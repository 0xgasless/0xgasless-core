import type { ServerWalletOptions, ServerWalletInfo, CreateWalletOptions, SignTransactionParams, SignTransactionResult, ListWalletsResponse, BroadcastResult } from "./server-wallet-types";
/**
 * Server-side wallet client for the 0xgas platform.
 *
 * Designed for **Node.js backends** — Telegram bots, trading bots, cron jobs,
 * and any automated system that needs to manage wallets and sign transactions
 * programmatically without user interaction.
 *
 * - No browser, no iframe, no DOM required.
 * - Wallets are created and identified by any string (`userId`).
 * - Signing is instant — no human approval flow.
 * - Transactions are governed by the policy engine configured in the 0xgas dashboard.
 *
 * @example
 * ```ts
 * import { OxGasServerWallet } from '@0xgasless/core';
 *
 * const wallet = new OxGasServerWallet({
 *   apiKey: 'your_project_api_key',
 *   defaultChainId: 43113,
 * });
 *
 * const address = await wallet.getAddress('telegram_123456');
 * console.log('Wallet:', address);
 *
 * const result = await wallet.signTransaction('telegram_123456', {
 *   to: '0x1111111111111111111111111111111111111111',
 *   value: '1000000000000000',
 *   nonce: 0,
 *   chainId: 43113,
 * });
 *
 * const txHash = await wallet.broadcastTransaction(
 *   result.rawTx,
 *   'https://api.avax-test.network/ext/bc/C/rpc'
 * );
 * ```
 */
export declare class OxGasServerWallet {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly defaultChainId;
    private readonly timeout;
    constructor(options: ServerWalletOptions);
    /**
     * Get or create a server wallet for the given `userId`.
     *
     * This is **idempotent** — safe to call on every interaction.
     * If the wallet already exists, the existing address is returned.
     *
     * @param userId  Any unique string — e.g. `"telegram_123456789"`, a UUID, an email.
     * @param options Optional label and chainId override.
     * @returns Full wallet information including the address.
     */
    getOrCreateWallet(userId: string, options?: CreateWalletOptions): Promise<ServerWalletInfo>;
    /**
     * Convenience method — returns just the wallet address for a `userId`.
     *
     * Internally calls `getOrCreateWallet`, so it's safe to call every time
     * without checking whether the wallet already exists.
     *
     * @param userId  The unique user identifier.
     * @param options Optional label and chainId override.
     * @returns The `0x`-prefixed wallet address.
     */
    getAddress(userId: string, options?: CreateWalletOptions): Promise<`0x${string}`>;
    /**
     * List all server wallets belonging to this project.
     *
     * @returns Project ID, total count, and array of wallet records.
     */
    listWallets(): Promise<ListWalletsResponse>;
    /**
     * Sign a transaction using the server wallet's KMS-backed key.
     *
     * No human approval is required — signing happens instantly.
     * The returned `rawTx` is a fully signed RLP-encoded EVM transaction
     * ready for `eth_sendRawTransaction`.
     *
     * If the transaction violates a policy set in the 0xgas dashboard,
     * a `PolicyViolationError` is thrown with the reason string.
     *
     * @param userId   The wallet owner's unique identifier.
     * @param txParams Transaction parameters (to, value, nonce, chainId, etc.).
     * @returns Signed transaction data including rawTx, txHash, and from address.
     *
     * @throws {PolicyViolationError} When the policy engine blocks the transaction.
     * @throws {WalletNotFoundError}  When no wallet exists for this userId.
     * @throws {ServerSigningError}   When signing fails for another reason.
     */
    signTransaction(userId: string, txParams: SignTransactionParams): Promise<SignTransactionResult>;
    /**
     * Broadcast a signed transaction to any EVM-compatible RPC endpoint.
     *
     * Takes the `rawTx` returned by `signTransaction` and submits it
     * via `eth_sendRawTransaction`. Works with any chain's RPC URL.
     *
     * @param rawTx  The signed, RLP-encoded transaction hex string.
     * @param rpcUrl The JSON-RPC endpoint to broadcast to.
     * @returns The transaction hash confirmed by the network.
     *
     * @throws {NetworkError} When the RPC call fails or returns an error.
     */
    broadcastTransaction(rawTx: string, rpcUrl: string): Promise<BroadcastResult>;
    /**
     * Internal HTTP helper.
     * Handles auth headers, timeouts, and maps API errors to typed exceptions.
     */
    private request;
    /**
     * Safely parse JSON from a response — returns null on failure
     * so error-mapping logic never throws during its own error handling.
     */
    private safeJson;
}
//# sourceMappingURL=OxGasServerWallet.d.ts.map