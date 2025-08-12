"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioManager = void 0;
const state_manager_1 = require("../core/state-manager");
const app_settings_manager_1 = require("./app-settings-manager");
// Audio Manager with comprehensive state management
class AudioManager extends state_manager_1.StateManager {
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
        const audio = new HTMLAudioElement();
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
//# sourceMappingURL=audio-manager.js.map