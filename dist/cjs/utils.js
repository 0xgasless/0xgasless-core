"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHex = toHex;
exports.normalizeMessageToHex = normalizeMessageToHex;
exports.withTimeout = withTimeout;
/**
 * Convert a Uint8Array to a 0x-prefixed hex string.
 */
function toHex(bytes) {
    return `0x${Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
}
/**
 * Normalize any message input to a 0x-prefixed hex string.
 * Handles: string, Uint8Array, and viem-style `{ raw: Uint8Array | string }` objects.
 */
function normalizeMessageToHex(message) {
    if (message instanceof Uint8Array) {
        return toHex(message);
    }
    if (typeof message === "object" && "raw" in message) {
        const raw = message.raw;
        return raw instanceof Uint8Array ? toHex(raw) : raw;
    }
    return message;
}
/**
 * Wrap a promise with a timeout. Rejects with the given error if the
 * promise does not resolve within `ms` milliseconds.
 */
function withTimeout(promise, ms, createError) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(createError()), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}
//# sourceMappingURL=utils.js.map