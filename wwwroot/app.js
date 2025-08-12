// Responsive breakpoints - these values are used throughout the application
// and are synchronized with CSS custom properties for consistent responsive behavior
const SIDEBAR_COLLAPSE_BREAKPOINT = 800; // Breakpoint for sidebar collapse (desktop and mobile)
// Settings system
const SETTINGS_KEYS = {
    PLAYLIST: 'playlist',
    SONG: 'song',
    AUTOPLAY: 'autoplay',
    REPEAT: 'repeat',
    SHUFFLE: 'shuffle',
    TAB: 'tab',
    POS: 'pos',
    RIGHT_SIDEBAR_SPLITTER_POS: 'split'
};
// Global settings object
window.settings = {
    autoplay: true,
    repeat: 'none', // 'none', 'one', 'all'
    shuffle: false,
    playlist: null,
    song: null,
    tab: 'info',
    pos: 0,
    split: 300
};
// Settings management functions
function loadSetting(key, defaultValue = null) {
    // First check query parameters (they override localStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const queryValue = urlParams.get(key);
    if (queryValue !== null) {
        // Parse the value based on expected type
        return parseSettingValue(key, queryValue);
    }
    // Fall back to localStorage
    try {
        const storedValue = localStorage.getItem(`setting_${key}`);
        if (storedValue !== null) {
            return parseSettingValue(key, storedValue);
        }
    } catch (error) {
        console.error(`Error loading setting ${key}:`, error);
    }
    return defaultValue;
}
function saveSetting(key, value) {
    try {
        // Save to localStorage
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
        // Only update URL parameters for playlist and song settings
        if (key === SETTINGS_KEYS.PLAYLIST || key === SETTINGS_KEYS.SONG) {
            // Update URL parameters (but don't trigger page reload)
            const url = new URL(window.location);
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value.toString());
            }
            // Update URL without reloading the page
            window.history.replaceState({}, '', url);
        }
        // console.log(`🎵 Settings System: Setting saved: ${key} = ${value}`);
    } catch (error) {
        console.error(`🎵 Settings System: Error saving setting ${key}:`, error);
    }
}
function parseSettingValue(key, value) {
    // Parse values based on their expected type
    switch (key) {
        case SETTINGS_KEYS.AUTOPLAY:
        case SETTINGS_KEYS.SHUFFLE:
            // Boolean values
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true' || value === '1';
            }
            return Boolean(value);
        case SETTINGS_KEYS.POS:
        case SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS:
            // Numeric values
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        case SETTINGS_KEYS.REPEAT:
            // String values with validation
            if (['none', 'one', 'all'].includes(value)) {
                return value;
            }
            return 'none';
        case SETTINGS_KEYS.TAB:
            // String values with validation
            if (['info', 'lyrics'].includes(value)) {
                return value;
            }
            return 'info';
        default:
            // String values (playlist, song)
            return value;
    }
}
function loadAllSettings() {
    // Load all settings with their default values
    const settings = {
        playlist: loadSetting(SETTINGS_KEYS.PLAYLIST, null),
        song: loadSetting(SETTINGS_KEYS.SONG, null),
        autoplay: loadSetting(SETTINGS_KEYS.AUTOPLAY, true),
        repeat: loadSetting(SETTINGS_KEYS.REPEAT, 'none'),
        shuffle: loadSetting(SETTINGS_KEYS.SHUFFLE, false),
        tab: loadSetting(SETTINGS_KEYS.TAB, 'info'),
        pos: loadSetting(SETTINGS_KEYS.POS, 0),
        split: loadSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, 300)
    };
    console.log('🎵 Settings System: Loaded settings:', settings);
    return settings;
}
function applySettings(settings) {
    // Apply all settings to global settings object
    window.settings = { ...window.settings, ...settings };
    // Apply tab setting (will be applied when rightSidebarManager is initialized)
    if (window.rightSidebarManager) {
        window.rightSidebarManager.switchTab(window.settings.tab);
    }
    // Apply position setting (song position) - will be applied when audio is loaded
    if (window.settings.pos > 0) {
        // Store position to apply when audio is loaded
        window.pendingSongPosition = window.settings.pos;
    }
    // Apply right sidebar splitter position
    if (window.rightSidebarManager) {
        window.rightSidebarManager.sidebarWidth = window.settings.split;
        window.rightSidebarManager.updateSidebarWidth();
    }
    // Update UI to reflect settings
    updateRepeatShuffleDisplay();
}
function saveAllSettings() {
    // Update global settings with current state
    window.settings.tab = window.rightSidebarManager ? window.rightSidebarManager.currentTab : 'info';
    window.settings.pos = currentAudio ? currentAudio.currentTime : 0;
    window.settings.split = window.rightSidebarManager ? window.rightSidebarManager.sidebarWidth : 300;
    // Save all settings
    saveSetting(SETTINGS_KEYS.PLAYLIST, window.settings.playlist);
    saveSetting(SETTINGS_KEYS.SONG, window.settings.song);
    saveSetting(SETTINGS_KEYS.AUTOPLAY, window.settings.autoplay);
    saveSetting(SETTINGS_KEYS.REPEAT, window.settings.repeat);
    saveSetting(SETTINGS_KEYS.SHUFFLE, window.settings.shuffle);
    saveSetting(SETTINGS_KEYS.TAB, window.settings.tab);
    saveSetting(SETTINGS_KEYS.POS, window.settings.pos);
    saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, window.settings.split);
}
// Auto-save settings periodically and on important events
function setupSettingsAutoSave() {
    // Save settings every 30 seconds
    setInterval(saveAllSettings, 30000);
    // Save settings when page is about to unload
    window.addEventListener('beforeunload', saveAllSettings);
    // Save settings when visibility changes (user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveAllSettings();
        }
    });
}
let currentAudio = null;
let isPlaying = false;
let playlists = [];
let currentPlaylistSongs = [];
let currentSongIndex = -1;
let isMobileMenuOpen = false;
let isSidebarCollapsed = false;
let errorRecoveryTimeout = null; // For automatic playlist advancement on error
let autoSkip = false;
// Playlist order management
let originalPlaylistOrder = [];
let shuffledPlaylistOrder = [];
// Default title for the application
const DEFAULT_TITLE = 'YouTube Music';
// Global variables for current song info
let currentSongInfo = null;
// Media key event handling
function setupMediaKeyListeners() {
    // Handle media key events
    navigator.mediaSession.setActionHandler('play', () => {
        if (currentAudio && !isPlaying) {
            togglePlay();
        }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        if (currentAudio && isPlaying) {
            togglePlay();
        }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (window.settings.playlist && currentPlaylistSongs.length > 0) {
            playPreviousSong();
        }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (window.settings.playlist && currentPlaylistSongs.length > 0) {
            playNextSong();
        }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (currentAudio && details.seekTime !== undefined) {
            currentAudio.currentTime = details.seekTime;
        }
    });
    navigator.mediaSession.setActionHandler('stop', () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            document.title = DEFAULT_TITLE;
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'none';
            }
        }
    });
    // Handle keyboard media keys
    document.addEventListener('keydown', (event) => {
        // Only handle media keys when the app is focused
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return; // Don't interfere with text input
        }
        switch (event.code) {
            case 'MediaPlayPause':
                event.preventDefault();
                if (currentAudio) {
                    togglePlay();
                }
                break;
            case 'MediaTrackNext':
                event.preventDefault();
                if (window.settings.playlist && currentPlaylistSongs.length > 0) {
                    playNextSong();
                }
                break;
            case 'MediaTrackPrevious':
                event.preventDefault();
                if (window.settings.playlist && currentPlaylistSongs.length > 0) {
                    playPreviousSong();
                }
                break;
        }
    });
}
// Function to stop all audio elements in the document
function stopAllAudio() {
    // Stop the current audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    // Stop all other audio elements that might be playing
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== currentAudio) {
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
    currentSongInfo = null;
    clearInfoPanel();
    console.log('Stopped all audio playback');
}
// Function to handle automatic playlist advancement on error
function handlePlaybackError(title, artist) {
    // Clear any existing error recovery timeout
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }
    // If we're in a playlist, automatically advance to next song after 3 seconds
    if (autoSkip && window.settings.playlist && currentPlaylistSongs.length > 0) {
        errorRecoveryTimeout = setTimeout(() => {
            console.log(`Auto-advancing playlist due to playback error: ${title}`);
            playNextSong();
            errorRecoveryTimeout = null;
        }, 3000);
    }
}
// Sidebar state management
class SidebarManager {
    constructor() {
        this.isMobile = false;
        this.currentState = 'expanded'; // 'full', 'expanded', 'icon', 'collapsed'
        this.isMobileMenuOpen = false;
        this.init();
    }
    init() {
        this.updateBreakpoint();
        this.setupEventListeners();
        this.restoreState();
        this.updateLayout();
    }
    updateBreakpoint() {
        this.isMobile = window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
    }
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();
            // Handle transition from mobile to desktop or vice versa
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }
            this.updateLayout();
        });
        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileMenuOpen) {
                const sidebar = document.getElementById('sidebar');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                    this.closeMobileMenu();
                }
            }
        });
        // Keyboard shortcuts for desktop
        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') { // Ctrl/Cmd + B to cycle through states
                event.preventDefault();
                this.cycleState();
            }
            // if (event.key === 'F11') { // F11 to toggle full screen
            //     event.preventDefault();
            //     if (this.currentState === 'full') {
            //         this.setState('expanded');
            //     } else {
            //         this.setState('full');
            //     }
            // }
        });
        // Double-click sidebar toggle to enter full screen
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('dblclick', (event) => {
                event.preventDefault();
                if (this.currentState === 'full') {
                    this.setState('expanded');
                } else {
                    this.setState('full');
                }
            });
        }
    }
    handleBreakpointChange() {
        if (this.isMobile) {
            // Transitioning to mobile - use collapsed state
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
            this.saveState();
        } else {
            // Transitioning to desktop - restore saved state
            this.restoreState();
        }
    }
    toggle() {
        if (this.isMobile) {
            this.toggleMobileMenu();
        } else {
            this.cycleState();
        }
    }
    cycleState() {
        const states = ['expanded', 'icon', 'collapsed'];
        const currentIndex = states.indexOf(this.currentState);
        const nextIndex = (currentIndex + 1) % states.length;
        this.currentState = states[nextIndex];
        this.saveState();
        this.updateLayout();
    }
    setState(state) {
        if (['full', 'expanded', 'icon', 'collapsed'].includes(state)) {
            this.currentState = state;
            this.saveState();
            this.updateLayout();
        }
    }
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        this.saveState();
        this.updateLayout();
    }
    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.saveState();
        this.updateLayout();
    }
    updateLayout() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const playerBar = document.querySelector('.player-bar');
        if (!sidebar || !mainContent) return;
        // Remove all state classes
        sidebar.classList.remove('full', 'expanded', 'icon', 'collapsed', 'mobile-open');
        mainContent.classList.remove('sidebar-full', 'sidebar-expanded', 'sidebar-icon', 'sidebar-collapsed');
        if (playerBar) {
            playerBar.classList.remove('sidebar-full', 'sidebar-expanded', 'sidebar-icon', 'sidebar-collapsed');
        }
        if (this.isMobile) {
            // Mobile layout
            sidebarToggle.style.display = 'none';
            mobileMenuToggle.style.display = 'flex';
            if (hamburgerMenu) hamburgerMenu.style.display = 'none';
            if (this.isMobileMenuOpen) {
                sidebar.classList.add('mobile-open');
                mobileMenuToggle.textContent = '✕';
                this.addMobileBackdrop();
            } else {
                sidebar.classList.add('collapsed');
                mobileMenuToggle.textContent = '☰';
                this.removeMobileBackdrop();
            }
            // Mobile sidebar should not affect main content layout
            mainContent.classList.remove('sidebar-collapsed');
            if (playerBar) {
                playerBar.classList.remove('sidebar-collapsed');
            }
        } else {
            // Desktop layout
            sidebarToggle.style.display = 'flex';
            mobileMenuToggle.style.display = 'none';
            this.removeMobileBackdrop();
            // Apply current state
            sidebar.classList.add(this.currentState);
            mainContent.classList.add(`sidebar-${this.currentState}`);
            if (playerBar) {
                playerBar.classList.add(`sidebar-${this.currentState}`);
            }
            // Update hamburger menu visibility
            if (hamburgerMenu) {
                hamburgerMenu.style.display = this.currentState === 'collapsed' ? 'block' : 'none';
            }
            // Update toggle button
            this.updateToggleButton();
        }
    }
    updateToggleButton() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (!sidebarToggle) return;
        const buttonConfig = {
            full: { text: '✕', title: 'Exit full screen', left: '20px' },
            expanded: { text: '◀', title: 'Collapse to icons', left: '260px' },
            icon: { text: '◀', title: 'Collapse sidebar', left: '80px' },
            collapsed: { text: '▶', title: 'Expand sidebar', left: '20px' }
        };
        const config = buttonConfig[this.currentState];
        if (config) {
            sidebarToggle.textContent = config.text;
            sidebarToggle.title = config.title;
            sidebarToggle.style.left = config.left;
        }
    }
    addMobileBackdrop() {
        if (!document.getElementById('mobileMenuBackdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'mobileMenuBackdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 199;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(backdrop);
            // Animate backdrop in
            setTimeout(() => {
                backdrop.style.opacity = '1';
            }, 10);
            // Close menu when backdrop is clicked
            backdrop.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
    }
    removeMobileBackdrop() {
        const backdrop = document.getElementById('mobileMenuBackdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
    }
    saveState() {
        if (!this.isMobile) {
            localStorage.setItem('sidebarState', JSON.stringify({
                state: this.currentState
            }));
        } else {
            // Save mobile state
            localStorage.setItem('sidebarState', JSON.stringify({
                state: this.currentState,
                isMobileMenuOpen: this.isMobileMenuOpen
            }));
        }
    }
    restoreState() {
        try {
            const savedState = localStorage.getItem('sidebarState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.currentState = state.state || 'expanded';
                this.isMobileMenuOpen = state.isMobileMenuOpen || false;
            } else {
                // Default states
                this.currentState = 'expanded';
                this.isMobileMenuOpen = false;
            }
        } catch (error) {
            console.error('Error restoring sidebar state:', error);
            this.currentState = 'expanded';
            this.isMobileMenuOpen = false;
        }
        // Override for mobile if transitioning to mobile
        if (this.isMobile) {
            this.currentState = 'collapsed';
            // Keep the mobile menu state from saved data
        }
    }
}
// Initialize sidebar manager
const sidebarManager = new SidebarManager();
window.sidebarManager = sidebarManager;
// Global toggle function for onclick handlers
function toggleSidebar() {
    sidebarManager.toggle();
}
// Add functions to directly set sidebar states
function setSidebarFull() {
    sidebarManager.setState('full');
}
function setSidebarExpanded() {
    sidebarManager.setState('expanded');
}
function setSidebarIcon() {
    sidebarManager.setState('icon');
}
function setSidebarCollapsed() {
    sidebarManager.setState('collapsed');
}
function shouldCollapseSidebar() {
    return window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
}
// Update CSS variables to match JavaScript constants
function updateCSSBreakpoints() {
    document.documentElement.style.setProperty('--sidebar-collapse-breakpoint', `${SIDEBAR_COLLAPSE_BREAKPOINT}px`);
}
// Mobile-specific touch handling
function addMobileTouchHandlers() {
    // Add touch feedback for control buttons
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach(button => {
        button.addEventListener('touchstart', function (e) {
            this.style.transform = 'scale(0.95)';
            this.style.backgroundColor = '#404040';
        });
        button.addEventListener('touchend', function (e) {
            this.style.transform = 'scale(1)';
            this.style.backgroundColor = '';
        });
        button.addEventListener('touchcancel', function (e) {
            this.style.transform = 'scale(1)';
            this.style.backgroundColor = '';
        });
    });
    // Improve progress bar touch handling
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('touchstart', function (e) {
            e.preventDefault();
            const rect = this.getBoundingClientRect();
            const touch = e.touches[0];
            const clickX = touch.clientX - rect.left;
            const percentage = (clickX / rect.width) * 100;
            if (currentAudio) {
                const newTime = (percentage / 100) * currentAudio.duration;
                currentAudio.currentTime = newTime;
                updateProgressBar();
            }
        });
    }
    // Improve volume slider touch handling
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('touchstart', function (e) {
            e.preventDefault();
            const rect = this.getBoundingClientRect();
            const touch = e.touches[0];
            const clickX = touch.clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            if (currentAudio) {
                currentAudio.volume = percentage / 100;
                currentVolume = percentage / 100;
                updateVolumeDisplay();
                saveVolume(); // Save volume on touch
            }
        });
    }
}
// Enhanced player controls for mobile
function enhancePlayerControls() {
    // Add swipe gestures for next/previous on mobile
    if (shouldCollapseSidebar()) {
        let startX = 0;
        let startY = 0;
        let isSwiping = false;
        const playerBar = document.querySelector('.player-bar');
        if (playerBar) {
            playerBar.addEventListener('touchstart', function (e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwiping = false;
            });
            playerBar.addEventListener('touchmove', function (e) {
                if (!isSwiping) {
                    const deltaX = Math.abs(e.touches[0].clientX - startX);
                    const deltaY = Math.abs(e.touches[0].clientY - startY);
                    if (deltaX > deltaY && deltaX > 50) {
                        isSwiping = true;
                    }
                }
            });
            playerBar.addEventListener('touchend', function (e) {
                if (isSwiping) {
                    const deltaX = e.changedTouches[0].clientX - startX;
                    const minSwipeDistance = 100;
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0) {
                            // Swipe right - previous song
                            playPreviousSong();
                        } else {
                            // Swipe left - next song
                            playNextSong();
                        }
                    }
                }
            });
        }
    }
}
// Notification System
let notificationCounter = 0;
function showNotification(type, title, message, duration = 5000) {
    const container = document.getElementById('notificationContainer');
    const notificationId = `notification-${++notificationCounter}`;
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.id = notificationId;
    const icons = {
        error: '❌',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️'
    };
    // Create notification icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'notification-icon';
    iconDiv.textContent = icons[type] || icons.info;
    // Create notification content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'notification-content';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'notification-title';
    titleDiv.textContent = title;
    const messageDiv = document.createElement('div');
    messageDiv.className = 'notification-message';
    messageDiv.textContent = message;
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(messageDiv);
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => removeNotification(notificationId);
    // Append all elements to notification
    notification.appendChild(iconDiv);
    notification.appendChild(contentDiv);
    notification.appendChild(closeButton);
    container.appendChild(notification);
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notificationId);
        }, duration);
    }
    return notificationId;
}
function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}
function showErrorNotification(message) {
    return showNotification('error', 'Error', message, 8000);
}
function showSuccessNotification(message) {
    return showNotification('success', 'Success', message, 4000);
}
function showWarningNotification(message) {
    return showNotification('warning', 'Warning', message, 6000);
}
function showInfoNotification(message) {
    return showNotification('info', 'Info', message, 5000);
}
// Get all query parameters from the current URL
function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}
// Convert query parameters to URL string
function buildQueryString(params) {
    return Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}
