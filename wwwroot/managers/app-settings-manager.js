"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettingsManager = void 0;
const state_manager_1 = require("../core/state-manager");
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
//# sourceMappingURL=app-settings-manager.js.map