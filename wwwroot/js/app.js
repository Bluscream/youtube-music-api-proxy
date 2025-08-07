// Main Application Entry Point
// This file imports and initializes all the modular components
// Note: API readiness system is now defined in api-ready.js and loaded before this module

console.log('Creating YouTube Music API...');
console.log('YouTubeMusicAPI available:', typeof YouTubeMusicAPI);

function createAPI() {
    if (typeof YouTubeMusicAPI !== 'undefined') {
        try {
            window.ytmAPI = new YouTubeMusicAPI('', {
                timeout: 30000,
                retries: 3
            });
            console.log('YouTube Music API created:', window.ytmAPI);
            return true;
        } catch (error) {
            console.error('Error creating YouTube Music API:', error);
            return false;
        }
    }
    return false;
}

// Enhanced API initialization with better error handling
async function initializeAPI(maxRetries = 10, retryDelay = 1000) {
    let retryCount = 0;

    const attemptCreate = async () => {
        if (createAPI()) {
            // Test the API to make sure it's working
            try {
                // Try a simple health check or basic operation
                if (window.ytmAPI.getHealth) {
                    await window.ytmAPI.getHealth();
                } else {
                    // If getHealth doesn't exist, just assume the API is working
                    console.log('YouTube Music API created successfully (no health check available)');
                }
                console.log('YouTube Music API is ready and working');
                window.notifyApiReady();
                return true;
            } catch (error) {
                console.error('API health check failed:', error);
                // Even if health check fails, we can still proceed if the API object exists
                if (window.ytmAPI) {
                    console.log('YouTube Music API created but health check failed, proceeding anyway');
                    window.notifyApiReady();
                    return true;
                }
                return false;
            }
        }

        retryCount++;
        if (retryCount < maxRetries) {
            console.log(`YouTube Music API not available, retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return await attemptCreate();
        } else {
            console.error('YouTube Music API failed to initialize after maximum retries');
            // Show error to user
            const errorDiv = document.getElementById('error');
            if (errorDiv) {
                errorDiv.textContent = 'Failed to initialize YouTube Music API. Please refresh the page.';
                errorDiv.style.display = 'block';
            }
            return false;
        }
    };

    return await attemptCreate();
}

// Import all modules (but don't initialize them yet)
import './constants.js';
import './utils.js';
import './notification-manager.js';
import './sidebar-manager.js';
import './right-sidebar-manager.js';
import './player-manager.js';
import './content-manager.js';
import './url-manager.js';
import { setupEventDelegation } from './event-delegation.js';

// Initialize the application only after API is ready
function initializeApp() {
    console.log('Initializing YouTube Music API Proxy...');

    // Update CSS breakpoints
    if (window.updateCSSBreakpoints) {
        window.updateCSSBreakpoints().catch(error => {
            console.error('Error updating CSS breakpoints:', error);
        });
    }

    // Initialize event delegation for data attributes
    setupEventDelegation();

    // Track user interaction to enable AudioContext
    const trackUserInteraction = () => {
        document.body.classList.add('user-interacted');
        // Remove the event listeners after first interaction
        document.removeEventListener('click', trackUserInteraction);
        document.removeEventListener('touchstart', trackUserInteraction);
        document.removeEventListener('keydown', trackUserInteraction);
    };

    document.addEventListener('click', trackUserInteraction);
    document.addEventListener('touchstart', trackUserInteraction);
    document.addEventListener('keydown', trackUserInteraction);

    // Stop any existing audio when page loads
    if (window.stopAllAudio) {
        window.stopAllAudio();
    }

    // Stop audio when page is about to unload
    window.addEventListener('beforeunload', () => {
        if (window.stopAllAudio) {
            window.stopAllAudio();
        }
    });

    // Initialize mobile enhancements
    if (window.playerManager) {
        window.playerManager.addMobileTouchHandlers();
        window.playerManager.enhancePlayerControls();
    }

    // Add event listeners for navigation items
    document.addEventListener('DOMContentLoaded', function () {
        const libraryNavItem = document.getElementById('libraryNavItem');
        const songsNavItem = document.getElementById('songsNavItem');
        const artistsNavItem = document.getElementById('artistsNavItem');
        const albumsNavItem = document.getElementById('albumsNavItem');
        const searchInput = document.getElementById('searchInput');

        if (libraryNavItem) {
            libraryNavItem.addEventListener('click', window.loadLibrary);
        }
        if (songsNavItem) {
            songsNavItem.addEventListener('click', window.loadSongs);
        }
        if (artistsNavItem) {
            artistsNavItem.addEventListener('click', window.loadArtists);
        }
        if (albumsNavItem) {
            albumsNavItem.addEventListener('click', window.loadAlbums);
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', window.handleSearch);
        }
    });

    // Check if there are URL parameters to load from
    // Use a small delay to ensure all modules are loaded
    setTimeout(() => {
        if (window.getQueryParams) {
            const params = window.getQueryParams();
            console.log('URL parameters found:', params);

            if (params.playlist || params.song) {
                // Load playlists first, then load from URL parameters
                if (window.contentManager) {
                    window.contentManager.loadPlaylists().then(() => {
                        if (window.urlManager) {
                            window.urlManager.loadFromURL();
                        }
                    });
                }
            } else {
                // No URL parameters, load home page
                if (window.contentManager) {
                    window.contentManager.loadHome();
                    // Load playlists in background
                    window.contentManager.loadPlaylists();
                }
            }
        } else {
            console.error('getQueryParams function not available');
            // Fallback: load home page
            if (window.contentManager) {
                window.contentManager.loadHome();
                window.contentManager.loadPlaylists();
            }
        }
    }, 100);

    console.log('YouTube Music API Proxy initialized successfully!');
}

// Main initialization function
async function startApplication() {
    console.log('Starting YouTube Music API Proxy application...');

    // Show loading state
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'block';
        loading.textContent = 'Initializing YouTube Music API...';
    }

    // Initialize API first
    const apiSuccess = await initializeAPI();

    if (!apiSuccess) {
        console.error('Failed to initialize API, application cannot start');
        return;
    }

    // Hide loading and show success
    if (loading) {
        loading.textContent = 'API Ready! Initializing application...';
    }

    // Initialize the app
    initializeApp();

    // Hide loading completely
    if (loading) {
        loading.style.display = 'none';
    }

    console.log('Application startup complete!');
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication);
} else {
    // DOM is already ready
    startApplication();
}

// Export for potential external use
export { initializeApp, startApplication };
