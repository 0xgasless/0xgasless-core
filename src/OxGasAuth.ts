import type {
    OxGasAuthConfig,
    OxGasAuthEvents,
    AuthState,
    WalletInfo,
    SignTxParams,
    SignTxResult,
    SignMessageResult,
} from "./types.js";
import { TypedEventEmitter } from "./events.js";
import {
    NotConnectedError,
    SigningRejectedError,
    SigningTimeoutError,
    WidgetError,
} from "./errors.js";
import {
    DEFAULT_WIDGET_URL,
    DEFAULT_LOGIN_TIMEOUT,
    DEFAULT_SIGN_TIMEOUT,
    DEFAULT_Z_INDEX,
    IFRAME_ID,
    IFRAME_READY_DELAY,
    NETWORK_NAMES,
} from "./constants.js";
import { normalizeMessageToHex, withTimeout } from "./utils.js";

/**
 * 0xgas-auth — Embedded wallet SDK for EVM chains.
 *
 * Manages a secure iframe widget that handles authentication and
 * AWS KMS-backed signing. Private keys and access tokens never
 * leave the iframe — the parent app only receives addresses,
 * emails, and signatures.
 *
 * @example
 * ```ts
 * import { OxGasAuth } from '0xgas-auth';
 *
 * const auth = new OxGasAuth({ apiKey: 'your-api-key', chainId: 11155111 });
 *
 * auth.on('connected', (wallet) => console.log('Wallet:', wallet.address));
 * auth.on('error', (err) => console.error(err));
 *
 * const wallet = await auth.login();
 * const { signature } = await auth.signMessage('0xdeadbeef...');
 * ```
 */
export class OxGasAuth extends TypedEventEmitter<OxGasAuthEvents & Record<string, (...args: any[]) => void>> {
    // ── Configuration (immutable after construction) ──
    private readonly apiKey: string;
    private readonly widgetOrigin: string;
    private readonly networkName: string;
    private readonly zIndex: number;
    private readonly loginTimeout: number;
    private readonly signTimeout: number;
    private readonly debugMode: boolean;

    // ── Internal state ──
    private iframe: HTMLIFrameElement | null = null;
    private walletInfo: WalletInfo | null = null;
    private authState: AuthState = "disconnected";
    private messageId = 0;

    constructor(config: OxGasAuthConfig | string) {
        super();

        // Support shorthand: new OxGasAuth("api-key")
        const cfg: OxGasAuthConfig =
            typeof config === "string" ? { apiKey: config } : config;

        if (!cfg.apiKey) {
            throw new Error("[0xgas-auth] apiKey is required.");
        }

        this.apiKey = cfg.apiKey;
        this.widgetOrigin = (cfg.widgetUrl || DEFAULT_WIDGET_URL).replace(
            /\/$/,
            ""
        );
        this.zIndex = cfg.zIndex ?? DEFAULT_Z_INDEX;
        this.loginTimeout = cfg.loginTimeout ?? DEFAULT_LOGIN_TIMEOUT;
        this.signTimeout = cfg.signTimeout ?? DEFAULT_SIGN_TIMEOUT;
        this.debugMode = cfg.debug ?? false;

        // Resolve network name: explicit > chainId lookup > default
        this.networkName =
            cfg.network ??
            (cfg.chainId ? NETWORK_NAMES[cfg.chainId] ?? `Chain ${cfg.chainId}` : "Ethereum");
    }

    // ── Public API ─────────────────────────────────────────────────

