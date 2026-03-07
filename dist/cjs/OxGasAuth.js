"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OxGasAuth = void 0;
const events_1 = require("./events");
const errors_1 = require("./errors");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
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
class OxGasAuth extends events_1.TypedEventEmitter {
    // ── Configuration (immutable after construction) ──
    apiKey;
    widgetOrigin;
    networkName;
    zIndex;
    loginTimeout;
    signTimeout;
    debugMode;
    // ── Internal state ──
    iframe = null;
    walletInfo = null;
    authState = "disconnected";
    messageId = 0;
    constructor(config) {
        super();
        // Support shorthand: new OxGasAuth("api-key")
        const cfg = typeof config === "string" ? { apiKey: config } : config;
        if (!cfg.apiKey) {
            throw new Error("[0xgas-auth] apiKey is required.");
        }
        this.apiKey = cfg.apiKey;
        this.widgetOrigin = (cfg.widgetUrl || constants_1.DEFAULT_WIDGET_URL).replace(/\/$/, "");
        this.zIndex = cfg.zIndex ?? constants_1.DEFAULT_Z_INDEX;
        this.loginTimeout = cfg.loginTimeout ?? constants_1.DEFAULT_LOGIN_TIMEOUT;
        this.signTimeout = cfg.signTimeout ?? constants_1.DEFAULT_SIGN_TIMEOUT;
        this.debugMode = cfg.debug ?? false;
        // Resolve network name: explicit > chainId lookup > default
        this.networkName =
            cfg.network ??
                (cfg.chainId ? constants_1.NETWORK_NAMES[cfg.chainId] ?? `Chain ${cfg.chainId}` : "Ethereum");
    }
    // ── Public API ─────────────────────────────────────────────────
    /**
     * Open the widget and authenticate the user.
     * If already logged in, returns cached wallet info immediately.
     *
     * @returns Wallet info containing the KMS EOA address and email.
     * @throws {SigningTimeoutError} if the user doesn't complete login in time.
     */
    async login() {
        if (this.walletInfo)
            return this.walletInfo;
        this.setState("connecting");
        this.injectIframe();
        const loginPromise = new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.origin !== this.widgetOrigin)
                    return;
                const { type, payload } = event.data;
                if (type === "WIDGET_READY") {
                    this.log("Widget ready, sending INIT");
                    this.iframe?.contentWindow?.postMessage({ type: "INIT", payload: { apiKey: this.apiKey } }, this.widgetOrigin);
                }
                else if (type === "WALLET_READY") {
                    window.removeEventListener("message", handleMessage);
                    this.walletInfo = payload;
                    this.setState("connected");
                    this.hideIframe();
                    this.log("Authenticated:", this.walletInfo.address);
                    this.emit("connected", this.walletInfo);
                    resolve(this.walletInfo);
                }
                else if (type === "AUTH_ERROR") {
                    window.removeEventListener("message", handleMessage);
                    this.setState("disconnected");
                    const error = new errors_1.WidgetError(payload?.message || "Authentication failed.");
                    this.emit("error", error);
                    reject(error);
                }
            };
            window.addEventListener("message", handleMessage);
        });
        return (0, utils_1.withTimeout)(loginPromise, this.loginTimeout, () => new errors_1.SigningTimeoutError(this.loginTimeout, "Login"));
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
    async signTransaction(txParams) {
        this.ensureConnected();
        this.ensureIframeVisible();
        const id = ++this.messageId;
        const signPromise = new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.origin !== this.widgetOrigin)
                    return;
                const { type, payload } = event.data;
                if (type === "TX_SIGNED") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();
                    if (payload.error) {
                        const error = new errors_1.SigningRejectedError(payload.error);
                        this.emit("error", error);
                        reject(error);
                    }
                    else {
                        const result = payload;
                        this.emit("signatureComplete", {
                            type: "transaction",
                            result,
                        });
                        resolve(result);
                    }
                }
                else if (type === "SIGN_ERROR") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();
                    const error = new errors_1.WidgetError(payload?.message || "Transaction signing failed.");
                    this.emit("error", error);
                    reject(error);
                }
            };
            window.addEventListener("message", handleMessage);
            this.iframe?.contentWindow?.postMessage({ id, type: "SIGN_TX", payload: txParams }, this.widgetOrigin);
        });
        return (0, utils_1.withTimeout)(signPromise, this.signTimeout, () => new errors_1.SigningTimeoutError(this.signTimeout, "Transaction signing"));
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
    async signMessage(message, network) {
        this.ensureConnected();
        const messageHash = (0, utils_1.normalizeMessageToHex)(message);
        this.log("signMessage called, hash:", messageHash);
        this.ensureIframeVisible();
        // Allow the iframe to become visible before posting
        await new Promise((resolve) => setTimeout(resolve, constants_1.IFRAME_READY_DELAY));
        const id = ++this.messageId;
        const signPromise = new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.origin !== this.widgetOrigin)
                    return;
                const { type, payload } = event.data;
                if (type === "MSG_SIGNED") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();
                    if (payload.error) {
                        const error = new errors_1.SigningRejectedError(payload.error);
                        this.emit("error", error);
                        reject(error);
                    }
                    else {
                        const result = {
                            signature: payload.signature,
                        };
                        this.log("Message signed:", payload.signature);
                        this.emit("signatureComplete", { type: "message", result });
                        resolve(result);
                    }
                }
                else if (type === "SIGN_ERROR") {
                    window.removeEventListener("message", handleMessage);
                    this.hideIframe();
                    const error = new errors_1.WidgetError(payload?.message || "Message signing failed.");
                    this.emit("error", error);
                    reject(error);
                }
            };
            window.addEventListener("message", handleMessage);
            this.log("Posting SIGN_MSG to iframe, id:", id);
            this.iframe?.contentWindow?.postMessage({
                id,
                type: "SIGN_MSG",
                payload: {
                    messageHash,
                    network: network || this.networkName,
                },
            }, this.widgetOrigin);
        });
        return (0, utils_1.withTimeout)(signPromise, this.signTimeout, () => new errors_1.SigningTimeoutError(this.signTimeout, "Message signing"));
    }
    /**
     * Returns the KMS EOA address of the connected wallet.
     * @throws {NotConnectedError} if the user is not logged in.
     */
    getAddress() {
        this.ensureConnected();
        return this.walletInfo.address;
    }
    /**
     * Returns the full wallet info, or `null` if not connected.
     */
    getWalletInfo() {
        return this.walletInfo;
    }
    /** Returns whether the user is currently authenticated. */
    isConnected() {
        return this.authState === "connected" && this.walletInfo !== null;
    }
    /** Returns the current authentication state. */
    getAuthState() {
        return this.authState;
    }
    /**
     * Log out the current user, clear state, and remove the iframe.
     */
    async logout() {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.postMessage({ type: "LOGOUT" }, this.widgetOrigin);
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
    destroy() {
        this.walletInfo = null;
        this.setState("disconnected");
        this.removeIframe();
        this.removeAllListeners();
        this.log("Destroyed");
    }
    // ── Private ────────────────────────────────────────────────────
    ensureConnected() {
        if (!this.walletInfo) {
            throw new errors_1.NotConnectedError();
        }
    }
    setState(state) {
        if (this.authState !== state) {
            this.authState = state;
            this.emit("stateChange", state);
        }
    }
    injectIframe() {
        if (document.getElementById(constants_1.IFRAME_ID))
            return;
        this.iframe = document.createElement("iframe");
        this.iframe.id = constants_1.IFRAME_ID;
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
    ensureIframeVisible() {
        if (this.iframe) {
            this.iframe.style.display = "block";
        }
    }
    hideIframe() {
        if (this.iframe) {
            this.iframe.style.display = "none";
        }
    }
    removeIframe() {
        if (this.iframe?.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
            this.iframe = null;
            this.log("Iframe removed");
        }
    }
    log(...args) {
        if (this.debugMode) {
            console.log("[0xgas-auth]", ...args);
        }
    }
}
exports.OxGasAuth = OxGasAuth;
//# sourceMappingURL=OxGasAuth.js.map