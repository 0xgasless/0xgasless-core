"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.ServerSigningError = exports.PolicyViolationError = exports.WalletNotFoundError = void 0;
const errors_1 = require("./errors");
// ─── Server Wallet Errors ────────────────────────────────────────
/**
 * Thrown when attempting to sign for a userId that has no wallet.
 */
class WalletNotFoundError extends errors_1.OxGasError {
    userId;
    constructor(userId) {
        super(`No server wallet found for userId "${userId}". Call getOrCreateWallet() first.`, "WALLET_NOT_FOUND");
        this.name = "WalletNotFoundError";
        this.userId = userId;
    }
}
exports.WalletNotFoundError = WalletNotFoundError;
/**
 * Thrown when the 0xgas policy engine blocks a transaction.
 * The `reason` field contains the human-readable policy violation message
 * returned by the API — useful for displaying to end users (e.g. in a bot).
 */
class PolicyViolationError extends errors_1.OxGasError {
    /** Human-readable reason the transaction was blocked. */
    reason;
    constructor(reason) {
        super(`Policy violation: ${reason}`, "POLICY_VIOLATION");
        this.name = "PolicyViolationError";
        this.reason = reason;
    }
}
exports.PolicyViolationError = PolicyViolationError;
/**
 * Thrown when server-side signing fails for a reason other than a policy violation.
 */
class ServerSigningError extends errors_1.OxGasError {
    constructor(message) {
        super(message, "SERVER_SIGNING_ERROR");
        this.name = "ServerSigningError";
    }
}
exports.ServerSigningError = ServerSigningError;
/**
 * Thrown when the 0xgas API is unreachable, returns an unexpected status,
 * or the request times out.
 */
class NetworkError extends errors_1.OxGasError {
    /** HTTP status code, if available. */
    statusCode;
    constructor(message, statusCode) {
        super(message, "NETWORK_ERROR");
        this.name = "NetworkError";
        this.statusCode = statusCode;
    }
}
exports.NetworkError = NetworkError;
//# sourceMappingURL=server-wallet-errors.js.map