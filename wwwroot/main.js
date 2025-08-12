"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Main entry point for regular JavaScript
const app_1 = require("./app");
// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new app_1.App();
    window.app = app;
    app.init();
});
// Make App available globally
window.App = app_1.App;
//# sourceMappingURL=main.js.map