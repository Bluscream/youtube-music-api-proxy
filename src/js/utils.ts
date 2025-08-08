import { DEFAULT_TITLE, SIDEBAR_COLLAPSE_BREAKPOINT } from './constants';

// Helper function to format duration
export function formatDuration(duration: any): string {
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
export function formatNumber(num: number): string {
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
export function formatDate(dateString: string): string {
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
export function getQueryParams(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}

// Convert query parameters to URL string
export function buildQueryString(params: Record<string, any>): string {
    return Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}

// Update URL with new parameters
export function updateURL(params: Record<string, any>): void {
    const url = new URL(window.location.href);
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
export async function updateCSSBreakpoints(): Promise<void> {
    try {
        document.documentElement.style.setProperty('--sidebar-collapse-breakpoint', `${SIDEBAR_COLLAPSE_BREAKPOINT}px`);
    } catch (error) {
        console.error('Error updating CSS breakpoints:', error);
    }
}

// Check if sidebar should be collapsed based on screen width
export async function shouldCollapseSidebar(): Promise<boolean> {
    try {
        return window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
    } catch (error) {
        console.error('Error checking sidebar collapse:', error);
        return false; // Default to not collapsed on error
    }
}

// Function to stop all audio elements in the document
export function stopAllAudio(): void {
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
        if ((video as any).audioTracks && (video as any).audioTracks.length > 0) {
            video.pause();
            video.currentTime = 0;
        }
    });

    // Also stop any HTML5 audio elements that might be created dynamically
    if (window.AudioContext || (window as any).webkitAudioContext) {
        // Stop any active audio contexts
        try {
            // Only create AudioContext if it's allowed (user has interacted with page)
            if (document.body.classList.contains('user-interacted')) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();
                if (audioContext.state === 'running') {
                    audioContext.suspend();
                }
            }
        } catch (e) {
            // Ignore errors if audio context is not available
        }
    }

    // Force stop any media elements that might be playing in the background
    // This handles cases where audio might be playing from other sources
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(media => {
        if (!(media as HTMLMediaElement).paused) {
            (media as HTMLMediaElement).pause();
            (media as HTMLMediaElement).currentTime = 0;
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
export function showLoading(): void {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const welcomeSection = document.querySelector('.welcome-section');
    const searchResults = document.getElementById('searchResults');
    const libraryContent = document.getElementById('libraryContent');

    if (loading) (loading as HTMLElement).style.display = 'block';
    if (error) (error as HTMLElement).style.display = 'none';
    if (welcomeSection) (welcomeSection as HTMLElement).style.display = 'none';
    if (searchResults) (searchResults as HTMLElement).style.display = 'none';
    if (libraryContent) (libraryContent as HTMLElement).style.display = 'none';
}

// Show error state
export function showError(message: string): void {
    const error = document.getElementById('error');
    const loading = document.getElementById('loading');
    const welcomeSection = document.querySelector('.welcome-section');
    const searchResults = document.getElementById('searchResults');
    const libraryContent = document.getElementById('libraryContent');

    if (error) {
        error.textContent = message;
        (error as HTMLElement).style.display = 'block';
    }
    if (loading) (loading as HTMLElement).style.display = 'none';
    if (welcomeSection) (welcomeSection as HTMLElement).style.display = 'none';
    if (searchResults) (searchResults as HTMLElement).style.display = 'none';
    if (libraryContent) (libraryContent as HTMLElement).style.display = 'none';
}

// Update active navigation item
export function updateActiveNavItem(clickedItem: Element): void {
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

// Create global utils object for backward compatibility
window.utils = {
    formatDuration,
    formatNumber,
    formatDate,
    getQueryParams,
    buildQueryString,
    updateURL,
    updateCSSBreakpoints,
    shouldCollapseSidebar,
    stopAllAudio,
    showLoading,
    showError,
    updateActiveNavItem
};

// Also export individual functions to window for direct access
window.formatDuration = formatDuration;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.getQueryParams = getQueryParams;
window.buildQueryString = buildQueryString;
window.updateURL = updateURL;
window.updateCSSBreakpoints = updateCSSBreakpoints;
window.shouldCollapseSidebar = shouldCollapseSidebar;
window.stopAllAudio = stopAllAudio;
window.showLoading = showLoading;
window.showError = showError;
window.updateActiveNavItem = updateActiveNavItem;

// Add synchronous wrapper for shouldCollapseSidebar for backward compatibility
window.shouldCollapseSidebarSync = (): boolean => {
    // Default to false for synchronous calls
    return window.innerWidth <= 800; // Default breakpoint
};
