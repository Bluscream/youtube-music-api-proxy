define("core/event-emitter", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EventEmitter = void 0;
    class EventEmitter {
        constructor() {
            this.events = new Map();
        }
        /**
         * Add an event listener
         */
        on(event, handler) {
            if (!this.events.has(event)) {
                this.events.set(event, []);
            }
            this.events.get(event).push(handler);
        }
        /**
         * Remove an event listener
         */
        off(event, handler) {
            const handlers = this.events.get(event);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }
        /**
         * Emit an event
         */
        emit(event, data) {
            const handlers = this.events.get(event);
            if (handlers) {
                handlers.forEach(handler => {
                    try {
                        handler(data);
                    }
                    catch (error) {
                        console.error(`Error in event handler for ${event}:`, error);
                    }
                });
            }
        }
        /**
         * Remove all listeners for an event
         */
        removeAllListeners(event) {
            if (event) {
                this.events.delete(event);
            }
            else {
                this.events.clear();
            }
        }
        /**
         * Get the number of listeners for an event
         */
        listenerCount(event) {
            const handlers = this.events.get(event);
            return handlers ? handlers.length : 0;
        }
    }
    exports.EventEmitter = EventEmitter;
});
define("core/state-manager", ["require", "exports", "core/event-emitter"], function (require, exports, event_emitter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StateManager = void 0;
    // Base state manager with change detection and events
    class StateManager extends event_emitter_1.EventEmitter {
        constructor(initialState, storageKey) {
            super();
            this.state = initialState;
            this.storageKey = storageKey;
            if (storageKey) {
                this.loadFromStorage();
            }
        }
        /**
         * Get current state
         */
        getState() {
            return { ...this.state };
        }
        /**
         * Update state partially
         */
        setState(updates) {
            const oldState = { ...this.state };
            this.state = { ...this.state, ...updates };
            this.emit('stateChanged', {
                oldState,
                newState: this.state,
                changes: updates
            });
            if (this.storageKey) {
                this.saveToStorage();
            }
        }
        /**
         * Replace entire state
         */
        replaceState(newState) {
            const oldState = { ...this.state };
            this.state = { ...newState };
            this.emit('stateChanged', {
                oldState,
                newState: this.state,
                changes: newState
            });
            if (this.storageKey) {
                this.saveToStorage();
            }
        }
        /**
         * Subscribe to state changes
         */
        subscribe(handler) {
            this.on('stateChanged', handler);
            return () => this.off('stateChanged', handler);
        }
        /**
         * Save state to localStorage
         */
        saveToStorage() {
            if (!this.storageKey)
                return;
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.state));
            }
            catch (error) {
                console.error(`Failed to save state to storage (${this.storageKey}):`, error);
            }
        }
        /**
         * Load state from localStorage
         */
        loadFromStorage() {
            if (!this.storageKey)
                return;
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.state = { ...this.state, ...parsed };
                }
            }
            catch (error) {
                console.error(`Failed to load state from storage (${this.storageKey}):`, error);
            }
        }
        /**
         * Clear stored state
         */
        clearStorage() {
            if (this.storageKey) {
                localStorage.removeItem(this.storageKey);
            }
        }
    }
    exports.StateManager = StateManager;
});
// Type definitions for the YouTube Music API Proxy
define("types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("managers/app-settings-manager", ["require", "exports", "core/state-manager"], function (require, exports, state_manager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppSettingsManager = void 0;
    // App settings manager using the base StateManager
    class AppSettingsManager extends state_manager_1.StateManager {
        constructor() {
            const initialSettings = {
                repeat: 'none',
                playlist: null,
                song: null,
                tab: 'info',
                split: 300
            };
            super(initialSettings, 'app-settings');
            this.loadFromURL();
        }
        /**
         * Get singleton instance
         */
        static getInstance() {
            if (!AppSettingsManager.instance) {
                AppSettingsManager.instance = new AppSettingsManager();
            }
            return AppSettingsManager.instance;
        }
        /**
         * Load settings from URL parameters
         */
        loadFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const updates = {};
            // Load playlist and song from URL
            const playlist = urlParams.get('playlist');
            if (playlist) {
                updates.playlist = playlist;
            }
            const song = urlParams.get('song');
            if (song) {
                updates.song = song;
            }
            if (Object.keys(updates).length > 0) {
                this.setState(updates);
            }
        }
        /**
         * Update URL when playlist or song changes
         */
        updateURL() {
            const url = new URL(window.location.href);
            const state = this.getState();
            // Update playlist parameter
            if (state.playlist) {
                url.searchParams.set('playlist', state.playlist);
            }
            else {
                url.searchParams.delete('playlist');
            }
            // Update song parameter
            if (state.song) {
                url.searchParams.set('song', state.song);
            }
            else {
                url.searchParams.delete('song');
            }
            window.history.replaceState({}, '', url);
        }
        /**
         * Override setState to update URL when needed
         */
        setState(updates) {
            super.setState(updates);
            // Update URL if playlist or song changed
            if (updates.playlist !== undefined || updates.song !== undefined) {
                this.updateURL();
            }
        }
        /**
         * Set repeat mode
         */
        setRepeatMode(mode) {
            this.setState({ repeat: mode });
        }
        /**
         * Get repeat mode
         */
        getRepeatMode() {
            return this.getState().repeat;
        }
        /**
         * Set active tab
         */
        setActiveTab(tab) {
            this.setState({ tab });
        }
        /**
         * Get active tab
         */
        getActiveTab() {
            return this.getState().tab;
        }
        /**
         * Set sidebar split position
         */
        setSidebarSplit(split) {
            this.setState({ split });
        }
        /**
         * Get sidebar split position
         */
        getSidebarSplit() {
            return this.getState().split;
        }
        /**
         * Set current playlist
         */
        setCurrentPlaylist(playlistId) {
            this.setState({ playlist: playlistId });
        }
        /**
         * Get current playlist
         */
        getCurrentPlaylist() {
            return this.getState().playlist;
        }
        /**
         * Set current song
         */
        setCurrentSong(songId) {
            this.setState({ song: songId });
        }
        /**
         * Get current song
         */
        getCurrentSong() {
            return this.getState().song;
        }
        /**
         * Cycle through repeat modes
         */
        cycleRepeatMode() {
            const modes = ['none', 'one', 'all'];
            const currentIndex = modes.indexOf(this.getRepeatMode());
            const nextIndex = (currentIndex + 1) % modes.length;
            const nextMode = modes[nextIndex];
            this.setRepeatMode(nextMode);
            return nextMode;
        }
        /**
         * Reset all settings to defaults
         */
        reset() {
            const defaultSettings = {
                repeat: 'none',
                playlist: null,
                song: null,
                tab: 'info',
                split: 300
            };
            this.replaceState(defaultSettings);
        }
    }
    exports.AppSettingsManager = AppSettingsManager;
});
define("managers/audio-manager", ["require", "exports", "core/state-manager", "managers/app-settings-manager"], function (require, exports, state_manager_2, app_settings_manager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AudioManager = void 0;
    // Audio Manager with comprehensive state management
    class AudioManager extends state_manager_2.StateManager {
        constructor() {
            const initialState = {
                currentAudio: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                volume: 1,
                currentSong: null,
                currentPlaylistSongs: [],
                currentSongIndex: -1,
                errorRecoveryTimeout: null,
                autoSkip: false
            };
            super(initialState, 'audio-state');
            this.mediaSession = null;
            this.settingsManager = app_settings_manager_1.AppSettingsManager.getInstance();
            this.setupMediaSession();
            this.setupEventListeners();
        }
        /**
         * Get singleton instance
         */
        static getInstance() {
            if (!AudioManager.instance) {
                AudioManager.instance = new AudioManager();
            }
            return AudioManager.instance;
        }
        /**
         * Setup Media Session API
         */
        setupMediaSession() {
            if (!navigator.mediaSession) {
                console.log('Media Session API not supported');
                return;
            }
            this.mediaSession = navigator.mediaSession;
            this.mediaSession.setActionHandler('play', () => this.play());
            this.mediaSession.setActionHandler('pause', () => this.pause());
            this.mediaSession.setActionHandler('previoustrack', () => this.previous());
            this.mediaSession.setActionHandler('nexttrack', () => this.next());
            this.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) {
                    this.seek(details.seekTime);
                }
            });
            this.mediaSession.setActionHandler('stop', () => this.stop());
        }
        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Keyboard media key listeners
            document.addEventListener('keydown', (event) => {
                if (document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA') {
                    return;
                }
                switch (event.code) {
                    case 'MediaPlayPause':
                        event.preventDefault();
                        this.togglePlay();
                        break;
                    case 'MediaTrackNext':
                        event.preventDefault();
                        this.next();
                        break;
                    case 'MediaTrackPrevious':
                        event.preventDefault();
                        this.previous();
                        break;
                }
            });
            // Listen to settings changes
            this.settingsManager.subscribe(({ changes }) => {
                if (changes.repeat !== undefined) {
                    this.updateRepeatMode();
                }
            });
        }
        /**
         * Play current audio
         */
        async play() {
            const state = this.getState();
            if (!state.currentAudio || !state.currentSong)
                return;
            try {
                await state.currentAudio.play();
                this.setState({ isPlaying: true });
                if (this.mediaSession) {
                    this.mediaSession.playbackState = 'playing';
                }
                this.emit('play', { song: state.currentSong });
            }
            catch (error) {
                console.error('Error playing audio:', error);
                this.emit('error', { error: error, song: state.currentSong });
            }
        }
        /**
         * Pause current audio
         */
        pause() {
            const state = this.getState();
            if (!state.currentAudio)
                return;
            state.currentAudio.pause();
            this.setState({ isPlaying: false });
            if (this.mediaSession) {
                this.mediaSession.playbackState = 'paused';
            }
            if (state.currentSong) {
                this.emit('pause', { song: state.currentSong });
            }
        }
        /**
         * Stop current audio
         */
        stop() {
            const state = this.getState();
            if (!state.currentAudio)
                return;
            state.currentAudio.pause();
            state.currentAudio.currentTime = 0;
            this.setState({
                isPlaying: false,
                currentTime: 0,
                currentSong: null
            });
            if (this.mediaSession) {
                this.mediaSession.playbackState = 'none';
            }
            this.emit('stop');
        }
        /**
         * Toggle play/pause
         */
        togglePlay() {
            const state = this.getState();
            if (state.isPlaying) {
                this.pause();
            }
            else {
                this.play();
            }
        }
        /**
         * Play next song in playlist
         */
        next() {
            const state = this.getState();
            const nextIndex = this.getNextSongIndex();
            if (nextIndex >= 0 && nextIndex < state.currentPlaylistSongs.length) {
                const song = state.currentPlaylistSongs[nextIndex];
                this.playSong(song, nextIndex);
            }
        }
        /**
         * Play previous song in playlist
         */
        previous() {
            const state = this.getState();
            const prevIndex = this.getPreviousSongIndex();
            if (prevIndex >= 0 && prevIndex < state.currentPlaylistSongs.length) {
                const song = state.currentPlaylistSongs[prevIndex];
                this.playSong(song, prevIndex);
            }
        }
        /**
         * Play a specific song
         */
        async playSong(song, index = -1) {
            // Stop current audio
            this.stopAllAudio();
            // Create new audio element
            const audio = new Audio();
            audio.src = await this.getAudioUrl(song.id);
            audio.volume = this.getState().volume;
            // Setup audio event listeners
            this.setupAudioEventListeners(audio, song);
            // Update state
            this.setState({
                currentAudio: audio,
                currentSong: song,
                currentSongIndex: index,
                currentTime: 0,
                duration: 0
            });
            // Update media session metadata
            this.updateMediaSessionMetadata(song);
            // Start playing
            await this.play();
        }
        /**
         * Set playlist
         */
        setPlaylist(songs) {
            this.setState({ currentPlaylistSongs: songs });
            this.emit('playlistChange', { songs });
        }
        /**
         * Seek to position
         */
        seek(time) {
            const state = this.getState();
            if (state.currentAudio) {
                state.currentAudio.currentTime = time;
                this.setState({ currentTime: time });
            }
        }
        /**
         * Set volume
         */
        setVolume(volume) {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            const state = this.getState();
            if (state.currentAudio) {
                state.currentAudio.volume = clampedVolume;
            }
            this.setState({ volume: clampedVolume });
            this.emit('volumeChange', { volume: clampedVolume });
        }
        /**
         * Get current volume
         */
        getVolume() {
            return this.getState().volume;
        }
        /**
         * Get current song
         */
        getCurrentSong() {
            return this.getState().currentSong;
        }
        /**
         * Get current playlist
         */
        getCurrentPlaylist() {
            return this.getState().currentPlaylistSongs;
        }
        /**
         * Get current song index
         */
        getCurrentSongIndex() {
            return this.getState().currentSongIndex;
        }
        /**
         * Check if currently playing
         */
        isPlaying() {
            return this.getState().isPlaying;
        }
        /**
         * Get next song index based on repeat mode
         */
        getNextSongIndex() {
            const state = this.getState();
            const repeatMode = this.settingsManager.getRepeatMode();
            if (state.currentSongIndex === -1)
                return -1;
            if (repeatMode === 'one') {
                return state.currentSongIndex; // Repeat current song
            }
            else if (repeatMode === 'all') {
                return (state.currentSongIndex + 1) % state.currentPlaylistSongs.length; // Loop playlist
            }
            else {
                return state.currentSongIndex + 1 < state.currentPlaylistSongs.length ?
                    state.currentSongIndex + 1 : -1; // Stop at end
            }
        }
        /**
         * Get previous song index
         */
        getPreviousSongIndex() {
            const state = this.getState();
            const repeatMode = this.settingsManager.getRepeatMode();
            if (state.currentSongIndex === -1)
                return -1;
            if (repeatMode === 'one') {
                return state.currentSongIndex; // Repeat current song
            }
            else if (repeatMode === 'all') {
                return state.currentSongIndex - 1 >= 0 ?
                    state.currentSongIndex - 1 : state.currentPlaylistSongs.length - 1; // Loop playlist
            }
            else {
                return state.currentSongIndex - 1 >= 0 ? state.currentSongIndex - 1 : -1; // Stop at beginning
            }
        }
        /**
         * Setup audio event listeners
         */
        setupAudioEventListeners(audio, song) {
            audio.addEventListener('timeupdate', () => {
                this.setState({
                    currentTime: audio.currentTime,
                    duration: audio.duration
                });
                this.emit('timeUpdate', {
                    currentTime: audio.currentTime,
                    duration: audio.duration
                });
            });
            audio.addEventListener('ended', () => {
                this.emit('songEnd', { song });
                this.next();
            });
            audio.addEventListener('error', (event) => {
                const error = new Error('Audio playback error');
                this.emit('error', { error, song });
                this.handlePlaybackError(song);
            });
        }
        /**
         * Update media session metadata
         */
        updateMediaSessionMetadata(song) {
            if (!this.mediaSession)
                return;
            this.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: song.album || '',
                artwork: song.thumbnail ? [{ src: song.thumbnail }] : []
            });
        }
        /**
         * Get audio URL for song
         */
        async getAudioUrl(songId) {
            // TODO: Implement API call to get audio URL
            return `/api/song/${songId}/audio`;
        }
        /**
         * Stop all audio playback
         */
        stopAllAudio() {
            const state = this.getState();
            if (state.currentAudio) {
                state.currentAudio.pause();
                state.currentAudio.currentTime = 0;
            }
            // Stop all other audio elements
            document.querySelectorAll('audio').forEach(audio => {
                if (audio !== state.currentAudio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
            // Stop all video elements with audio
            document.querySelectorAll('video').forEach(video => {
                if (video.audioTracks?.length > 0) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }
        /**
         * Handle playback errors
         */
        handlePlaybackError(song) {
            const state = this.getState();
            if (state.errorRecoveryTimeout) {
                clearTimeout(state.errorRecoveryTimeout);
            }
            if (state.autoSkip && state.currentPlaylistSongs.length > 0) {
                const timeout = window.setTimeout(() => {
                    console.log(`Auto-advancing playlist due to playback error: ${song.title}`);
                    this.next();
                    this.setState({ errorRecoveryTimeout: null });
                }, 3000);
                this.setState({ errorRecoveryTimeout: timeout });
            }
        }
        /**
         * Update repeat mode display
         */
        updateRepeatMode() {
            // This would update UI elements
            console.log('Repeat mode updated:', this.settingsManager.getRepeatMode());
        }
    }
    exports.AudioManager = AudioManager;
});
define("managers/notification-manager", ["require", "exports", "core/event-emitter"], function (require, exports, event_emitter_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationManager = void 0;
    // Notification Manager for handling app notifications
    class NotificationManager extends event_emitter_2.EventEmitter {
        constructor() {
            super();
            this.notifications = new Map();
            this.container = null;
            this.autoRemoveTimeouts = new Map();
            this.createContainer();
        }
        /**
         * Get singleton instance
         */
        static getInstance() {
            if (!NotificationManager.instance) {
                NotificationManager.instance = new NotificationManager();
            }
            return NotificationManager.instance;
        }
        /**
         * Create notification container
         */
        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
            document.body.appendChild(this.container);
        }
        /**
         * Show a notification
         */
        show(type, title, message, duration = 5000) {
            const id = this.generateId();
            const notification = {
                id,
                type,
                title,
                message,
                duration,
                timestamp: Date.now()
            };
            this.notifications.set(id, notification);
            this.createNotificationElement(notification);
            // Auto-remove after duration
            if (duration > 0) {
                const timeout = window.setTimeout(() => {
                    this.remove(id);
                }, duration);
                this.autoRemoveTimeouts.set(id, timeout);
            }
            this.emit('notificationShown', notification);
            return id;
        }
        /**
         * Remove a notification
         */
        remove(id) {
            const notification = this.notifications.get(id);
            if (!notification)
                return;
            // Clear auto-remove timeout
            const timeout = this.autoRemoveTimeouts.get(id);
            if (timeout) {
                clearTimeout(timeout);
                this.autoRemoveTimeouts.delete(id);
            }
            // Remove from DOM
            const element = document.getElementById(`notification-${id}`);
            if (element) {
                element.classList.add('notification-fade-out');
                setTimeout(() => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                }, 300);
            }
            this.notifications.delete(id);
            this.emit('notificationRemoved', notification);
        }
        /**
         * Remove all notifications
         */
        clear() {
            // Clear all timeouts
            this.autoRemoveTimeouts.forEach(timeout => clearTimeout(timeout));
            this.autoRemoveTimeouts.clear();
            // Remove all elements
            if (this.container) {
                this.container.innerHTML = '';
            }
            this.notifications.clear();
            this.emit('notificationsCleared');
        }
        /**
         * Get all active notifications
         */
        getAll() {
            return Array.from(this.notifications.values());
        }
        /**
         * Get notification by ID
         */
        get(id) {
            return this.notifications.get(id);
        }
        /**
         * Show success notification
         */
        success(title, message, duration) {
            return this.show('success', title, message, duration);
        }
        /**
         * Show error notification
         */
        error(title, message, duration) {
            return this.show('error', title, message, duration);
        }
        /**
         * Show warning notification
         */
        warning(title, message, duration) {
            return this.show('warning', title, message, duration);
        }
        /**
         * Show info notification
         */
        info(title, message, duration) {
            return this.show('info', title, message, duration);
        }
        /**
         * Create notification element
         */
        createNotificationElement(notification) {
            if (!this.container)
                return;
            const element = document.createElement('div');
            element.id = `notification-${notification.id}`;
            element.className = `notification notification-${notification.type}`;
            element.style.cssText = `
            background: ${this.getBackgroundColor(notification.type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-bottom: 10px;
            max-width: 400px;
            pointer-events: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            border-left: 4px solid ${this.getBorderColor(notification.type)};
        `;
            element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                        ${this.escapeHtml(notification.title)}
                    </div>
                    <div style="font-size: 13px; opacity: 0.9;">
                        ${this.escapeHtml(notification.message)}
                    </div>
                </div>
                <button onclick="window.notificationManager.remove('${notification.id}')" 
                        style="background: none; border: none; color: white; cursor: pointer; 
                               font-size: 18px; margin-left: 10px; opacity: 0.7; padding: 0;">
                    ×
                </button>
            </div>
        `;
            this.container.appendChild(element);
            // Animate in
            setTimeout(() => {
                element.style.transform = 'translateX(0)';
            }, 10);
        }
        /**
         * Get background color for notification type
         */
        getBackgroundColor(type) {
            switch (type) {
                case 'success': return '#4caf50';
                case 'error': return '#f44336';
                case 'warning': return '#ff9800';
                case 'info': return '#2196f3';
                default: return '#333';
            }
        }
        /**
         * Get border color for notification type
         */
        getBorderColor(type) {
            switch (type) {
                case 'success': return '#45a049';
                case 'error': return '#da190b';
                case 'warning': return '#e68900';
                case 'info': return '#0b7dda';
                default: return '#666';
            }
        }
        /**
         * Generate unique ID
         */
        generateId() {
            return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        /**
         * Get notification count
         */
        getCount() {
            return this.notifications.size;
        }
        /**
         * Check if has notifications
         */
        hasNotifications() {
            return this.notifications.size > 0;
        }
    }
    exports.NotificationManager = NotificationManager;
    // Make it available globally for backward compatibility
    window.notificationManager = NotificationManager.getInstance();
});
define("settings", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SETTINGS_KEYS = exports.SIDEBAR_COLLAPSE_BREAKPOINT = exports.settings = void 0;
    exports.loadSetting = loadSetting;
    exports.saveSetting = saveSetting;
    exports.loadAllSettings = loadAllSettings;
    exports.applySettings = applySettings;
    exports.saveAllSettings = saveAllSettings;
    exports.setupSettingsAutoSave = setupSettingsAutoSave;
    // Constants
    const SIDEBAR_COLLAPSE_BREAKPOINT = 800;
    exports.SIDEBAR_COLLAPSE_BREAKPOINT = SIDEBAR_COLLAPSE_BREAKPOINT;
    // Settings keys
    const SETTINGS_KEYS = {
        PLAYLIST: 'playlist',
        SONG: 'song',
        REPEAT: 'repeat',
        TAB: 'tab',
        RIGHT_SIDEBAR_SPLITTER_POS: 'split'
    };
    exports.SETTINGS_KEYS = SETTINGS_KEYS;
    // Global settings object
    exports.settings = {
        repeat: 'none',
        playlist: null,
        song: null,
        tab: 'info',
        split: 300
    };
    /**
     * Load a setting from URL parameters or localStorage
     */
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
        }
        catch (error) {
            console.error(`Error loading setting ${key}:`, error);
        }
        return defaultValue;
    }
    /**
     * Save a setting to localStorage and update URL if needed
     */
    function saveSetting(key, value) {
        try {
            localStorage.setItem(`setting_${key}`, JSON.stringify(value));
            if (key === SETTINGS_KEYS.PLAYLIST || key === SETTINGS_KEYS.SONG) {
                const url = new URL(window.location.href);
                if (value === null || value === undefined || value === '') {
                    url.searchParams.delete(key);
                }
                else {
                    url.searchParams.set(key, value.toString());
                }
                window.history.replaceState({}, '', url);
            }
        }
        catch (error) {
            console.error(`🎵 Settings System: Error saving setting ${key}:`, error);
        }
    }
    /**
     * Parse setting value based on key type
     */
    function parseSettingValue(key, value) {
        switch (key) {
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
    /**
     * Load all settings from storage
     */
    function loadAllSettings() {
        const loadedSettings = {
            playlist: loadSetting(SETTINGS_KEYS.PLAYLIST, null),
            song: loadSetting(SETTINGS_KEYS.SONG, null),
            repeat: loadSetting(SETTINGS_KEYS.REPEAT, 'none'),
            tab: loadSetting(SETTINGS_KEYS.TAB, 'info'),
            split: loadSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, 300)
        };
        console.log('🎵 Settings System: Loaded settings:', loadedSettings);
        return loadedSettings;
    }
    /**
     * Apply settings to the global settings object
     */
    function applySettings(newSettings) {
        exports.settings = { ...exports.settings, ...newSettings };
        // Apply settings to UI components if they exist
        if (window.rightSidebarManager) {
            window.rightSidebarManager.switchTab(exports.settings.tab);
        }
        if (window.rightSidebarManager) {
            window.rightSidebarManager.sidebarWidth = exports.settings.split;
            window.rightSidebarManager.updateSidebarWidth();
        }
        updateRepeatShuffleDisplay();
    }
    /**
     * Save all current settings
     */
    function saveAllSettings() {
        // Update split setting from right sidebar manager if available
        if (window.rightSidebarManager) {
            exports.settings.split = window.rightSidebarManager.sidebarWidth;
        }
        saveSetting(SETTINGS_KEYS.PLAYLIST, exports.settings.playlist);
        saveSetting(SETTINGS_KEYS.SONG, exports.settings.song);
        saveSetting(SETTINGS_KEYS.REPEAT, exports.settings.repeat);
        saveSetting(SETTINGS_KEYS.TAB, exports.settings.tab);
        saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, exports.settings.split);
    }
    /**
     * Setup automatic saving of settings
     */
    function setupSettingsAutoSave() {
        setInterval(saveAllSettings, 30000); // Save every 30 seconds
        window.addEventListener('beforeunload', saveAllSettings);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveAllSettings();
            }
        });
    }
    /**
     * Update the repeat/shuffle display in the UI
     */
    function updateRepeatShuffleDisplay() {
        const repeatButton = document.getElementById('repeatButton');
        if (repeatButton) {
            const repeatModes = {
                'none': { icon: '🔁', title: 'No repeat' },
                'one': { icon: '🔂', title: 'Repeat one' },
                'all': { icon: '🔁', title: 'Repeat all' }
            };
            const mode = repeatModes[exports.settings.repeat];
            repeatButton.textContent = mode.icon;
            repeatButton.title = mode.title;
        }
    }
});
define("sidebar-manager", ["require", "exports", "settings"], function (require, exports, settings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SidebarManager = void 0;
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
            this.isMobile = window.innerWidth <= settings_1.SIDEBAR_COLLAPSE_BREAKPOINT;
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
                    if (sidebar && mobileMenuToggle &&
                        !sidebar.contains(event.target) &&
                        !mobileMenuToggle.contains(event.target)) {
                        this.closeMobileMenu();
                    }
                }
            });
            document.addEventListener('keydown', (event) => {
                if (this.isMobile)
                    return;
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
                    }
                    else {
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
            }
            else {
                this.restoreState();
            }
        }
        toggle() {
            if (this.isMobile) {
                this.toggleMobileMenu();
            }
            else {
                this.cycleState();
            }
        }
        toggleMobileMenu() {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
            this.updateLayout();
            this.saveState();
        }
        closeMobileMenu() {
            this.isMobileMenuOpen = false;
            this.updateLayout();
            this.saveState();
        }
        cycleState() {
            const states = ['expanded', 'icon', 'collapsed', 'full'];
            const currentIndex = states.indexOf(this.currentState);
            const nextIndex = (currentIndex + 1) % states.length;
            this.setState(states[nextIndex]);
        }
        setState(state) {
            this.currentState = state;
            this.updateLayout();
            this.saveState();
        }
        updateLayout() {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            const playerBar = document.querySelector('.player-bar');
            if (!sidebar || !mainContent || !playerBar)
                return;
            // Remove all state classes
            sidebar.className = 'sidebar';
            mainContent.className = 'main-content';
            playerBar.className = 'player-bar';
            // Add current state classes
            sidebar.classList.add(`sidebar-${this.currentState}`);
            mainContent.classList.add(`sidebar-${this.currentState}`);
            playerBar.classList.add(`sidebar-${this.currentState}`);
            // Handle mobile menu
            if (this.isMobile) {
                if (this.isMobileMenuOpen) {
                    sidebar.classList.add('mobile-open');
                    mainContent.classList.add('mobile-menu-open');
                }
                else {
                    sidebar.classList.remove('mobile-open');
                    mainContent.classList.remove('mobile-menu-open');
                }
            }
            // Update CSS breakpoints
            this.updateCSSBreakpoints();
        }
        updateCSSBreakpoints() {
            const root = document.documentElement;
            root.style.setProperty('--sidebar-collapse-breakpoint', `${settings_1.SIDEBAR_COLLAPSE_BREAKPOINT}px`);
        }
        saveState() {
            if (!this.isMobile) {
                localStorage.setItem('sidebarState', JSON.stringify({
                    state: this.currentState,
                    isMobile: this.isMobile
                }));
            }
        }
        restoreState() {
            if (this.isMobile) {
                this.currentState = 'collapsed';
                this.isMobileMenuOpen = false;
            }
            else {
                try {
                    const savedState = localStorage.getItem('sidebarState');
                    if (savedState) {
                        const state = JSON.parse(savedState);
                        if (!state.isMobile) {
                            this.currentState = state.state || 'expanded';
                        }
                    }
                }
                catch (error) {
                    console.error('Error restoring sidebar state:', error);
                    this.currentState = 'expanded';
                }
            }
        }
        getCurrentState() {
            return this.currentState;
        }
        isMobileView() {
            return this.isMobile;
        }
        getMobileMenuOpen() {
            return this.isMobileMenuOpen;
        }
    }
    exports.SidebarManager = SidebarManager;
});
define("right-sidebar-manager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RightSidebarManager = void 0;
    class RightSidebarManager {
        constructor() {
            this.isCollapsed = false;
            this.isMobileOpen = false;
            this.sidebarWidth = 300;
            this.isResizing = false;
            this.startX = 0;
            this.startWidth = 0;
            this.init();
        }
        init() {
            this.setupEventListeners();
            this.restoreState();
            this.updateSidebarWidth();
        }
        setupEventListeners() {
            const resizeHandle = document.getElementById('rightSidebarResizeHandle');
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
                resizeHandle.addEventListener('touchstart', (e) => this.startResize(e), { passive: true });
            }
            document.addEventListener('mousemove', (e) => this.handleResize(e));
            document.addEventListener('touchmove', (e) => this.handleResize(e), { passive: true });
            document.addEventListener('mouseup', () => this.stopResize());
            document.addEventListener('touchend', () => this.stopResize());
            // Mobile backdrop click handler
            document.addEventListener('click', (e) => {
                const backdrop = document.getElementById('rightSidebarBackdrop');
                if (backdrop && e.target === backdrop) {
                    this.closeMobile();
                }
            });
        }
        startResize(e) {
            this.isResizing = true;
            this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            this.startWidth = this.sidebarWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        handleResize(e) {
            if (!this.isResizing)
                return;
            const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const deltaX = this.startX - currentX;
            const newWidth = Math.max(200, Math.min(600, this.startWidth + deltaX));
            this.sidebarWidth = newWidth;
            this.updateSidebarWidth();
        }
        stopResize() {
            if (!this.isResizing)
                return;
            this.isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            this.saveState();
        }
        toggle() {
            if (this.isMobile()) {
                this.toggleMobile();
            }
            else {
                this.toggleDesktop();
            }
        }
        toggleDesktop() {
            this.isCollapsed = !this.isCollapsed;
            this.updateSidebarWidth();
            this.saveState();
        }
        toggleMobile() {
            this.isMobileOpen = !this.isMobileOpen;
            this.updateSidebarWidth();
            this.saveState();
        }
        open() {
            if (this.isMobile()) {
                this.openMobile();
            }
            else {
                this.openDesktop();
            }
        }
        close() {
            if (this.isMobile()) {
                this.closeMobile();
            }
            else {
                this.closeDesktop();
            }
        }
        openDesktop() {
            this.isCollapsed = false;
            this.updateSidebarWidth();
            this.saveState();
        }
        closeDesktop() {
            this.isCollapsed = true;
            this.updateSidebarWidth();
            this.saveState();
        }
        openMobile() {
            this.isMobileOpen = true;
            this.updateSidebarWidth();
            this.saveState();
        }
        closeMobile() {
            this.isMobileOpen = false;
            this.updateSidebarWidth();
            this.saveState();
        }
        switchTab(tab) {
            const mainPanel = document.getElementById('mainPanel');
            if (!mainPanel)
                return;
            // Remove active class from all panels
            const panels = mainPanel.querySelectorAll('.right-sidebar-panel');
            panels.forEach(panel => panel.classList.remove('active'));
            // Add active class to target panel
            const targetPanel = mainPanel.querySelector(`#${tab}Panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            // Update tab buttons if they exist
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => {
                button.classList.remove('active');
                if (button.getAttribute('data-tab') === tab) {
                    button.classList.add('active');
                }
            });
        }
        updateSidebarWidth() {
            const rightSidebar = document.getElementById('rightSidebar');
            const mainContent = document.getElementById('mainContent');
            const root = document.documentElement;
            if (!rightSidebar || !mainContent)
                return;
            if (this.isMobile()) {
                if (this.isMobileOpen) {
                    rightSidebar.classList.add('mobile-open');
                    mainContent.classList.add('right-sidebar-mobile-open');
                    this.createMobileBackdrop();
                }
                else {
                    rightSidebar.classList.remove('mobile-open');
                    mainContent.classList.remove('right-sidebar-mobile-open');
                    this.removeMobileBackdrop();
                }
            }
            else {
                if (this.isCollapsed) {
                    rightSidebar.classList.add('collapsed');
                    mainContent.classList.add('right-sidebar-collapsed');
                    root.style.setProperty('--right-sidebar-width', '0px');
                }
                else {
                    rightSidebar.classList.remove('collapsed');
                    mainContent.classList.remove('right-sidebar-collapsed');
                    root.style.setProperty('--right-sidebar-width', `${this.sidebarWidth}px`);
                }
            }
        }
        createMobileBackdrop() {
            if (document.getElementById('rightSidebarBackdrop'))
                return;
            const backdrop = document.createElement('div');
            backdrop.id = 'rightSidebarBackdrop';
            backdrop.className = 'right-sidebar-backdrop';
            backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 998;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
            document.body.appendChild(backdrop);
            setTimeout(() => backdrop.classList.add('active'), 10);
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
            if (!this.isMobile()) {
                localStorage.setItem('rightSidebarState', JSON.stringify({
                    isCollapsed: this.isCollapsed,
                    sidebarWidth: this.sidebarWidth
                }));
            }
        }
        restoreState() {
            if (this.isMobile()) {
                this.isCollapsed = true;
                this.isMobileOpen = false;
            }
            else {
                try {
                    const savedState = localStorage.getItem('rightSidebarState');
                    if (savedState) {
                        const state = JSON.parse(savedState);
                        this.isCollapsed = state.isCollapsed || false;
                        this.sidebarWidth = state.sidebarWidth || 300;
                    }
                    else {
                        this.isCollapsed = false;
                        this.sidebarWidth = 300;
                    }
                }
                catch (error) {
                    console.error('Error restoring right sidebar state:', error);
                    this.isCollapsed = false;
                    this.sidebarWidth = 300;
                }
            }
        }
        isMobile() {
            return window.innerWidth <= 800;
        }
        getSidebarWidth() {
            return this.sidebarWidth;
        }
        isCollapsedState() {
            return this.isCollapsed;
        }
        isMobileOpenState() {
            return this.isMobileOpen;
        }
    }
    exports.RightSidebarManager = RightSidebarManager;
});
define("services/api-service", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApiService = void 0;
    // API Service for communicating with the backend
    class ApiService {
        constructor() {
            this.baseUrl = '/api';
        }
        /**
         * Search for content
         */
        async search(query, category) {
            const url = new URL(`${this.baseUrl}/search`, window.location.origin);
            url.searchParams.set('query', query);
            if (category) {
                url.searchParams.set('category', category);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get playlist by ID
         */
        async getPlaylist(playlistId) {
            const url = `${this.baseUrl}/playlist/${playlistId}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load playlist: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library playlists
         */
        async getLibraryPlaylists() {
            const url = `${this.baseUrl}/library/playlists`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load library playlists: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library
         */
        async getLibrary() {
            const url = `${this.baseUrl}/library`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load library: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get song information
         */
        async getSongInfo(songId) {
            const url = `${this.baseUrl}/song/${songId}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load song info: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get album information
         */
        async getAlbumInfo(albumId) {
            const url = `${this.baseUrl}/album/${albumId}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load album info: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get artist information
         */
        async getArtistInfo(artistId) {
            const url = `${this.baseUrl}/artist/${artistId}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load artist info: ${response.statusText}`);
            }
            return await response.json();
        }
    }
    exports.ApiService = ApiService;
});
define("app", ["require", "exports", "managers/app-settings-manager", "managers/audio-manager", "managers/notification-manager", "sidebar-manager", "right-sidebar-manager", "services/api-service"], function (require, exports, app_settings_manager_2, audio_manager_1, notification_manager_1, sidebar_manager_1, right_sidebar_manager_1, api_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = void 0;
    // Main application class
    class App {
        constructor() {
            this.isInitialized = false;
            // Initialize managers
            this.settingsManager = app_settings_manager_2.AppSettingsManager.getInstance();
            this.audioManager = audio_manager_1.AudioManager.getInstance();
            this.notificationManager = notification_manager_1.NotificationManager.getInstance();
            this.sidebarManager = new sidebar_manager_1.SidebarManager();
            this.rightSidebarManager = new right_sidebar_manager_1.RightSidebarManager();
            this.apiService = new api_service_1.ApiService();
            // Make managers available globally for backward compatibility
            window.settingsManager = this.settingsManager;
            window.audioManager = this.audioManager;
            window.notificationManager = this.notificationManager;
            window.sidebarManager = this.sidebarManager;
            window.rightSidebarManager = this.rightSidebarManager;
        }
        /**
         * Initialize the application
         */
        async init() {
            if (this.isInitialized)
                return;
            console.log('🎵 Initializing YouTube Music API Proxy...');
            try {
                // Setup event listeners
                this.setupEventListeners();
                // Setup audio manager events
                this.setupAudioEvents();
                // Setup settings manager events
                this.setupSettingsEvents();
                // Load initial content from URL
                await this.loadFromURL();
                this.isInitialized = true;
                console.log('🎵 Application initialized successfully');
                this.notificationManager.success('App Ready', 'YouTube Music API Proxy is ready!', 3000);
            }
            catch (error) {
                console.error('Failed to initialize app:', error);
                this.notificationManager.error('Initialization Error', 'Failed to initialize the application');
            }
        }
        /**
         * Setup global event listeners
         */
        setupEventListeners() {
            // Event delegation for dynamic content
            document.addEventListener('click', (event) => this.handleGlobalClick(event));
            // Search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (event) => this.handleSearch(event));
            }
            // Navigation events
            this.setupNavigationEvents();
        }
        /**
         * Setup audio manager events
         */
        setupAudioEvents() {
            this.audioManager.on('play', ({ song }) => {
                this.updateNowPlaying(song);
                this.notificationManager.info('Now Playing', `${song.title} by ${song.artist}`, 2000);
            });
            this.audioManager.on('pause', ({ song }) => {
                this.updateNowPlaying(song, false);
            });
            this.audioManager.on('error', ({ error, song }) => {
                this.notificationManager.error('Playback Error', `Failed to play ${song.title}: ${error.message}`);
            });
            this.audioManager.on('timeUpdate', ({ currentTime, duration }) => {
                this.updateProgressBar(currentTime, duration);
            });
            this.audioManager.on('volumeChange', ({ volume }) => {
                this.updateVolumeDisplay(volume);
            });
        }
        /**
         * Setup settings manager events
         */
        setupSettingsEvents() {
            this.settingsManager.subscribe(({ changes }) => {
                if (changes.repeat !== undefined) {
                    this.updateRepeatButton(changes.repeat);
                }
                if (changes.tab !== undefined) {
                    this.rightSidebarManager.switchTab(changes.tab);
                }
            });
        }
        /**
         * Setup navigation events
         */
        setupNavigationEvents() {
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (event) => {
                    this.handleNavigationClick(event);
                });
            });
        }
        /**
         * Handle global click events
         */
        handleGlobalClick(event) {
            const target = event.target;
            // Don't handle clicks on player controls
            if (target.closest('.progress-bar') ||
                target.closest('.player-controls') ||
                target.closest('.volume-controls')) {
                return;
            }
            // Handle song clicks
            const songElement = target.closest('[data-song-id]');
            if (songElement) {
                this.handleSongClick(songElement);
                event.stopPropagation();
                return;
            }
            // Handle playlist clicks
            const playlistElement = target.closest('[data-playlist-id]');
            if (playlistElement) {
                this.handlePlaylistClick(playlistElement);
                event.stopPropagation();
                return;
            }
            // Handle album clicks
            const albumElement = target.closest('[data-album-id]');
            if (albumElement) {
                this.handleAlbumClick(albumElement);
                event.stopPropagation();
                return;
            }
            // Handle artist clicks
            const artistElement = target.closest('[data-artist-id]');
            if (artistElement) {
                this.handleArtistClick(artistElement);
                event.stopPropagation();
                return;
            }
        }
        /**
         * Handle song click
         */
        handleSongClick(element) {
            const songId = element.getAttribute('data-song-id') || '';
            const songName = element.getAttribute('data-song-name') || '';
            const songArtist = element.getAttribute('data-song-artist') || '';
            const songThumbnail = element.getAttribute('data-song-thumbnail') || '';
            const playlistId = element.getAttribute('data-playlist-id');
            const songIndex = element.getAttribute('data-song-index') ?
                parseInt(element.getAttribute('data-song-index') || '0') : -1;
            this.playSong(songId, songName, songArtist, songThumbnail, playlistId, songIndex);
        }
        /**
         * Handle playlist click
         */
        handlePlaylistClick(element) {
            const playlistId = element.getAttribute('data-playlist-id') || '';
            const playlistTitle = element.getAttribute('data-playlist-title') || '';
            this.loadPlaylist(playlistId, playlistTitle);
        }
        /**
         * Handle album click
         */
        handleAlbumClick(element) {
            const albumId = element.getAttribute('data-album-id') || '';
            const albumTitle = element.getAttribute('data-album-title') || '';
            this.loadAlbum(albumId, albumTitle);
        }
        /**
         * Handle artist click
         */
        handleArtistClick(element) {
            const artistId = element.getAttribute('data-artist-id') || '';
            const artistName = element.getAttribute('data-artist-name') || '';
            this.loadArtist(artistId, artistName);
        }
        /**
         * Handle navigation click
         */
        handleNavigationClick(event) {
            const target = event.target;
            const navItem = target.closest('.nav-item');
            if (!navItem)
                return;
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            navItem.classList.add('active');
            // Handle different navigation types
            const navId = navItem.id;
            switch (navId) {
                case 'libraryNavItem':
                    this.loadLibrary();
                    break;
                case 'songsNavItem':
                    this.loadSongs();
                    break;
                case 'artistsNavItem':
                    this.loadArtists();
                    break;
                case 'albumsNavItem':
                    this.loadAlbums();
                    break;
            }
        }
        /**
         * Handle search
         */
        handleSearch(event) {
            const input = event.target;
            const query = input.value.trim();
            if (query.length > 2) {
                this.performSearch(query);
            }
            else if (query.length === 0) {
                this.clearSearch();
            }
        }
        /**
         * Load content from URL parameters
         */
        async loadFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const playlistId = urlParams.get('playlist');
            const songId = urlParams.get('song');
            if (playlistId) {
                try {
                    await this.loadPlaylist(playlistId, '');
                }
                catch (error) {
                    console.error('Error loading playlist from URL:', error);
                    this.notificationManager.error('Load Error', 'Failed to load playlist from URL');
                }
            }
            else if (songId) {
                try {
                    await this.loadSong(songId, '', '', '');
                }
                catch (error) {
                    console.error('Error loading song from URL:', error);
                    this.notificationManager.error('Load Error', 'Failed to load song from URL');
                }
            }
        }
        // Public methods for external use
        async playSong(songId, title, artist, thumbnail, playlistId, songIndex) {
            const song = { id: songId, title, artist, thumbnail };
            await this.audioManager.playSong(song, songIndex || -1);
            if (playlistId) {
                this.settingsManager.setCurrentPlaylist(playlistId);
            }
            this.settingsManager.setCurrentSong(songId);
        }
        async loadPlaylist(playlistId, playlistTitle) {
            console.log('Loading playlist:', { playlistId, playlistTitle });
            try {
                this.notificationManager.info('Loading Playlist', `Loading ${playlistTitle || playlistId}...`);
                const playlistData = await this.apiService.getPlaylist(playlistId);
                console.log('Playlist data:', playlistData);
                // Update the UI with playlist data
                this.displayPlaylist(playlistData);
                this.notificationManager.success('Playlist Loaded', `Loaded ${playlistData.title || playlistId}`);
            }
            catch (error) {
                console.error('Error loading playlist:', error);
                this.notificationManager.error('Load Error', `Failed to load playlist: ${error.message}`);
            }
        }
        async loadAlbum(albumId, albumTitle) {
            console.log('Loading album:', { albumId, albumTitle });
            // TODO: Implement album loading logic
            this.notificationManager.info('Loading Album', `Loading ${albumTitle || albumId}...`);
        }
        async loadArtist(artistId, artistName) {
            console.log('Loading artist:', { artistId, artistName });
            // TODO: Implement artist loading logic
            this.notificationManager.info('Loading Artist', `Loading ${artistName || artistId}...`);
        }
        async loadSong(songId, title, artist, thumbnail) {
            console.log('Loading song:', { songId, title, artist, thumbnail });
            // TODO: Implement song loading logic
            this.notificationManager.info('Loading Song', `Loading ${title || songId}...`);
        }
        async performSearch(query) {
            console.log('Performing search:', query);
            try {
                this.notificationManager.info('Searching', `Searching for "${query}"...`);
                const searchResults = await this.apiService.search(query);
                console.log('Search results:', searchResults);
                // Update the UI with search results
                this.displaySearchResults(searchResults);
                this.notificationManager.success('Search Complete', `Found ${searchResults.songs?.length || 0} results`);
            }
            catch (error) {
                console.error('Error performing search:', error);
                this.notificationManager.error('Search Error', `Failed to search: ${error.message}`);
            }
        }
        clearSearch() {
            console.log('Clearing search');
            // TODO: Implement clear search logic
        }
        loadLibrary() {
            console.log('Loading library');
            // TODO: Implement library loading
        }
        loadSongs() {
            console.log('Loading songs');
            // TODO: Implement songs loading
        }
        loadArtists() {
            console.log('Loading artists');
            // TODO: Implement artists loading
        }
        loadAlbums() {
            console.log('Loading albums');
            // TODO: Implement albums loading
        }
        // UI update methods
        updateNowPlaying(song, isPlaying = true) {
            const titleElement = document.getElementById('nowPlayingTitle');
            const artistElement = document.getElementById('nowPlayingArtist');
            const thumbnailElement = document.getElementById('nowPlayingThumbnail');
            const playButton = document.getElementById('playButton');
            if (titleElement)
                titleElement.textContent = song.title;
            if (artistElement)
                artistElement.textContent = song.artist;
            if (playButton)
                playButton.textContent = isPlaying ? '⏸' : '▶';
            if (thumbnailElement && song.thumbnail) {
                thumbnailElement.style.backgroundImage = `url(${song.thumbnail})`;
            }
            document.title = isPlaying ? `${song.title} - ${song.artist}` : 'YouTube Music';
        }
        updateProgressBar(currentTime, duration) {
            const progressFill = document.getElementById('progressFill');
            if (progressFill && duration > 0) {
                const percentage = (currentTime / duration) * 100;
                progressFill.style.width = `${percentage}%`;
            }
        }
        updateVolumeDisplay(volume) {
            const volumeFill = document.getElementById('volumeFill');
            if (volumeFill) {
                volumeFill.style.width = `${volume * 100}%`;
            }
        }
        updateRepeatButton(repeatMode) {
            const repeatButton = document.getElementById('repeatButton');
            if (repeatButton) {
                const repeatModes = {
                    'none': { icon: '🔁', title: 'No repeat' },
                    'one': { icon: '🔂', title: 'Repeat one' },
                    'all': { icon: '🔁', title: 'Repeat all' }
                };
                const mode = repeatModes[repeatMode];
                repeatButton.textContent = mode.icon;
                repeatButton.title = mode.title;
            }
        }
        /**
         * Display playlist data in the UI
         */
        displayPlaylist(playlistData) {
            console.log('Displaying playlist:', playlistData);
            // Update page title
            document.title = `${playlistData.title} - YouTube Music`;
            // Show playlist content
            const searchResults = document.getElementById('searchResults');
            const welcomeSection = document.querySelector('.welcome-section');
            if (welcomeSection) {
                welcomeSection.style.display = 'none';
            }
            if (searchResults) {
                searchResults.style.display = 'block';
                let html = `
                <div class="playlist-header">
                    <h1>${playlistData.title || 'Playlist'}</h1>
                    <p>${playlistData.songs?.length || 0} songs</p>
                </div>
                <div class="songs-list">
            `;
                if (playlistData.songs && playlistData.songs.length > 0) {
                    playlistData.songs.forEach((song, index) => {
                        html += `
                        <div class="song-item" data-song-id="${song.id}" data-song-name="${song.title}" data-song-artist="${song.artist}" data-song-thumbnail="${song.thumbnail || ''}" data-playlist-id="${playlistData.id}" data-song-index="${index}">
                            <div class="song-thumbnail">
                                <img src="${song.thumbnail || '/logo.png'}" alt="${song.title}">
                            </div>
                            <div class="song-info">
                                <div class="song-title">${song.title}</div>
                                <div class="song-artist">${song.artist}</div>
                            </div>
                            <div class="song-duration">${song.duration || ''}</div>
                        </div>
                    `;
                    });
                }
                else {
                    html += '<div class="no-songs">No songs found in this playlist</div>';
                }
                html += '</div>';
                searchResults.innerHTML = html;
            }
        }
        /**
         * Display search results in the UI
         */
        displaySearchResults(searchResults) {
            console.log('Displaying search results:', searchResults);
            const searchResultsElement = document.getElementById('searchResults');
            const welcomeSection = document.querySelector('.welcome-section');
            if (welcomeSection) {
                welcomeSection.style.display = 'none';
            }
            if (searchResultsElement) {
                searchResultsElement.style.display = 'block';
                let html = '<div class="search-results-header"><h2>Search Results</h2></div>';
                if (searchResults.songs && searchResults.songs.length > 0) {
                    html += '<div class="songs-list">';
                    searchResults.songs.forEach((song) => {
                        html += `
                        <div class="song-item" data-song-id="${song.id}" data-song-name="${song.title}" data-song-artist="${song.artist}" data-song-thumbnail="${song.thumbnail || ''}">
                            <div class="song-thumbnail">
                                <img src="${song.thumbnail || '/logo.png'}" alt="${song.title}">
                            </div>
                            <div class="song-info">
                                <div class="song-title">${song.title}</div>
                                <div class="song-artist">${song.artist}</div>
                            </div>
                            <div class="song-duration">${song.duration || ''}</div>
                        </div>
                    `;
                    });
                    html += '</div>';
                }
                else {
                    html += '<div class="no-results">No results found</div>';
                }
                searchResultsElement.innerHTML = html;
            }
        }
    }
    exports.App = App;
    // Global functions for HTML onclick handlers
    window.toggleSidebar = function () {
        window.sidebarManager.toggle();
    };
    window.toggleRightSidebar = function () {
        window.rightSidebarManager.toggle();
    };
    window.togglePlay = function () {
        window.audioManager.togglePlay();
    };
    window.playNextSong = function () {
        window.audioManager.next();
    };
    window.playPreviousSong = function () {
        window.audioManager.previous();
    };
    window.toggleRepeatMode = function () {
        const newMode = window.settingsManager.cycleRepeatMode();
        window.notificationManager.success('Repeat Mode', `Repeat mode: ${newMode}`);
    };
    // Initialize app when DOM is ready
    document.addEventListener('DOMContentLoaded', async () => {
        const app = new App();
        window.app = app;
        await app.init();
    });
});
define("main", ["require", "exports", "app"], function (require, exports, app_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.App = void 0;
    Object.defineProperty(exports, "App", { enumerable: true, get: function () { return app_1.App; } });
    // Initialize the app immediately (RequireJS ensures DOM is ready)
    const app = new app_1.App();
    window.app = app;
    app.init();
    // Make App available globally
    window.App = app_1.App;
});
define("audio", ["require", "exports", "settings"], function (require, exports, settings_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.autoSkip = exports.errorRecoveryTimeout = exports.currentSongInfo = exports.isPlaying = exports.currentAudio = void 0;
    exports.setupMediaKeyListeners = setupMediaKeyListeners;
    exports.stopAllAudio = stopAllAudio;
    exports.handlePlaybackError = handlePlaybackError;
    exports.togglePlay = togglePlay;
    exports.playNextSong = playNextSong;
    exports.playPreviousSong = playPreviousSong;
    exports.toggleRepeatMode = toggleRepeatMode;
    // Audio state
    exports.currentAudio = null;
    exports.isPlaying = false;
    exports.currentSongInfo = null;
    exports.errorRecoveryTimeout = null;
    exports.autoSkip = false;
    const DEFAULT_TITLE = 'YouTube Music';
    /**
     * Setup media key listeners for system media controls
     */
    function setupMediaKeyListeners() {
        if (!navigator.mediaSession)
            return;
        navigator.mediaSession.setActionHandler('play', () => {
            if (exports.currentAudio && !exports.isPlaying) {
                togglePlay();
            }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            if (exports.currentAudio && exports.isPlaying) {
                togglePlay();
            }
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (settings_2.settings.playlist && window.currentPlaylistSongs?.length > 0) {
                playPreviousSong();
            }
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            if (settings_2.settings.playlist && window.currentPlaylistSongs?.length > 0) {
                playNextSong();
            }
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (exports.currentAudio && details.seekTime !== undefined) {
                exports.currentAudio.currentTime = details.seekTime;
            }
        });
        navigator.mediaSession.setActionHandler('stop', () => {
            if (exports.currentAudio) {
                exports.currentAudio.pause();
                exports.currentAudio.currentTime = 0;
                exports.isPlaying = false;
                const playButton = document.getElementById('playButton');
                if (playButton) {
                    playButton.textContent = '▶';
                }
                document.title = DEFAULT_TITLE;
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'none';
                }
            }
        });
        // Keyboard media key listeners
        document.addEventListener('keydown', (event) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }
            switch (event.code) {
                case 'MediaPlayPause':
                    event.preventDefault();
                    if (exports.currentAudio) {
                        togglePlay();
                    }
                    break;
                case 'MediaTrackNext':
                    event.preventDefault();
                    if (settings_2.settings.playlist && window.currentPlaylistSongs?.length > 0) {
                        playNextSong();
                    }
                    break;
                case 'MediaTrackPrevious':
                    event.preventDefault();
                    if (settings_2.settings.playlist && window.currentPlaylistSongs?.length > 0) {
                        playPreviousSong();
                    }
                    break;
            }
        });
    }
    /**
     * Stop all audio playback
     */
    function stopAllAudio() {
        if (exports.currentAudio) {
            exports.currentAudio.pause();
            exports.currentAudio.currentTime = 0;
            exports.currentAudio = null;
        }
        // Stop all audio elements
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            if (audio !== exports.currentAudio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        // Stop all video elements with audio tracks
        const allVideoElements = document.querySelectorAll('video');
        allVideoElements.forEach(video => {
            if (video.audioTracks && video.audioTracks.length > 0) {
                video.pause();
                video.currentTime = 0;
            }
        });
        // Suspend audio context if available
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'running') {
                    audioContext.suspend();
                }
            }
            catch (e) {
                // Ignore errors
            }
        }
        // Stop all media elements
        const mediaElements = document.querySelectorAll('audio, video');
        mediaElements.forEach(media => {
            const mediaElement = media;
            if (!mediaElement.paused) {
                mediaElement.pause();
                mediaElement.currentTime = 0;
            }
        });
        exports.currentSongInfo = null;
        clearInfoPanel();
        console.log('Stopped all audio playback');
    }
    /**
     * Handle playback errors
     */
    function handlePlaybackError(title, artist) {
        if (exports.errorRecoveryTimeout) {
            clearTimeout(exports.errorRecoveryTimeout);
            exports.errorRecoveryTimeout = null;
        }
        if (exports.autoSkip && settings_2.settings.playlist && window.currentPlaylistSongs?.length > 0) {
            exports.errorRecoveryTimeout = window.setTimeout(() => {
                console.log(`Auto-advancing playlist due to playback error: ${title}`);
                playNextSong();
                exports.errorRecoveryTimeout = null;
            }, 3000);
        }
    }
    /**
     * Toggle play/pause state
     */
    function togglePlay() {
        if (!exports.currentAudio)
            return;
        if (exports.isPlaying) {
            exports.currentAudio.pause();
            exports.isPlaying = false;
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.textContent = '▶';
            }
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
        else {
            exports.currentAudio.play().then(() => {
                exports.isPlaying = true;
                const playButton = document.getElementById('playButton');
                if (playButton) {
                    playButton.textContent = '⏸';
                }
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            }).catch(error => {
                console.error('Error playing audio:', error);
                showErrorNotification('Failed to play audio');
            });
        }
    }
    /**
     * Play next song in playlist
     */
    function playNextSong() {
        if (!settings_2.settings.playlist || !window.currentPlaylistSongs)
            return;
        const nextIndex = getNextSongIndex();
        if (nextIndex >= 0 && nextIndex < window.currentPlaylistSongs.length) {
            const song = window.currentPlaylistSongs[nextIndex];
            playSong(song.id, song.title, song.artist, song.thumbnail, settings_2.settings.playlist, nextIndex);
        }
    }
    /**
     * Play previous song in playlist
     */
    function playPreviousSong() {
        if (!settings_2.settings.playlist || !window.currentPlaylistSongs)
            return;
        const prevIndex = getPreviousSongIndex();
        if (prevIndex >= 0 && prevIndex < window.currentPlaylistSongs.length) {
            const song = window.currentPlaylistSongs[prevIndex];
            playSong(song.id, song.title, song.artist, song.thumbnail, settings_2.settings.playlist, prevIndex);
        }
    }
    /**
     * Get next song index based on repeat mode
     */
    function getNextSongIndex() {
        if (!window.currentPlaylistSongs || window.currentSongIndex === -1)
            return -1;
        const currentIndex = window.currentSongIndex;
        const totalSongs = window.currentPlaylistSongs.length;
        if (settings_2.settings.repeat === 'one') {
            return currentIndex; // Repeat current song
        }
        else if (settings_2.settings.repeat === 'all') {
            return (currentIndex + 1) % totalSongs; // Loop playlist
        }
        else {
            return currentIndex + 1 < totalSongs ? currentIndex + 1 : -1; // Stop at end
        }
    }
    /**
     * Get previous song index
     */
    function getPreviousSongIndex() {
        if (!window.currentPlaylistSongs || window.currentSongIndex === -1)
            return -1;
        const currentIndex = window.currentSongIndex;
        const totalSongs = window.currentPlaylistSongs.length;
        if (settings_2.settings.repeat === 'one') {
            return currentIndex; // Repeat current song
        }
        else if (settings_2.settings.repeat === 'all') {
            return currentIndex - 1 >= 0 ? currentIndex - 1 : totalSongs - 1; // Loop playlist
        }
        else {
            return currentIndex - 1 >= 0 ? currentIndex - 1 : -1; // Stop at beginning
        }
    }
    /**
     * Toggle repeat mode
     */
    function toggleRepeatMode() {
        const repeatModes = ['none', 'one', 'all'];
        const currentIndex = repeatModes.indexOf(settings_2.settings.repeat);
        const nextIndex = (currentIndex + 1) % repeatModes.length;
        settings_2.settings.repeat = repeatModes[nextIndex];
        updateRepeatShuffleDisplay();
        showSuccessNotification(`Repeat mode: ${settings_2.settings.repeat}`);
    }
    /**
     * Update repeat/shuffle display
     */
    function updateRepeatShuffleDisplay() {
        const repeatButton = document.getElementById('repeatButton');
        if (repeatButton) {
            const repeatModes = {
                'none': { icon: '🔁', title: 'No repeat' },
                'one': { icon: '🔂', title: 'Repeat one' },
                'all': { icon: '🔁', title: 'Repeat all' }
            };
            const mode = repeatModes[settings_2.settings.repeat];
            repeatButton.textContent = mode.icon;
            repeatButton.title = mode.title;
        }
    }
    // Helper functions (these would be imported from other modules)
    function playSong(songId, title, artist, thumbnail, playlistId, songIndex) {
        // This would be implemented in the main app module
        console.log('Playing song:', { songId, title, artist, thumbnail, playlistId, songIndex });
    }
    function clearInfoPanel() {
        // This would be implemented in the UI module
        console.log('Clearing info panel');
    }
    function showErrorNotification(message) {
        // This would be implemented in the notification module
        console.error('Error notification:', message);
    }
    function showSuccessNotification(message) {
        // This would be implemented in the notification module
        console.log('Success notification:', message);
    }
});
define("core/ui-component", ["require", "exports", "core/event-emitter"], function (require, exports, event_emitter_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UIComponent = void 0;
    // Base UI Component class with lifecycle management
    class UIComponent extends event_emitter_3.EventEmitter {
        constructor(selector) {
            super();
            this.selector = selector;
            this.element = null;
            this.isInitialized = false;
        }
        /**
         * Initialize the component
         */
        init() {
            if (this.isInitialized)
                return;
            if (this.selector) {
                this.element = document.querySelector(this.selector);
            }
            this.onInit();
            this.setupEventListeners();
            this.isInitialized = true;
            this.emit('initialized');
        }
        /**
         * Destroy the component
         */
        destroy() {
            if (!this.isInitialized)
                return;
            this.removeAllListeners();
            this.onDestroy();
            this.isInitialized = false;
            this.emit('destroyed');
        }
        /**
         * Get the component element
         */
        getElement() {
            return this.element;
        }
        /**
         * Check if component is initialized
         */
        isReady() {
            return this.isInitialized && this.element !== null;
        }
        /**
         * Show the component
         */
        show() {
            if (this.element) {
                this.element.style.display = '';
                this.emit('shown');
            }
        }
        /**
         * Hide the component
         */
        hide() {
            if (this.element) {
                this.element.style.display = 'none';
                this.emit('hidden');
            }
        }
        /**
         * Add CSS class to component
         */
        addClass(className) {
            if (this.element) {
                this.element.classList.add(className);
            }
        }
        /**
         * Remove CSS class from component
         */
        removeClass(className) {
            if (this.element) {
                this.element.classList.remove(className);
            }
        }
        /**
         * Toggle CSS class on component
         */
        toggleClass(className) {
            if (this.element) {
                this.element.classList.toggle(className);
            }
        }
        /**
         * Check if component has CSS class
         */
        hasClass(className) {
            return this.element?.classList.contains(className) || false;
        }
        /**
         * Set component content
         */
        setContent(content) {
            if (this.element) {
                this.element.innerHTML = content;
            }
        }
        /**
         * Get component content
         */
        getContent() {
            return this.element?.innerHTML || '';
        }
    }
    exports.UIComponent = UIComponent;
});
//# sourceMappingURL=app.js.map