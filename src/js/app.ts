// Main Application Entry Point
// This file imports and initializes all the modular components

// Reference types
/// <reference path="./types.d.ts" />

// Import CSS
import '../css/main.css';

// Import all modules (but don't initialize them yet)
import './constants';
import './utils';
import './notification-manager';
import './sidebar-manager';
import './right-sidebar-manager';
import './player-manager';
import './content-manager';
import './url-manager';
import { setupEventDelegation } from './event-delegation';
import apiService from './services/api-service';

console.log('Initializing API service...');

// Enhanced API initialization with better error handling
async function initializeAPI(maxRetries: number = 10, retryDelay: number = 1000): Promise<boolean> {
    let retryCount = 0;

    const attemptCreate = async (): Promise<boolean> => {
        try {
            // Initialize the API service
            const api = await apiService.initialize('', {
                timeout: 30000,
                retries: 3
            });

            // Set the global API instance for backward compatibility
            window.ytmAPI = api;

            console.log('YouTube Music API is ready and working');
            return true;
        } catch (error) {
            console.error('Error creating YouTube Music API:', error);

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
        }
    };

    return await attemptCreate();
}

// Initialize the application only after API is ready
function initializeApp(): void {
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
    const trackUserInteraction = (): void => {
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
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;

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
async function startApplication(): Promise<void> {
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
