import { StateManager } from '../core/state-manager';
import { AppSettings, RepeatMode, TabType } from '../types';

// App settings manager using the base StateManager
export class AppSettingsManager extends StateManager<AppSettings> {
    private static instance: AppSettingsManager;

    private constructor() {
        const initialSettings: AppSettings = {
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
    static getInstance(): AppSettingsManager {
        if (!AppSettingsManager.instance) {
            AppSettingsManager.instance = new AppSettingsManager();
        }
        return AppSettingsManager.instance;
    }

    /**
     * Load settings from URL parameters
     */
    private loadFromURL(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const updates: Partial<AppSettings> = {};

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
    private updateURL(): void {
        const url = new URL(window.location.href);
        const state = this.getState();

        // Update playlist parameter
        if (state.playlist) {
            url.searchParams.set('playlist', state.playlist);
        } else {
            url.searchParams.delete('playlist');
        }

        // Update song parameter
        if (state.song) {
            url.searchParams.set('song', state.song);
        } else {
            url.searchParams.delete('song');
        }

        window.history.replaceState({}, '', url);
    }

    /**
     * Override setState to update URL when needed
     */
    setState(updates: Partial<AppSettings>): void {
        super.setState(updates);

        // Update URL if playlist or song changed
        if (updates.playlist !== undefined || updates.song !== undefined) {
            this.updateURL();
        }
    }

    /**
     * Set repeat mode
     */
    setRepeatMode(mode: RepeatMode): void {
        this.setState({ repeat: mode });
    }

    /**
     * Get repeat mode
     */
    getRepeatMode(): RepeatMode {
        return this.getState().repeat;
    }

    /**
     * Set active tab
     */
    setActiveTab(tab: TabType): void {
        this.setState({ tab });
    }

    /**
     * Get active tab
     */
    getActiveTab(): TabType {
        return this.getState().tab;
    }

    /**
     * Set sidebar split position
     */
    setSidebarSplit(split: number): void {
        this.setState({ split });
    }

    /**
     * Get sidebar split position
     */
    getSidebarSplit(): number {
        return this.getState().split;
    }

    /**
     * Set current playlist
     */
    setCurrentPlaylist(playlistId: string | null): void {
        this.setState({ playlist: playlistId });
    }

    /**
     * Get current playlist
     */
    getCurrentPlaylist(): string | null {
        return this.getState().playlist;
    }

    /**
     * Set current song
     */
    setCurrentSong(songId: string | null): void {
        this.setState({ song: songId });
    }

    /**
     * Get current song
     */
    getCurrentSong(): string | null {
        return this.getState().song;
    }

    /**
     * Cycle through repeat modes
     */
    cycleRepeatMode(): RepeatMode {
        const modes: RepeatMode[] = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.getRepeatMode());
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];

        this.setRepeatMode(nextMode);
        return nextMode;
    }

    /**
     * Reset all settings to defaults
     */
    reset(): void {
        const defaultSettings: AppSettings = {
            repeat: 'none',
            playlist: null,
            song: null,
            tab: 'info',
            split: 300
        };

        this.replaceState(defaultSettings);
    }
}
