import type { OxGasAuthConfig, OxGasAuthEvents, AuthState, WalletInfo, SignTxParams, SignTxResult, SignMessageResult } from "./types";
import { TypedEventEmitter } from "./events";
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
export declare class OxGasAuth extends TypedEventEmitter<OxGasAuthEvents & Record<string, (...args: any[]) => void>> {
    private readonly apiKey;
    private readonly widgetOrigin;
    private readonly networkName;
    private readonly zIndex;
    private readonly loginTimeout;
    private readonly signTimeout;
    private readonly debugMode;
    private iframe;
    private walletInfo;
    private authState;
    private messageId;
    constructor(config: OxGasAuthConfig | string);
    /**
     * Open the widget and authenticate the user.
     * If already logged in, returns cached wallet info immediately.
     *
     * @returns Wallet info containing the KMS EOA address and email.
     * @throws {SigningTimeoutError} if the user doesn't complete login in time.
     */
    login(): Promise<WalletInfo>;
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
    signTransaction(txParams: SignTxParams): Promise<SignTxResult>;
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
    signMessage(message: string | Uint8Array, network?: string): Promise<SignMessageResult>;
    /**
     * Returns the KMS EOA address of the connected wallet.
     * @throws {NotConnectedError} if the user is not logged in.
     */
    getAddress(): `0x${string}`;
    /**
     * Returns the full wallet info, or `null` if not connected.
     */
    getWalletInfo(): WalletInfo | null;
    /** Returns whether the user is currently authenticated. */
    isConnected(): boolean;
    /** Returns the current authentication state. */
    getAuthState(): AuthState;
    /**
     * Log out the current user, clear state, and remove the iframe.
     */
    logout(): Promise<void>;
    /**
     * Full teardown — logout, remove iframe, clear all event listeners.
     * Call this when unmounting the component using OxGasAuth.
     */
    destroy(): void;
    private ensureConnected;
    private setState;
    private injectIframe;
    private ensureIframeVisible;
    private hideIframe;
    private removeIframe;
    private log;
}
//# sourceMappingURL=OxGasAuth.d.ts.map