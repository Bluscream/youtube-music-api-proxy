// Responsive breakpoints - these values are used throughout the application
// and are synchronized with CSS custom properties for consistent responsive behavior
const SIDEBAR_COLLAPSE_BREAKPOINT = 800; // Breakpoint for sidebar collapse (desktop and mobile)

let currentAudio = null;
let isPlaying = false;
let currentSongId = null;
let playlists = [];
let currentPlaylist = null;
let currentPlaylistSongs = [];
let currentSongIndex = -1;
let autoPlayEnabled = true;
let isMobileMenuOpen = false;
let isSidebarCollapsed = false;
let errorRecoveryTimeout = null; // For automatic playlist advancement on error

// Repeat and shuffle modes
let repeatMode = 'none'; // 'none', 'one', 'all'
let shuffleEnabled = false;
let originalPlaylistOrder = [];
let shuffledPlaylistOrder = [];

// Default title for the application
const DEFAULT_TITLE = 'YouTube Music';

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
        if (currentPlaylist && currentPlaylistSongs.length > 0) {
            playPreviousSong();
        }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (currentPlaylist && currentPlaylistSongs.length > 0) {
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
                if (currentPlaylist && currentPlaylistSongs.length > 0) {
                    playNextSong();
                }
                break;
            case 'MediaTrackPrevious':
                event.preventDefault();
                if (currentPlaylist && currentPlaylistSongs.length > 0) {
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
    if (currentPlaylist && currentPlaylistSongs.length > 0) {
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

            // Ctrl/Cmd + B to cycle through states
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                event.preventDefault();
                this.cycleState();
            }

            // F11 to toggle full screen
            if (event.key === 'F11') {
                event.preventDefault();
                if (this.currentState === 'full') {
                    this.setState('expanded');
                } else {
                    this.setState('full');
                }
            }
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
        this.updateLayout();
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
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
        }
    }

    restoreState() {
        if (this.isMobile) {
            // Mobile always starts with collapsed sidebar
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
        } else {
            // Desktop restores saved state
            try {
                const savedState = localStorage.getItem('sidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.currentState = state.state || 'expanded';
                } else {
                    this.currentState = 'expanded'; // Default to expanded on desktop
                }
            } catch (error) {
                console.error('Error restoring sidebar state:', error);
                this.currentState = 'expanded';
            }
        }
    }
}

