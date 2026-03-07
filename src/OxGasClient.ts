import type { Hex } from "viem";
import {
    createPublicClient,
    http,
    encodeFunctionData,
    parseAbi,
    parseUnits,
    formatUnits,
} from "viem";
import { OxGasAuth } from "./OxGasAuth";
import { OxGasAuthSigner } from "./signer-adapter";
import type { OxGasAuthConfig, WalletInfo, AuthState, SignMessageResult } from "./types";

// ─── Re-exported from smart-account SDK ──────────────────────────
import {
    createSmartAccountClient,
    PaymasterMode,
    type ZeroXgaslessSmartAccount,
    type UserOpResponse,
} from "@0xgasless/smart-account";

// ─── Client Config ───────────────────────────────────────────────

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

// ─── ERC-20 ABI ──────────────────────────────────────────────────

const ERC20_ABI = parseAbi([
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
]);

// ─── OxGasClient ─────────────────────────────────────────────────

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
export class OxGasClient {
    /** The underlying OxGasAuth instance (auth + signing). */
    public readonly auth: OxGasAuth;

    /** Smart account configuration. */
    private readonly config: OxGasClientConfig;

    /** Smart account instance (created after setupSmartAccount). */
    private smartAccount: ZeroXgaslessSmartAccount | null = null;

    /** Smart account address (cached after setup). */
    private _smartAccountAddress: string | null = null;

    /** Debug logging flag. */
    private readonly debug: boolean;

    constructor(config: OxGasClientConfig) {
        this.config = config;
        this.debug = config.debug ?? false;

        // Create the auth instance with the same config
        this.auth = new OxGasAuth(config);
    }

    // ── Auth ─────────────────────────────────────────────────────

    /**
     * Authenticate the user via the 0xgas widget (email/password).
     * If already logged in, returns cached wallet info.
     */
    public async login(): Promise<WalletInfo> {
        return this.auth.login();
    }

    /** Whether the user is authenticated. */
    public get isLoggedIn(): boolean {
        return this.auth.isConnected();
    }

    /** The KMS EOA address of the connected wallet. */
    public get eoaAddress(): `0x${string}` | null {
        return this.auth.getWalletInfo()?.address ?? null;
    }

    /** Current auth state. */
    public get authState(): AuthState {
        return this.auth.getAuthState();
    }

    /** Current chain ID configured for this client. */
    public get chainId(): number {
        return this.config.chainId ?? 1;
    }

    /** Current RPC URL configured for this client. */
    public get rpcUrl(): string | undefined {
        return this.config.rpcUrl;
    }

    /** Current Paymaster URL configured for this client. */
    public get paymasterUrl(): string {
        return this.config.paymasterUrl;
    }

    /** Current Bundler URL configured for this client. */
    public get bundlerUrl(): string {
        return this.config.bundlerUrl;
    }

    // ── Smart Account ────────────────────────────────────────────

    /**
     * Create the ERC-4337 smart account. Must be called after `login()`.
     * The smart account address is deterministic — calling this again
     * returns the same address.
     *
     * @returns The smart account address.
     */
    public async setupSmartAccount(): Promise<`0x${string}`> {
        if (!this.auth.isConnected()) {
            throw new Error("[0xgas] Must login before setting up smart account.");
        }

        if (this.smartAccount) {
            return this._smartAccountAddress as `0x${string}`;
        }

        this.log("Creating smart account…");

        // Wire the KMS signer adapter
        const signer = new OxGasAuthSigner(this.auth);

        this.smartAccount = await createSmartAccountClient({
            signer: signer as any,
            paymasterUrl: this.config.paymasterUrl,
            bundlerUrl: this.config.bundlerUrl,
            chainId: this.config.chainId ?? 1,
            ...(this.config.accountIndex !== undefined && {
                index: this.config.accountIndex,
            }),
        });

        this._smartAccountAddress = await this.smartAccount.getAccountAddress();
        this.log("Smart account ready:", this._smartAccountAddress);

        return this._smartAccountAddress as `0x${string}`;
    }

    /** The smart account address (null until `setupSmartAccount` is called). */
    public get smartAccountAddress(): `0x${string}` | null {
        return this._smartAccountAddress as `0x${string}` | null;
    }

    /** Whether a smart account has been set up. */
    public get hasSmartAccount(): boolean {
        return this.smartAccount !== null;
    }

    // ── Transactions ─────────────────────────────────────────────