// Update URL with new parameters
function updateURL(params) {
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
// Load content from settings on page load
async function loadFromURL() {
    const settings = loadAllSettings();
    if (settings.playlist) {
        // Load playlist from settings
        try {
            const queryParams = getQueryParams();
            const response = await fetch(`/api/playlist/${settings.playlist}?${buildQueryString(queryParams)}`);
            if (response.ok) {
                const data = await response.json();
                const playlistTitle = data.name || data.title || 'Playlist';
                displayPlaylistContent(data, playlistTitle);
                // Set current playlist
                window.settings.playlist = settings.playlist;
                highlightCurrentPlaylist();
                // If song setting is also present, load that specific song
                if (settings.song) {
                    const songIndex = currentPlaylistSongs.findIndex(song => song.id === settings.song);
                    if (songIndex !== -1) {
                        const song = currentPlaylistSongs[songIndex];
                        const title = song.name || song.title || 'Unknown Title';
                        const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                        const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
                        // If autoplay is enabled, auto-play the song
                        if (settings.autoplay) {
                            playSong(song.id || '', title, artist, thumbnail, window.settings.playlist, songIndex);
                        } else {
                            loadSong(song.id || '', title, artist, thumbnail, window.settings.playlist, songIndex);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading playlist from settings:', error);
        }
    } else if (settings.song) {
        // Load specific song from settings
        try {
            const queryParams = getQueryParams();
            const response = await fetch(`/api/song/${settings.song}?${buildQueryString(queryParams)}`);
            if (response.ok) {
                const data = await response.json();
                const title = data.name || data.title || 'Unknown Title';
                const artist = data.artists && data.artists.length > 0 ? data.artists[0].name : '';
                const thumbnail = data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[0].url : '';
                // If autoplay is enabled, auto-play the song
                if (settings.autoplay) {
                    playSong(settings.song, title, artist, thumbnail, null, -1);
                } else {
                    loadSong(settings.song, title, artist, thumbnail, null, -1);
                }
            }
        } catch (error) {
            console.error('Error loading song from settings:', error);
        }
    }
}
function handleSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query) {
            performSearch(query);
        }
    }
}
async function performSearch(query) {
    showLoading();
    try {
        const queryParams = getQueryParams();
        queryParams.query = query;
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/search?${queryString}`);
        const data = await response.json();
        if (response.ok) {
            console.log('Search results:', data.results); // Debug log
            displaySearchResults(data.results || []);
        } else {
            showError(data.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error); // Debug log
        showError('Network error');
    }
}
function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';
    // Clear container
    container.innerHTML = '';
    // Create result cards
    results.forEach(result => {
        // Get the correct ID based on result type
        let songId = result.id || result.browseId || '';
        let title = result.title || result.name || 'Unknown Title';
        let artist = result.artist || result.author || '';
        // Only show playable items (songs and videos)
        const isPlayable = result.type === 'SongSearchResult' || result.type === 'VideoSearchResult';
        const thumbnail = result.thumbnails && result.thumbnails.length > 0 ? result.thumbnails[0].url : (result.thumbnail || '');
        // Create result card container
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        if (isPlayable) {
            resultCard.setAttribute('data-song-id', songId);
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
        }
        // Create thumbnail container
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'result-thumbnail';
        if (thumbnail) {
            const img = document.createElement('img');
            img.src = thumbnail;
            img.alt = title;
            img.className = 'thumbnail-image';
            thumbnailDiv.appendChild(img);
        } else {
            thumbnailDiv.textContent = '🎵';
        }
        // Create title element
        const titleDiv = document.createElement('div');
        titleDiv.className = 'result-title';
        titleDiv.textContent = title;
        // Create artist element
        const artistDiv = document.createElement('div');
        artistDiv.className = 'result-artist';
        artistDiv.textContent = artist;
        // Append elements to result card
        resultCard.appendChild(thumbnailDiv);
        resultCard.appendChild(titleDiv);
        resultCard.appendChild(artistDiv);
        // Add not playable indicator if needed
        if (!isPlayable) {
            const notPlayableDiv = document.createElement('div');
            notPlayableDiv.className = 'not-playable-indicator';
            notPlayableDiv.textContent = 'Not playable';
            resultCard.appendChild(notPlayableDiv);
        }
        // Append result card to container
        container.appendChild(resultCard);
    });
}
function highlightCurrentSong() {
    // Remove playing class from all playlist items
    document.querySelectorAll('.playlist-song-item').forEach(item => {
        item.classList.remove('playing');
    });
    // Add playing class to current song
    if (currentSongIndex >= 0 && currentPlaylistSongs.length > 0) {
        const currentSongElement = document.querySelector(`.playlist-song-item:nth-child(${currentSongIndex + 1})`);
        if (currentSongElement) {
            currentSongElement.classList.add('playing');
        }
    }
}
function highlightCurrentPlaylist() {
    // Remove active class from all playlist items in sidebar
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('active');
        // Reset text color for song count
        const songCountElement = item.querySelector('div > div:last-child');
        if (songCountElement) {
            songCountElement.style.color = '#666';
            songCountElement.style.opacity = '1';
        }
    });
    // Add active class to current playlist
    if (window.settings.playlist) {
        const currentPlaylistElement = document.querySelector(`.playlist-item[onclick*="${window.settings.playlist}"]`);
        if (currentPlaylistElement) {
            currentPlaylistElement.classList.add('active');
            // Update text color for song count
            const songCountElement = currentPlaylistElement.querySelector('div > div:last-child');
            if (songCountElement) {
                songCountElement.style.color = '#000000';
                songCountElement.style.opacity = '0.7';
            }
        }
    }
}
async function loadSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
    // Clear any existing error recovery timeout
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }
    // Stop all audio playback before loading new song
    stopAllAudio();
    // Save settings for song and playlist
    saveSetting(SETTINGS_KEYS.SONG, songId);
    saveSetting(SETTINGS_KEYS.PLAYLIST, playlistId);
    window.settings.song = songId;
    currentSongIndex = songIndex;
    document.getElementById('nowPlayingTitle').textContent = title;
    document.getElementById('nowPlayingArtist').textContent = artist;
    document.getElementById('playButton').textContent = '▶';
    isPlaying = false;
    // Reset repeat and shuffle if loading from search results (no playlist)
    if (!playlistId) {
        window.settings.repeat = 'none';
        window.settings.shuffle = false;
        updateRepeatShuffleDisplay();
    }
    // Update document title with current song
    document.title = `${title} by ${artist}`;
    // Highlight current song in playlist
    if (playlistId && songIndex >= 0) {
        highlightCurrentSong();
    }
    // Update current playlist and highlight it in sidebar if loading from a playlist
    if (playlistId) {
        window.settings.playlist = playlistId;
        highlightCurrentPlaylist();
    } else {
        // Clear playlist highlighting if loading from search results
        window.settings.playlist = null;
        highlightCurrentPlaylist();
    }
    // Set thumbnail if provided
    const thumbnailElement = document.getElementById('nowPlayingThumbnail');
    // Clear existing content
    thumbnailElement.innerHTML = '';
    if (thumbnail && thumbnail.trim() !== '') {
        const img = document.createElement('img');
        img.src = thumbnail;
        img.alt = title;
        img.className = 'thumbnail-image';
        thumbnailElement.appendChild(img);
    } else {
        thumbnailElement.textContent = '🎵';
    }
    // Fetch detailed song information for the Info tab
    fetchSongInfo(songId);
    // Preload audio without playing
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const audioUrl = `/api/stream/${songId}?${queryString}`;
        const audio = new Audio(audioUrl);
        audio.volume = currentVolume; // Set initial volume
        // Add error handling for audio loading
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title on error
            document.title = DEFAULT_TITLE;
            showErrorNotification(`Failed to load "${title}" by ${artist}. The song may be unavailable or restricted.`);
            handlePlaybackError(title, artist);
        });
        audio.addEventListener('abort', () => {
            console.log('Audio loading aborted');
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title on abort
            document.title = DEFAULT_TITLE;
            showWarningNotification(`Loading of "${title}" was interrupted.`);
        });
        audio.addEventListener('loadeddata', () => {
            // Update media session metadata for system media controls
            if (navigator.mediaSession) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: title,
                    artist: artist,
                    album: 'YouTube Music',
                    artwork: thumbnail ? [{ src: thumbnail, sizes: '300x300', type: 'image/jpeg' }] : []
                });
            }
            // Apply pending song position if available
            if (window.pendingSongPosition && window.pendingSongPosition > 0) {
                audio.currentTime = window.pendingSongPosition;
                window.pendingSongPosition = null;
            }
            // Reset the next song trigger flag for this new song
            audio.nextSongTriggered = false;
            showInfoNotification(`Loaded: "${title}" by ${artist}`);
        });
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            // Update media session position state
            if (navigator.mediaSession && audio.duration) {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    position: audio.currentTime,
                    playbackRate: audio.playbackRate
                });
            }
            // Save song position every 5 seconds (prevent multiple saves)
            const currentSecond = Math.floor(audio.currentTime);
            const lastSavedSecond = Math.floor(audio.lastSavedPosition || 0);
            if (currentSecond % 5 === 0 && currentSecond !== lastSavedSecond) {
                audio.lastSavedPosition = audio.currentTime;
                saveSetting(SETTINGS_KEYS.POS, audio.currentTime);
            }
            // Auto-load next song 3 seconds before current song ends
            if (window.settings.autoplay && audio.duration && window.settings.playlist && currentPlaylistSongs.length > 0) {
                const timeRemaining = audio.duration - audio.currentTime;
                const threeSeconds = 3;
                // Reset trigger flag if user seeks back to more than 3 seconds from end
                if (timeRemaining > threeSeconds && audio.nextSongTriggered) {
                    audio.nextSongTriggered = false;
                }
                // Check if we're within 3 seconds of the end and haven't already triggered next song
                if (timeRemaining <= threeSeconds && !audio.nextSongTriggered) {
                    audio.nextSongTriggered = true;
                    console.log(`🎵 Auto-loading next song (${timeRemaining.toFixed(1)}s remaining)`);
                    // Get next song info
                    const nextIndex = getNextSongIndex();
                    if (nextIndex !== -1) {
                        const nextSong = currentPlaylistSongs[nextIndex];
                        const nextTitle = nextSong.name || nextSong.title || 'Unknown Title';
                        const nextArtist = nextSong.artists && nextSong.artists.length > 0 ? nextSong.artists[0].name : '';
                        const nextThumbnail = nextSong.thumbnails && nextSong.thumbnails.length > 0 ? nextSong.thumbnails[0].url : '';
                        // Pre-load the next song (this will prepare it but not start playing)
                        loadSong(nextSong.id || '', nextTitle, nextArtist, nextThumbnail, window.settings.playlist, nextIndex);
                    }
                }
            }
        });
        audio.addEventListener('ended', () => {
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title when song ends
            document.title = DEFAULT_TITLE;
            // Update media session state
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'none';
            }
            // Handle repeat one mode
            if (window.settings.repeat === 'one') {
                // Replay the same song
                const currentSong = currentPlaylistSongs[currentSongIndex];
                const title = currentSong.name || currentSong.title || 'Unknown Title';
                const artist = currentSong.artists && currentSong.artists.length > 0 ? currentSong.artists[0].name : '';
                const thumbnail = currentSong.thumbnails && currentSong.thumbnails.length > 0 ? currentSong.thumbnails[0].url : '';
                playSong(currentSong.id || '', title, artist, thumbnail, window.settings.playlist, currentSongIndex);
                return;
            }
            // Auto-play next song if enabled and we're in a playlist
            if (window.settings.autoplay && window.settings.playlist && currentPlaylistSongs.length > 0) {
                playNextSong();
            } else {
                // Clear song info when no more songs to play
                currentSongInfo = null;
                clearInfoPanel();
                showInfoNotification('Song finished playing');
            }
        });
        currentAudio = audio;
    } catch (error) {
        console.error('LoadSong error:', error);
        isPlaying = false;
        document.getElementById('playButton').textContent = '▶';
        // Reset document title on error
        document.title = DEFAULT_TITLE;
        showErrorNotification(`Failed to load "${title}" by ${artist}. Please check your connection and try again.`);
    }
}
async function playSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
    // If no song is currently loaded or different song, load it first
    if (!window.settings.song || window.settings.song !== songId) {
        await loadSong(songId, title, artist, thumbnail, playlistId, songIndex);
    }
    // Start playback
    if (currentAudio && !isPlaying) {
        try {
            document.getElementById('playButton').textContent = '⏸';
            isPlaying = true;
            // Update media session state
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'playing';
            }
            await currentAudio.play();
            showSuccessNotification(`Now playing: "${title}" by ${artist}`);
        } catch (error) {
            console.error('Play error:', error);
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            showErrorNotification(`Failed to start playback of "${title}". Please try again.`);
            handlePlaybackError(title, artist);
        }
    }
}
// Function to fetch detailed song information
async function fetchSongInfo(songId) {
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/song/${songId}?${queryString}`);
        if (response.ok) {
            const songInfo = await response.json();
            currentSongInfo = songInfo;
            updateInfoPanel(songInfo);
            updateLyricsPanel(songInfo);
        } else {
            console.warn('Failed to fetch song info:', response.status);
            // Show basic info if detailed fetch fails
            updateInfoPanelWithBasicInfo();
        }
    } catch (error) {
        console.error('Error fetching song info:', error);
        // Show basic info if fetch fails
        updateInfoPanelWithBasicInfo();
    }
}
// Function to update the Info panel with detailed song information
function updateInfoPanel(songInfo) {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    const panelContent = infoPanel.querySelector('.panel-content');
    if (!panelContent) return;
    // Format duration
    const duration = songInfo.duration || '';
    const formattedDuration = duration ? formatDuration(duration) : 'Unknown';
    // Format view count
    const viewsCount = songInfo.viewsCount || 0;
    const formattedViews = viewsCount > 0 ? formatNumber(viewsCount) : 'Unknown';
    // Format publish date
    const publishedAt = songInfo.publishedAt || '';
    const formattedDate = publishedAt ? formatDate(publishedAt) : 'Unknown';
    // Get artist names
    const artists = songInfo.artists || [];
    const artistNames = artists.length > 0 ? artists.map(artist => artist.name || artist).join(', ') : 'Unknown Artist';
    // Get album name
    const album = songInfo.album || songInfo.albumName || 'Unknown Album';
    const albumName = typeof album === 'object' ? album.name : album;
    // Get description (truncate if too long)
    const description = songInfo.description || '';
    const truncatedDescription = description.length > 300 ? description.substring(0, 300) + '...' : description;
    // Get thumbnail - try to get the highest quality thumbnail
    const thumbnails = songInfo.thumbnails || [];
    let thumbnail = '';
    if (thumbnails.length > 0) {
        // Sort by width to get the highest quality thumbnail
        const sortedThumbnails = thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));
        thumbnail = sortedThumbnails[0].url;
    }
    // Check if lyrics are available
    const hasLyrics = songInfo.lyrics && songInfo.lyrics.data && songInfo.lyrics.data.length > 0;
    // Clear existing content
    panelContent.innerHTML = '';
    // Create main container
    const container = document.createElement('div');
    container.className = 'song-info-container';
    // Create thumbnail if available
    if (thumbnail) {
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'song-info-thumbnail';
        const img = document.createElement('img');
        img.src = thumbnail;
        img.alt = songInfo.name || songInfo.title || 'Song';
        img.className = 'thumbnail-image-large';
        thumbnailDiv.appendChild(img);
        container.appendChild(thumbnailDiv);
    }
    // Create details container
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'song-info-details';
    // Create title
    const titleH3 = document.createElement('h3');
    titleH3.className = 'song-info-title';
    titleH3.textContent = songInfo.name || songInfo.title || 'Unknown Title';
    detailsDiv.appendChild(titleH3);
    // Create artist
    const artistP = document.createElement('p');
    artistP.className = 'song-info-artist';
    artistP.textContent = artistNames;
    detailsDiv.appendChild(artistP);
    // Create album section if available
    if (albumName && albumName !== 'Unknown Album') {
        const albumSection = document.createElement('div');
        albumSection.className = 'song-info-section';
        const albumH4 = document.createElement('h4');
        albumH4.textContent = 'Album';
        albumSection.appendChild(albumH4);
        const albumP = document.createElement('p');
        albumP.textContent = albumName;
        albumSection.appendChild(albumP);
        detailsDiv.appendChild(albumSection);
    }
    // Create duration section
    const durationSection = document.createElement('div');
    durationSection.className = 'song-info-section';
    const durationH4 = document.createElement('h4');
    durationH4.textContent = 'Duration';
    durationSection.appendChild(durationH4);
    const durationP = document.createElement('p');
    durationP.textContent = formattedDuration;
    durationSection.appendChild(durationP);
    detailsDiv.appendChild(durationSection);
    // Create views section if available
    if (viewsCount > 0) {
        const viewsSection = document.createElement('div');
        viewsSection.className = 'song-info-section';
        const viewsH4 = document.createElement('h4');
        viewsH4.textContent = 'Views';
        viewsSection.appendChild(viewsH4);
        const viewsP = document.createElement('p');
        viewsP.textContent = formattedViews;
        viewsSection.appendChild(viewsP);
        detailsDiv.appendChild(viewsSection);
    }
    // Create published section if available
    if (publishedAt) {
        const publishedSection = document.createElement('div');
        publishedSection.className = 'song-info-section';
        const publishedH4 = document.createElement('h4');
        publishedH4.textContent = 'Published';
        publishedSection.appendChild(publishedH4);
        const publishedP = document.createElement('p');
        publishedP.textContent = formattedDate;
        publishedSection.appendChild(publishedP);
        detailsDiv.appendChild(publishedSection);
    }
    // Create description section if available
    if (truncatedDescription) {
        const descSection = document.createElement('div');
        descSection.className = 'song-info-section';
        const descH4 = document.createElement('h4');
        descH4.textContent = 'Description';
        descSection.appendChild(descH4);
        const descP = document.createElement('p');
        descP.className = 'song-info-description';
        descP.textContent = truncatedDescription;
        descSection.appendChild(descP);
        detailsDiv.appendChild(descSection);
    }
    // Create tags section if available
    if (songInfo.tags && songInfo.tags.length > 0) {
        const tagsSection = document.createElement('div');
        tagsSection.className = 'song-info-section';
        const tagsH4 = document.createElement('h4');
        tagsH4.textContent = 'Tags';
        tagsSection.appendChild(tagsH4);
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'song-info-tags';
        // Create tag spans
        songInfo.tags.slice(0, 10).forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
        });
        tagsSection.appendChild(tagsDiv);
        detailsDiv.appendChild(tagsSection);
    }
    // Append details to container
    container.appendChild(detailsDiv);
    // Append container to panel content
    panelContent.appendChild(container);
}
// Function to update the Lyrics panel with song lyrics
function updateLyricsPanel(songInfo) {
    const lyricsPanel = document.getElementById('lyricsPanel');
    if (!lyricsPanel) return;
    const panelContent = lyricsPanel.querySelector('.panel-content');
    if (!panelContent) return;
    // Check if lyrics are available
    const hasLyrics = songInfo.lyrics && songInfo.lyrics.data && songInfo.lyrics.data.length > 0;
    if (hasLyrics) {
        // Get lyrics text from the first lyric entry
        const firstLyric = songInfo.lyrics.data[0];
        const lyricsText = firstLyric.plainLyric || '';
        // Get song title and artist for header
        const title = songInfo.name || songInfo.title || 'Unknown Title';
        const artists = songInfo.artists || [];
        const artistNames = artists.length > 0 ? artists.map(artist => artist.name || artist).join(', ') : 'Unknown Artist';
        // Clear existing content
        panelContent.innerHTML = '';
        // Create lyrics container
        const lyricsContainer = document.createElement('div');
        lyricsContainer.className = 'lyrics-container';
        // Create lyrics content
        const lyricsContent = document.createElement('div');
        lyricsContent.className = 'lyrics-content';
        // Create lyrics text
        const lyricsPre = document.createElement('pre');
        lyricsPre.className = 'lyrics-text';
        lyricsPre.textContent = lyricsText;
        lyricsContent.appendChild(lyricsPre);
        lyricsContainer.appendChild(lyricsContent);
        panelContent.appendChild(lyricsContainer);
    } else {
        // Show placeholder when no lyrics available
        // Clear existing content
        panelContent.innerHTML = '';
        // Create placeholder container
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'lyrics-placeholder';
        // Create placeholder icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'placeholder-icon';
        iconDiv.textContent = '🎵';
        // Create placeholder text
        const textDiv = document.createElement('div');
        textDiv.className = 'placeholder-text';
        textDiv.textContent = 'No lyrics available for this song';
        placeholderDiv.appendChild(iconDiv);
        placeholderDiv.appendChild(textDiv);
        panelContent.appendChild(placeholderDiv);
    }
}
// Function to update Info panel with basic information when detailed fetch fails
function updateInfoPanelWithBasicInfo() {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    const panelContent = infoPanel.querySelector('.panel-content');
    if (!panelContent) return;
    const title = document.getElementById('nowPlayingTitle').textContent;
    const artist = document.getElementById('nowPlayingArtist').textContent;
    // Clear existing content
    panelContent.innerHTML = '';
    // Create main container
    const container = document.createElement('div');
    container.className = 'song-info-container';
    // Create details container
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'song-info-details';
    // Create title
    const titleH3 = document.createElement('h3');
    titleH3.className = 'song-info-title';
    titleH3.textContent = title;
    detailsDiv.appendChild(titleH3);
    // Create artist
    const artistP = document.createElement('p');
    artistP.className = 'song-info-artist';
    artistP.textContent = artist;
    detailsDiv.appendChild(artistP);
    // Create info section
    const infoSection = document.createElement('div');
    infoSection.className = 'song-info-section';
    const infoP = document.createElement('p');
    infoP.className = 'info-placeholder-text';
    infoP.textContent = 'Detailed information unavailable';
    infoSection.appendChild(infoP);
    detailsDiv.appendChild(infoSection);
    container.appendChild(detailsDiv);
    panelContent.appendChild(container);
}
// Function to clear the Info panel and show placeholder
function clearInfoPanel() {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    const panelContent = infoPanel.querySelector('.panel-content');
    if (!panelContent) return;
    // Clear existing content
    panelContent.innerHTML = '';
    // Create placeholder container
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'info-placeholder';
    // Create placeholder icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'placeholder-icon';
    iconDiv.textContent = 'ℹ️';
    // Create placeholder text
    const textDiv = document.createElement('div');
    textDiv.className = 'placeholder-text';
    textDiv.textContent = 'Song information will appear here';
    placeholderDiv.appendChild(iconDiv);
    placeholderDiv.appendChild(textDiv);
    panelContent.appendChild(placeholderDiv);
}
// Helper function to format duration
function formatDuration(duration) {
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
function formatNumber(num) {
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
function formatDate(dateString) {
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
function playNextSong() {
    const nextIndex = getNextSongIndex();
    if (nextIndex === -1) {
        showInfoNotification('No more songs in playlist');
        return;
    }
    const nextSong = currentPlaylistSongs[nextIndex];
    const title = nextSong.name || nextSong.title || 'Unknown Title';
    const artist = nextSong.artists && nextSong.artists.length > 0 ? nextSong.artists[0].name : '';
    const thumbnail = nextSong.thumbnails && nextSong.thumbnails.length > 0 ? nextSong.thumbnails[0].url : '';
    playSong(nextSong.id || '', title, artist, thumbnail, window.settings.playlist, nextIndex);
}
function playPreviousSong() {
    const prevIndex = getPreviousSongIndex();
    if (prevIndex === -1) {
        showInfoNotification('No previous song in playlist');
        return;
    }
    const prevSong = currentPlaylistSongs[prevIndex];
    const title = prevSong.name || prevSong.title || 'Unknown Title';
    const artist = prevSong.artists && prevSong.artists.length > 0 ? prevSong.artists[0].name : '';
    const thumbnail = prevSong.thumbnails && prevSong.thumbnails.length > 0 ? prevSong.thumbnails[0].url : '';
    playSong(prevSong.id || '', title, artist, thumbnail, window.settings.playlist, prevIndex);
}
function togglePlay() {
    if (currentAudio) {
        if (isPlaying) {
            currentAudio.pause();
            document.getElementById('playButton').textContent = '▶';
            isPlaying = false;
            // Reset document title when paused
            document.title = DEFAULT_TITLE;
            // Update media session state
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'paused';
            }
            // Save position when paused
            saveSetting(SETTINGS_KEYS.POS, currentAudio.currentTime);
            currentAudio.lastSavedPosition = currentAudio.currentTime;
        } else {
            currentAudio.play();
            document.getElementById('playButton').textContent = '⏸';
            isPlaying = true;
            // Update document title when resumed
            const title = document.getElementById('nowPlayingTitle').textContent;
            const artist = document.getElementById('nowPlayingArtist').textContent;
            document.title = `${title} by ${artist}`;
            // Update media session state
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }
    }
}
function seek(event) {
    if (currentAudio) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        currentAudio.currentTime = percentage * currentAudio.duration;
        // Save position immediately when user seeks
        saveSetting(SETTINGS_KEYS.POS, currentAudio.currentTime);
        currentAudio.lastSavedPosition = currentAudio.currentTime;
    }
}
let isDraggingVolume = false;
let currentVolume = 0.5;
// Volume persistence functions
function saveVolume() {
    localStorage.setItem('playerVolume', currentVolume.toString());
}
function restoreVolume() {
    try {
        const savedVolume = localStorage.getItem('playerVolume');
        if (savedVolume !== null) {
            currentVolume = parseFloat(savedVolume);
            // Ensure volume is within valid range
            currentVolume = Math.max(0, Math.min(1, currentVolume));
        } else {
            currentVolume = 0.5; // Default volume
        }
    } catch (error) {
        console.error('Error restoring volume:', error);
        currentVolume = 0.5; // Default volume on error
    }
}
function setVolume(event) {
    if (currentAudio) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const volume = Math.max(0, Math.min(1, clickX / rect.width));
        currentAudio.volume = volume;
        currentVolume = volume;
        updateVolumeDisplay();
        saveVolume(); // Save volume when changed
        // Show volume notification for significant changes
        if (volume === 0) {
            showInfoNotification('Volume muted');
        }
    }
}
function updateVolumeDisplay() {
    const volumeFill = document.getElementById('volumeFill');
    const volumeThumb = document.getElementById('volumeThumb');
    const percentage = currentVolume * 100;
    if (volumeFill) volumeFill.style.width = percentage + '%';
    if (volumeThumb) volumeThumb.style.left = percentage + '%';
}
function updateProgressBar() {
    if (currentAudio) {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
    }
}
function initVolumeSlider() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeThumb = document.getElementById('volumeThumb');
    if (!volumeSlider || !volumeThumb) return;
    // Restore saved volume
    restoreVolume();
    // Set initial volume
    updateVolumeDisplay();
    // Mouse events for dragging
    volumeThumb.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        e.preventDefault();
    });
    volumeSlider.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        setVolume(e);
    });
    // Add click handler for volume slider
    volumeSlider.addEventListener('click', (e) => {
        setVolume(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, clickX / rect.width));
            if (currentAudio) {
                currentAudio.volume = volume;
            }
            currentVolume = volume;
            updateVolumeDisplay();
        }
    });
    document.addEventListener('mouseup', () => {
        if (isDraggingVolume) {
            saveVolume(); // Save volume when dragging ends
        }
        isDraggingVolume = false;
    });
}
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.querySelector('.welcome-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
}
function showError(message) {
    document.getElementById('error').textContent = message;
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.querySelector('.welcome-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
}
function updateActiveNavItem(clickedItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    // Add active class to clicked item
    clickedItem.classList.add('active');
    // Close mobile menu after navigation
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }
}
function loadLibrary(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear playlist and song settings when going to library
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadLibraryData();
}
function loadSongs(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear playlist and song settings when going to songs
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadSongsData();
}
function loadArtists(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear playlist and song settings when going to artists
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadArtistsData();
}
function loadAlbums(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear playlist and song settings when going to albums
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadAlbumsData();
}
function loadHome(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
        // Only clear playlist and song settings when explicitly navigating to home
        saveSetting(SETTINGS_KEYS.PLAYLIST, null);
        saveSetting(SETTINGS_KEYS.SONG, null);
    }
    document.querySelector('.welcome-section').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}
