import { EventEmitter } from './event-emitter';

// Base UI Component class with lifecycle management
export abstract class UIComponent extends EventEmitter {
    protected element: HTMLElement | null = null;
    protected isInitialized: boolean = false;

    constructor(protected selector?: string) {
        super();
    }

    /**
     * Initialize the component
     */
    init(): void {
        if (this.isInitialized) return;

        if (this.selector) {
            this.element = document.querySelector(this.selector);
        }

        this.onInit();
        this.setupEventListeners();
        this.isInitialized = true;
        this.emit('initialized');
    }

    /**
     * Destroy the component
     */
    destroy(): void {
        if (!this.isInitialized) return;

        this.removeAllListeners();
        this.onDestroy();
        this.isInitialized = false;
        this.emit('destroyed');
    }

    /**
     * Get the component element
     */
    getElement(): HTMLElement | null {
        return this.element;
    }

    /**
     * Check if component is initialized
     */
    isReady(): boolean {
        return this.isInitialized && this.element !== null;
    }

    /**
     * Show the component
     */
    show(): void {
        if (this.element) {
            this.element.style.display = '';
            this.emit('shown');
        }
    }

    /**
     * Hide the component
     */
    hide(): void {
        if (this.element) {
            this.element.style.display = 'none';
            this.emit('hidden');
        }
    }

    /**
     * Add CSS class to component
     */
    addClass(className: string): void {
        if (this.element) {
            this.element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from component
     */
    removeClass(className: string): void {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }

    /**
     * Toggle CSS class on component
     */
    toggleClass(className: string): void {
        if (this.element) {
            this.element.classList.toggle(className);
        }
    }

    /**
     * Check if component has CSS class
     */
    hasClass(className: string): boolean {
        return this.element?.classList.contains(className) || false;
    }

    /**
     * Set component content
     */
    setContent(content: string): void {
        if (this.element) {
            this.element.innerHTML = content;
        }
    }

    /**
     * Get component content
     */
    getContent(): string {
        return this.element?.innerHTML || '';
    }

    /**
     * Abstract methods to be implemented by subclasses
     */
    protected abstract onInit(): void;
    protected abstract onDestroy(): void;
    protected abstract setupEventListeners(): void;
}