    /**
     * Send a gasless (sponsored) transaction via the smart account.
     * Opens the widget for KMS signature approval, then submits the
     * UserOperation to the bundler.
     *
     * @param tx - Transaction parameters (to, value, data).
     * @returns UserOp response with hash and wait function.
     */
    public async sendTransaction(tx: TransactionParams): Promise<UserOpResponse> {
        const _smartAccount = this.getSmartAccount();

        this.log("Sending transaction to:", tx.to);

        return _smartAccount.sendTransaction(
            {
                to: tx.to,
                value: tx.value ?? 0n,
                data: tx.data ?? "0x",
            },
            {
                paymasterServiceData: { mode: PaymasterMode.SPONSORED },
            }
        );
    }

    /**
     * Send multiple transactions in a single UserOperation (batch).
     *
     * @param txs - Array of transaction parameters.
     * @returns UserOp response.
     */
    public async sendBatchTransactions(txs: TransactionParams[]): Promise<UserOpResponse> {
        const _smartAccount = this.getSmartAccount();

        this.log(`Sending batch of ${txs.length} transactions`);

        return _smartAccount.sendTransaction(
            txs.map((tx) => ({
                to: tx.to,
                value: tx.value ?? 0n,
                data: tx.data ?? "0x",
            })),
            {
                paymasterServiceData: { mode: PaymasterMode.SPONSORED },
            }
        );
    }

    /**
     * Send a gasless ERC-20 token transfer.
     * Encodes the transfer call data automatically.
     *
     * @param params - Token address, recipient, amount (human-readable).
     * @returns UserOp response.
     */
    public async transferToken(params: TokenTransferParams): Promise<UserOpResponse> {
        this.getSmartAccount();

        let decimals = params.decimals;
        if (decimals === undefined) {
            const pc = this.getPublicClient();
            decimals = (await pc.readContract({
                address: params.tokenAddress,
                abi: ERC20_ABI,
                functionName: "decimals",
            })) as number;
        }

        const data = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [params.to, parseUnits(params.amount, decimals)],
        });

        this.log(`Transferring ${params.amount} tokens to ${params.to}`);

        return this.sendTransaction({
            to: params.tokenAddress,
            value: 0n,
            data,
        });
    }

    /**
     * Sign a raw message hash via KMS (e.g. for EIP-1271 signatures).
     */
    public async signMessage(message: string | Uint8Array): Promise<SignMessageResult> {
        return this.auth.signMessage(message);
    }

    // ── Token Utilities ──────────────────────────────────────────

    /**
     * Get the ERC-20 token balance of the smart account.
     *
     * @param tokenAddress - ERC-20 contract address.
     * @returns Object with balance, symbol, name, and decimals.
     */
    public async getTokenBalance(tokenAddress: `0x${string}`): Promise<{
        balance: string;
        symbol: string;
        name: string;
        decimals: number;
        rawBalance: bigint;
    }> {
        const target = this._smartAccountAddress || this.eoaAddress;
        if (!target) throw new Error("[0xgas] No address available. Login first.");

        const pc = this.getPublicClient();

        const [rawBalance, decimals, symbol, name] = await Promise.all([
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [target as Hex] }),
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "decimals" }),
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "symbol" }),
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "name" }),
        ]);

        return {
            balance: formatUnits(rawBalance as bigint, decimals as number),
            symbol: symbol as string,
            name: name as string,
            decimals: decimals as number,
            rawBalance: rawBalance as bigint,
        };
    }

    /**
     * Get the native token (ETH) balance of the smart account.
     */
    public async getNativeBalance(): Promise<bigint> {
        const target = this._smartAccountAddress || this.eoaAddress;
        if (!target) throw new Error("[0xgas] No address available. Login first.");

        const pc = this.getPublicClient();
        return pc.getBalance({ address: target as Hex });
    }

    // ── Lifecycle ────────────────────────────────────────────────

    /** Log out, clear smart account state. */
    public async logout(): Promise<void> {
        await this.auth.logout();
        this.smartAccount = null;
        this._smartAccountAddress = null;
        this.log("Logged out, smart account cleared");
    }

    /** Full teardown — logout + remove all listeners. */
    public destroy(): void {
        this.auth.destroy();
        this.smartAccount = null;
        this._smartAccountAddress = null;
    }

    // ── Private ──────────────────────────────────────────────────

    private getSmartAccount(): ZeroXgaslessSmartAccount {
        if (!this.smartAccount) {
            throw new Error("[0xgas] Smart account not set up. Call setupSmartAccount() first.");
        }
        return this.smartAccount;
    }

    private getPublicClient() {
        const rpcUrl = this.config.rpcUrl;
        return createPublicClient({
            transport: http(rpcUrl),
        });
    }

    private log(...args: unknown[]): void {
        if (this.debug) {
            console.log("[0xgas-client]", ...args);
        }
    }
}
