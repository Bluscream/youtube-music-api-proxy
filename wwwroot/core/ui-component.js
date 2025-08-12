"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIComponent = void 0;
const event_emitter_1 = require("./event-emitter");
// Base UI Component class with lifecycle management
class UIComponent extends event_emitter_1.EventEmitter {
    constructor(selector) {
        super();
        this.selector = selector;
        this.element = null;
        this.isInitialized = false;
    }
    /**
     * Initialize the component
     */
    init() {
        if (this.isInitialized)
            return;
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
    destroy() {
        if (!this.isInitialized)
            return;
        this.removeAllListeners();
        this.onDestroy();
        this.isInitialized = false;
        this.emit('destroyed');
    }
    /**
     * Get the component element
     */
    getElement() {
        return this.element;
    }
    /**
     * Check if component is initialized
     */
    isReady() {
        return this.isInitialized && this.element !== null;
    }
    /**
     * Show the component
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
            this.emit('shown');
        }
    }
    /**
     * Hide the component
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.emit('hidden');
        }
    }
    /**
     * Add CSS class to component
     */
    addClass(className) {
        if (this.element) {
            this.element.classList.add(className);
        }
    }
    /**
     * Remove CSS class from component
     */
    removeClass(className) {
        if (this.element) {
            this.element.classList.remove(className);
        }
    }
    /**
     * Toggle CSS class on component
     */
    toggleClass(className) {
        if (this.element) {
            this.element.classList.toggle(className);
        }
    }
    /**
     * Check if component has CSS class
     */
    hasClass(className) {
        return this.element?.classList.contains(className) || false;
    }
    /**
     * Set component content
     */
    setContent(content) {
        if (this.element) {
            this.element.innerHTML = content;
        }
    }
    /**
     * Get component content
     */
    getContent() {
        return this.element?.innerHTML || '';
    }
}
exports.UIComponent = UIComponent;
//# sourceMappingURL=ui-component.js.map