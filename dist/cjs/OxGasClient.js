"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OxGasClient = void 0;
const viem_1 = require("viem");
const OxGasAuth_1 = require("./OxGasAuth");
const signer_adapter_1 = require("./signer-adapter");
// ─── Re-exported from smart-account SDK ──────────────────────────
const smart_account_1 = require("@0xgasless/smart-account");
// ─── ERC-20 ABI ──────────────────────────────────────────────────
const ERC20_ABI = (0, viem_1.parseAbi)([
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
class OxGasClient {
    /** The underlying OxGasAuth instance (auth + signing). */
    auth;
    /** Smart account configuration. */
    config;
    /** Smart account instance (created after setupSmartAccount). */
    smartAccount = null;
    /** Smart account address (cached after setup). */
    _smartAccountAddress = null;
    /** Debug logging flag. */
    debug;
    constructor(config) {
        this.config = config;
        this.debug = config.debug ?? false;
        // Create the auth instance with the same config
        this.auth = new OxGasAuth_1.OxGasAuth(config);
    }
    // ── Auth ─────────────────────────────────────────────────────
    /**
     * Authenticate the user via the 0xgas widget (email/password).
     * If already logged in, returns cached wallet info.
     */
    async login() {
        return this.auth.login();
    }
    /** Whether the user is authenticated. */
    get isLoggedIn() {
        return this.auth.isConnected();
    }
    /** The KMS EOA address of the connected wallet. */
    get eoaAddress() {
        return this.auth.getWalletInfo()?.address ?? null;
    }
    /** Current auth state. */
    get authState() {
        return this.auth.getAuthState();
    }
    /** Current chain ID configured for this client. */
    get chainId() {
        return this.config.chainId ?? 1;
    }
    /** Current RPC URL configured for this client. */
    get rpcUrl() {
        return this.config.rpcUrl;
    }
    /** Current Paymaster URL configured for this client. */
    get paymasterUrl() {
        return this.config.paymasterUrl;
    }
    /** Current Bundler URL configured for this client. */
    get bundlerUrl() {
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
    async setupSmartAccount() {
        if (!this.auth.isConnected()) {
            throw new Error("[0xgas] Must login before setting up smart account.");
        }
        if (this.smartAccount) {
            return this._smartAccountAddress;
        }
        this.log("Creating smart account…");
        // Wire the KMS signer adapter
        const signer = new signer_adapter_1.OxGasAuthSigner(this.auth);
        this.smartAccount = await (0, smart_account_1.createSmartAccountClient)({
            signer: signer,
            paymasterUrl: this.config.paymasterUrl,
            bundlerUrl: this.config.bundlerUrl,
            chainId: this.config.chainId ?? 1,
            ...(this.config.accountIndex !== undefined && {
                index: this.config.accountIndex,
            }),
        });
        this._smartAccountAddress = await this.smartAccount.getAccountAddress();
        this.log("Smart account ready:", this._smartAccountAddress);
        return this._smartAccountAddress;
    }
    /** The smart account address (null until `setupSmartAccount` is called). */
    get smartAccountAddress() {
        return this._smartAccountAddress;
    }
    /** Whether a smart account has been set up. */
    get hasSmartAccount() {
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
    async sendTransaction(tx) {
        const _smartAccount = this.getSmartAccount();
        this.log("Sending transaction to:", tx.to);
        return _smartAccount.sendTransaction({
            to: tx.to,
            value: tx.value ?? 0n,
            data: tx.data ?? "0x",
        }, {
            paymasterServiceData: { mode: smart_account_1.PaymasterMode.SPONSORED },
        });
    }
    /**
     * Send multiple transactions in a single UserOperation (batch).
     *
     * @param txs - Array of transaction parameters.
     * @returns UserOp response.
     */
    async sendBatchTransactions(txs) {
        const _smartAccount = this.getSmartAccount();
        this.log(`Sending batch of ${txs.length} transactions`);
        return _smartAccount.sendTransaction(txs.map((tx) => ({
            to: tx.to,
            value: tx.value ?? 0n,
            data: tx.data ?? "0x",
        })), {
            paymasterServiceData: { mode: smart_account_1.PaymasterMode.SPONSORED },
        });
    }
    /**
     * Send a gasless ERC-20 token transfer.
     * Encodes the transfer call data automatically.
     *
     * @param params - Token address, recipient, amount (human-readable).
     * @returns UserOp response.
     */
    async transferToken(params) {
        this.getSmartAccount();
        let decimals = params.decimals;
        if (decimals === undefined) {
            const pc = this.getPublicClient();
            decimals = (await pc.readContract({
                address: params.tokenAddress,
                abi: ERC20_ABI,
                functionName: "decimals",
            }));
        }
        const data = (0, viem_1.encodeFunctionData)({
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [params.to, (0, viem_1.parseUnits)(params.amount, decimals)],
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
    async signMessage(message) {
        return this.auth.signMessage(message);
    }
    // ── Token Utilities ──────────────────────────────────────────
    /**
     * Get the ERC-20 token balance of the smart account.
     *
     * @param tokenAddress - ERC-20 contract address.
     * @returns Object with balance, symbol, name, and decimals.
     */
    async getTokenBalance(tokenAddress) {
        const target = this._smartAccountAddress || this.eoaAddress;
        if (!target)
            throw new Error("[0xgas] No address available. Login first.");
        const pc = this.getPublicClient();
        const [rawBalance, decimals, symbol, name] = await Promise.all([
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [target] }),
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "decimals" }),
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "symbol" }),
            pc.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "name" }),
        ]);
        return {
            balance: (0, viem_1.formatUnits)(rawBalance, decimals),
            symbol: symbol,
            name: name,
            decimals: decimals,
            rawBalance: rawBalance,
        };
    }
    /**
     * Get the native token (ETH) balance of the smart account.
     */
    async getNativeBalance() {
        const target = this._smartAccountAddress || this.eoaAddress;
        if (!target)
            throw new Error("[0xgas] No address available. Login first.");
        const pc = this.getPublicClient();
        return pc.getBalance({ address: target });
    }
    // ── Lifecycle ────────────────────────────────────────────────
    /** Log out, clear smart account state. */
    async logout() {
        await this.auth.logout();
        this.smartAccount = null;
        this._smartAccountAddress = null;
        this.log("Logged out, smart account cleared");
    }
    /** Full teardown — logout + remove all listeners. */
    destroy() {
        this.auth.destroy();
        this.smartAccount = null;
        this._smartAccountAddress = null;
    }
    // ── Private ──────────────────────────────────────────────────
    getSmartAccount() {
        if (!this.smartAccount) {
            throw new Error("[0xgas] Smart account not set up. Call setupSmartAccount() first.");
        }
        return this.smartAccount;
    }
    getPublicClient() {
        const rpcUrl = this.config.rpcUrl;
        return (0, viem_1.createPublicClient)({
            transport: (0, viem_1.http)(rpcUrl),
        });
    }
    log(...args) {
        if (this.debug) {
            console.log("[0xgas-client]", ...args);
        }
    }
}
exports.OxGasClient = OxGasClient;
//# sourceMappingURL=OxGasClient.js.map