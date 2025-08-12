// Main entry point for AMD bundling
import { App } from './app';

// Initialize the app immediately (RequireJS ensures DOM is ready)
const app = new App();
(window as any).app = app;
app.init();

// Make App available globally
(window as any).App = App;

// Export for AMD
export { App };
