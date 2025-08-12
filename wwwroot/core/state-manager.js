"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const event_emitter_1 = require("./event-emitter");
// Base state manager with change detection and events
class StateManager extends event_emitter_1.EventEmitter {
    constructor(initialState, storageKey) {
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
    getState() {
        return { ...this.state };
    }
    /**
     * Update state partially
     */
    setState(updates) {
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
    replaceState(newState) {
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
    subscribe(handler) {
        this.on('stateChanged', handler);
        return () => this.off('stateChanged', handler);
    }
    /**
     * Save state to localStorage
     */
    saveToStorage() {
        if (!this.storageKey)
            return;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        }
        catch (error) {
            console.error(`Failed to save state to storage (${this.storageKey}):`, error);
        }
    }
    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        if (!this.storageKey)
            return;
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.state = { ...this.state, ...parsed };
            }
        }
        catch (error) {
            console.error(`Failed to load state from storage (${this.storageKey}):`, error);
        }
    }
    /**
     * Clear stored state
     */
    clearStorage() {
        if (this.storageKey) {
            localStorage.removeItem(this.storageKey);
        }
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=state-manager.js.map