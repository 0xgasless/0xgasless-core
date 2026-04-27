// ─── Server Wallet Types ─────────────────────────────────────────

/**
 * Constructor options for `OxGasServerWallet`.
 */
export interface ServerWalletOptions {
    /** Your 0xgas project API key (required). */
    apiKey: string;

    /**
     * Override the 0xgas API base URL.
     * @default "https://pmwv2d8iwa.execute-api.eu-north-1.amazonaws.com"
     */
    baseUrl?: string;

    /**
     * Default chain ID to use when not specified per call.
     * @default 1
     */
    defaultChainId?: number;

    /**
     * HTTP request timeout in milliseconds.
     * @default 30000 (30 seconds)
     */
    timeout?: number;
}

// ─── Wallet Info ─────────────────────────────────────────────────

/**
 * Information about a server-managed wallet.
 */
export interface ServerWalletInfo {
    /** The unique user identifier provided during creation. */
    userId: string;
    /** The KMS-backed EOA address. */
    address: `0x${string}`;
    /** The project this wallet belongs to. */
    projectId: string;
    /** Optional label for display purposes. */
    label?: string;
    /** The chain ID this wallet was created with. */
    chainId: number;
    /** Whether the wallet already existed at the time of the call. */
    existing?: boolean;
    /** ISO-8601 timestamp of when the wallet was created. */
    createdAt?: string;
}

/**
 * Optional parameters for `getOrCreateWallet`.
 */
export interface CreateWalletOptions {
    /** Human-readable label for the wallet (shown in dashboard). */
    label?: string;
    /** Chain ID override — defaults to `defaultChainId` from constructor. */
    chainId?: number;
}

// ─── Transaction Signing ─────────────────────────────────────────

/**
 * Parameters for server-side transaction signing.
 * All value/gas amounts are strings to avoid JS number precision issues with large wei values.
 */
export interface SignTransactionParams {
    /** Recipient address. */
    to: `0x${string}`;
    /** Value in wei as a string. */
    value: string;
    /** Transaction nonce. */
    nonce: number;
    /** Target chain ID. */
    chainId: number;
    /** Gas limit (default: 21000). */
    gas?: number;
    /** Gas price in wei as a string or number (default: 30 gwei). */
    gasPrice?: string | number;
    /** Calldata for contract interactions. */
    data?: string;
}

/**
 * Result of a server-side transaction signing.
 */
export interface SignTransactionResult {
    /** The fully signed RLP-encoded transaction, ready for `eth_sendRawTransaction`. */
    rawTx: `0x${string}`;
    /** The transaction hash computed from the signed transaction. */
    txHash: `0x${string}`;
    /** The sender (server wallet) address. */
    from: `0x${string}`;
}

// ─── Wallet List ─────────────────────────────────────────────────

/**
 * Response from listing all server wallets for a project.
 */
export interface ListWalletsResponse {
    /** The project ID. */
    projectId: string;
    /** Total number of wallets in the project. */
    totalWallets: number;
    /** Array of wallet records. */
    wallets: ServerWalletInfo[];
}

// ─── Broadcast ───────────────────────────────────────────────────

/**
 * Result of broadcasting a signed transaction to the network.
 */
export interface BroadcastResult {
    /** The transaction hash returned by the RPC node. */
    txHash: string;
}
