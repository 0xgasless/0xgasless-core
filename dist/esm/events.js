/**
 * Minimal typed EventEmitter — zero external dependencies.
 * Generic parameter `T` maps event names to their handler signatures.
 */
export class TypedEventEmitter {
    listeners = new Map();
    /**
     * Register a listener for the given event.
     * Returns an unsubscribe function for convenience.
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);
        return () => this.off(event, handler);
    }
    /** Remove a previously registered listener. */
    off(event, handler) {
        this.listeners.get(event)?.delete(handler);
    }
    /** Register a one-shot listener that auto-removes after first invocation. */
    once(event, handler) {
        const wrapper = ((...args) => {
            this.off(event, wrapper);
            handler(...args);
        });
        return this.on(event, wrapper);
    }
    /** Emit an event, invoking all registered listeners with the provided args. */
    emit(event, ...args) {
        this.listeners.get(event)?.forEach((fn) => {
            try {
                fn(...args);
            }
            catch {
                // Listener errors should never crash the SDK
            }
        });
    }
    /** Remove all listeners, optionally for a specific event only. */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    }
}
//# sourceMappingURL=events.js.map