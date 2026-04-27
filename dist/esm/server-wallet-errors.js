import { OxGasError } from "./errors";
// ─── Server Wallet Errors ────────────────────────────────────────
/**
 * Thrown when attempting to sign for a userId that has no wallet.
 */
export class WalletNotFoundError extends OxGasError {
    userId;
    constructor(userId) {
        super(`No server wallet found for userId "${userId}". Call getOrCreateWallet() first.`, "WALLET_NOT_FOUND");
        this.name = "WalletNotFoundError";
        this.userId = userId;
    }
}
/**
 * Thrown when the 0xgas policy engine blocks a transaction.
 * The `reason` field contains the human-readable policy violation message
 * returned by the API — useful for displaying to end users (e.g. in a bot).
 */
export class PolicyViolationError extends OxGasError {
    /** Human-readable reason the transaction was blocked. */
    reason;
    constructor(reason) {
        super(`Policy violation: ${reason}`, "POLICY_VIOLATION");
        this.name = "PolicyViolationError";
        this.reason = reason;
    }
}
/**
 * Thrown when server-side signing fails for a reason other than a policy violation.
 */
export class ServerSigningError extends OxGasError {
    constructor(message) {
        super(message, "SERVER_SIGNING_ERROR");
        this.name = "ServerSigningError";
    }
}
/**
 * Thrown when the 0xgas API is unreachable, returns an unexpected status,
 * or the request times out.
 */
export class NetworkError extends OxGasError {
    /** HTTP status code, if available. */
    statusCode;
    constructor(message, statusCode) {
        super(message, "NETWORK_ERROR");
        this.name = "NetworkError";
        this.statusCode = statusCode;
    }
}
//# sourceMappingURL=server-wallet-errors.js.map