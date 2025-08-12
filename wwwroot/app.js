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
// TypeScript interfaces matching C# models from Controllers/ApiController.cs and .references/YouTubeMusicAPI
define("services/api-types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchCategory = void 0;
    // Search interfaces
    var SearchCategory;
    (function (SearchCategory) {
        SearchCategory["Songs"] = "Songs";
        SearchCategory["Videos"] = "Videos";
        SearchCategory["Albums"] = "Albums";
        SearchCategory["CommunityPlaylists"] = "CommunityPlaylists";
        SearchCategory["Artists"] = "Artists";
        SearchCategory["Podcasts"] = "Podcasts";
        SearchCategory["Episodes"] = "Episodes";
        SearchCategory["Profiles"] = "Profiles";
    })(SearchCategory || (exports.SearchCategory = SearchCategory = {}));
});
define("types", ["require", "exports", "services/api-types"], function (require, exports, api_types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchCategory = void 0;
    Object.defineProperty(exports, "SearchCategory", { enumerable: true, get: function () { return api_types_1.SearchCategory; } });
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
        }
        /**
         * Play a song
         */
        async playSong(song, songIndex = -1) {
            try {
                // Stop any currently playing audio
                this.stopAllAudio();
                // Create audio element
                const audio = new Audio();
                // Set up audio event listeners
                this.setupAudioEventListeners(audio);
                // Set the audio source
                const audioUrl = `/api/stream/${song.id}`;
                audio.src = audioUrl;
                // Update state
                this.setState({
                    currentAudio: audio,
                    currentSong: song,
                    currentSongIndex: songIndex,
                    isPlaying: false
                });
                // Update media session metadata
                this.updateMediaSessionMetadata(song);
                // Start playing
                await audio.play();
                this.setState({ isPlaying: true });
                this.emit('play', { song });
                console.log(`Now playing: ${song.name} by ${song.artists?.[0]?.name || 'Unknown Artist'}`);
            }
            catch (error) {
                console.error('Error playing song:', error);
                this.emit('error', { error: error, song });
            }
        }
        /**
         * Setup audio event listeners
         */
        setupAudioEventListeners(audio) {
            audio.addEventListener('loadstart', () => {
                console.log('Audio loading started');
            });
            audio.addEventListener('canplay', () => {
                console.log('Audio can start playing');
            });
            audio.addEventListener('play', () => {
                this.setState({ isPlaying: true });
                if (this.state.currentSong) {
                    this.emit('play', { song: this.state.currentSong });
                }
            });
            audio.addEventListener('pause', () => {
                this.setState({ isPlaying: false });
                if (this.state.currentSong) {
                    this.emit('pause', { song: this.state.currentSong });
                }
            });
            audio.addEventListener('ended', () => {
                console.log('Audio playback ended');
                this.setState({ isPlaying: false });
                if (this.state.currentSong) {
                    this.emit('songEnd', { song: this.state.currentSong });
                }
                // Auto-play next song if in playlist mode
                const settings = this.settingsManager.getState();
                if (settings.repeat === 'all' && this.state.currentPlaylistSongs.length > 0) {
                    this.next();
                }
            });
            audio.addEventListener('error', (event) => {
                console.error('Audio error:', event);
                const error = event;
                if (this.state.currentSong) {
                    this.emit('error', { error: new Error(error.message), song: this.state.currentSong });
                }
            });
            audio.addEventListener('timeupdate', () => {
                if (audio) {
                    this.setState({
                        currentTime: audio.currentTime,
                        duration: audio.duration
                    });
                    this.emit('timeUpdate', { currentTime: audio.currentTime, duration: audio.duration });
                }
            });
            audio.addEventListener('volumechange', () => {
                if (audio) {
                    this.setState({ volume: audio.volume });
                    this.emit('volumeChange', { volume: audio.volume });
                }
            });
        }
        /**
         * Update media session metadata
         */
        updateMediaSessionMetadata(song) {
            if (!this.mediaSession)
                return;
            this.mediaSession.metadata = new MediaMetadata({
                title: song.name,
                artist: song.artists?.[0]?.name || 'Unknown Artist',
                album: song.album?.name || '',
                artwork: song.thumbnails?.map(thumb => ({
                    src: thumb.url,
                    sizes: `${thumb.width}x${thumb.height}`,
                    type: 'image/jpeg'
                })) || []
            });
        }
        /**
         * Toggle play/pause
         */
        togglePlay() {
            if (this.state.isPlaying) {
                this.pause();
            }
            else {
                this.play();
            }
        }
        /**
         * Play current audio
         */
        play() {
            if (this.state.currentAudio && this.state.currentAudio instanceof HTMLAudioElement && !this.state.isPlaying) {
                this.state.currentAudio.play().then(() => {
                    this.setState({ isPlaying: true });
                    if (this.mediaSession) {
                        this.mediaSession.playbackState = 'playing';
                    }
                }).catch(error => {
                    console.error('Error playing audio:', error);
                    if (this.state.currentSong) {
                        this.emit('error', { error, song: this.state.currentSong });
                    }
                });
            }
        }
        /**
         * Pause current audio
         */
        pause() {
            if (this.state.currentAudio && this.state.currentAudio instanceof HTMLAudioElement && this.state.isPlaying) {
                this.state.currentAudio.pause();
                this.setState({ isPlaying: false });
                if (this.mediaSession) {
                    this.mediaSession.playbackState = 'paused';
                }
            }
        }
        /**
         * Stop all audio
         */
        stop() {
            this.stopAllAudio();
            if (this.mediaSession) {
                this.mediaSession.playbackState = 'none';
            }
            this.emit('stop');
        }
        /**
         * Stop all audio playback
         */
        stopAllAudio() {
            if (this.state.currentAudio && this.state.currentAudio instanceof HTMLAudioElement) {
                this.state.currentAudio.pause();
                this.state.currentAudio.currentTime = 0;
            }
            // Stop all audio elements
            const allAudioElements = document.querySelectorAll('audio');
            allAudioElements.forEach(audio => {
                if (audio !== this.state.currentAudio) {
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
            this.setState({
                currentAudio: null,
                currentSong: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0
            });
            console.log('Stopped all audio playback');
        }
        /**
         * Play next song in playlist
         */
        next() {
            const { currentPlaylistSongs, currentSongIndex } = this.state;
            if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
                console.log('No playlist songs available');
                return;
            }
            let nextIndex = currentSongIndex + 1;
            const settings = this.settingsManager.getState();
            // Handle repeat modes
            if (nextIndex >= currentPlaylistSongs.length) {
                if (settings.repeat === 'all') {
                    nextIndex = 0; // Loop back to beginning
                }
                else {
                    console.log('Reached end of playlist');
                    return;
                }
            }
            const nextSong = currentPlaylistSongs[nextIndex];
            if (nextSong) {
                this.playSong(nextSong, nextIndex);
            }
        }
        /**
         * Play previous song in playlist
         */
        previous() {
            const { currentPlaylistSongs, currentSongIndex } = this.state;
            if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
                console.log('No playlist songs available');
                return;
            }
            let prevIndex = currentSongIndex - 1;
            const settings = this.settingsManager.getState();
            // Handle repeat modes
            if (prevIndex < 0) {
                if (settings.repeat === 'all') {
                    prevIndex = currentPlaylistSongs.length - 1; // Loop to end
                }
                else {
                    console.log('Reached beginning of playlist');
                    return;
                }
            }
            const prevSong = currentPlaylistSongs[prevIndex];
            if (prevSong) {
                this.playSong(prevSong, prevIndex);
            }
        }
        /**
         * Set volume
         */
        setVolume(volume) {
            if (this.state.currentAudio && this.state.currentAudio instanceof HTMLAudioElement) {
                this.state.currentAudio.volume = Math.max(0, Math.min(1, volume));
            }
        }
        /**
         * Seek to position
         */
        seek(position) {
            if (this.state.currentAudio && this.state.currentAudio instanceof HTMLAudioElement && !isNaN(position)) {
                this.state.currentAudio.currentTime = Math.max(0, Math.min(this.state.currentAudio.duration, position));
            }
        }
        /**
         * Set playlist songs
         */
        setPlaylistSongs(songs) {
            this.setState({ currentPlaylistSongs: songs });
            this.emit('playlistChange', { songs });
        }
        /**
         * Get current audio state
         */
        getCurrentState() {
            return this.state;
        }
        /**
         * Get current song
         */
        getCurrentSong() {
            return this.state.currentSong;
        }
        /**
         * Get current playlist songs
         */
        getCurrentPlaylistSongs() {
            return this.state.currentPlaylistSongs;
        }
        /**
         * Get current song index
         */
        getCurrentSongIndex() {
            return this.state.currentSongIndex;
        }
        /**
         * Check if currently playing
         */
        isCurrentlyPlaying() {
            return this.state.isPlaying;
        }
        /**
         * Get current time
         */
        getCurrentTime() {
            return this.state.currentTime;
        }
        /**
         * Get duration
         */
        getDuration() {
            return this.state.duration;
        }
        /**
         * Get volume
         */
        getVolume() {
            return this.state.volume;
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
                // Clear container by removing all child nodes
                while (this.container.firstChild) {
                    this.container.removeChild(this.container.firstChild);
                }
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
            // Create the notification content structure
            const contentWrapper = document.createElement('div');
            contentWrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start;';
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = 'flex: 1;';
            const titleDiv = document.createElement('div');
            titleDiv.style.cssText = 'font-weight: bold; margin-bottom: 5px; font-size: 14px;';
            titleDiv.textContent = this.escapeHtml(notification.title);
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'font-size: 13px; opacity: 0.9;';
            messageDiv.textContent = this.escapeHtml(notification.message);
            contentDiv.appendChild(titleDiv);
            contentDiv.appendChild(messageDiv);
            const closeButton = document.createElement('button');
            closeButton.style.cssText = 'background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 10px; opacity: 0.7; padding: 0;';
            closeButton.textContent = '×';
            closeButton.onclick = () => window.notificationManager.remove(notification.id);
            contentWrapper.appendChild(contentDiv);
            contentWrapper.appendChild(closeButton);
            element.appendChild(contentWrapper);
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
            return div.textContent || '';
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
         * Get health and version information
         */
        async getHealth() {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Search for content
         */
        async search(query, category, location) {
            const url = new URL(`${this.baseUrl}/search`, window.location.origin);
            url.searchParams.set('query', query);
            if (category) {
                url.searchParams.set('category', category);
            }
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get detailed information about a song or video including streaming URLs
         */
        async getSongVideoInfo(id, location) {
            const url = new URL(`${this.baseUrl}/song/${id}`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load song/video info: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get streaming data for a song or video
         */
        async getStreamingData(id, location) {
            const url = new URL(`${this.baseUrl}/streaming/${id}`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load streaming data: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Stream audio directly from YouTube Music
         */
        async streamAudio(id, location, quality) {
            const url = new URL(`${this.baseUrl}/stream/${id}`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            if (quality) {
                url.searchParams.set('quality', quality);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to stream audio: ${response.statusText}`);
            }
            return response;
        }
        /**
         * Get album information
         */
        async getAlbumInfo(browseId, location) {
            const url = new URL(`${this.baseUrl}/album/${browseId}`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load album info: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get artist information
         */
        async getArtistInfo(browseId, location) {
            const url = new URL(`${this.baseUrl}/artist/${browseId}`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load artist info: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library (requires authentication)
         */
        async getLibrary(location) {
            const url = new URL(`${this.baseUrl}/library`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library songs (requires authentication)
         */
        async getLibrarySongs(location) {
            const url = new URL(`${this.baseUrl}/library/songs`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library songs: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library albums (requires authentication)
         */
        async getLibraryAlbums(location) {
            const url = new URL(`${this.baseUrl}/library/albums`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library albums: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library artists (requires authentication)
         */
        async getLibraryArtists(location) {
            const url = new URL(`${this.baseUrl}/library/artists`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library artists: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library subscriptions (requires authentication)
         */
        async getLibrarySubscriptions(location) {
            const url = new URL(`${this.baseUrl}/library/subscriptions`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library subscriptions: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library podcasts (requires authentication)
         */
        async getLibraryPodcasts(location) {
            const url = new URL(`${this.baseUrl}/library/podcasts`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library podcasts: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get user's library playlists (requires authentication)
         */
        async getLibraryPlaylists(location) {
            const url = new URL(`${this.baseUrl}/library/playlists`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load library playlists: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get playlist information by ID (no authentication required)
         */
        async getPlaylist(id, location) {
            const url = new URL(`${this.baseUrl}/playlist/${id}`, window.location.origin);
            if (location) {
                url.searchParams.set('location', location);
            }
            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Failed to load playlist: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Clear the session cache
         */
        async clearSessionCache() {
            const response = await fetch(`${this.baseUrl}/cache/clear`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to clear cache: ${response.statusText}`);
            }
            return await response.json();
        }
        /**
         * Get session cache statistics
         */
        async getSessionCacheStats() {
            const response = await fetch(`${this.baseUrl}/cache/stats`);
            if (!response.ok) {
                throw new Error(`Failed to get cache stats: ${response.statusText}`);
            }
            return await response.json();
        }
    }
    exports.ApiService = ApiService;
});
define("app", ["require", "exports", "managers/app-settings-manager", "managers/audio-manager", "managers/notification-manager", "sidebar-manager", "right-sidebar-manager", "services/api-service", "services/api-types"], function (require, exports, app_settings_manager_2, audio_manager_1, notification_manager_1, sidebar_manager_1, right_sidebar_manager_1, api_service_1, api_types_2) {
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
                this.notificationManager.info('Now Playing', `${song.name} by ${song.artists?.[0]?.name || 'Unknown Artist'}`, 2000);
            });
            this.audioManager.on('pause', ({ song }) => {
                this.updateNowPlaying(song, false);
            });
            this.audioManager.on('error', ({ error, song }) => {
                this.notificationManager.error('Playback Error', `Failed to play ${song.name}: ${error.message}`);
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
            const song = {
                id: songId,
                name: title,
                artists: [{ name: artist, id: '' }],
                album: { name: '', id: '' },
                duration: '00:00',
                isExplicit: false,
                playsInfo: '',
                thumbnails: thumbnail ? [{ url: thumbnail, width: 0, height: 0 }] : [],
                category: api_types_2.SearchCategory.Songs
            };
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
                this.notificationManager.success('Playlist Loaded', `Loaded ${playlistData.id || playlistId}`);
            }
            catch (error) {
                console.error('Error loading playlist:', error);
                this.notificationManager.error('Load Error', `Failed to load playlist: ${error.message}`);
            }
        }
        async loadAlbum(albumId, albumTitle) {
            console.log('Loading album:', { albumId, albumTitle });
            try {
                this.notificationManager.info('Loading Album', `Loading ${albumTitle || albumId}...`);
                const albumData = await this.apiService.getAlbumInfo(albumId);
                console.log('Album data:', albumData);
                // Update the UI with album data
                this.displayAlbum(albumData);
                this.notificationManager.success('Album Loaded', `Loaded ${albumData.name || albumId}`);
            }
            catch (error) {
                console.error('Error loading album:', error);
                this.notificationManager.error('Load Error', `Failed to load album: ${error.message}`);
            }
        }
        async loadArtist(artistId, artistName) {
            console.log('Loading artist:', { artistId, artistName });
            try {
                this.notificationManager.info('Loading Artist', `Loading ${artistName || artistId}...`);
                const artistData = await this.apiService.getArtistInfo(artistId);
                console.log('Artist data:', artistData);
                // Update the UI with artist data
                this.displayArtist(artistData);
                this.notificationManager.success('Artist Loaded', `Loaded ${artistData.name || artistId}`);
            }
            catch (error) {
                console.error('Error loading artist:', error);
                this.notificationManager.error('Load Error', `Failed to load artist: ${error.message}`);
            }
        }
        async loadSong(songId, title, artist, thumbnail) {
            console.log('Loading song:', { songId, title, artist, thumbnail });
            try {
                this.notificationManager.info('Loading Song', `Loading ${title || songId}...`);
                const songData = await this.apiService.getSongVideoInfo(songId);
                console.log('Song data:', songData);
                // Update the UI with song data
                this.displaySong(songData);
                this.notificationManager.success('Song Loaded', `Loaded ${songData.name || songId}`);
            }
            catch (error) {
                console.error('Error loading song:', error);
                this.notificationManager.error('Load Error', `Failed to load song: ${error.message}`);
            }
        }
        async performSearch(query) {
            console.log('Performing search:', query);
            try {
                this.notificationManager.info('Searching', `Searching for "${query}"...`);
                const searchResults = await this.apiService.search(query);
                console.log('Search results:', searchResults);
                // Update the UI with search results
                this.displaySearchResults(searchResults);
                this.notificationManager.success('Search Complete', `Found ${searchResults.totalCount} results`);
            }
            catch (error) {
                console.error('Error performing search:', error);
                this.notificationManager.error('Search Error', `Failed to search: ${error.message}`);
            }
        }
        clearSearch() {
            console.log('Clearing search');
            const searchResults = document.getElementById('searchResults');
            const welcomeSection = document.querySelector('.welcome-section');
            if (searchResults) {
                searchResults.style.display = 'none';
            }
            if (welcomeSection) {
                welcomeSection.style.display = 'block';
            }
        }
        async loadLibrary() {
            console.log('Loading library');
            try {
                this.notificationManager.info('Loading Library', 'Loading your library...');
                const libraryData = await this.apiService.getLibrary();
                console.log('Library data:', libraryData);
                // Update the UI with library data
                this.displayLibrary(libraryData);
                this.notificationManager.success('Library Loaded', 'Your library has been loaded');
            }
            catch (error) {
                console.error('Error loading library:', error);
                this.notificationManager.error('Load Error', `Failed to load library: ${error.message}`);
            }
        }
        async loadSongs() {
            console.log('Loading songs');
            try {
                this.notificationManager.info('Loading Songs', 'Loading your songs...');
                const songsData = await this.apiService.getLibrarySongs();
                console.log('Songs data:', songsData);
                // Update the UI with songs data
                this.displaySongs(songsData);
                this.notificationManager.success('Songs Loaded', `Loaded ${songsData.totalCount} songs`);
            }
            catch (error) {
                console.error('Error loading songs:', error);
                this.notificationManager.error('Load Error', `Failed to load songs: ${error.message}`);
            }
        }
        async loadArtists() {
            console.log('Loading artists');
            try {
                this.notificationManager.info('Loading Artists', 'Loading your artists...');
                const artistsData = await this.apiService.getLibraryArtists();
                console.log('Artists data:', artistsData);
                // Update the UI with artists data
                this.displayArtists(artistsData);
                this.notificationManager.success('Artists Loaded', `Loaded ${artistsData.totalCount} artists`);
            }
            catch (error) {
                console.error('Error loading artists:', error);
                this.notificationManager.error('Load Error', `Failed to load artists: ${error.message}`);
            }
        }
        async loadAlbums() {
            console.log('Loading albums');
            try {
                this.notificationManager.info('Loading Albums', 'Loading your albums...');
                const albumsData = await this.apiService.getLibraryAlbums();
                console.log('Albums data:', albumsData);
                // Update the UI with albums data
                this.displayAlbums(albumsData);
                this.notificationManager.success('Albums Loaded', `Loaded ${albumsData.totalCount} albums`);
            }
            catch (error) {
                console.error('Error loading albums:', error);
                this.notificationManager.error('Load Error', `Failed to load albums: ${error.message}`);
            }
        }
        // UI update methods
        updateNowPlaying(song, isPlaying = true) {
            const titleElement = document.getElementById('nowPlayingTitle');
            const artistElement = document.getElementById('nowPlayingArtist');
            const thumbnailElement = document.getElementById('nowPlayingThumbnail');
            const playButton = document.getElementById('playButton');
            if (titleElement)
                titleElement.textContent = song.name;
            if (artistElement)
                artistElement.textContent = song.artists?.[0]?.name || 'Unknown Artist';
            if (playButton)
                playButton.textContent = isPlaying ? '⏸' : '▶';
            if (thumbnailElement && song.thumbnails?.[0]?.url) {
                thumbnailElement.style.backgroundImage = `url(${song.thumbnails[0].url})`;
            }
            document.title = isPlaying ? `${song.name} - ${song.artists?.[0]?.name || 'Unknown Artist'}` : 'YouTube Music';
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
         * Helper method to create a song item element
         */
        createSongItem(song, index = -1, playlistId) {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.setAttribute('data-song-id', song.id);
            songItem.setAttribute('data-song-name', song.name || song.title || 'Unknown Song');
            songItem.setAttribute('data-song-artist', song.artists?.[0]?.name || song.artist || 'Unknown Artist');
            songItem.setAttribute('data-song-thumbnail', song.thumbnails?.[0]?.url || song.thumbnail || '/logo.png');
            if (playlistId) {
                songItem.setAttribute('data-playlist-id', playlistId);
            }
            if (index >= 0) {
                songItem.setAttribute('data-song-index', index.toString());
            }
            const thumbnail = document.createElement('div');
            thumbnail.className = 'song-thumbnail';
            const img = document.createElement('img');
            img.src = song.thumbnails?.[0]?.url || song.thumbnail || '/logo.png';
            img.alt = song.name || song.title || 'Unknown Song';
            thumbnail.appendChild(img);
            const info = document.createElement('div');
            info.className = 'song-info';
            const title = document.createElement('div');
            title.className = 'song-title';
            title.textContent = song.name || song.title || 'Unknown Song';
            const artist = document.createElement('div');
            artist.className = 'song-artist';
            artist.textContent = song.artists?.[0]?.name || song.artist || 'Unknown Artist';
            info.appendChild(title);
            info.appendChild(artist);
            const duration = document.createElement('div');
            duration.className = 'song-duration';
            duration.textContent = song.duration || '';
            songItem.appendChild(thumbnail);
            songItem.appendChild(info);
            songItem.appendChild(duration);
            return songItem;
        }
        /**
         * Helper method to create a result card element
         */
        createResultCard(type, data) {
            const card = document.createElement('div');
            card.className = 'result-card';
            if (type === 'artist') {
                card.setAttribute('data-artist-id', data.id);
                card.setAttribute('data-artist-name', data.name);
            }
            else {
                card.setAttribute('data-album-id', data.id);
                card.setAttribute('data-album-title', data.name);
            }
            const thumbnail = document.createElement('div');
            thumbnail.className = 'result-card-thumbnail';
            const img = document.createElement('img');
            img.src = data.thumbnails?.[0]?.url || '/logo.png';
            img.alt = data.name;
            thumbnail.appendChild(img);
            const info = document.createElement('div');
            info.className = 'result-card-info';
            const title = document.createElement('div');
            title.className = 'result-card-title';
            title.textContent = data.name;
            const subtitle = document.createElement('div');
            subtitle.className = 'result-card-subtitle';
            if (type === 'artist') {
                subtitle.textContent = data.subscribers || 'Unknown subscribers';
            }
            else {
                subtitle.textContent = data.artists?.[0]?.name || 'Unknown Artist';
            }
            info.appendChild(title);
            info.appendChild(subtitle);
            card.appendChild(thumbnail);
            card.appendChild(info);
            return card;
        }
        /**
         * Helper method to create a header element
         */
        createHeader(title, subtitle) {
            const header = document.createElement('div');
            header.className = 'playlist-header';
            const h1 = document.createElement('h1');
            h1.textContent = title;
            const p = document.createElement('p');
            p.textContent = subtitle;
            header.appendChild(h1);
            header.appendChild(p);
            return header;
        }
        /**
         * Helper method to clear and prepare search results container
         */
        prepareSearchResultsContainer() {
            const searchResults = document.getElementById('searchResults');
            const welcomeSection = document.querySelector('.welcome-section');
            if (welcomeSection) {
                welcomeSection.style.display = 'none';
            }
            if (searchResults) {
                searchResults.style.display = 'block';
                // Clear container by removing all child nodes
                while (searchResults.firstChild) {
                    searchResults.removeChild(searchResults.firstChild);
                }
                return searchResults;
            }
            return null;
        }
        /**
         * Display playlist data in the UI
         */
        displayPlaylist(playlistData) {
            console.log('Displaying playlist:', playlistData);
            // Update page title
            document.title = `${playlistData.id} - YouTube Music`;
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader(playlistData.id || 'Playlist', `${playlistData.totalSongs || 0} songs`);
            searchResults.appendChild(header);
            // Create songs list container
            const songsList = document.createElement('div');
            songsList.className = 'songs-list';
            if (playlistData.songs && playlistData.songs.length > 0) {
                playlistData.songs.forEach((song, index) => {
                    const songItem = this.createSongItem(song, index, playlistData.id);
                    songsList.appendChild(songItem);
                });
            }
            else {
                const noSongs = document.createElement('div');
                noSongs.className = 'no-songs';
                noSongs.textContent = 'No songs found in this playlist';
                songsList.appendChild(noSongs);
            }
            searchResults.appendChild(songsList);
        }
        /**
         * Display search results in the UI
         */
        displaySearchResults(searchResults) {
            console.log('Displaying search results:', searchResults);
            const searchResultsElement = this.prepareSearchResultsContainer();
            if (!searchResultsElement)
                return;
            // Create header
            const header = document.createElement('div');
            header.className = 'search-results-header';
            const h2 = document.createElement('h2');
            h2.textContent = 'Search Results';
            header.appendChild(h2);
            searchResultsElement.appendChild(header);
            if (searchResults.results && searchResults.results.length > 0) {
                const songsList = document.createElement('div');
                songsList.className = 'songs-list';
                searchResults.results.forEach((result) => {
                    if (result.category === api_types_2.SearchCategory.Songs) {
                        const song = result;
                        const songItem = this.createSongItem(song);
                        songsList.appendChild(songItem);
                    }
                });
                searchResultsElement.appendChild(songsList);
            }
            else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No results found';
                searchResultsElement.appendChild(noResults);
            }
        }
        /**
         * Display album data in the UI
         */
        displayAlbum(albumData) {
            console.log('Displaying album:', albumData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader(albumData.name, `${albumData.songs?.length || 0} songs`);
            searchResults.appendChild(header);
            // Create songs list container
            const songsList = document.createElement('div');
            songsList.className = 'songs-list';
            if (albumData.songs && albumData.songs.length > 0) {
                albumData.songs.forEach((song, index) => {
                    const songItem = this.createSongItem(song, index);
                    songsList.appendChild(songItem);
                });
            }
            else {
                const noSongs = document.createElement('div');
                noSongs.className = 'no-songs';
                noSongs.textContent = 'No songs found in this album';
                songsList.appendChild(noSongs);
            }
            searchResults.appendChild(songsList);
        }
        /**
         * Display artist data in the UI
         */
        displayArtist(artistData) {
            console.log('Displaying artist:', artistData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader(artistData.name, `${artistData.songs?.length || 0} songs`);
            searchResults.appendChild(header);
            // Create songs list container
            const songsList = document.createElement('div');
            songsList.className = 'songs-list';
            if (artistData.songs && artistData.songs.length > 0) {
                artistData.songs.forEach((song, index) => {
                    const songItem = this.createSongItem(song, index);
                    songsList.appendChild(songItem);
                });
            }
            else {
                const noSongs = document.createElement('div');
                noSongs.className = 'no-songs';
                noSongs.textContent = 'No songs found for this artist';
                songsList.appendChild(noSongs);
            }
            searchResults.appendChild(songsList);
        }
        /**
         * Display song data in the UI
         */
        displaySong(songData) {
            console.log('Displaying song:', songData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader(songData.name, `by ${songData.artists?.[0]?.name || 'Unknown Artist'}`);
            searchResults.appendChild(header);
            // Create songs list container
            const songsList = document.createElement('div');
            songsList.className = 'songs-list';
            const songItem = this.createSongItem(songData);
            songsList.appendChild(songItem);
            searchResults.appendChild(songsList);
        }
        /**
         * Display library data in the UI
         */
        displayLibrary(libraryData) {
            console.log('Displaying library:', libraryData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader('Your Library', `${libraryData.songs?.length || 0} songs, ${libraryData.albums?.length || 0} albums, ${libraryData.artists?.length || 0} artists`);
            searchResults.appendChild(header);
        }
        /**
         * Display songs data in the UI
         */
        displaySongs(songsData) {
            console.log('Displaying songs:', songsData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader('Your Songs', `${songsData.totalCount || 0} songs`);
            searchResults.appendChild(header);
            // Create songs list container
            const songsList = document.createElement('div');
            songsList.className = 'songs-list';
            if (songsData.songs && songsData.songs.length > 0) {
                songsData.songs.forEach((song, index) => {
                    const songItem = this.createSongItem(song, index);
                    songsList.appendChild(songItem);
                });
            }
            else {
                const noSongs = document.createElement('div');
                noSongs.className = 'no-songs';
                noSongs.textContent = 'No songs found in your library';
                songsList.appendChild(noSongs);
            }
            searchResults.appendChild(songsList);
        }
        /**
         * Display artists data in the UI
         */
        displayArtists(artistsData) {
            console.log('Displaying artists:', artistsData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader('Your Artists', `${artistsData.totalCount || 0} artists`);
            searchResults.appendChild(header);
            // Create results grid container
            const resultsGrid = document.createElement('div');
            resultsGrid.className = 'results-grid';
            if (artistsData.artists && artistsData.artists.length > 0) {
                artistsData.artists.forEach((artist) => {
                    const artistCard = this.createResultCard('artist', artist);
                    resultsGrid.appendChild(artistCard);
                });
            }
            else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No artists found in your library';
                resultsGrid.appendChild(noResults);
            }
            searchResults.appendChild(resultsGrid);
        }
        /**
         * Display albums data in the UI
         */
        displayAlbums(albumsData) {
            console.log('Displaying albums:', albumsData);
            const searchResults = this.prepareSearchResultsContainer();
            if (!searchResults)
                return;
            // Create header
            const header = this.createHeader('Your Albums', `${albumsData.totalCount || 0} albums`);
            searchResults.appendChild(header);
            // Create results grid container
            const resultsGrid = document.createElement('div');
            resultsGrid.className = 'results-grid';
            if (albumsData.albums && albumsData.albums.length > 0) {
                albumsData.albums.forEach((album) => {
                    const albumCard = this.createResultCard('album', album);
                    resultsGrid.appendChild(albumCard);
                });
            }
            else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No albums found in your library';
                resultsGrid.appendChild(noResults);
            }
            searchResults.appendChild(resultsGrid);
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
    exports.playSong = playSong;
    exports.playNextSong = playNextSong;
    exports.playPreviousSong = playPreviousSong;
    exports.setVolume = setVolume;
    exports.seekTo = seekTo;
    exports.getCurrentAudioState = getCurrentAudioState;
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
     * Play a song by ID
     */
    async function playSong(songId, title, artist, thumbnail) {
        try {
            // Stop any currently playing audio
            stopAllAudio();
            // Create audio element
            exports.currentAudio = new Audio();
            // Set up audio event listeners
            setupAudioEventListeners(exports.currentAudio);
            // Set the audio source
            const audioUrl = `/api/stream/${songId}`;
            exports.currentAudio.src = audioUrl;
            // Update current song info
            exports.currentSongInfo = {
                id: songId,
                name: title,
                artists: [{ name: artist, id: '' }],
                album: { name: '', id: '' },
                duration: '00:00',
                isExplicit: false,
                playsInfo: '',
                thumbnails: thumbnail ? [{ url: thumbnail, width: 0, height: 0 }] : [],
                category: 'Songs'
            };
            // Update media session metadata
            updateMediaSessionMetadata(exports.currentSongInfo);
            // Start playing
            await exports.currentAudio.play();
            exports.isPlaying = true;
            // Update UI
            updateNowPlayingUI(exports.currentSongInfo, true);
            console.log(`Now playing: ${title} by ${artist}`);
        }
        catch (error) {
            console.error('Error playing song:', error);
            showErrorNotification(`Failed to play ${title}`);
            handlePlaybackError(title, artist);
        }
    }
    /**
     * Setup audio event listeners
     */
    function setupAudioEventListeners(audio) {
        audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });
        audio.addEventListener('canplay', () => {
            console.log('Audio can start playing');
        });
        audio.addEventListener('play', () => {
            exports.isPlaying = true;
            updateNowPlayingUI(exports.currentSongInfo, true);
        });
        audio.addEventListener('pause', () => {
            exports.isPlaying = false;
            updateNowPlayingUI(exports.currentSongInfo, false);
        });
        audio.addEventListener('ended', () => {
            console.log('Audio playback ended');
            exports.isPlaying = false;
            updateNowPlayingUI(exports.currentSongInfo, false);
            // Auto-play next song if in playlist mode
            if (settings_2.settings.repeat === 'all' && window.currentPlaylistSongs?.length > 0) {
                playNextSong();
            }
        });
        audio.addEventListener('error', (event) => {
            console.error('Audio error:', event);
            const error = event;
            showErrorNotification(`Audio error: ${error.message}`);
            if (exports.currentSongInfo) {
                handlePlaybackError(exports.currentSongInfo.name, exports.currentSongInfo.artists?.[0]?.name || 'Unknown Artist');
            }
        });
        audio.addEventListener('timeupdate', () => {
            if (exports.currentAudio) {
                updateProgressBar(exports.currentAudio.currentTime, exports.currentAudio.duration);
            }
        });
        audio.addEventListener('volumechange', () => {
            if (exports.currentAudio) {
                updateVolumeDisplay(exports.currentAudio.volume);
            }
        });
    }
    /**
     * Update media session metadata
     */
    function updateMediaSessionMetadata(song) {
        if (!navigator.mediaSession)
            return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name,
            artist: song.artists?.[0]?.name || 'Unknown Artist',
            album: song.album?.name || '',
            artwork: song.thumbnails?.map(thumb => ({
                src: thumb.url,
                sizes: `${thumb.width}x${thumb.height}`,
                type: 'image/jpeg'
            })) || []
        });
    }
    /**
     * Update now playing UI
     */
    function updateNowPlayingUI(song, isPlaying) {
        const titleElement = document.getElementById('nowPlayingTitle');
        const artistElement = document.getElementById('nowPlayingArtist');
        const thumbnailElement = document.getElementById('nowPlayingThumbnail');
        const playButton = document.getElementById('playButton');
        if (song) {
            if (titleElement)
                titleElement.textContent = song.name;
            if (artistElement)
                artistElement.textContent = song.artists?.[0]?.name || 'Unknown Artist';
            if (playButton)
                playButton.textContent = isPlaying ? '⏸' : '▶';
            if (thumbnailElement && song.thumbnails?.[0]?.url) {
                thumbnailElement.style.backgroundImage = `url(${song.thumbnails[0].url})`;
            }
            document.title = isPlaying ? `${song.name} - ${song.artists?.[0]?.name || 'Unknown Artist'}` : 'YouTube Music';
        }
        else {
            if (titleElement)
                titleElement.textContent = '';
            if (artistElement)
                artistElement.textContent = '';
            if (playButton)
                playButton.textContent = '▶';
            if (thumbnailElement)
                thumbnailElement.style.backgroundImage = '';
            document.title = 'YouTube Music';
        }
    }
    /**
     * Update progress bar
     */
    function updateProgressBar(currentTime, duration) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill && duration > 0) {
            const percentage = (currentTime / duration) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }
    /**
     * Update volume display
     */
    function updateVolumeDisplay(volume) {
        const volumeFill = document.getElementById('volumeFill');
        if (volumeFill) {
            volumeFill.style.width = `${volume * 100}%`;
        }
    }
    /**
     * Clear info panel
     */
    function clearInfoPanel() {
        const titleElement = document.getElementById('nowPlayingTitle');
        const artistElement = document.getElementById('nowPlayingArtist');
        const thumbnailElement = document.getElementById('nowPlayingThumbnail');
        const playButton = document.getElementById('playButton');
        if (titleElement)
            titleElement.textContent = '';
        if (artistElement)
            artistElement.textContent = '';
        if (playButton)
            playButton.textContent = '▶';
        if (thumbnailElement)
            thumbnailElement.style.backgroundImage = '';
        document.title = DEFAULT_TITLE;
    }
    /**
     * Show error notification
     */
    function showErrorNotification(message) {
        if (window.notificationManager) {
            window.notificationManager.error('Audio Error', message);
        }
        else {
            console.error('Audio Error:', message);
        }
    }
    /**
     * Play next song in playlist
     */
    function playNextSong() {
        const currentPlaylistSongs = window.currentPlaylistSongs;
        const currentSongIndex = window.currentSongIndex;
        if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
            console.log('No playlist songs available');
            return;
        }
        let nextIndex = currentSongIndex + 1;
        // Handle repeat modes
        if (nextIndex >= currentPlaylistSongs.length) {
            if (settings_2.settings.repeat === 'all') {
                nextIndex = 0; // Loop back to beginning
            }
            else {
                console.log('Reached end of playlist');
                return;
            }
        }
        const nextSong = currentPlaylistSongs[nextIndex];
        if (nextSong) {
            window.currentSongIndex = nextIndex;
            playSong(nextSong.id, nextSong.name, nextSong.artists?.[0]?.name || 'Unknown Artist', nextSong.thumbnails?.[0]?.url);
        }
    }
    /**
     * Play previous song in playlist
     */
    function playPreviousSong() {
        const currentPlaylistSongs = window.currentPlaylistSongs;
        const currentSongIndex = window.currentSongIndex;
        if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
            console.log('No playlist songs available');
            return;
        }
        let prevIndex = currentSongIndex - 1;
        // Handle repeat modes
        if (prevIndex < 0) {
            if (settings_2.settings.repeat === 'all') {
                prevIndex = currentPlaylistSongs.length - 1; // Loop to end
            }
            else {
                console.log('Reached beginning of playlist');
                return;
            }
        }
        const prevSong = currentPlaylistSongs[prevIndex];
        if (prevSong) {
            window.currentSongIndex = prevIndex;
            playSong(prevSong.id, prevSong.name, prevSong.artists?.[0]?.name || 'Unknown Artist', prevSong.thumbnails?.[0]?.url);
        }
    }
    /**
     * Set volume
     */
    function setVolume(volume) {
        if (exports.currentAudio) {
            exports.currentAudio.volume = Math.max(0, Math.min(1, volume));
        }
    }
    /**
     * Seek to position
     */
    function seekTo(position) {
        if (exports.currentAudio && !isNaN(position)) {
            exports.currentAudio.currentTime = Math.max(0, Math.min(exports.currentAudio.duration, position));
        }
    }
    /**
     * Get current audio state
     */
    function getCurrentAudioState() {
        if (exports.currentAudio) {
            return {
                currentTime: exports.currentAudio.currentTime,
                duration: exports.currentAudio.duration,
                volume: exports.currentAudio.volume,
                isPlaying: exports.isPlaying
            };
        }
        return {
            currentTime: 0,
            duration: 0,
            volume: 1,
            isPlaying: false
        };
    }
    // Initialize media key listeners when the module loads
    setupMediaKeyListeners();
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
                // Clear existing content
                this.element.textContent = '';
                // For simple text content, use textContent directly
                if (!content.includes('<')) {
                    this.element.textContent = content;
                    return;
                }
                // For HTML content, use a safer approach with DOMParser
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    const body = doc.body;
                    // Move all child nodes to the element
                    while (body.firstChild) {
                        this.element.appendChild(body.firstChild);
                    }
                }
                catch (error) {
                    // Fallback to text content if parsing fails
                    console.warn('Failed to parse HTML content, using text content instead:', error);
                    this.element.textContent = content;
                }
            }
        }
        /**
         * Get component content
         */
        getContent() {
            if (!this.element)
                return '';
            // Create a temporary container to get HTML content
            const tempContainer = document.createElement('div');
            tempContainer.appendChild(this.element.cloneNode(true));
            return tempContainer.innerHTML;
        }
    }
    exports.UIComponent = UIComponent;
});
//# sourceMappingURL=app.js.map