const SIDEBAR_COLLAPSE_BREAKPOINT = 800;
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
window.settings = {
    autoplay: true,
    repeat: 'none',
    shuffle: false,
    playlist: null,
    song: null,
    tab: 'info',
    pos: 0,
    split: 300
};
function loadSetting(key, defaultValue = null) {
    const urlParams = new URLSearchParams(window.location.search);
    const queryValue = urlParams.get(key);
    if (queryValue !== null) {
        return parseSettingValue(key, queryValue);
    }
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
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
        if (key === SETTINGS_KEYS.PLAYLIST || key === SETTINGS_KEYS.SONG) {
            const url = new URL(window.location);
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value.toString());
            }
            window.history.replaceState({}, '', url);
        }
    } catch (error) {
        console.error(`🎵 Settings System: Error saving setting ${key}:`, error);
    }
}
function parseSettingValue(key, value) {
    switch (key) {
        case SETTINGS_KEYS.AUTOPLAY:
        case SETTINGS_KEYS.SHUFFLE:
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true' || value === '1';
            }
            return Boolean(value);
        case SETTINGS_KEYS.POS:
        case SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS:
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        case SETTINGS_KEYS.REPEAT:
            if (['none', 'one', 'all'].includes(value)) {
                return value;
            }
            return 'none';
        case SETTINGS_KEYS.TAB:
            if (['info', 'lyrics'].includes(value)) {
                return value;
            }
            return 'info';
        default:
            return value;
    }
}
function loadAllSettings() {
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
    window.settings = { ...window.settings, ...settings };
    if (window.rightSidebarManager) {
        window.rightSidebarManager.switchTab(window.settings.tab);
    }
    if (window.settings.pos > 0) {
        window.pendingSongPosition = window.settings.pos;
    }
    if (window.rightSidebarManager) {
        window.rightSidebarManager.sidebarWidth = window.settings.split;
        window.rightSidebarManager.updateSidebarWidth();
    }
    updateRepeatShuffleDisplay();
}
function saveAllSettings() {
    window.settings.tab = window.rightSidebarManager ? window.rightSidebarManager.currentTab : 'info';
    window.settings.pos = currentAudio ? currentAudio.currentTime : 0;
    window.settings.split = window.rightSidebarManager ? window.rightSidebarManager.sidebarWidth : 300;
    saveSetting(SETTINGS_KEYS.PLAYLIST, window.settings.playlist);
    saveSetting(SETTINGS_KEYS.SONG, window.settings.song);
    saveSetting(SETTINGS_KEYS.AUTOPLAY, window.settings.autoplay);
    saveSetting(SETTINGS_KEYS.REPEAT, window.settings.repeat);
    saveSetting(SETTINGS_KEYS.SHUFFLE, window.settings.shuffle);
    saveSetting(SETTINGS_KEYS.TAB, window.settings.tab);
    saveSetting(SETTINGS_KEYS.POS, window.settings.pos);
    saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, window.settings.split);
}
function setupSettingsAutoSave() {
    setInterval(saveAllSettings, 30000);
    window.addEventListener('beforeunload', saveAllSettings);
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
let errorRecoveryTimeout = null;
let autoSkip = false;
let originalPlaylistOrder = [];
let shuffledPlaylistOrder = [];
const DEFAULT_TITLE = 'YouTube Music';
let currentSongInfo = null;
function setupMediaKeyListeners() {
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
    document.addEventListener('keydown', (event) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
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
function stopAllAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== currentAudio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    const allVideoElements = document.querySelectorAll('video');
    allVideoElements.forEach(video => {
        if (video.audioTracks && video.audioTracks.length > 0) {
            video.pause();
            video.currentTime = 0;
        }
    });
    if (window.AudioContext || window.webkitAudioContext) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'running') {
                audioContext.suspend();
            }
        } catch (e) {
        }
    }
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(media => {
        if (!media.paused) {
            media.pause();
            media.currentTime = 0;
        }
    });
    currentSongInfo = null;
    clearInfoPanel();
    console.log('Stopped all audio playback');
}
function handlePlaybackError(title, artist) {
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }
    if (autoSkip && window.settings.playlist && currentPlaylistSongs.length > 0) {
        errorRecoveryTimeout = setTimeout(() => {
            console.log(`Auto-advancing playlist due to playback error: ${title}`);
            playNextSong();
            errorRecoveryTimeout = null;
        }, 3000);
    }
}
class SidebarManager {
    constructor() {
        this.isMobile = false;
        this.currentState = 'expanded';
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
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }
            this.updateLayout();
        });
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileMenuOpen) {
                const sidebar = document.getElementById('sidebar');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                    this.closeMobileMenu();
                }
            }
        });
        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                event.preventDefault();
                this.cycleState();
            }
        });
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
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
            this.saveState();
        } else {
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
        sidebar.classList.remove('full', 'expanded', 'icon', 'collapsed', 'mobile-open');
        mainContent.classList.remove('sidebar-full', 'sidebar-expanded', 'sidebar-icon', 'sidebar-collapsed');
        if (playerBar) {
            playerBar.classList.remove('sidebar-full', 'sidebar-expanded', 'sidebar-icon', 'sidebar-collapsed');
        }
        if (this.isMobile) {
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
            mainContent.classList.remove('sidebar-collapsed');
            if (playerBar) {
                playerBar.classList.remove('sidebar-collapsed');
            }
        } else {
            sidebarToggle.style.display = 'flex';
            mobileMenuToggle.style.display = 'none';
            this.removeMobileBackdrop();
            sidebar.classList.add(this.currentState);
            mainContent.classList.add(`sidebar-${this.currentState}`);
            if (playerBar) {
                playerBar.classList.add(`sidebar-${this.currentState}`);
            }
            if (hamburgerMenu) {
                hamburgerMenu.style.display = this.currentState === 'collapsed' ? 'block' : 'none';
            }
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
            setTimeout(() => {
                backdrop.style.opacity = '1';
            }, 10);
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
                this.currentState = 'expanded';
                this.isMobileMenuOpen = false;
            }
        } catch (error) {
            console.error('Error restoring sidebar state:', error);
            this.currentState = 'expanded';
            this.isMobileMenuOpen = false;
        }
        if (this.isMobile) {
            this.currentState = 'collapsed';
        }
    }
}
const sidebarManager = new SidebarManager();
window.sidebarManager = sidebarManager;
function toggleSidebar() {
    sidebarManager.toggle();
}
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
function updateCSSBreakpoints() {
    document.documentElement.style.setProperty('--sidebar-collapse-breakpoint', `${SIDEBAR_COLLAPSE_BREAKPOINT}px`);
}
function addMobileTouchHandlers() {
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
                saveVolume();
            }
        });
    }
}
function enhancePlayerControls() {
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
                            playPreviousSong();
                        } else {
                            playNextSong();
                        }
                    }
                }
            });
        }
    }
}
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
    const iconDiv = document.createElement('div');
    iconDiv.className = 'notification-icon';
    iconDiv.textContent = icons[type] || icons.info;
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
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => removeNotification(notificationId);
    notification.appendChild(iconDiv);
    notification.appendChild(contentDiv);
    notification.appendChild(closeButton);
    container.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
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
function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}
function buildQueryString(params) {
    return Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}
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
async function loadFromURL() {
    const settings = loadAllSettings();
    if (settings.playlist) {
        try {
            const queryParams = getQueryParams();
            const response = await fetch(`/api/playlist/${settings.playlist}?${buildQueryString(queryParams)}`);
            if (response.ok) {
                const data = await response.json();
                const playlistTitle = data.name || data.title || 'Playlist';
                displayPlaylistContent(data, playlistTitle);
                window.settings.playlist = settings.playlist;
                highlightCurrentPlaylist();
                if (settings.song) {
                    const songIndex = currentPlaylistSongs.findIndex(song => song.id === settings.song);
                    if (songIndex !== -1) {
                        const song = currentPlaylistSongs[songIndex];
                        const title = song.name || song.title || 'Unknown Title';
                        const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                        const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
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
        try {
            const queryParams = getQueryParams();
            const response = await fetch(`/api/song/${settings.song}?${buildQueryString(queryParams)}`);
            if (response.ok) {
                const data = await response.json();
                const title = data.name || data.title || 'Unknown Title';
                const artist = data.artists && data.artists.length > 0 ? data.artists[0].name : '';
                const thumbnail = data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[0].url : '';
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
            console.log('Search results:', data.results);
            displaySearchResults(data.results || []);
        } else {
            showError(data.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
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
    container.innerHTML = '';
    results.forEach(result => {
        let songId = result.id || result.browseId || '';
        let title = result.title || result.name || 'Unknown Title';
        let artist = result.artist || result.author || '';
        const isPlayable = result.type === 'SongSearchResult' || result.type === 'VideoSearchResult';
        const thumbnail = result.thumbnails && result.thumbnails.length > 0 ? result.thumbnails[0].url : (result.thumbnail || '');
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        if (isPlayable) {
            resultCard.setAttribute('data-song-id', songId);
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
        }
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
        const titleDiv = document.createElement('div');
        titleDiv.className = 'result-title';
        titleDiv.textContent = title;
        const artistDiv = document.createElement('div');
        artistDiv.className = 'result-artist';
        artistDiv.textContent = artist;
        resultCard.appendChild(thumbnailDiv);
        resultCard.appendChild(titleDiv);
        resultCard.appendChild(artistDiv);
        if (!isPlayable) {
            const notPlayableDiv = document.createElement('div');
            notPlayableDiv.className = 'not-playable-indicator';
            notPlayableDiv.textContent = 'Not playable';
            resultCard.appendChild(notPlayableDiv);
        }
        container.appendChild(resultCard);
    });
}
function highlightCurrentSong() {
    document.querySelectorAll('.playlist-song-item').forEach(item => {
        item.classList.remove('playing');
    });
    if (currentSongIndex >= 0 && currentPlaylistSongs.length > 0) {
        const currentSongElement = document.querySelector(`.playlist-song-item:nth-child(${currentSongIndex + 1})`);
        if (currentSongElement) {
            currentSongElement.classList.add('playing');
        }
    }
}
function highlightCurrentPlaylist() {
    document.querySelectorAll('.playlist-item').forEach(item => {
        item.classList.remove('active');
        const songCountElement = item.querySelector('div > div:last-child');
        if (songCountElement) {
            songCountElement.style.color = '#666';
            songCountElement.style.opacity = '1';
        }
    });
    if (window.settings.playlist) {
        const currentPlaylistElement = document.querySelector(`.playlist-item[onclick*="${window.settings.playlist}"]`);
        if (currentPlaylistElement) {
            currentPlaylistElement.classList.add('active');
            const songCountElement = currentPlaylistElement.querySelector('div > div:last-child');
            if (songCountElement) {
                songCountElement.style.color = '#000000';
                songCountElement.style.opacity = '0.7';
            }
        }
    }
}
async function loadSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }
    stopAllAudio();
    saveSetting(SETTINGS_KEYS.SONG, songId);
    saveSetting(SETTINGS_KEYS.PLAYLIST, playlistId);
    window.settings.song = songId;
    currentSongIndex = songIndex;
    document.getElementById('nowPlayingTitle').textContent = title;
    document.getElementById('nowPlayingArtist').textContent = artist;
    document.getElementById('playButton').textContent = '▶';
    isPlaying = false;
    if (!playlistId) {
        window.settings.repeat = 'none';
        window.settings.shuffle = false;
        updateRepeatShuffleDisplay();
    }
    document.title = `${title} by ${artist}`;
    if (playlistId && songIndex >= 0) {
        highlightCurrentSong();
    }
    if (playlistId) {
        window.settings.playlist = playlistId;
        highlightCurrentPlaylist();
    } else {
        window.settings.playlist = null;
        highlightCurrentPlaylist();
    }
    const thumbnailElement = document.getElementById('nowPlayingThumbnail');
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
    fetchSongInfo(songId);
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const audioUrl = `/api/stream/${songId}?${queryString}`;
        const audio = new Audio(audioUrl);
        audio.volume = currentVolume;
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            document.title = DEFAULT_TITLE;
            showErrorNotification(`Failed to load "${title}" by ${artist}. The song may be unavailable or restricted.`);
            handlePlaybackError(title, artist);
        });
        audio.addEventListener('abort', () => {
            console.log('Audio loading aborted');
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            document.title = DEFAULT_TITLE;
            showWarningNotification(`Loading of "${title}" was interrupted.`);
        });
        audio.addEventListener('loadeddata', () => {
            if (navigator.mediaSession) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: title,
                    artist: artist,
                    album: 'YouTube Music',
                    artwork: thumbnail ? [{ src: thumbnail, sizes: '300x300', type: 'image/jpeg' }] : []
                });
            }
            if (window.pendingSongPosition && window.pendingSongPosition > 0) {
                audio.currentTime = window.pendingSongPosition;
                window.pendingSongPosition = null;
            }
            audio.nextSongTriggered = false;
            showInfoNotification(`Loaded: "${title}" by ${artist}`);
        });
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            if (navigator.mediaSession && audio.duration) {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    position: audio.currentTime,
                    playbackRate: audio.playbackRate
                });
            }
            const currentSecond = Math.floor(audio.currentTime);
            const lastSavedSecond = Math.floor(audio.lastSavedPosition || 0);
            if (currentSecond % 5 === 0 && currentSecond !== lastSavedSecond) {
                audio.lastSavedPosition = audio.currentTime;
                saveSetting(SETTINGS_KEYS.POS, audio.currentTime);
            }
            if (window.settings.autoplay && audio.duration && window.settings.playlist && currentPlaylistSongs.length > 0) {
                const timeRemaining = audio.duration - audio.currentTime;
                const threeSeconds = 3;
                if (timeRemaining > threeSeconds && audio.nextSongTriggered) {
                    audio.nextSongTriggered = false;
                }
                if (timeRemaining <= threeSeconds && !audio.nextSongTriggered) {
                    audio.nextSongTriggered = true;
                    console.log(`🎵 Auto-loading next song (${timeRemaining.toFixed(1)}s remaining)`);
                    const nextIndex = getNextSongIndex();
                    if (nextIndex !== -1) {
                        const nextSong = currentPlaylistSongs[nextIndex];
                        const nextTitle = nextSong.name || nextSong.title || 'Unknown Title';
                        const nextArtist = nextSong.artists && nextSong.artists.length > 0 ? nextSong.artists[0].name : '';
                        const nextThumbnail = nextSong.thumbnails && nextSong.thumbnails.length > 0 ? nextSong.thumbnails[0].url : '';
                        loadSong(nextSong.id || '', nextTitle, nextArtist, nextThumbnail, window.settings.playlist, nextIndex);
                    }
                }
            }
        });
        audio.addEventListener('ended', () => {
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            document.title = DEFAULT_TITLE;
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'none';
            }
            if (window.settings.repeat === 'one') {
                const currentSong = currentPlaylistSongs[currentSongIndex];
                const title = currentSong.name || currentSong.title || 'Unknown Title';
                const artist = currentSong.artists && currentSong.artists.length > 0 ? currentSong.artists[0].name : '';
                const thumbnail = currentSong.thumbnails && currentSong.thumbnails.length > 0 ? currentSong.thumbnails[0].url : '';
                playSong(currentSong.id || '', title, artist, thumbnail, window.settings.playlist, currentSongIndex);
                return;
            }
            if (window.settings.autoplay && window.settings.playlist && currentPlaylistSongs.length > 0) {
                playNextSong();
            } else {
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
        document.title = DEFAULT_TITLE;
        showErrorNotification(`Failed to load "${title}" by ${artist}. Please check your connection and try again.`);
    }
}
async function playSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
    if (!window.settings.song || window.settings.song !== songId) {
        await loadSong(songId, title, artist, thumbnail, playlistId, songIndex);
    }
    if (currentAudio && !isPlaying) {
        try {
            document.getElementById('playButton').textContent = '⏸';
            isPlaying = true;
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
            updateInfoPanelWithBasicInfo();
        }
    } catch (error) {
        console.error('Error fetching song info:', error);
        updateInfoPanelWithBasicInfo();
    }
}
function updateInfoPanel(songInfo) {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    const panelContent = infoPanel.querySelector('.panel-content');
    if (!panelContent) return;
    const duration = songInfo.duration || '';
    const formattedDuration = duration ? formatDuration(duration) : 'Unknown';
    const viewsCount = songInfo.viewsCount || 0;
    const formattedViews = viewsCount > 0 ? formatNumber(viewsCount) : 'Unknown';
    const publishedAt = songInfo.publishedAt || '';
    const formattedDate = publishedAt ? formatDate(publishedAt) : 'Unknown';
    const artists = songInfo.artists || [];
    const artistNames = artists.length > 0 ? artists.map(artist => artist.name || artist).join(', ') : 'Unknown Artist';
    const album = songInfo.album || songInfo.albumName || 'Unknown Album';
    const albumName = typeof album === 'object' ? album.name : album;
    const description = songInfo.description || '';
    const truncatedDescription = description.length > 300 ? description.substring(0, 300) + '...' : description;
    const thumbnails = songInfo.thumbnails || [];
    let thumbnail = '';
    if (thumbnails.length > 0) {
        const sortedThumbnails = thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));
        thumbnail = sortedThumbnails[0].url;
    }
    const hasLyrics = songInfo.lyrics && songInfo.lyrics.data && songInfo.lyrics.data.length > 0;
    panelContent.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'song-info-container';
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
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'song-info-details';
    const titleH3 = document.createElement('h3');
    titleH3.className = 'song-info-title';
    titleH3.textContent = songInfo.name || songInfo.title || 'Unknown Title';
    detailsDiv.appendChild(titleH3);
    const artistP = document.createElement('p');
    artistP.className = 'song-info-artist';
    artistP.textContent = artistNames;
    detailsDiv.appendChild(artistP);
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
    const durationSection = document.createElement('div');
    durationSection.className = 'song-info-section';
    const durationH4 = document.createElement('h4');
    durationH4.textContent = 'Duration';
    durationSection.appendChild(durationH4);
    const durationP = document.createElement('p');
    durationP.textContent = formattedDuration;
    durationSection.appendChild(durationP);
    detailsDiv.appendChild(durationSection);
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
    if (songInfo.tags && songInfo.tags.length > 0) {
        const tagsSection = document.createElement('div');
        tagsSection.className = 'song-info-section';
        const tagsH4 = document.createElement('h4');
        tagsH4.textContent = 'Tags';
        tagsSection.appendChild(tagsH4);
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'song-info-tags';
        songInfo.tags.slice(0, 10).forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            tagsDiv.appendChild(tagSpan);
        });
        tagsSection.appendChild(tagsDiv);
        detailsDiv.appendChild(tagsSection);
    }
    container.appendChild(detailsDiv);
    panelContent.appendChild(container);
}
function updateLyricsPanel(songInfo) {
    const lyricsPanel = document.getElementById('lyricsPanel');
    if (!lyricsPanel) return;
    const panelContent = lyricsPanel.querySelector('.panel-content');
    if (!panelContent) return;
    const hasLyrics = songInfo.lyrics && songInfo.lyrics.data && songInfo.lyrics.data.length > 0;
    if (hasLyrics) {
        const firstLyric = songInfo.lyrics.data[0];
        const lyricsText = firstLyric.plainLyric || '';
        const title = songInfo.name || songInfo.title || 'Unknown Title';
        const artists = songInfo.artists || [];
        const artistNames = artists.length > 0 ? artists.map(artist => artist.name || artist).join(', ') : 'Unknown Artist';
        panelContent.innerHTML = '';
        const lyricsContainer = document.createElement('div');
        lyricsContainer.className = 'lyrics-container';
        const lyricsContent = document.createElement('div');
        lyricsContent.className = 'lyrics-content';
        const lyricsPre = document.createElement('pre');
        lyricsPre.className = 'lyrics-text';
        lyricsPre.textContent = lyricsText;
        lyricsContent.appendChild(lyricsPre);
        lyricsContainer.appendChild(lyricsContent);
        panelContent.appendChild(lyricsContainer);
    } else {
        panelContent.innerHTML = '';
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'lyrics-placeholder';
        const iconDiv = document.createElement('div');
        iconDiv.className = 'placeholder-icon';
        iconDiv.textContent = '🎵';
        const textDiv = document.createElement('div');
        textDiv.className = 'placeholder-text';
        textDiv.textContent = 'No lyrics available for this song';
        placeholderDiv.appendChild(iconDiv);
        placeholderDiv.appendChild(textDiv);
        panelContent.appendChild(placeholderDiv);
    }
}
function updateInfoPanelWithBasicInfo() {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    const panelContent = infoPanel.querySelector('.panel-content');
    if (!panelContent) return;
    const title = document.getElementById('nowPlayingTitle').textContent;
    const artist = document.getElementById('nowPlayingArtist').textContent;
    panelContent.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'song-info-container';
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'song-info-details';
    const titleH3 = document.createElement('h3');
    titleH3.className = 'song-info-title';
    titleH3.textContent = title;
    detailsDiv.appendChild(titleH3);
    const artistP = document.createElement('p');
    artistP.className = 'song-info-artist';
    artistP.textContent = artist;
    detailsDiv.appendChild(artistP);
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
function clearInfoPanel() {
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel) return;
    const panelContent = infoPanel.querySelector('.panel-content');
    if (!panelContent) return;
    panelContent.innerHTML = '';
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'info-placeholder';
    const iconDiv = document.createElement('div');
    iconDiv.className = 'placeholder-icon';
    iconDiv.textContent = 'ℹ️';
    const textDiv = document.createElement('div');
    textDiv.className = 'placeholder-text';
    textDiv.textContent = 'Song information will appear here';
    placeholderDiv.appendChild(iconDiv);
    placeholderDiv.appendChild(textDiv);
    panelContent.appendChild(placeholderDiv);
}
function formatDuration(duration) {
    if (!duration) return 'Unknown';
    if (typeof duration === 'string' && duration.includes(':')) {
        return duration.split('.')[0];
    }
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
            document.title = DEFAULT_TITLE;
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'paused';
            }
            saveSetting(SETTINGS_KEYS.POS, currentAudio.currentTime);
            currentAudio.lastSavedPosition = currentAudio.currentTime;
        } else {
            currentAudio.play();
            document.getElementById('playButton').textContent = '⏸';
            isPlaying = true;
            const title = document.getElementById('nowPlayingTitle').textContent;
            const artist = document.getElementById('nowPlayingArtist').textContent;
            document.title = `${title} by ${artist}`;
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
        saveSetting(SETTINGS_KEYS.POS, currentAudio.currentTime);
        currentAudio.lastSavedPosition = currentAudio.currentTime;
    }
}
let isDraggingVolume = false;
let currentVolume = 0.5;
function saveVolume() {
    localStorage.setItem('playerVolume', currentVolume.toString());
}
function restoreVolume() {
    try {
        const savedVolume = localStorage.getItem('playerVolume');
        if (savedVolume !== null) {
            currentVolume = parseFloat(savedVolume);
            currentVolume = Math.max(0, Math.min(1, currentVolume));
        } else {
            currentVolume = 0.5;
        }
    } catch (error) {
        console.error('Error restoring volume:', error);
        currentVolume = 0.5;
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
        saveVolume();
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
    restoreVolume();
    updateVolumeDisplay();
    volumeThumb.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        e.preventDefault();
    });
    volumeSlider.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        setVolume(e);
    });
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
            saveVolume();
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
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    clickedItem.classList.add('active');
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }
}
function loadLibrary(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadLibraryData();
}
function loadSongs(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadSongsData();
}
function loadArtists(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadArtistsData();
}
function loadAlbums(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
    loadAlbumsData();
}
function loadHome(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
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
    saveSetting(SETTINGS_KEYS.PLAYLIST, null);
    saveSetting(SETTINGS_KEYS.SONG, null);
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
        playlistsList.innerHTML = '';
        playlists.forEach(playlist => {
            const title = playlist.name || playlist.title || 'Unknown Playlist';
            const thumbnail = playlist.thumbnail ||
                (playlist.thumbnails && playlist.thumbnails.length > 0 ? playlist.thumbnails[0].url : null) ||
                (playlist.art && playlist.art.sources && playlist.art.sources.length > 0 ? playlist.art.sources[0].url : null);
            const isActive = window.settings.playlist === (playlist.id || '');
            const activeClass = isActive ? ' active' : '';
            const playlistItem = document.createElement('div');
            playlistItem.className = `playlist-item${activeClass}`;
            playlistItem.setAttribute('data-playlist-id', playlist.id || '');
            playlistItem.setAttribute('data-playlist-title', title);
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
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info-container';
            const titleDiv = document.createElement('div');
            titleDiv.className = 'playlist-name';
            titleDiv.textContent = title;
            const songCountDiv = document.createElement('div');
            songCountDiv.className = 'song-count';
            songCountDiv.style.cssText = `color: ${isActive ? '#000000' : '#666'}; opacity: ${isActive ? '0.7' : '1'};`;
            songCountDiv.textContent = `${playlist.songCount || 0} songs`;
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
    if (shouldCollapseSidebar() && isMobileMenuOpen) {
        toggleSidebar();
    }
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
    container.style.display = 'block';
    window.settings.playlist = playlistData.id || playlistData.browseId || '';
    currentPlaylistSongs = playlistData.songs || [];
    if (window.settings.shuffle && currentPlaylistSongs.length > 0) {
        createShuffledOrder();
    }
    highlightCurrentPlaylist();
    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'header-container';
    const titleH2 = document.createElement('h2');
    titleH2.className = 'playlist-name header-title';
    titleH2.textContent = playlistTitle;
    const songCountP = document.createElement('p');
    songCountP.className = 'song-count';
    songCountP.textContent = `${playlistData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    if (playlistData.songs && playlistData.songs.length > 0) {
        const songsListDiv = document.createElement('div');
        songsListDiv.className = 'playlist-songs-list';
        playlistData.songs.forEach((song, index) => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const isCurrentlyPlaying = window.settings.song === (song.id || '') && window.settings.playlist === (playlistData.id || playlistData.browseId || '');
            const playingClass = isCurrentlyPlaying ? ' playing' : '';
            const songItem = document.createElement('div');
            songItem.className = `playlist-song-item${playingClass}`;
            songItem.setAttribute('data-song-id', song.id || '');
            songItem.setAttribute('data-song-name', title);
            songItem.setAttribute('data-song-artist', artist);
            songItem.setAttribute('data-song-thumbnail', thumbnail);
            songItem.setAttribute('data-playlist-id', window.settings.playlist);
            songItem.setAttribute('data-song-index', index.toString());
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
            const infoDiv = document.createElement('div');
            infoDiv.className = 'playlist-song-info';
            const titleDiv = document.createElement('div');
            titleDiv.className = 'playlist-song-title';
            titleDiv.textContent = title;
            const artistDiv = document.createElement('div');
            artistDiv.className = 'playlist-song-artist';
            artistDiv.textContent = artist;
            const numberDiv = document.createElement('div');
            numberDiv.className = 'playlist-song-number';
            numberDiv.textContent = index + 1;
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(artistDiv);
            songItem.appendChild(thumbnailDiv);
            songItem.appendChild(infoDiv);
            songItem.appendChild(numberDiv);
            songsListDiv.appendChild(songItem);
        });
        container.appendChild(songsListDiv);
    } else {
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
    const songsContainer = document.getElementById('librarySongs');
    const songsSection = songsContainer.parentElement;
    if (libraryData.songs && libraryData.songs.length > 0) {
        songsSection.style.display = 'block';
        songsContainer.innerHTML = '';
        libraryData.songs.slice(0, 10).forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.setAttribute('data-song-id', song.id || '');
            libraryItem.setAttribute('data-song-name', title);
            libraryItem.setAttribute('data-song-artist', artist);
            libraryItem.setAttribute('data-song-thumbnail', thumbnail);
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
            const infoDiv = document.createElement('div');
            infoDiv.className = 'library-item-info';
            const titleDiv = document.createElement('div');
            titleDiv.className = 'library-item-title';
            titleDiv.textContent = title;
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'library-item-subtitle';
            subtitleDiv.textContent = artist;
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(subtitleDiv);
            libraryItem.appendChild(thumbnailDiv);
            libraryItem.appendChild(infoDiv);
            songsContainer.appendChild(libraryItem);
        });
    } else {
        songsSection.style.display = 'none';
    }
    const albumsContainer = document.getElementById('libraryAlbums');
    const albumsSection = albumsContainer.parentElement;
    if (libraryData.albums && libraryData.albums.length > 0) {
        albumsSection.style.display = 'block';
        albumsContainer.innerHTML = '';
        libraryData.albums.slice(0, 10).forEach(album => {
            const title = album.name || album.title || 'Unknown Album';
            const artist = album.artist || '';
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.setAttribute('data-album-id', album.browseId || '');
            libraryItem.setAttribute('data-album-title', title);
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
            const infoDiv = document.createElement('div');
            infoDiv.className = 'library-item-info';
            const titleDiv = document.createElement('div');
            titleDiv.className = 'library-item-title';
            titleDiv.textContent = title;
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'library-item-subtitle';
            subtitleDiv.textContent = artist;
            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(subtitleDiv);
            libraryItem.appendChild(thumbnailDiv);
            libraryItem.appendChild(infoDiv);
            albumsContainer.appendChild(libraryItem);
        });
    } else {
        albumsSection.style.display = 'none';
    }
    const artistsContainer = document.getElementById('libraryArtists');
    const artistsSection = artistsContainer.parentElement;
    if (libraryData.artists && libraryData.artists.length > 0) {
        artistsSection.style.display = 'block';
        artistsContainer.innerHTML = '';
        libraryData.artists.slice(0, 10).forEach(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.setAttribute('data-artist-id', artist.browseId || '');
            libraryItem.setAttribute('data-artist-name', name);
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
            const infoDiv = document.createElement('div');
            infoDiv.className = 'library-item-info';
            const titleDiv = document.createElement('div');
            titleDiv.className = 'library-item-title';
            titleDiv.textContent = name;
            const subtitleDiv = document.createElement('div');
            subtitleDiv.className = 'library-item-subtitle';
            subtitleDiv.textContent = subscribers;
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
    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'grid-header';
    const titleH2 = document.createElement('h2');
    titleH2.className = 'header-title';
    titleH2.textContent = 'Your Songs';
    const songCountP = document.createElement('p');
    songCountP.className = 'song-count';
    songCountP.textContent = `${libraryData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    if (libraryData.songs && libraryData.songs.length > 0) {
        libraryData.songs.forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', song.id || '');
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
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
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
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
    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'grid-header';
    const titleH2 = document.createElement('h2');
    titleH2.className = 'header-title';
    titleH2.textContent = 'Your Artists';
    const artistCountP = document.createElement('p');
    artistCountP.className = 'song-count';
    artistCountP.textContent = `${libraryData.artists?.length || 0} artists`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(artistCountP);
    container.appendChild(headerDiv);
    if (libraryData.artists && libraryData.artists.length > 0) {
        libraryData.artists.forEach(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            const thumbnail = artist.thumbnail || '';
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-artist-id', artist.browseId || '');
            resultCard.setAttribute('data-artist-name', name);
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
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = name;
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = subscribers;
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
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
    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.className = 'grid-header';
    const titleH2 = document.createElement('h2');
    titleH2.className = 'header-title';
    titleH2.textContent = 'Your Albums';
    const albumCountP = document.createElement('p');
    albumCountP.className = 'song-count';
    albumCountP.textContent = `${libraryData.albums?.length || 0} albums`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(albumCountP);
    container.appendChild(headerDiv);
    if (libraryData.albums && libraryData.albums.length > 0) {
        libraryData.albums.forEach(album => {
            const title = album.name || album.title || 'Unknown Album';
            const artist = album.artist || '';
            const thumbnail = album.thumbnail || '';
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-album-id', album.browseId || '');
            resultCard.setAttribute('data-album-title', title);
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
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
        const noAlbumsDiv = document.createElement('div');
        noAlbumsDiv.className = 'no-content-message';
        noAlbumsDiv.textContent = 'No albums in your library';
        container.appendChild(noAlbumsDiv);
    }
}
async function loadAlbum(browseId, albumTitle) {
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
    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 20px;';
    const titleH2 = document.createElement('h2');
    titleH2.style.cssText = 'color: #ffffff; margin-bottom: 8px;';
    titleH2.textContent = albumTitle;
    const songCountP = document.createElement('p');
    songCountP.style.cssText = 'color: #b3b3b3; margin: 0;';
    songCountP.textContent = `${albumData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    if (albumData.songs && albumData.songs.length > 0) {
        albumData.songs.forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', song.id || '');
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
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
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
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
    container.innerHTML = '';
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'grid-column: 1 / -1; margin-bottom: 20px;';
    const titleH2 = document.createElement('h2');
    titleH2.style.cssText = 'color: #ffffff; margin-bottom: 8px;';
    titleH2.textContent = artistName;
    const songCountP = document.createElement('p');
    songCountP.style.cssText = 'color: #b3b3b3; margin: 0;';
    songCountP.textContent = `${artistData.songs?.length || 0} songs`;
    headerDiv.appendChild(titleH2);
    headerDiv.appendChild(songCountP);
    container.appendChild(headerDiv);
    if (artistData.songs && artistData.songs.length > 0) {
        artistData.songs.forEach(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', song.id || '');
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);
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
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(thumbnailDiv);
            resultCard.appendChild(titleDiv);
            resultCard.appendChild(artistDiv);
            container.appendChild(resultCard);
        });
    } else {
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
    for (let i = shuffledPlaylistOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlaylistOrder[i], shuffledPlaylistOrder[j]] = [shuffledPlaylistOrder[j], shuffledPlaylistOrder[i]];
    }
}
function getNextSongIndex() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return -1;
    if (window.settings.shuffle) {
        const currentShuffledIndex = shuffledPlaylistOrder.indexOf(currentSongIndex);
        const nextShuffledIndex = currentShuffledIndex + 1;
        if (nextShuffledIndex < shuffledPlaylistOrder.length) {
            return shuffledPlaylistOrder[nextShuffledIndex];
        } else if (window.settings.repeat === 'all') {
            createShuffledOrder();
            return shuffledPlaylistOrder[0];
        }
    } else {
        const nextIndex = currentSongIndex + 1;
        if (nextIndex < currentPlaylistSongs.length) {
            return nextIndex;
        } else if (window.settings.repeat === 'all') {
            return 0;
        }
    }
    return -1;
}
function getPreviousSongIndex() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return -1;
    if (window.settings.shuffle) {
        const currentShuffledIndex = shuffledPlaylistOrder.indexOf(currentSongIndex);
        const prevShuffledIndex = currentShuffledIndex - 1;
        if (prevShuffledIndex >= 0) {
            return shuffledPlaylistOrder[prevShuffledIndex];
        } else if (window.settings.repeat === 'all') {
            return shuffledPlaylistOrder[shuffledPlaylistOrder.length - 1];
        }
    } else {
        const prevIndex = currentSongIndex - 1;
        if (prevIndex >= 0) {
            return prevIndex;
        } else if (window.settings.repeat === 'all') {
            return currentPlaylistSongs.length - 1;
        }
    }
    return -1;
}
function updateRepeatShuffleDisplay() {
    const repeatButton = document.getElementById('repeatButton');
    const shuffleButton = document.getElementById('shuffleButton');
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
updateCSSBreakpoints();
setupEventDelegation();
initVolumeSlider();
updateRepeatShuffleDisplay();
const settings = loadAllSettings();
applySettings(settings);
setupSettingsAutoSave();
if (settings.playlist || settings.song) {
    loadPlaylists().then(() => {
        loadFromURL();
    });
} else {
    loadHome();
    loadPlaylists();
}
setupMediaKeyListeners();
addMobileTouchHandlers();
enhancePlayerControls();
stopAllAudio();
window.addEventListener('beforeunload', () => {
    stopAllAudio();
});
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
window.loadSetting = loadSetting;
window.saveSetting = saveSetting;
window.loadAllSettings = loadAllSettings;
window.saveAllSettings = saveAllSettings;
window.applySettings = applySettings;
class RightSidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.currentTab = 'info';
        this.isMobile = false;
        this.isMobileOpen = false;
        this.sidebarWidth = 300;
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
        this.sidebarWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.sidebarWidth));
    }
    setupEventListeners() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }
            this.updateLayout();
        });
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileOpen) {
                const rightSidebar = document.getElementById('rightSidebar');
                if (rightSidebar && !rightSidebar.contains(event.target)) {
                    this.closeMobileSidebar();
                }
            }
        });
        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                this.toggle();
            }
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '1') {
                event.preventDefault();
                this.switchTab('info');
            }
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '2') {
                event.preventDefault();
                this.switchTab('lyrics');
            }
        });
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
            this.saveState();
            saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, this.sidebarWidth);
        };
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
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
            this.isCollapsed = true;
            this.isMobileOpen = false;
            this.saveState();
        } else {
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
        rightSidebar.classList.remove('collapsed', 'mobile-open');
        if (mainContent) {
            mainContent.classList.remove('right-sidebar-collapsed');
        }
        if (playerBar) {
            playerBar.classList.remove('right-sidebar-collapsed');
        }
        this.updateSidebarWidth();
        if (this.isMobile) {
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
            if (mainContent) {
                mainContent.classList.remove('right-sidebar-collapsed');
            }
            if (playerBar) {
                playerBar.classList.remove('right-sidebar-collapsed');
            }
        } else {
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
        if (infoTab) {
            infoTab.classList.toggle('active', this.currentTab === 'info');
        }
        if (lyricsTab) {
            lyricsTab.classList.toggle('active', this.currentTab === 'lyrics');
        }
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
            setTimeout(() => {
                backdrop.classList.add('active');
            }, 10);
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
            this.isCollapsed = true;
            this.isMobileOpen = false;
        } else {
            try {
                const savedState = localStorage.getItem('rightSidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.isCollapsed = state.isCollapsed || false;
                    this.currentTab = state.currentTab || 'info';
                    this.sidebarWidth = state.sidebarWidth || 300;
                } else {
                    this.isCollapsed = false;
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
const rightSidebarManager = new RightSidebarManager();
window.rightSidebarManager = rightSidebarManager;
function applyPendingSettings() {
    const settings = loadAllSettings();
    if (window.rightSidebarManager && settings.tab) {
        window.rightSidebarManager.switchTab(settings.tab);
    }
    if (window.rightSidebarManager && settings.split) {
        window.rightSidebarManager.sidebarWidth = settings.split;
        window.rightSidebarManager.updateSidebarWidth();
    }
}
setTimeout(applyPendingSettings, 100);
function toggleRightSidebar() {
    rightSidebarManager.toggle();
}
function switchRightSidebarTab(tabName) {
    rightSidebarManager.switchTab(tabName);
}
function setupEventDelegation() {
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
            event.stopPropagation();
            return;
        }
        const playlistElement = event.target.closest('[data-playlist-id]');
        if (playlistElement) {
            const playlistId = playlistElement.dataset.playlistId;
            const playlistTitle = playlistElement.dataset.playlistTitle || '';
            loadPlaylist(playlistId, playlistTitle);
            event.stopPropagation();
            return;
        }
        const albumElement = event.target.closest('[data-album-id]');
        if (albumElement) {
            const albumId = albumElement.dataset.albumId;
            const albumTitle = albumElement.dataset.albumTitle || '';
            loadAlbum(albumId, albumTitle);
            event.stopPropagation();
            return;
        }
        const artistElement = event.target.closest('[data-artist-id]');
        if (artistElement) {
            const artistId = artistElement.dataset.artistId;
            const artistName = artistElement.dataset.artistName || '';
            loadArtist(artistId, artistName);
            event.stopPropagation();
            return;
        }
    });
}