    /**
     * Open the widget and authenticate the user.
     * If already logged in, returns cached wallet info immediately.
     *
     * @returns Wallet info containing the KMS EOA address and email.
     * @throws {SigningTimeoutError} if the user doesn't complete login in time.
     */
    public async login(): Promise<WalletInfo> {
        if (this.walletInfo) return this.walletInfo;

        this.setState("connecting");
        this.injectIframe();

        const loginPromise = new Promise<WalletInfo>((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== this.widgetOrigin) return;
                const { type, payload } = event.data;

                if (type === "WIDGET_READY") {
                    this.log("Widget ready, sending INIT");
                    this.iframe?.contentWindow?.postMessage(
                        { type: "INIT", payload: { apiKey: this.apiKey } },
                        this.widgetOrigin
                    );
                } else if (type === "WALLET_READY") {
                    window.removeEventListener("message", handleMessage);
                    this.walletInfo = payload as WalletInfo;
                    this.setState("connected");
                    this.hideIframe();
                    this.log("Authenticated:", this.walletInfo.address);
                    this.emit("connected", this.walletInfo);
                    resolve(this.walletInfo);
                } else if (type === "AUTH_ERROR") {
                    window.removeEventListener("message", handleMessage);
                    this.setState("disconnected");
                    const error = new WidgetError(
                        payload?.message || "Authentication failed."
                    );
                    this.emit("error", error);
                    reject(error);
                }
            };

            window.addEventListener("message", handleMessage);
        });

        return withTimeout(
            loginPromise,
            this.loginTimeout,
            () => new SigningTimeoutError(this.loginTimeout, "Login")
        );
    }

    /**
     * Sign a raw transaction via the widget.
     * Opens the "Approve Transaction" screen for user confirmation.
     *
     * @param txParams - Transaction parameters (to, value, data, etc.)
     * @returns Signed transaction result.
     * @throws {NotConnectedError} if the user is not logged in.
     * @throws {SigningRejectedError} if the user rejects.
     * @throws {SigningTimeoutError} if the operation times out.
     */
    public async signTransaction(txParams: SignTxParams): Promise<SignTxResult> {
        this.ensureConnected();
        this.ensureIframeVisible();

        const id = ++this.messageId;

        const signPromise = new Promise<SignTxResult>((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== this.widgetOrigin) return;
                const { type, payload } = event.data;

                if (type === "TX_SIGNED") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();

                    if (payload.error) {
                        const error = new SigningRejectedError(payload.error);
                        this.emit("error", error);
                        reject(error);
                    } else {
                        const result = payload as SignTxResult;
                        this.emit("signatureComplete", {
                            type: "transaction",
                            result,
                        });
                        resolve(result);
                    }
                } else if (type === "SIGN_ERROR") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();
                    const error = new WidgetError(
                        payload?.message || "Transaction signing failed."
                    );
                    this.emit("error", error);
                    reject(error);
                }
            };

            window.addEventListener("message", handleMessage);

            this.iframe?.contentWindow?.postMessage(
                { id, type: "SIGN_TX", payload: txParams },
                this.widgetOrigin
            );
        });

        return withTimeout(
            signPromise,
            this.signTimeout,
            () => new SigningTimeoutError(this.signTimeout, "Transaction signing")
        );
    }

    /**
     * Sign a message hash (typically an ERC-4337 UserOperation hash).
     * Opens the "Sign Request" screen for user confirmation, then
     * calls the KMS backend to produce a 65-byte ECDSA signature.
     *
     * @param message - The hash to sign. Accepts a hex string, Uint8Array,
     *                  or a viem-style `{ raw: Uint8Array }` object.
     * @param network - Optional network name override for the approval UI.
     * @returns Object containing the `signature` as 0x-prefixed hex.
     * @throws {NotConnectedError} if the user is not logged in.
     * @throws {SigningRejectedError} if the user rejects.
     * @throws {SigningTimeoutError} if the operation times out.
     */
    public async signMessage(
        message: string | Uint8Array,
        network?: string
    ): Promise<SignMessageResult> {
        this.ensureConnected();

        const messageHash = normalizeMessageToHex(message);
        this.log("signMessage called, hash:", messageHash);

        this.ensureIframeVisible();

        // Allow the iframe to become visible before posting
        await new Promise((resolve) => setTimeout(resolve, IFRAME_READY_DELAY));

        const id = ++this.messageId;

        const signPromise = new Promise<SignMessageResult>((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== this.widgetOrigin) return;
                const { type, payload } = event.data;

                if (type === "MSG_SIGNED") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();

                    if (payload.error) {
                        const error = new SigningRejectedError(payload.error);
                        this.emit("error", error);
                        reject(error);
                    } else {
                        const result: SignMessageResult = {
                            signature: payload.signature,
                        };
                        this.log("Message signed:", payload.signature);
                        this.emit("signatureComplete", { type: "message", result });
                        resolve(result);
                    }
                } else if (type === "SIGN_ERROR") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();
                    const error = new WidgetError(
                        payload?.message || "Message signing failed."
                    );
                    this.emit("error", error);
                    reject(error);
                }
            };

            window.addEventListener("message", handleMessage);

            this.log("Posting SIGN_MSG to iframe, id:", id);
            this.iframe?.contentWindow?.postMessage(
                {
                    id,
                    type: "SIGN_MSG",
                    payload: {
                        messageHash,
                        network: network || this.networkName,
                    },
                },
                this.widgetOrigin
            );
        });

        return withTimeout(
            signPromise,
            this.signTimeout,
            () => new SigningTimeoutError(this.signTimeout, "Message signing")
        );
    }

    /**
     * Returns the KMS EOA address of the connected wallet.
     * @throws {NotConnectedError} if the user is not logged in.
     */
    public getAddress(): `0x${string}` {
        this.ensureConnected();
        return this.walletInfo!.address;
    }

    /**
     * Returns the full wallet info, or `null` if not connected.
     */
    public getWalletInfo(): WalletInfo | null {
        return this.walletInfo;
    }

    /** Returns whether the user is currently authenticated. */
    public isConnected(): boolean {
        return this.authState === "connected" && this.walletInfo !== null;
    }

    /** Returns the current authentication state. */
    public getAuthState(): AuthState {
        return this.authState;
    }

    /**
     * Log out the current user, clear state, and remove the iframe.
     */
    public async logout(): Promise<void> {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.postMessage(
                { type: "LOGOUT" },
                this.widgetOrigin
            );
        }
        this.walletInfo = null;
        this.setState("disconnected");
        this.removeIframe();
        this.emit("disconnected");
        this.log("Logged out");
    }

    /**
     * Full teardown — logout, remove iframe, clear all event listeners.
     * Call this when unmounting the component using OxGasAuth.
     */
    public destroy(): void {
        this.walletInfo = null;
        this.setState("disconnected");
        this.removeIframe();
        this.removeAllListeners();
        this.log("Destroyed");
    }

    // ── Private ────────────────────────────────────────────────────

    private ensureConnected(): void {
        if (!this.walletInfo) {
            throw new NotConnectedError();
        }
    }

    private setState(state: AuthState): void {
        if (this.authState !== state) {
            this.authState = state;
            this.emit("stateChange", state);
        }
    }

    private injectIframe(): void {
        if (document.getElementById(IFRAME_ID)) return;

        this.iframe = document.createElement("iframe");
        this.iframe.id = IFRAME_ID;
        this.iframe.src = `${this.widgetOrigin}/widget.html?apiKey=${encodeURIComponent(this.apiKey)}`;
        this.iframe.allow = "clipboard-write";

        Object.assign(this.iframe.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            border: "none",
            zIndex: String(this.zIndex),
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "block",
        });

        document.body.appendChild(this.iframe);
        this.log("Iframe injected");
    }

    private ensureIframeVisible(): void {
        if (this.iframe) {
            this.iframe.style.display = "block";
        }
    }

    private hideIframe(): void {
        if (this.iframe) {
            this.iframe.style.display = "none";
        }
    }

    private removeIframe(): void {
        if (this.iframe?.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
            this.iframe = null;
            this.log("Iframe removed");
        }
    }

    private log(...args: unknown[]): void {
        if (this.debugMode) {
            console.log("[0xgas-auth]", ...args);
        }
    }
}
