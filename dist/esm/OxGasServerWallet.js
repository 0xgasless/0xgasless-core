import { WalletNotFoundError, PolicyViolationError, ServerSigningError, NetworkError, } from "./server-wallet-errors";
// ─── Defaults ────────────────────────────────────────────────────
const DEFAULT_BASE_URL = "https://pmwv2d8iwa.execute-api.eu-north-1.amazonaws.com";
const DEFAULT_TIMEOUT = 30_000; // 30 seconds — KMS signing can take a few seconds
// ─── OxGasServerWallet ──────────────────────────────────────────
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
export class OxGasServerWallet {
    apiKey;
    baseUrl;
    defaultChainId;
    timeout;
    constructor(options) {
        if (!options.apiKey) {
            throw new Error("[0xgas] Server wallet requires an apiKey.");
        }
        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
        this.defaultChainId = options.defaultChainId ?? 1;
        this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    }
    // ── Wallet Management ────────────────────────────────────────
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
    async getOrCreateWallet(userId, options) {
        const body = {
            userId,
            chainId: options?.chainId ?? this.defaultChainId,
        };
        if (options?.label) {
            body.label = options.label;
        }
        const data = await this.request("POST", "/v1/server/wallet/create", body);
        return data;
    }
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
    async getAddress(userId, options) {
        const info = await this.getOrCreateWallet(userId, options);
        return info.address;
    }
    /**
     * List all server wallets belonging to this project.
     *
     * @returns Project ID, total count, and array of wallet records.
     */
    async listWallets() {
        return this.request("GET", "/v1/server/wallets");
    }
    // ── Transaction Signing ──────────────────────────────────────
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
    async signTransaction(userId, txParams) {
        const body = {
            userId,
            to: txParams.to,
            value: txParams.value,
            nonce: txParams.nonce,
            chainId: txParams.chainId,
        };
        if (txParams.gas !== undefined)
            body.gas = txParams.gas;
        if (txParams.gasPrice !== undefined)
            body.gasPrice = txParams.gasPrice;
        if (txParams.data !== undefined)
            body.data = txParams.data;
        return this.request("POST", "/v1/server/tx/sign", body);
    }
    // ── Broadcasting ─────────────────────────────────────────────
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
    async broadcastTransaction(rawTx, rpcUrl) {
        const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendRawTransaction",
            params: [rawTx],
        };
        let response;
        try {
            response = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.timeout),
            });
        }
        catch (err) {
            throw new NetworkError(`Failed to broadcast transaction: ${err.message}`);
        }
        if (!response.ok) {
            throw new NetworkError(`RPC endpoint returned HTTP ${response.status}`, response.status);
        }
        const result = (await response.json());
        if (result.error) {
            throw new NetworkError(`RPC error: ${result.error.message}`, result.error.code);
        }
        return { txHash: result.result };
    }
    // ── Private ──────────────────────────────────────────────────
    /**
     * Internal HTTP helper.
     * Handles auth headers, timeouts, and maps API errors to typed exceptions.
     */
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
        let response;
        try {
            response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(this.timeout),
            });
        }
        catch (err) {
            if (err.name === "TimeoutError" || err.name === "AbortError") {
                throw new NetworkError(`Request to ${path} timed out after ${this.timeout}ms`);
            }
            throw new NetworkError(`Failed to reach 0xgas API: ${err.message}`);
        }
        // ── Map HTTP error codes to typed errors ──
        if (response.status === 403) {
            const data = await this.safeJson(response);
            const reason = data?.error ?? data?.message ?? "Unknown policy violation";
            throw new PolicyViolationError(reason);
        }
        if (response.status === 404) {
            const data = await this.safeJson(response);
            // Attempt to extract userId from the request body
            const uid = body?.userId;
            if (uid) {
                throw new WalletNotFoundError(uid);
            }
            throw new NetworkError(data?.error ?? data?.message ?? `Not found: ${path}`, 404);
        }
        if (!response.ok) {
            const data = await this.safeJson(response);
            const msg = data?.error ??
                data?.message ??
                `HTTP ${response.status} on ${method} ${path}`;
            throw new ServerSigningError(msg);
        }
        return (await response.json());
    }
    /**
     * Safely parse JSON from a response — returns null on failure
     * so error-mapping logic never throws during its own error handling.
     */
    async safeJson(response) {
        try {
            return (await response.json());
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=OxGasServerWallet.js.map