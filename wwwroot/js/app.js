// Main Application Entry Point
// This file imports and initializes all the modular components

// Create YouTube Music Library instance immediately
window.ytmLibrary = new YouTubeMusicLibrary('', {
    timeout: 30000,
    retries: 3,
    volume: 1
});

// Import all modules
import './constants.js';
import './utils.js';
import './notification-manager.js';
import './sidebar-manager.js';
import './right-sidebar-manager.js';
import './player-manager.js';
import './content-manager.js';
import './url-manager.js';
import { setupEventDelegation } from './event-delegation.js';

// Initialize the application
function initializeApp() {
    console.log('Initializing YouTube Music API Proxy...');

    // Update CSS breakpoints
    if (window.updateCSSBreakpoints) {
        window.updateCSSBreakpoints();
    }

    // Initialize event delegation for data attributes
    setupEventDelegation();

    // Initialize mobile enhancements
    if (window.playerManager) {
        window.playerManager.addMobileTouchHandlers();
        window.playerManager.enhancePlayerControls();
    }

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

// Initialize the app when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

// Export for potential external use
export { initializeApp };
