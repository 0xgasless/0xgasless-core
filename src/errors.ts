/**
 * Base error class for all 0xgas-auth errors.
 * Provides a `code` field for programmatic error handling.
 */
export class OxGasError extends Error {
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = "OxGasError";
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when an operation requires an authenticated user but none is connected.
 */
export class NotConnectedError extends OxGasError {
    constructor(message = "Wallet not connected. Call login() first.") {
        super(message, "NOT_CONNECTED");
        this.name = "NotConnectedError";
    }
}

/**
 * Thrown when the user rejects a signing request in the widget.
 */
export class SigningRejectedError extends OxGasError {
    constructor(message = "User rejected the signing request.") {
        super(message, "SIGNING_REJECTED");
        this.name = "SigningRejectedError";
    }
}

/**
 * Thrown when a signing or login operation exceeds the configured timeout.
 */
export class SigningTimeoutError extends OxGasError {
    public readonly timeoutMs: number;

    constructor(timeoutMs: number, operation = "Operation") {
        super(`${operation} timed out after ${timeoutMs}ms.`, "TIMEOUT");
        this.name = "SigningTimeoutError";
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Thrown when the widget iframe reports an error.
 */
export class WidgetError extends OxGasError {
    constructor(message: string) {
        super(message, "WIDGET_ERROR");
        this.name = "WidgetError";
    }
}