function loadExplore(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear playlist and song settings when going to explore
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    // TODO: Implement explore loading
    document.querySelector('.welcome-section').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}
async function loadLibraryData() {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/library?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayLibraryContent(data);
        } else {
            showError('Failed to load library. Please check your authentication.');
        }
    } catch (error) {
        console.error('Library error:', error);
        showError('Failed to load library');
    }
}
async function loadSongsData() {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/library/songs?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displaySongsContent(data);
        } else {
            showError('Failed to load songs. Please check your authentication.');
        }
    } catch (error) {
        console.error('Songs error:', error);
        showError('Failed to load songs');
    }
}
async function loadArtistsData() {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/library/artists?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayArtistsContent(data);
        } else {
            showError('Failed to load artists. Please check your authentication.');
        }
    } catch (error) {
        console.error('Artists error:', error);
        showError('Failed to load artists');
    }
}
async function loadAlbumsData() {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/library/albums?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayAlbumsContent(data);
        } else {
            showError('Failed to load albums. Please check your authentication.');
        }
    } catch (error) {
        console.error('Albums error:', error);
        showError('Failed to load albums');
    }
}
async function loadPlaylists() {
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/library/playlists?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            playlists = data.playlists || [];
            displayPlaylistsInSidebar();
            if (playlists.length > 0) {
                // showSuccessNotification(`Loaded ${playlists.length} playlist${playlists.length > 1 ? 's' : ''}`);
            }
        }
    } catch (error) {
        console.error('Playlists error:', error);
        showErrorNotification('Failed to load playlists');
    }
}
function displayPlaylistsInSidebar() {
    const playlistsSection = document.getElementById('playlistsSection');
    const playlistsList = document.getElementById('playlistsList');
    if (playlists.length > 0) {
        playlistsSection.style.display = 'block';
        // Clear existing content
        playlistsList.innerHTML = '';
        // Create playlist items
        playlists.forEach(playlist => {
            const title = playlist.name || playlist.title || 'Unknown Playlist';
            // Get playlist thumbnail - try different possible properties
            const thumbnail = playlist.thumbnail ||
                (playlist.thumbnails && playlist.thumbnails.length > 0 ? playlist.thumbnails[0].url : null) ||
                (playlist.art && playlist.art.sources && playlist.art.sources.length > 0 ? playlist.art.sources[0].url : null);
            // Check if this playlist is currently active
            const isActive = window.settings.playlist === (playlist.id || '');
            const activeClass = isActive ? ' active' : '';
            // Create playlist item container
            const playlistItem = document.createElement('div');
            playlistItem.className = `playlist-item${activeClass}`;
            playlistItem.setAttribute('data-playlist-id', playlist.id || '');
            playlistItem.setAttribute('data-playlist-title', title);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'playlist-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '📋';
            }
            // Create info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-container';
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'playlist-name';
            titleDiv.textContent = title;
            // Create song count element
            const songCountDiv = document.createElement('div');
            songCountDiv.className = 'song-count';
            songCountDiv.style.cssText = `color: ${isActive ? '#000000' : '#666'}; opacity: ${isActive ? '0.7' : '1'};`;
            songCountDiv.textContent = `${playlist.songCount || 0} songs`;
            // Append elements
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(songCountDiv);
            playlistItem.appendChild(thumbnailDiv);
            playlistItem.appendChild(infoDiv);
            playlistsList.appendChild(playlistItem);
        });
    } else {
        playlistsSection.style.display = 'none';
    }
}
async function loadPlaylist(playlistId, playlistTitle) {
    // Close mobile menu after playlist selection
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }
    // Save playlist setting
    saveSetting(SETTINGS_KEYS.PLAYLIST, playlistId);
    saveSetting(SETTINGS_KEYS.SONG, null);
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/playlist/${playlistId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayPlaylistContent(data, playlistTitle);
            // Update current playlist and highlight it in sidebar
            window.settings.playlist = playlistId;
            highlightCurrentPlaylist();
        } else {
            showError('Failed to load playlist');
        }
    } catch (error) {
        console.error('Playlist error:', error);
        showError('Failed to load playlist');
    }
}
function displayPlaylistContent(playlistData, playlistTitle) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'block'; // Changed from 'grid' to 'block' for list layout
    // Store playlist information for queue management
    window.settings.playlist = playlistData.id || playlistData.browseId || '';
    currentPlaylistSongs = playlistData.songs || [];
    // Initialize shuffle order if shuffle is enabled
    if (window.settings.shuffle && currentPlaylistSongs.length > 0) {
        createShuffledOrder();
    }
    // Highlight the current playlist in sidebar
    highlightCurrentPlaylist();
    // Clear container and add playlist header
    container.innerHTML = '';
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.className = 'header-container';
    // Create title
    const titleH2 = document.createElement('h2');
    titleH2.className = 'playlist-name header-title';
    titleH2.textContent = playlistTitle;
    // Create song count
    const songCountP = document.createElement('p');
    songCountP.className = 'song-count';
    songCountP.textContent = `${playlistData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    // Add playlist songs as a list
    if (playlistData.songs && playlistData.songs.length > 0) {
        // Create songs list container
        const songsListDiv = document.createElement('div');
        songsListDiv.className = 'playlist-songs-list';
        // Create song items
        playlistData.songs.forEach((song, index) => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            // Check if this song is currently playing
            const isCurrentlyPlaying = window.settings.song === (song.id || '') && window.settings.playlist === (playlistData.id || playlistData.browseId || '');
            const playingClass = isCurrentlyPlaying ? ' playing' : '';
            // Create song item container
            const songItem = document.createElement('div');
            songItem.className = `playlist-song-item${playingClass}`;
            songItem.setAttribute('data-song-id', song.id || '');
            songItem.setAttribute('data-song-name', title);
            songItem.setAttribute('data-song-artist', artist);
            songItem.setAttribute('data-song-thumbnail', thumbnail);
            songItem.setAttribute('data-playlist-id', window.settings.playlist);
            songItem.setAttribute('data-song-index', index.toString());
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'playlist-song-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.className = 'thumbnail-image';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            // Create info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'playlist-song-info';
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'playlist-song-title';
            titleDiv.textContent = title;
            // Create artist element
            const artistDiv = document.createElement('div');
            artistDiv.className = 'playlist-song-artist';
            artistDiv.textContent = artist;
            // Create number element
            const numberDiv = document.createElement('div');
            numberDiv.className = 'playlist-song-number';
            numberDiv.textContent = index + 1;
            // Append elements
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(artistDiv);
            songItem.appendChild(thumbnailDiv);
            songItem.appendChild(infoDiv);
            songItem.appendChild(numberDiv);
            songsListDiv.appendChild(songItem);
        });
        container.appendChild(songsListDiv);
    } else {
        // Create no songs message
        const noSongsDiv = document.createElement('div');
        noSongsDiv.className = 'no-content-message';
        noSongsDiv.textContent = 'No songs in this playlist';
        container.appendChild(noSongsDiv);
    }
}
function displayLibraryContent(libraryData) {
    const libraryContent = document.getElementById('libraryContent');
    const welcomeSection = document.querySelector('.welcome-section');
    const searchResults = document.getElementById('searchResults');
    welcomeSection.style.display = 'none';
    searchResults.style.display = 'none';
    libraryContent.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    // Display songs
    const songsContainer = document.getElementById('librarySongs');
    const songsSection = songsContainer.parentElement;
    if (libraryData.songs && libraryData.songs.length > 0) {
        songsSection.style.display = 'block';
        // Clear existing content
        songsContainer.innerHTML = '';
        // Create song items
        libraryData.songs.slice(0, 10).forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            // Create library item container
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.setAttribute('data-song-id', song.id || '');
            libraryItem.setAttribute('data-song-name', title);
            libraryItem.setAttribute('data-song-artist', artist);
            libraryItem.setAttribute('data-song-thumbnail', thumbnail);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'library-item-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.className = 'thumbnail-image';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            // Create info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'library-item-info';
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'library-item-title';
            titleDiv.textContent = title;
            // Create subtitle element
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'library-item-subtitle';
            subtitleDiv.textContent = artist;
            // Append elements
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(subtitleDiv);
            libraryItem.appendChild(thumbnailDiv);
            libraryItem.appendChild(infoDiv);
            songsContainer.appendChild(libraryItem);
        });
    } else {
        songsSection.style.display = 'none';
    }
    // Display albums
    const albumsContainer = document.getElementById('libraryAlbums');
    const albumsSection = albumsContainer.parentElement;
    if (libraryData.albums && libraryData.albums.length > 0) {
        albumsSection.style.display = 'block';
        // Clear existing content
        albumsContainer.innerHTML = '';
        // Create album items
        libraryData.albums.slice(0, 10).forEach(album => {
            const title = album.name || album.title || 'Unknown Album';
            const artist = album.artist || '';
            // Create library item container
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.setAttribute('data-album-id', album.browseId || '');
            libraryItem.setAttribute('data-album-title', title);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'library-item-thumbnail';
            if (album.thumbnail) {
                const img = document.createElement('img');
                img.src = album.thumbnail;
                img.alt = title;
                img.className = 'thumbnail-image';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '💿';
            }
            // Create info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'library-item-info';
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'library-item-title';
            titleDiv.textContent = title;
            // Create subtitle element
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'library-item-subtitle';
            subtitleDiv.textContent = artist;
            // Append elements
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(subtitleDiv);
            libraryItem.appendChild(thumbnailDiv);
            libraryItem.appendChild(infoDiv);
            albumsContainer.appendChild(libraryItem);
        });
    } else {
        albumsSection.style.display = 'none';
    }
    // Display artists
    const artistsContainer = document.getElementById('libraryArtists');
    const artistsSection = artistsContainer.parentElement;
    if (libraryData.artists && libraryData.artists.length > 0) {
        artistsSection.style.display = 'block';
        // Clear existing content
        artistsContainer.innerHTML = '';
        // Create artist items
        libraryData.artists.slice(0, 10).forEach(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            // Create library item container
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.setAttribute('data-artist-id', artist.browseId || '');
            libraryItem.setAttribute('data-artist-name', name);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'library-item-thumbnail';
            if (artist.thumbnail) {
                const img = document.createElement('img');
                img.src = artist.thumbnail;
                img.alt = name;
                img.className = 'thumbnail-image';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '👤';
            }
            // Create info container
            const infoDiv = document.createElement('div');
            infoDiv.className = 'library-item-info';
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'library-item-title';
            titleDiv.textContent = name;
            // Create subtitle element
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'library-item-subtitle';
            subtitleDiv.textContent = subscribers;
            // Append elements
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(subtitleDiv);
            libraryItem.appendChild(thumbnailDiv);
            libraryItem.appendChild(infoDiv);
            artistsContainer.appendChild(libraryItem);
        });
    } else {
        artistsSection.style.display = 'none';
    }
}
function displaySongsContent(libraryData) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    // Clear container and add songs header
    container.innerHTML = '';
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.className = 'grid-header';
    // Create title
    const titleH2 = document.createElement('h2');
    titleH2.className = 'header-title';
    titleH2.textContent = 'Your Songs';
    // Create song count
    const songCountP = document.createElement('p');
    songCountP.className = 'song-count';
    songCountP.textContent = `${libraryData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    // Display songs
    if (libraryData.songs && libraryData.songs.length > 0) {
        // Create song items
        libraryData.songs.forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            // Create result card container
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', song.id || '');
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            // Create artist element
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            // Append elements
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
        // Create no songs message
        const noSongsDiv = document.createElement('div');
        noSongsDiv.className = 'no-content-message';
        noSongsDiv.textContent = 'No songs in your library';
        container.appendChild(noSongsDiv);
    }
}
function displayArtistsContent(libraryData) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    // Clear container and add artists header
    container.innerHTML = '';
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.className = 'grid-header';
    // Create title
    const titleH2 = document.createElement('h2');
    titleH2.className = 'header-title';
    titleH2.textContent = 'Your Artists';
    // Create artist count
    const artistCountP = document.createElement('p');
    artistCountP.className = 'song-count';
    artistCountP.textContent = `${libraryData.artists?.length || 0} artists`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(artistCountP);
    container.appendChild(headerDiv);
    // Display artists
    if (libraryData.artists && libraryData.artists.length > 0) {
        // Create artist items
        libraryData.artists.forEach(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            const thumbnail = artist.thumbnail || '';
            // Create result card container
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-artist-id', artist.browseId || '');
            resultCard.setAttribute('data-artist-name', name);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = name;
                img.className = 'thumbnail-image';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '👤';
            }
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = name;
            // Create artist element
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = subscribers;
            // Append elements
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
        // Create no artists message
        const noArtistsDiv = document.createElement('div');
        noArtistsDiv.className = 'no-content-message';
        noArtistsDiv.textContent = 'No artists in your library';
        container.appendChild(noArtistsDiv);
    }
}
function displayAlbumsContent(libraryData) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    // Clear container and add albums header
    container.innerHTML = '';
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.className = 'grid-header';
    // Create title
    const titleH2 = document.createElement('h2');
    titleH2.className = 'header-title';
    titleH2.textContent = 'Your Albums';
    // Create album count
    const albumCountP = document.createElement('p');
    albumCountP.className = 'song-count';
    albumCountP.textContent = `${libraryData.albums?.length || 0} albums`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(albumCountP);
    container.appendChild(headerDiv);
    // Display albums
    if (libraryData.albums && libraryData.albums.length > 0) {
        // Create album items
        libraryData.albums.forEach(album => {
            const title = album.name || album.title || 'Unknown Album';
            const artist = album.artist || '';
            const thumbnail = album.thumbnail || '';
            // Create result card container
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-album-id', album.browseId || '');
            resultCard.setAttribute('data-album-title', title);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '💿';
            }
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            // Create artist element
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            // Append elements
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
        // Create no albums message
        const noAlbumsDiv = document.createElement('div');
        noAlbumsDiv.className = 'no-content-message';
        noAlbumsDiv.textContent = 'No albums in your library';
        container.appendChild(noAlbumsDiv);
    }
}
async function loadAlbum(browseId, albumTitle) {
    // Close mobile menu after album selection
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/album/${browseId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayAlbumContent(data, albumTitle);
        } else {
            showError('Failed to load album');
        }
    } catch (error) {
        console.error('Album error:', error);
        showError('Failed to load album');
    }
}
async function loadArtist(browseId, artistName) {
    // Close mobile menu after artist selection
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const response = await fetch(`/api/artist/${browseId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayArtistContent(data, artistName);
        } else {
            showError('Failed to load artist');
        }
    } catch (error) {
        console.error('Artist error:', error);
        showError('Failed to load artist');
    }
}
function displayAlbumContent(albumData, albumTitle) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';
    // Clear container and add album header
    container.innerHTML = '';
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 20px;';
    // Create title
    const titleH2 = document.createElement('h2');
    titleH2.style.cssText = 'color: #ffffff; margin-bottom: 8px;';
    titleH2.textContent = albumTitle;
    // Create song count
    const songCountP = document.createElement('p');
    songCountP.style.cssText = 'color: #b3b3b3; margin: 0;';
    songCountP.textContent = `${albumData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    // Add album songs
    if (albumData.songs && albumData.songs.length > 0) {
        // Create song items
        albumData.songs.forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            // Create result card container
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', song.id || '');
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            // Create artist element
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            // Append elements
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
        // Create no songs message
        const noSongsDiv = document.createElement('div');
        noSongsDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #b3b3b3;';
        noSongsDiv.textContent = 'No songs in this album';
        container.appendChild(noSongsDiv);
    }
}
function displayArtistContent(artistData, artistName) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');
    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';
    // Clear container and add artist header
    container.innerHTML = '';
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 20px;';
    // Create title
    const titleH2 = document.createElement('h2');
    titleH2.style.cssText = 'color: #ffffff; margin-bottom: 8px;';
    titleH2.textContent = artistName;
    // Create song count
    const songCountP = document.createElement('p');
    songCountP.style.cssText = 'color: #b3b3b3; margin: 0;';
    songCountP.textContent = `${artistData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    // Add artist songs
    if (artistData.songs && artistData.songs.length > 0) {
        // Create song items
        artistData.songs.forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            // Create result card container
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', song.id || '');
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';
            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 4px;';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            // Create title element
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            // Create artist element
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            // Append elements
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
        // Create no songs message
        const noSongsDiv = document.createElement('div');
        noSongsDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #b3b3b3;';
        noSongsDiv.textContent = 'No songs by this artist';
        container.appendChild(noSongsDiv);
    }
}
function toggleRepeatMode() {
    switch (window.settings.repeat) {
        case 'none':
            window.settings.repeat = 'all';
            showInfoNotification('Repeat all enabled');
            break;
        case 'all':
            window.settings.repeat = 'one';
            showInfoNotification('Repeat one enabled');
            break;
        case 'one':
            window.settings.repeat = 'none';
            showInfoNotification('Repeat disabled');
            break;
    }
    saveSetting(SETTINGS_KEYS.REPEAT, window.settings.repeat);
    updateRepeatShuffleDisplay();
}
function toggleShuffle() {
    window.settings.shuffle = !window.settings.shuffle;
    if (window.settings.shuffle) {
        // Create shuffled order if we have a playlist
        if (currentPlaylistSongs.length > 0) {
            createShuffledOrder();
        }
        showInfoNotification('Shuffle enabled');
    } else {
        showInfoNotification('Shuffle disabled');
    }
    saveSetting(SETTINGS_KEYS.SHUFFLE, window.settings.shuffle);
    updateRepeatShuffleDisplay();
}
function createShuffledOrder() {
    originalPlaylistOrder = [...Array(currentPlaylistSongs.length).keys()];
    shuffledPlaylistOrder = [...originalPlaylistOrder];
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledPlaylistOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlaylistOrder[i], shuffledPlaylistOrder[j]] = [shuffledPlaylistOrder[j], shuffledPlaylistOrder[i]];
    }
}
function getNextSongIndex() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return -1;
    if (window.settings.shuffle) {
        // Find current song in shuffled order
        const currentShuffledIndex = shuffledPlaylistOrder.indexOf(currentSongIndex);
        const nextShuffledIndex = currentShuffledIndex + 1;
        if (nextShuffledIndex < shuffledPlaylistOrder.length) {
            return shuffledPlaylistOrder[nextShuffledIndex];
        } else if (window.settings.repeat === 'all') {
            // Re-shuffle and start from beginning
            createShuffledOrder();
            return shuffledPlaylistOrder[0];
        }
    } else {
        const nextIndex = currentSongIndex + 1;
        if (nextIndex < currentPlaylistSongs.length) {
            return nextIndex;
        } else if (window.settings.repeat === 'all') {
            return 0; // Start from beginning
        }
    }
    return -1; // No more songs
}
function getPreviousSongIndex() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return -1;
    if (window.settings.shuffle) {
        // Find current song in shuffled order
        const currentShuffledIndex = shuffledPlaylistOrder.indexOf(currentSongIndex);
        const prevShuffledIndex = currentShuffledIndex - 1;
        if (prevShuffledIndex >= 0) {
            return shuffledPlaylistOrder[prevShuffledIndex];
        } else if (window.settings.repeat === 'all') {
            // Go to end of shuffled order
            return shuffledPlaylistOrder[shuffledPlaylistOrder.length - 1];
        }
    } else {
        const prevIndex = currentSongIndex - 1;
        if (prevIndex >= 0) {
            return prevIndex;
        } else if (window.settings.repeat === 'all') {
            return currentPlaylistSongs.length - 1; // Go to end
        }
    }
    return -1; // No previous song
}
function updateRepeatShuffleDisplay() {
    const repeatButton = document.getElementById('repeatButton');
    const shuffleButton = document.getElementById('shuffleButton');
    // Update repeat button
    switch (window.settings.repeat) {
        case 'none':
            repeatButton.textContent = '🔁';
            repeatButton.title = 'No repeat';
            repeatButton.style.color = '';
            break;
        case 'all':
            repeatButton.textContent = '🔁';
            repeatButton.title = 'Repeat all';
            repeatButton.style.color = '#1db954';
            break;
        case 'one':
            repeatButton.textContent = '🔂';
            repeatButton.title = 'Repeat one';
            repeatButton.style.color = '#1db954';
            break;
    }
    // Update shuffle button
    if (window.settings.shuffle) {
        shuffleButton.textContent = '🔀';
        shuffleButton.style.color = '#1db954';
        shuffleButton.title = 'Shuffle on';
    } else {
        shuffleButton.textContent = '🔀';
        shuffleButton.style.color = '';
        shuffleButton.title = 'Shuffle off';
    }
}
// Initialize
updateCSSBreakpoints();
// Initialize event delegation for data attributes
setupEventDelegation();
// Initialize other components
initVolumeSlider();
updateRepeatShuffleDisplay();
// Load and apply settings
const settings = loadAllSettings();
applySettings(settings);
// Setup auto-save for settings
setupSettingsAutoSave();
// Check if there are settings to load from
if (settings.playlist || settings.song) {
    // Load playlists first, then load from settings
    loadPlaylists().then(() => {
        loadFromURL();
    });
} else {
    // No settings, load home page
    loadHome();
    // Load playlists in background
    loadPlaylists();
}
// Initialize media key listeners
setupMediaKeyListeners();
// Initialize mobile enhancements
addMobileTouchHandlers();
enhancePlayerControls();
// Stop any existing audio when page loads
stopAllAudio();
// Stop audio when page is about to unload
window.addEventListener('beforeunload', () => {
    stopAllAudio();
});
// Add event listeners for navigation items
document.addEventListener('DOMContentLoaded', function () {
    const libraryNavItem = document.getElementById('libraryNavItem');
    const songsNavItem = document.getElementById('songsNavItem');
    const artistsNavItem = document.getElementById('artistsNavItem');
    const albumsNavItem = document.getElementById('albumsNavItem');
    const searchInput = document.getElementById('searchInput');
    if (libraryNavItem) {
        libraryNavItem.addEventListener('click', loadLibrary);
    }
    if (songsNavItem) {
        songsNavItem.addEventListener('click', loadSongs);
    }
    if (artistsNavItem) {
        artistsNavItem.addEventListener('click', loadArtists);
    }
    if (albumsNavItem) {
        albumsNavItem.addEventListener('click', loadAlbums);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearch);
    }
});
// Make functions globally accessible for onclick handlers
window.loadLibrary = loadLibrary;
window.loadSongs = loadSongs;
window.loadArtists = loadArtists;
window.loadAlbums = loadAlbums;
window.loadHome = loadHome;
window.loadExplore = loadExplore;
window.togglePlay = togglePlay;
window.playNextSong = playNextSong;
window.playPreviousSong = playPreviousSong;
window.toggleRepeatMode = toggleRepeatMode;
window.toggleShuffle = toggleShuffle;
window.toggleSidebar = toggleSidebar;
window.handleSearch = handleSearch;
window.seek = seek;
window.playSong = playSong;
window.loadPlaylist = loadPlaylist;
window.loadAlbum = loadAlbum;
window.loadArtist = loadArtist;
window.removeNotification = removeNotification;
window.stopAllAudio = stopAllAudio;
window.loadFromURL = loadFromURL;
window.fetchSongInfo = fetchSongInfo;
window.updateInfoPanel = updateInfoPanel;
window.updateLyricsPanel = updateLyricsPanel;
window.updateInfoPanelWithBasicInfo = updateInfoPanelWithBasicInfo;
window.clearInfoPanel = clearInfoPanel;
// Make settings functions globally accessible
window.loadSetting = loadSetting;
window.saveSetting = saveSetting;
window.loadAllSettings = loadAllSettings;
window.saveAllSettings = saveAllSettings;
window.applySettings = applySettings;
// Right Sidebar Manager
class RightSidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.currentTab = 'info';
        this.isMobile = false;
        this.isMobileOpen = false;
        this.sidebarWidth = 300; // Default width
        this.minWidth = 200;
        this.maxWidth = 600;
        this.init();
    }
    init() {
        this.updateBreakpoint();
        this.setupEventListeners();
        this.restoreState();
        this.updateLayout();
    }
    updateBreakpoint() {
        this.isMobile = window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
        this.updateWidthConstraints();
    }
    updateWidthConstraints() {
        if (window.innerWidth <= 1000) {
            this.minWidth = 200;
            this.maxWidth = 400;
        } else if (window.innerWidth <= 1200) {
            this.minWidth = 200;
            this.maxWidth = 500;
        } else {
            this.minWidth = 200;
            this.maxWidth = 600;
        }
        // Ensure current width is within constraints
        this.sidebarWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.sidebarWidth));
    }
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }
            this.updateLayout();
        });
        // Close mobile sidebar when clicking outside
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileOpen) {
                const rightSidebar = document.getElementById('rightSidebar');
                if (rightSidebar && !rightSidebar.contains(event.target)) {
                    this.closeMobileSidebar();
                }
            }
        });
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;
            // Ctrl/Cmd + Shift + R to toggle right sidebar
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                this.toggle();
            }
            // Ctrl/Cmd + Shift + 1 for Info tab
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '1') {
                event.preventDefault();
                this.switchTab('info');
            }
            // Ctrl/Cmd + Shift + 2 for Lyrics tab
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '2') {
                event.preventDefault();
                this.switchTab('lyrics');
            }
        });
        // Setup resize handle functionality
        this.setupResizeHandle();
    }
    setupResizeHandle() {
        const resizeHandle = document.getElementById('rightSidebarResizeHandle');
        const rightSidebar = document.getElementById('rightSidebar');
        if (!resizeHandle || !rightSidebar) return;
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        const startResize = (e) => {
            if (this.isMobile || this.isCollapsed) return;
            isResizing = true;
            startX = e.clientX || e.touches[0].clientX;
            startWidth = this.sidebarWidth;
            resizeHandle.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };
        const doResize = (e) => {
            if (!isResizing) return;
            const currentX = e.clientX || e.touches[0].clientX;
            const deltaX = startX - currentX;
            let newWidth = startWidth + deltaX;
            // Apply min/max constraints
            newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
            this.sidebarWidth = newWidth;
            this.updateSidebarWidth();
            e.preventDefault();
        };
        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            resizeHandle.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            // Save the new width
            this.saveState();
            saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, this.sidebarWidth);
        };
        // Mouse events
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        // Touch events for mobile
        resizeHandle.addEventListener('touchstart', startResize);
        document.addEventListener('touchmove', doResize);
        document.addEventListener('touchend', stopResize);
    }
    updateSidebarWidth() {
        const rightSidebar = document.getElementById('rightSidebar');
        if (rightSidebar) {
            rightSidebar.style.width = `${this.sidebarWidth}px`;
            document.documentElement.style.setProperty('--right-sidebar-width', `${this.sidebarWidth}px`);
        }
    }
    handleBreakpointChange() {
        if (this.isMobile) {
            // Transitioning to mobile - collapse sidebar
            this.isCollapsed = true;
            this.isMobileOpen = false;
            this.saveState();
        } else {
            // Transitioning to desktop - restore saved state
            this.restoreState();
        }
    }
    toggle() {
        if (this.isMobile) {
            this.toggleMobileSidebar();
        } else {
            this.isCollapsed = !this.isCollapsed;
            this.saveState();
            this.updateLayout();
        }
    }
    toggleMobileSidebar() {
        this.isMobileOpen = !this.isMobileOpen;
        this.updateLayout();
    }
    closeMobileSidebar() {
        this.isMobileOpen = false;
        this.updateLayout();
    }
    switchTab(tabName) {
        if (['info', 'lyrics'].includes(tabName)) {
            this.currentTab = tabName;
            this.saveState();
            this.updateLayout();
            // Save tab setting
            saveSetting(SETTINGS_KEYS.TAB, tabName);
        }
    }
    updateLayout() {
        const rightSidebar = document.getElementById('rightSidebar');
        const mainContent = document.getElementById('mainContent');
        const playerBar = document.querySelector('.player-bar');
        const rightSidebarToggle = document.getElementById('rightSidebarToggle');
        const rightSidebarMobileToggle = document.getElementById('rightSidebarMobileToggle');
        if (!rightSidebar) return;
        // Remove all state classes
        rightSidebar.classList.remove('collapsed', 'mobile-open');
        if (mainContent) {
            mainContent.classList.remove('right-sidebar-collapsed');
        }
        if (playerBar) {
            playerBar.classList.remove('right-sidebar-collapsed');
        }
        // Update sidebar width
        this.updateSidebarWidth();
        if (this.isMobile) {
            // Mobile layout
            if (rightSidebarToggle) {
                rightSidebarToggle.style.display = 'none';
            }
            if (rightSidebarMobileToggle) {
                rightSidebarMobileToggle.style.display = 'flex';
            }
            if (this.isMobileOpen) {
                rightSidebar.classList.add('mobile-open');
                this.addMobileBackdrop();
            } else {
                rightSidebar.classList.add('collapsed');
                this.removeMobileBackdrop();
            }
            // Mobile sidebar should not affect main content layout
            if (mainContent) {
                mainContent.classList.remove('right-sidebar-collapsed');
            }
            if (playerBar) {
                playerBar.classList.remove('right-sidebar-collapsed');
            }
        } else {
            // Desktop layout
            if (rightSidebarToggle) {
                rightSidebarToggle.style.display = 'flex';
            }
            if (rightSidebarMobileToggle) {
                rightSidebarMobileToggle.style.display = 'none';
            }
            this.removeMobileBackdrop();
            if (this.isCollapsed) {
                rightSidebar.classList.add('collapsed');
                if (mainContent) {
                    mainContent.classList.add('right-sidebar-collapsed');
                }
                if (playerBar) {
                    playerBar.classList.add('right-sidebar-collapsed');
                }
            }
            this.updateToggleButton();
        }
        this.updateTabs();
    }
    updateToggleButton() {
        const rightSidebarToggle = document.getElementById('rightSidebarToggle');
        if (!rightSidebarToggle) return;
        if (this.isCollapsed) {
            rightSidebarToggle.textContent = '◀';
            rightSidebarToggle.title = 'Expand right sidebar';
        } else {
            rightSidebarToggle.textContent = '▶';
            rightSidebarToggle.title = 'Collapse right sidebar';
        }
    }
    updateTabs() {
        const infoTab = document.getElementById('infoTab');
        const lyricsTab = document.getElementById('lyricsTab');
        const infoPanel = document.getElementById('infoPanel');
        const lyricsPanel = document.getElementById('lyricsPanel');
        // Update tab states
        if (infoTab) {
            infoTab.classList.toggle('active', this.currentTab === 'info');
        }
        if (lyricsTab) {
            lyricsTab.classList.toggle('active', this.currentTab === 'lyrics');
        }
        // Update panel states
        if (infoPanel) {
            infoPanel.classList.toggle('active', this.currentTab === 'info');
        }
        if (lyricsPanel) {
            lyricsPanel.classList.toggle('active', this.currentTab === 'lyrics');
        }
    }
    addMobileBackdrop() {
        if (!document.getElementById('rightSidebarBackdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'rightSidebarBackdrop';
            backdrop.className = 'right-sidebar-backdrop';
            document.body.appendChild(backdrop);
            // Animate backdrop in
            setTimeout(() => {
                backdrop.classList.add('active');
            }, 10);
            // Close sidebar when backdrop is clicked
            backdrop.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
    }
    removeMobileBackdrop() {
        const backdrop = document.getElementById('rightSidebarBackdrop');
        if (backdrop) {
            backdrop.classList.remove('active');
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
    }
    saveState() {
        if (!this.isMobile) {
            localStorage.setItem('rightSidebarState', JSON.stringify({
                isCollapsed: this.isCollapsed,
                currentTab: this.currentTab,
                sidebarWidth: this.sidebarWidth
            }));
        }
    }
    restoreState() {
        if (this.isMobile) {
            // Mobile always starts with collapsed sidebar
            this.isCollapsed = true;
            this.isMobileOpen = false;
        } else {
            // Desktop restores saved state
            try {
                const savedState = localStorage.getItem('rightSidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.isCollapsed = state.isCollapsed || false;
                    this.currentTab = state.currentTab || 'info';
                    this.sidebarWidth = state.sidebarWidth || 300;
                } else {
                    this.isCollapsed = false; // Default to expanded on desktop
                    this.currentTab = 'info';
                    this.sidebarWidth = 300;
                }
            } catch (error) {
                console.error('Error restoring right sidebar state:', error);
                this.isCollapsed = false;
                this.currentTab = 'info';
                this.sidebarWidth = 300;
            }
        }
    }
}
// Initialize right sidebar manager
const rightSidebarManager = new RightSidebarManager();
window.rightSidebarManager = rightSidebarManager;
// Apply any pending settings that require the rightSidebarManager
function applyPendingSettings() {
    const settings = loadAllSettings();
    // Apply tab setting
    if (window.rightSidebarManager && settings.tab) {
        window.rightSidebarManager.switchTab(settings.tab);
    }
    // Apply right sidebar splitter position
    if (window.rightSidebarManager && settings.split) {
        window.rightSidebarManager.sidebarWidth = settings.split;
        window.rightSidebarManager.updateSidebarWidth();
    }
}
// Apply pending settings after a short delay to ensure initialization
setTimeout(applyPendingSettings, 100);
// Global functions for onclick handlers
function toggleRightSidebar() {
    rightSidebarManager.toggle();
}
function switchRightSidebarTab(tabName) {
    rightSidebarManager.switchTab(tabName);
}
// Event delegation for data attributes instead of inline onclick handlers
function setupEventDelegation() {
    // Handle song clicks with data attributes
    document.addEventListener('click', function (event) {
        const songElement = event.target.closest('[data-song-id]');
        if (songElement) {
            const songId = songElement.dataset.songId;
            const songName = songElement.dataset.songName || '';
            const songArtist = songElement.dataset.songArtist || '';
            const songThumbnail = songElement.dataset.songThumbnail || '';
            const playlistId = songElement.dataset.playlistId || null;
            const songIndex = songElement.dataset.songIndex ? parseInt(songElement.dataset.songIndex) : -1;
            playSong(songId, songName, songArtist, songThumbnail, playlistId, songIndex);
            event.stopPropagation(); // Prevent event from bubbling up to parent elements
            return; // Exit early to prevent other handlers from running
        }
        // Handle playlist clicks with data attributes
        const playlistElement = event.target.closest('[data-playlist-id]');
        if (playlistElement) {
            const playlistId = playlistElement.dataset.playlistId;
            const playlistTitle = playlistElement.dataset.playlistTitle || '';
            loadPlaylist(playlistId, playlistTitle);
            event.stopPropagation(); // Prevent event from bubbling up
            return; // Exit early to prevent other handlers from running
        }
        // Handle album clicks with data attributes
        const albumElement = event.target.closest('[data-album-id]');
        if (albumElement) {
            const albumId = albumElement.dataset.albumId;
            const albumTitle = albumElement.dataset.albumTitle || '';
            loadAlbum(albumId, albumTitle);
            event.stopPropagation(); // Prevent event from bubbling up
            return; // Exit early to prevent other handlers from running
        }
        // Handle artist clicks with data attributes
        const artistElement = event.target.closest('[data-artist-id]');
        if (artistElement) {
            const artistId = artistElement.dataset.artistId;
            const artistName = artistElement.dataset.artistName || '';
            loadArtist(artistId, artistName);
            event.stopPropagation(); // Prevent event from bubbling up
            return; // Exit early to prevent other handlers from running
        }
    });
}