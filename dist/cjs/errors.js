"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidgetError = exports.SigningTimeoutError = exports.SigningRejectedError = exports.NotConnectedError = exports.OxGasError = void 0;
/**
 * Base error class for all 0xgas-auth errors.
 * Provides a `code` field for programmatic error handling.
 */
class OxGasError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.name = "OxGasError";
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.OxGasError = OxGasError;
/**
 * Thrown when an operation requires an authenticated user but none is connected.
 */
class NotConnectedError extends OxGasError {
    constructor(message = "Wallet not connected. Call login() first.") {
        super(message, "NOT_CONNECTED");
        this.name = "NotConnectedError";
    }
}
exports.NotConnectedError = NotConnectedError;
/**
 * Thrown when the user rejects a signing request in the widget.
 */
class SigningRejectedError extends OxGasError {
    constructor(message = "User rejected the signing request.") {
        super(message, "SIGNING_REJECTED");
        this.name = "SigningRejectedError";
    }
}
exports.SigningRejectedError = SigningRejectedError;
/**
 * Thrown when a signing or login operation exceeds the configured timeout.
 */
class SigningTimeoutError extends OxGasError {
    timeoutMs;
    constructor(timeoutMs, operation = "Operation") {
        super(`${operation} timed out after ${timeoutMs}ms.`, "TIMEOUT");
        this.name = "SigningTimeoutError";
        this.timeoutMs = timeoutMs;
    }
}
exports.SigningTimeoutError = SigningTimeoutError;
/**
 * Thrown when the widget iframe reports an error.
 */
class WidgetError extends OxGasError {
    constructor(message) {
        super(message, "WIDGET_ERROR");
        this.name = "WidgetError";
    }
}
exports.WidgetError = WidgetError;
//# sourceMappingURL=errors.js.map