/**
 * Minimal typed EventEmitter — zero external dependencies.
 * Generic parameter `T` maps event names to their handler signatures.
 */
export declare class TypedEventEmitter<T extends Record<string, any>> {
    private listeners;
    /**
     * Register a listener for the given event.
     * Returns an unsubscribe function for convenience.
     */
    on<K extends keyof T>(event: K, handler: T[K]): () => void;
    /** Remove a previously registered listener. */
    off<K extends keyof T>(event: K, handler: T[K]): void;
    /** Register a one-shot listener that auto-removes after first invocation. */
    once<K extends keyof T>(event: K, handler: T[K]): () => void;
    /** Emit an event, invoking all registered listeners with the provided args. */
    protected emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
    /** Remove all listeners, optionally for a specific event only. */
    removeAllListeners(event?: keyof T): void;
}
//# sourceMappingURL=events.d.ts.map