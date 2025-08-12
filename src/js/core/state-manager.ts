import { EventEmitter } from './event-emitter';

// Base state manager with change detection and events
export abstract class StateManager<T> extends EventEmitter {
    protected state: T;
    private readonly storageKey?: string;

    constructor(initialState: T, storageKey?: string) {
        super();
        this.state = initialState;
        this.storageKey = storageKey;

        if (storageKey) {
            this.loadFromStorage();
        }
    }

    /**
     * Get current state
     */
    getState(): T {
        return { ...this.state };
    }

    /**
     * Update state partially
     */
    setState(updates: Partial<T>): void {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };

        this.emit('stateChanged', {
            oldState,
            newState: this.state,
            changes: updates
        });

        if (this.storageKey) {
            this.saveToStorage();
        }
    }

    /**
     * Replace entire state
     */
    replaceState(newState: T): void {
        const oldState = { ...this.state };
        this.state = { ...newState };

        this.emit('stateChanged', {
            oldState,
            newState: this.state,
            changes: newState
        });

        if (this.storageKey) {
            this.saveToStorage();
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(handler: (data: { oldState: T; newState: T; changes: Partial<T> }) => void): () => void {
        this.on('stateChanged', handler);
        return () => this.off('stateChanged', handler);
    }

    /**
     * Save state to localStorage
     */
    private saveToStorage(): void {
        if (!this.storageKey) return;

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.error(`Failed to save state to storage (${this.storageKey}):`, error);
        }
    }

    /**
     * Load state from localStorage
     */
    private loadFromStorage(): void {
        if (!this.storageKey) return;

        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error(`Failed to load state from storage (${this.storageKey}):`, error);
        }
    }

    /**
     * Clear stored state
     */
    clearStorage(): void {
        if (this.storageKey) {
            localStorage.removeItem(this.storageKey);
        }
    }
}
