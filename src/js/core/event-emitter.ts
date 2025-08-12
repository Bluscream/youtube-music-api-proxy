// Reusable EventEmitter class for better event management
export type EventHandler<T = any> = (data: T) => void;

export class EventEmitter {
    private events: Map<string, EventHandler[]> = new Map();

    /**
     * Add an event listener
     */
    on<T = any>(event: string, handler: EventHandler<T>): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(handler);
    }

    /**
     * Remove an event listener
     */
    off(event: string, handler: EventHandler): void {
        const handlers = this.events.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit an event
     */
    emit<T = any>(event: string, data?: T): void {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event?: string): void {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    /**
     * Get the number of listeners for an event
     */
    listenerCount(event: string): number {
        const handlers = this.events.get(event);
        return handlers ? handlers.length : 0;
    }
}
