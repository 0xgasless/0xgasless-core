/**
 * Convert a Uint8Array to a 0x-prefixed hex string.
 */
export function toHex(bytes: Uint8Array): `0x${string}` {
    return `0x${Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}` as `0x${string}`;
}

/**
 * Normalize any message input to a 0x-prefixed hex string.
 * Handles: string, Uint8Array, and viem-style `{ raw: Uint8Array | string }` objects.
 */
export function normalizeMessageToHex(
    message: string | Uint8Array | { raw: Uint8Array | string }
): string {
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
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    createError: () => Error
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(createError()), ms);
    });

    return Promise.race([promise, timeout]).finally(() =>
        clearTimeout(timeoutId)
    );
}
