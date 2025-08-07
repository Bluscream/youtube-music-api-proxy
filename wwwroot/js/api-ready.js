// API Readiness System - Must be loaded before any modules
// This ensures window.onApiReady is available when modules are imported

// Global state to track API readiness
window.apiReady = false;
window.apiReadyCallbacks = [];

// Function to register callbacks that should run when API is ready
window.onApiReady = (callback) => {
    if (window.apiReady) {
        callback();
    } else {
        window.apiReadyCallbacks.push(callback);
    }
};

// Function to notify all callbacks that API is ready
window.notifyApiReady = () => {
    window.apiReady = true;
    window.apiReadyCallbacks.forEach(callback => {
        try {
            callback();
        } catch (error) {
            console.error('Error in API ready callback:', error);
        }
    });
    window.apiReadyCallbacks = [];
};

console.log('API readiness system initialized');
