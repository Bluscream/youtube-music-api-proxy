// Main entry point for regular JavaScript
import { App } from './app';

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    (window as any).app = app;
    app.init();
});

// Make App available globally
(window as any).App = App;
