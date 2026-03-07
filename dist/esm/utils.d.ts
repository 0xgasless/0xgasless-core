/**
 * Convert a Uint8Array to a 0x-prefixed hex string.
 */
export declare function toHex(bytes: Uint8Array): `0x${string}`;
/**
 * Normalize any message input to a 0x-prefixed hex string.
 * Handles: string, Uint8Array, and viem-style `{ raw: Uint8Array | string }` objects.
 */
export declare function normalizeMessageToHex(message: string | Uint8Array | {
    raw: Uint8Array | string;
}): string;
/**
 * Wrap a promise with a timeout. Rejects with the given error if the
 * promise does not resolve within `ms` milliseconds.
 */
export declare function withTimeout<T>(promise: Promise<T>, ms: number, createError: () => Error): Promise<T>;
//# sourceMappingURL=utils.d.ts.map