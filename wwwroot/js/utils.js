import { DEFAULT_TITLE } from './constants.js';

// Helper function to format duration
export function formatDuration(duration) {
    if (!duration) return 'Unknown';

    // If it's already formatted (HH:MM:SS), return as is
    if (typeof duration === 'string' && duration.includes(':')) {
        // Remove milliseconds if present (e.g., "00:03:17.3600000" -> "00:03:17")
        return duration.split('.')[0];
    }

    // If it's a number (seconds), convert to HH:MM:SS
    if (typeof duration === 'number') {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    return duration;
}

// Helper function to format numbers (e.g., 1000000 -> 1M)
export function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Helper function to format date
export function formatDate(dateString) {
    if (!dateString) return 'Unknown';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Get all query parameters from the current URL
export function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}

// Convert query parameters to URL string
export function buildQueryString(params) {
    return Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}

// Update URL with new parameters
export function updateURL(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, params[key]);
        }
    });
    window.history.pushState({}, '', url);
}

// Update CSS variables to match JavaScript constants
export function updateCSSBreakpoints() {
    import('./constants.js').then(({ SIDEBAR_COLLAPSE_BREAKPOINT }) => {
        document.documentElement.style.setProperty('--sidebar-collapse-breakpoint', `${SIDEBAR_COLLAPSE_BREAKPOINT}px`);
    });
}

// Check if sidebar should be collapsed based on screen width
export function shouldCollapseSidebar() {
    import('./constants.js').then(({ SIDEBAR_COLLAPSE_BREAKPOINT }) => {
        return window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
    });
}

// Function to stop all audio elements in the document
export function stopAllAudio() {
    // Stop the current audio
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        window.currentAudio = null;
    }

    // Stop all other audio elements that might be playing
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== window.currentAudio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });

    // Stop any video elements that might have audio
    const allVideoElements = document.querySelectorAll('video');
    allVideoElements.forEach(video => {
        if (video.audioTracks && video.audioTracks.length > 0) {
            video.pause();
            video.currentTime = 0;
        }
    });

    // Also stop any HTML5 audio elements that might be created dynamically
    if (window.AudioContext || window.webkitAudioContext) {
        // Stop any active audio contexts
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'running') {
                audioContext.suspend();
            }
        } catch (e) {
            // Ignore errors if audio context is not available
        }
    }

    // Force stop any media elements that might be playing in the background
    // This handles cases where audio might be playing from other sources
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(media => {
        if (!media.paused) {
            media.pause();
            media.currentTime = 0;
        }
    });

    // Clear song info when stopping audio
    window.currentSongInfo = null;
    if (window.clearInfoPanel) {
        window.clearInfoPanel();
    }

    console.log('Stopped all audio playback');
}

// Show loading state
export function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.querySelector('.welcome-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
}

// Show error state
export function showError(message) {
    document.getElementById('error').textContent = message;
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.querySelector('.welcome-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
}

// Update active navigation item
export function updateActiveNavItem(clickedItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    // Add active class to clicked item
    clickedItem.classList.add('active');

    // Close mobile menu after navigation
    if (window.sidebarManager && window.sidebarManager.isMobile && window.sidebarManager.isMobileMenuOpen) {
        window.sidebarManager.toggle();
    }
}
