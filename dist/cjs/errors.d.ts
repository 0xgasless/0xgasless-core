/**
 * Base error class for all 0xgas-auth errors.
 * Provides a `code` field for programmatic error handling.
 */
export declare class OxGasError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
/**
 * Thrown when an operation requires an authenticated user but none is connected.
 */
export declare class NotConnectedError extends OxGasError {
    constructor(message?: string);
}
/**
 * Thrown when the user rejects a signing request in the widget.
 */
export declare class SigningRejectedError extends OxGasError {
    constructor(message?: string);
}
/**
 * Thrown when a signing or login operation exceeds the configured timeout.
 */
export declare class SigningTimeoutError extends OxGasError {
    readonly timeoutMs: number;
    constructor(timeoutMs: number, operation?: string);
}
/**
 * Thrown when the widget iframe reports an error.
 */
export declare class WidgetError extends OxGasError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map