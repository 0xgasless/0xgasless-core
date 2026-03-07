/**
 * Configuration options for the OxGasAuth SDK.
 * Only `apiKey` is required — everything else has sensible defaults.
 */
export interface OxGasAuthConfig {
    /** Your 0xgas API key (required). */
    apiKey: string;
    /**
     * Override the widget URL. Defaults to the 0xgas-hosted CloudFront widget.
     * Useful for self-hosted or local development setups.
     */
    widgetUrl?: string;
    /**
     * Network name shown in the widget approval screen (e.g. "Ethereum", "Base").
     * If a `chainId` is provided instead, the SDK resolves it automatically.
     * @default "Ethereum"
     */
    network?: string;
    /**
     * EVM chain ID. Used to resolve `network` name if not explicitly provided.
     */
    chainId?: number;
    /**
     * CSS z-index of the widget overlay.
     * @default 99999
     */
    zIndex?: number;
    /**
     * Login timeout in milliseconds.
     * @default 300000 (5 min)
     */
    loginTimeout?: number;
    /**
     * Signing timeout in milliseconds (applies to signMessage and signTransaction).
     * @default 120000 (2 min)
     */
    signTimeout?: number;
    /**
     * Enable verbose console logging for development.
     * @default false
     */
    debug?: boolean;
}
/** Information returned after a successful login. */
export interface WalletInfo {
    /** The KMS-backed EOA address. */
    address: `0x${string}`;
    /** The email associated with the account. */
    email: string;
}
/** Authentication state of the SDK. */
export type AuthState = "disconnected" | "connecting" | "connected";
/** Parameters for signing a raw transaction via the widget. */
export interface SignTxParams {
    to: `0x${string}`;
    value: string;
    nonce?: number;
    chainId?: number;
    data?: `0x${string}`;
    gas?: number;
    gasPrice?: number;
    maxFeePerGas?: number;
    maxPriorityFeePerGas?: number;
}
/** Result of a signed transaction. */
export interface SignTxResult {
    rawTx: `0x${string}`;
    txHash: `0x${string}`;
    from: `0x${string}`;
}
/** Result of a signed message (e.g. ERC-4337 UserOperation hash). */
export interface SignMessageResult {
    /** 65-byte ECDSA signature (r + s + v) as 0x-prefixed hex. */
    signature: `0x${string}`;
}
/** Typed event map for `OxGasAuth.on(event, handler)`. */
export interface OxGasAuthEvents {
    /** Emitted when the user successfully logs in. */
    connected: (wallet: WalletInfo) => void;
    /** Emitted when the user logs out or the session is destroyed. */
    disconnected: () => void;
    /** Emitted when a signing operation completes successfully. */
    signatureComplete: (data: {
        type: "message" | "transaction";
        result: SignMessageResult | SignTxResult;
    }) => void;
    /** Emitted when any error occurs during SDK operations. */
    error: (error: Error) => void;
    /** Emitted when the auth state changes. */
    stateChange: (state: AuthState) => void;
}
//# sourceMappingURL=types.d.ts.map