// Initialize sidebar manager
const sidebarManager = new SidebarManager();

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
                updateVolumeDisplay();
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

    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="removeNotification('${notificationId}')">×</button>
    `;

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

// Load content from URL parameters on page load
async function loadFromURL() {
    const params = getQueryParams();

    if (params.playlist) {
        // Load playlist from URL parameter
        try {
            const response = await fetch(`/api/playlist/${params.playlist}?${buildQueryString(params)}`);
            if (response.ok) {
                const data = await response.json();
                const playlistTitle = data.name || data.title || 'Playlist';
                displayPlaylistContent(data, playlistTitle);

                // Set current playlist
                currentPlaylist = params.playlist;
                highlightCurrentPlaylist();

                // If song parameter is also present, play that specific song
                if (params.song) {
                    const songIndex = currentPlaylistSongs.findIndex(song => song.id === params.song);
                    if (songIndex !== -1) {
                        const song = currentPlaylistSongs[songIndex];
                        const title = song.name || song.title || 'Unknown Title';
                        const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                        const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
                        playSong(song.id || '', title, artist, thumbnail, currentPlaylist, songIndex);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading playlist from URL:', error);
        }
    } else if (params.song) {
        // Load and play specific song from URL parameter
        try {
            const response = await fetch(`/api/song/${params.song}?${buildQueryString(params)}`);
            if (response.ok) {
                const data = await response.json();
                const title = data.name || data.title || 'Unknown Title';
                const artist = data.artists && data.artists.length > 0 ? data.artists[0].name : '';
                const thumbnail = data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[0].url : '';
                playSong(params.song, title, artist, thumbnail, null, -1);
            }
        } catch (error) {
            console.error('Error loading song from URL:', error);
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

    container.innerHTML = results.map(result => {
        // Get the correct ID based on result type
        let songId = result.id || result.browseId || '';
        let title = result.title || result.name || 'Unknown Title';
        let artist = result.artist || result.author || '';

        // Only show playable items (songs and videos)
        const isPlayable = result.type === 'SongSearchResult' || result.type === 'VideoSearchResult';

        // Safely escape quotes for onclick
        const safeTitle = title.replace(/'/g, "\\'");
        const safeArtist = artist.replace(/'/g, "\\'");

        const thumbnail = result.thumbnails && result.thumbnails.length > 0 ? result.thumbnails[0].url : (result.thumbnail || '');
        const safeThumbnail = thumbnail.replace(/'/g, "\\'");

        return `
            <div class="result-card" ${isPlayable ? `onclick="playSong('${songId}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)"` : ''}>
                <div class="result-thumbnail">
                    ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                </div>
                <div class="result-title">${title}</div>
                <div class="result-artist">${artist}</div>
                ${!isPlayable ? '<div style="font-size: 10px; color: #666; margin-top: 4px;">Not playable</div>' : ''}
            </div>
        `;
    }).join('');
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
    if (currentPlaylist) {
        const currentPlaylistElement = document.querySelector(`.playlist-item[onclick*="${currentPlaylist}"]`);
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

async function playSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
    // Clear any existing error recovery timeout
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }

    // Stop all audio playback before starting new song
    stopAllAudio();

    // Update URL with song parameter
    const urlParams = {};
    if (playlistId) {
        urlParams.playlist = playlistId;
        urlParams.song = songId;
    } else {
        urlParams.song = songId;
        urlParams.playlist = null;
    }
    updateURL(urlParams);

    currentSongId = songId;
    currentSongIndex = songIndex;
    document.getElementById('nowPlayingTitle').textContent = title;
    document.getElementById('nowPlayingArtist').textContent = artist;
    document.getElementById('playButton').textContent = '⏸';
    isPlaying = true;

    // Update media session state
    if (navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'playing';
    }

    // Reset repeat and shuffle if playing from search results (no playlist)
    if (!playlistId) {
        repeatMode = 'none';
        shuffleEnabled = false;
        updateRepeatShuffleDisplay();
    }

    // Update document title with current song
    document.title = `${title} by ${artist}`;

    // Highlight current song in playlist
    if (playlistId && songIndex >= 0) {
        highlightCurrentSong();
    }

    // Update current playlist and highlight it in sidebar if playing from a playlist
    if (playlistId) {
        currentPlaylist = playlistId;
        highlightCurrentPlaylist();
    } else {
        // Clear playlist highlighting if playing from search results
        currentPlaylist = null;
        highlightCurrentPlaylist();
    }

    // Set thumbnail if provided
    const thumbnailElement = document.getElementById('nowPlayingThumbnail');
    if (thumbnail && thumbnail.trim() !== '') {
        thumbnailElement.innerHTML = `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
    } else {
        thumbnailElement.innerHTML = '🎵';
    }

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
            showErrorNotification(`Failed to play "${title}" by ${artist}. The song may be unavailable or restricted.`);
            handlePlaybackError(title, artist);
        });

        audio.addEventListener('abort', () => {
            console.log('Audio loading aborted');
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title on abort
            document.title = DEFAULT_TITLE;
            showWarningNotification(`Playback of "${title}" was interrupted.`);
        });

        audio.addEventListener('loadeddata', () => {
            audio.play().catch(error => {
                console.error('Play error:', error);
                isPlaying = false;
                document.getElementById('playButton').textContent = '▶';
                // Reset document title on play error
                document.title = DEFAULT_TITLE;
                showErrorNotification(`Failed to start playback of "${title}". Please try again.`);
                handlePlaybackError(title, artist);
            }).then(() => {
                // Update media session metadata for system media controls
                if (navigator.mediaSession) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: title,
                        artist: artist,
                        album: 'YouTube Music',
                        artwork: thumbnail ? [{ src: thumbnail, sizes: '300x300', type: 'image/jpeg' }] : []
                    });
                }
                // showSuccessNotification(`Now playing: "${title}" by ${artist}`);
            });
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
            if (repeatMode === 'one') {
                // Replay the same song
                const currentSong = currentPlaylistSongs[currentSongIndex];
                const title = currentSong.name || currentSong.title || 'Unknown Title';
                const artist = currentSong.artists && currentSong.artists.length > 0 ? currentSong.artists[0].name : '';
                const thumbnail = currentSong.thumbnails && currentSong.thumbnails.length > 0 ? currentSong.thumbnails[0].url : '';

                playSong(currentSong.id || '', title, artist, thumbnail, currentPlaylist, currentSongIndex);
                return;
            }

            // Auto-play next song if enabled and we're in a playlist
            if (autoPlayEnabled && currentPlaylist && currentPlaylistSongs.length > 0) {
                playNextSong();
            } else {
                showInfoNotification('Song finished playing');
            }
        });

        currentAudio = audio;
    } catch (error) {
        console.error('PlaySong error:', error);
        isPlaying = false;
        document.getElementById('playButton').textContent = '▶';
        // Reset document title on error
        document.title = DEFAULT_TITLE;
        showErrorNotification(`Failed to load "${title}" by ${artist}. Please check your connection and try again.`);
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

    playSong(nextSong.id || '', title, artist, thumbnail, currentPlaylist, nextIndex);
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

    playSong(prevSong.id || '', title, artist, thumbnail, currentPlaylist, prevIndex);
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
    }
}

