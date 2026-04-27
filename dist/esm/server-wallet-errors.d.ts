import { OxGasError } from "./errors";
/**
 * Thrown when attempting to sign for a userId that has no wallet.
 */
export declare class WalletNotFoundError extends OxGasError {
    readonly userId: string;
    constructor(userId: string);
}
/**
 * Thrown when the 0xgas policy engine blocks a transaction.
 * The `reason` field contains the human-readable policy violation message
 * returned by the API — useful for displaying to end users (e.g. in a bot).
 */
export declare class PolicyViolationError extends OxGasError {
    /** Human-readable reason the transaction was blocked. */
    readonly reason: string;
    constructor(reason: string);
}
/**
 * Thrown when server-side signing fails for a reason other than a policy violation.
 */
export declare class ServerSigningError extends OxGasError {
    constructor(message: string);
}
/**
 * Thrown when the 0xgas API is unreachable, returns an unexpected status,
 * or the request times out.
 */
export declare class NetworkError extends OxGasError {
    /** HTTP status code, if available. */
    readonly statusCode?: number;
    constructor(message: string, statusCode?: number);
}
//# sourceMappingURL=server-wallet-errors.d.ts.map