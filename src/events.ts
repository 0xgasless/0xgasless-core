/**
 * Minimal typed EventEmitter — zero external dependencies.
 * Generic parameter `T` maps event names to their handler signatures.
 */
export class TypedEventEmitter<T extends Record<string, any>> {
    private listeners = new Map<keyof T, Set<Function>>();

    /**
     * Register a listener for the given event.
     * Returns an unsubscribe function for convenience.
     */
    on<K extends keyof T>(event: K, handler: T[K]): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
        return () => this.off(event, handler);
    }

    /** Remove a previously registered listener. */
    off<K extends keyof T>(event: K, handler: T[K]): void {
        this.listeners.get(event)?.delete(handler);
    }

    /** Register a one-shot listener that auto-removes after first invocation. */
    once<K extends keyof T>(event: K, handler: T[K]): () => void {
        const wrapper = ((...args: any[]) => {
            this.off(event, wrapper as T[K]);
            (handler as Function)(...args);
        }) as T[K];
        return this.on(event, wrapper);
    }

    /** Emit an event, invoking all registered listeners with the provided args. */
    protected emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
        this.listeners.get(event)?.forEach((fn) => {
            try {
                fn(...args);
            } catch {
                // Listener errors should never crash the SDK
            }
        });
    }

    /** Remove all listeners, optionally for a specific event only. */
    removeAllListeners(event?: keyof T): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}