let isDraggingVolume = false;
let currentVolume = 0.5;

function setVolume(event) {
    if (currentAudio) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const volume = Math.max(0, Math.min(1, clickX / rect.width));
        currentAudio.volume = volume;
        currentVolume = volume;
        updateVolumeDisplay();

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
    // Clear URL parameters when going to library
    updateURL({ playlist: null, song: null });
    loadLibraryData();
}

function loadSongs(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear URL parameters when going to songs
    updateURL({ playlist: null, song: null });
    loadSongsData();
}

function loadArtists(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear URL parameters when going to artists
    updateURL({ playlist: null, song: null });
    loadArtistsData();
}

function loadAlbums(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // Clear URL parameters when going to albums
    updateURL({ playlist: null, song: null });
    loadAlbumsData();
}

function loadHome(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
        // Only clear URL parameters when explicitly navigating to home
        updateURL({ playlist: null, song: null });
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
    // Clear URL parameters when going to explore
    updateURL({ playlist: null, song: null });

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
        playlistsList.innerHTML = playlists.map(playlist => {
            const title = playlist.name || playlist.title || 'Unknown Playlist';
            const safeTitle = title.replace(/'/g, "\\'");

            // Get playlist thumbnail - try different possible properties
            const thumbnail = playlist.thumbnail ||
                (playlist.thumbnails && playlist.thumbnails.length > 0 ? playlist.thumbnails[0].url : null) ||
                (playlist.art && playlist.art.sources && playlist.art.sources.length > 0 ? playlist.art.sources[0].url : null);

            // Check if this playlist is currently active
            const isActive = currentPlaylist === (playlist.id || '');
            const activeClass = isActive ? ' active' : '';

            return `
                <div class="playlist-item${activeClass}" onclick="loadPlaylist('${playlist.id || ''}', '${safeTitle}')">
                    <div class="playlist-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}">` : '📋'}
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                        <div style="font-size: 12px; color: ${isActive ? '#000000' : '#666'}; opacity: ${isActive ? '0.7' : '1'};">
                            ${playlist.songCount || 0} songs
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        playlistsSection.style.display = 'none';
    }
}

async function loadPlaylist(playlistId, playlistTitle) {
    // Close mobile menu after playlist selection
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }

    // Update URL with playlist parameter
    updateURL({ playlist: playlistId, song: null });

    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/playlist/${playlistId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayPlaylistContent(data, playlistTitle);

            // Update current playlist and highlight it in sidebar
            currentPlaylist = playlistId;
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
    currentPlaylist = playlistData.id || playlistData.browseId || '';
    currentPlaylistSongs = playlistData.songs || [];

    // Initialize shuffle order if shuffle is enabled
    if (shuffleEnabled && currentPlaylistSongs.length > 0) {
        createShuffledOrder();
    }

    // Highlight the current playlist in sidebar
    highlightCurrentPlaylist();

    // Add playlist header
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">${playlistTitle}</h2>
            <p style="color: #b3b3b3; margin: 0;">${playlistData.songs?.length || 0} songs</p>
        </div>
    `;

    // Add playlist songs as a list
    if (playlistData.songs && playlistData.songs.length > 0) {
        container.innerHTML += `
            <div class="playlist-songs-list">
                ${playlistData.songs.map((song, index) => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            // Check if this song is currently playing
            const isCurrentlyPlaying = currentSongId === (song.id || '') && currentPlaylist === (playlistData.id || playlistData.browseId || '');
            const playingClass = isCurrentlyPlaying ? ' playing' : '';

            return `
                        <div class="playlist-song-item${playingClass}" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', '${currentPlaylist}', ${index})">
                            <div class="playlist-song-thumbnail">
                                ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                            </div>
                            <div class="playlist-song-info">
                                <div class="playlist-song-title">${title}</div>
                                <div class="playlist-song-artist">${artist}</div>
                            </div>
                            <div class="playlist-song-number">${index + 1}</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    } else {
        container.innerHTML += '<div style="text-align: center; color: #b3b3b3;">No songs in this playlist</div>';
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
        songsContainer.innerHTML = libraryData.songs.slice(0, 10).map(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
                    <div class="library-item-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="library-item-info">
                        <div class="library-item-title">${title}</div>
                        <div class="library-item-subtitle">${artist}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        songsSection.style.display = 'none';
    }

    // Display albums
    const albumsContainer = document.getElementById('libraryAlbums');
    const albumsSection = albumsContainer.parentElement;
    if (libraryData.albums && libraryData.albums.length > 0) {
        albumsSection.style.display = 'block';
        albumsContainer.innerHTML = libraryData.albums.slice(0, 10).map(album => {
            const title = album.name || album.title || 'Unknown Album';
            const artist = album.artist || '';
            const safeTitle = title.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="loadAlbum('${album.browseId || ''}', '${safeTitle}')">
                    <div class="library-item-thumbnail">
                        ${album.thumbnail ? `<img src="${album.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '💿'}
                    </div>
                    <div class="library-item-info">
                        <div class="library-item-title">${title}</div>
                        <div class="library-item-subtitle">${artist}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        albumsSection.style.display = 'none';
    }

    // Display artists
    const artistsContainer = document.getElementById('libraryArtists');
    const artistsSection = artistsContainer.parentElement;
    if (libraryData.artists && libraryData.artists.length > 0) {
        artistsSection.style.display = 'block';
        artistsContainer.innerHTML = libraryData.artists.slice(0, 10).map(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            const safeName = name.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="loadArtist('${artist.browseId || ''}', '${safeName}')">
                    <div class="library-item-thumbnail">
                        ${artist.thumbnail ? `<img src="${artist.thumbnail}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '👤'}
                    </div>
                    <div class="library-item-info">
                        <div class="library-item-title">${name}</div>
                        <div class="library-item-subtitle">${subscribers}</div>
                    </div>
                </div>
            `;
        }).join('');
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

    // Add songs header
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">Your Songs</h2>
            <p style="color: #b3b3b3; margin: 0;">${libraryData.songs?.length || 0} songs</p>
        </div>
    `;

    // Display songs
    if (libraryData.songs && libraryData.songs.length > 0) {
        container.innerHTML += libraryData.songs.map(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-artist">${artist}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs in your library</div>';
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

    // Add artists header
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">Your Artists</h2>
            <p style="color: #b3b3b3; margin: 0;">${libraryData.artists?.length || 0} artists</p>
        </div>
    `;

    // Display artists
    if (libraryData.artists && libraryData.artists.length > 0) {
        container.innerHTML += libraryData.artists.map(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            const thumbnail = artist.thumbnail || '';
            const safeName = name.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="loadArtist('${artist.browseId || ''}', '${safeName}')">
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '👤'}
                    </div>
                    <div class="result-title">${name}</div>
                    <div class="result-artist">${subscribers}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No artists in your library</div>';
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

    // Add albums header
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">Your Albums</h2>
            <p style="color: #b3b3b3; margin: 0;">${libraryData.albums?.length || 0} albums</p>
        </div>
    `;

    // Display albums
    if (libraryData.albums && libraryData.albums.length > 0) {
        container.innerHTML += libraryData.albums.map(album => {
            const title = album.name || album.title || 'Unknown Album';
            const artist = album.artist || '';
            const thumbnail = album.thumbnail || '';
            const safeTitle = title.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="loadAlbum('${album.browseId || ''}', '${safeTitle}')">
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '💿'}
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-artist">${artist}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No albums in your library</div>';
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

    // Add album header
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">${albumTitle}</h2>
            <p style="color: #b3b3b3; margin: 0;">${albumData.songs?.length || 0} songs</p>
        </div>
    `;

    // Add album songs
    if (albumData.songs && albumData.songs.length > 0) {
        container.innerHTML += albumData.songs.map(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-artist">${artist}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs in this album</div>';
    }
}

function displayArtistContent(artistData, artistName) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');

    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';

    // Add artist header
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">${artistName}</h2>
            <p style="color: #b3b3b3; margin: 0;">${artistData.songs?.length || 0} songs</p>
        </div>
    `;

    // Add artist songs
    if (artistData.songs && artistData.songs.length > 0) {
        container.innerHTML += artistData.songs.map(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-artist">${artist}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs by this artist</div>';
    }
}

function toggleRepeatMode() {
    switch (repeatMode) {
        case 'none':
            repeatMode = 'all';
            showInfoNotification('Repeat all enabled');
            break;
        case 'all':
            repeatMode = 'one';
            showInfoNotification('Repeat one enabled');
            break;
        case 'one':
            repeatMode = 'none';
            showInfoNotification('Repeat disabled');
            break;
    }
    updateRepeatShuffleDisplay();
}

function toggleShuffle() {
    shuffleEnabled = !shuffleEnabled;

    if (shuffleEnabled) {
        // Create shuffled order if we have a playlist
        if (currentPlaylistSongs.length > 0) {
            createShuffledOrder();
        }
        showInfoNotification('Shuffle enabled');
    } else {
        showInfoNotification('Shuffle disabled');
    }

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

    if (shuffleEnabled) {
        // Find current song in shuffled order
        const currentShuffledIndex = shuffledPlaylistOrder.indexOf(currentSongIndex);
        const nextShuffledIndex = currentShuffledIndex + 1;

        if (nextShuffledIndex < shuffledPlaylistOrder.length) {
            return shuffledPlaylistOrder[nextShuffledIndex];
        } else if (repeatMode === 'all') {
            // Re-shuffle and start from beginning
            createShuffledOrder();
            return shuffledPlaylistOrder[0];
        }
    } else {
        const nextIndex = currentSongIndex + 1;
        if (nextIndex < currentPlaylistSongs.length) {
            return nextIndex;
        } else if (repeatMode === 'all') {
            return 0; // Start from beginning
        }
    }

    return -1; // No more songs
}

function getPreviousSongIndex() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return -1;

    if (shuffleEnabled) {
        // Find current song in shuffled order
        const currentShuffledIndex = shuffledPlaylistOrder.indexOf(currentSongIndex);
        const prevShuffledIndex = currentShuffledIndex - 1;

        if (prevShuffledIndex >= 0) {
            return shuffledPlaylistOrder[prevShuffledIndex];
        } else if (repeatMode === 'all') {
            // Go to end of shuffled order
            return shuffledPlaylistOrder[shuffledPlaylistOrder.length - 1];
        }
    } else {
        const prevIndex = currentSongIndex - 1;
        if (prevIndex >= 0) {
            return prevIndex;
        } else if (repeatMode === 'all') {
            return currentPlaylistSongs.length - 1; // Go to end
        }
    }

    return -1; // No previous song
}

function updateRepeatShuffleDisplay() {
    const repeatButton = document.getElementById('repeatButton');
    const shuffleButton = document.getElementById('shuffleButton');

    // Update repeat button
    switch (repeatMode) {
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
    if (shuffleEnabled) {
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

// Initialize other components
initVolumeSlider();
updateRepeatShuffleDisplay();

// Check if there are URL parameters to load from
const params = getQueryParams();
if (params.playlist || params.song) {
    // Load playlists first, then load from URL parameters
    loadPlaylists().then(() => {
        loadFromURL();
    });
} else {
    // No URL parameters, load home page
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

// Right Sidebar Manager
class RightSidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.currentTab = 'info';
        this.isMobile = false;
        this.isMobileOpen = false;
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
                currentTab: this.currentTab
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
                } else {
                    this.isCollapsed = false; // Default to expanded on desktop
                    this.currentTab = 'info';
                }
            } catch (error) {
                console.error('Error restoring right sidebar state:', error);
                this.isCollapsed = false;
                this.currentTab = 'info';
            }
        }
    }
}

// Initialize right sidebar manager
const rightSidebarManager = new RightSidebarManager();

// Global functions for onclick handlers
function toggleRightSidebar() {
    rightSidebarManager.toggle();
}

function switchRightSidebarTab(tabName) {
    rightSidebarManager.switchTab(tabName);
}