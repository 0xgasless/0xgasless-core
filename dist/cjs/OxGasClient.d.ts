import { OxGasAuth } from "./OxGasAuth";
import type { OxGasAuthConfig, WalletInfo, AuthState, SignMessageResult } from "./types";
import { type UserOpResponse } from "@0xgasless/smart-account";
/** Configuration for OxGasClient — extends OxGasAuthConfig with smart-account options. */
export interface OxGasClientConfig extends OxGasAuthConfig {
    /** Bundler URL for submitting UserOperations. */
    bundlerUrl: string;
    /** Paymaster URL for gas sponsorship. */
    paymasterUrl: string;
    /** Override RPC URL (defaults to the chain's public RPC). */
    rpcUrl?: string;
    /** Account index (default 0) — use to derive different smart accounts from the same signer. */
    accountIndex?: number;
}
/** Transaction parameters for `sendTransaction`. */
export interface TransactionParams {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
}
/** ERC-20 transfer shorthand. */
export interface TokenTransferParams {
    tokenAddress: `0x${string}`;
    to: `0x${string}`;
    amount: string;
    /** Override decimals (default: fetched from contract). */
    decimals?: number;
}
/**
 * All-in-one client for 0xgas embedded wallets + ERC-4337 smart accounts.
 *
 * Combines authentication, KMS signing, smart account creation,
 * and gasless transaction submission into a single, easy-to-use API.
 *
 * @example
 * ```ts
 * import { OxGasClient, PaymasterMode } from '0xgas-auth';
 *
 * const client = new OxGasClient({
 *   apiKey: 'your-key',
 *   chainId: 11155111,
 *   bundlerUrl: 'https://bundler.0xgasless.com/11155111',
 *   paymasterUrl: 'https://paymaster.0xgasless.com/v1/11155111/rpc/your-api-key',
 * });
 *
 * await client.login();
 * await client.setupSmartAccount();
 * const result = await client.sendTransaction({ to: '0x...', value: 0n, data: '0x...' });
 * ```
 */
export declare class OxGasClient {
    /** The underlying OxGasAuth instance (auth + signing). */
    readonly auth: OxGasAuth;
    /** Smart account configuration. */
    private readonly config;
    /** Smart account instance (created after setupSmartAccount). */
    private smartAccount;
    /** Smart account address (cached after setup). */
    private _smartAccountAddress;
    /** Debug logging flag. */
    private readonly debug;
    constructor(config: OxGasClientConfig);
    /**
     * Authenticate the user via the 0xgas widget (email/password).
     * If already logged in, returns cached wallet info.
     */
    login(): Promise<WalletInfo>;
    /** Whether the user is authenticated. */
    get isLoggedIn(): boolean;
    /** The KMS EOA address of the connected wallet. */
    get eoaAddress(): `0x${string}` | null;
    /** Current auth state. */
    get authState(): AuthState;
    /** Current chain ID configured for this client. */
    get chainId(): number;
    /** Current RPC URL configured for this client. */
    get rpcUrl(): string | undefined;
    /** Current Paymaster URL configured for this client. */
    get paymasterUrl(): string;
    /** Current Bundler URL configured for this client. */
    get bundlerUrl(): string;
    /**
     * Create the ERC-4337 smart account. Must be called after `login()`.
     * The smart account address is deterministic — calling this again
     * returns the same address.
     *
     * @returns The smart account address.
     */
    setupSmartAccount(): Promise<`0x${string}`>;
    /** The smart account address (null until `setupSmartAccount` is called). */
    get smartAccountAddress(): `0x${string}` | null;
    /** Whether a smart account has been set up. */
    get hasSmartAccount(): boolean;
    /**
     * Send a gasless (sponsored) transaction via the smart account.
     * Opens the widget for KMS signature approval, then submits the
     * UserOperation to the bundler.
     *
     * @param tx - Transaction parameters (to, value, data).
     * @returns UserOp response with hash and wait function.
     */
    sendTransaction(tx: TransactionParams): Promise<UserOpResponse>;
    /**
     * Send multiple transactions in a single UserOperation (batch).
     *
     * @param txs - Array of transaction parameters.
     * @returns UserOp response.
     */
    sendBatchTransactions(txs: TransactionParams[]): Promise<UserOpResponse>;
    /**
     * Send a gasless ERC-20 token transfer.
     * Encodes the transfer call data automatically.
     *
     * @param params - Token address, recipient, amount (human-readable).
     * @returns UserOp response.
     */
    transferToken(params: TokenTransferParams): Promise<UserOpResponse>;
    /**
     * Sign a raw message hash via KMS (e.g. for EIP-1271 signatures).
     */
    signMessage(message: string | Uint8Array): Promise<SignMessageResult>;
    /**
     * Get the ERC-20 token balance of the smart account.
     *
     * @param tokenAddress - ERC-20 contract address.
     * @returns Object with balance, symbol, name, and decimals.
     */
    getTokenBalance(tokenAddress: `0x${string}`): Promise<{
        balance: string;
        symbol: string;
        name: string;
        decimals: number;
        rawBalance: bigint;
    }>;
    /**
     * Get the native token (ETH) balance of the smart account.
     */
    getNativeBalance(): Promise<bigint>;
    /** Log out, clear smart account state. */
    logout(): Promise<void>;
    /** Full teardown — logout + remove all listeners. */
    destroy(): void;
    private getSmartAccount;
    private getPublicClient;
    private log;
}
//# sourceMappingURL=OxGasClient.d.ts.map