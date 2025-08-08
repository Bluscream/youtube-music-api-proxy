// Type declarations for external libraries and global variables

declare global {

    // Manager classes
    class NotificationManager {
        showNotification(type: string, title: string, message: string, duration?: number): string | null;
        removeNotification(notificationId: string): void;
        showErrorNotification(message: string): string | null;
        showSuccessNotification(message: string): string | null;
        showWarningNotification(message: string): string | null;
        showInfoNotification(message: string): string | null;
    }

    class SidebarManager {
        toggle(): void;
        setState(state: string): void;
        toggleMobileMenu(): void;
        closeMobileMenu(): void;
        isMobile: boolean;
        isMobileMenuOpen: boolean;
    }

    class RightSidebarManager {
        show(): void;
        hide(): void;
        toggle(): void;
        updateInfoPanel(songInfo: any): void;
        updateLyricsPanel(lyrics: string): void;
        clearInfoPanel(): void;
    }

    class PlayerManager {
        playSong(id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number): void;
        loadSong(id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number): void;
        pauseSong(): void;
        resumeSong(): void;
        stopSong(): void;
        nextSong(): void;
        previousSong(): void;
        setVolume(volume: number): void;
        setRepeatMode(mode: string): void;
        toggleShuffle(): void;
        addMobileTouchHandlers(): void;
        enhancePlayerControls(): void;
        setCurrentPlaylist(playlistId: string): void;
        highlightCurrentPlaylist(): void;
    }

    class ContentManager {
        loadHome(): Promise<void>;
        loadLibrary(): Promise<void>;
        loadSongs(): Promise<void>;
        loadArtists(): Promise<void>;
        loadAlbums(): Promise<void>;
        loadPlaylists(): Promise<void>;
        loadPlaylist(id: string, title: string): Promise<void>;
        loadAlbum(id: string, title: string): Promise<void>;
        loadArtist(id: string, name: string): Promise<void>;
        handleSearch(event: KeyboardEvent): Promise<void>;
        displayPlaylistContent(data: any, title: string): void;
    }

    class URLManager {
        loadFromURL(): Promise<void>;
    }

    // Global window interface extensions
    interface Window {
        // API readiness system
        apiReady: boolean;
        apiReadyCallbacks: (() => void)[];
        onApiReady: (callback: () => void) => void;
        notifyApiReady: () => void;

        // YouTube Music API
        ytmAPI: import('./lib/youtube-music-api-proxy/youtube-music-api-proxy').YouTubeMusicAPI;

        // Utility functions
        updateCSSBreakpoints: () => Promise<void>;
        stopAllAudio: () => void;
        currentAudio: HTMLAudioElement | null;
        currentSongInfo: any;
        clearInfoPanel?: () => void;

        // Managers
        playerManager: PlayerManager;
        contentManager: ContentManager;
        urlManager: URLManager;
        notificationManager: NotificationManager;
        sidebarManager: SidebarManager;
        rightSidebarManager: RightSidebarManager;

        // Utility functions
        getQueryParams: () => Record<string, string>;
        loadLibrary: () => void;
        loadSongs: () => void;
        loadArtists: () => void;
        loadAlbums: () => void;
        handleSearch: (event: KeyboardEvent) => void;
        loadFromURL: () => Promise<void>;
        removeNotification: (notificationId: string) => void;

        // Utils object
        utils: {
            formatDuration: (duration: any) => string;
            formatNumber: (num: number) => string;
            formatDate: (dateString: string) => string;
            getQueryParams: () => Record<string, string>;
            buildQueryString: (params: Record<string, any>) => string;
            updateURL: (params: Record<string, any>) => void;
            updateCSSBreakpoints: () => Promise<void>;
            shouldCollapseSidebar: () => Promise<boolean>;
            stopAllAudio: () => void;
            showLoading: () => void;
            showError: (message: string) => void;
            updateActiveNavItem: (clickedItem: Element) => void;
        };

        // Individual utility functions
        formatDuration: (duration: any) => string;
        formatNumber: (num: number) => string;
        formatDate: (dateString: string) => string;
        buildQueryString: (params: Record<string, any>) => string;
        updateURL: (params: Record<string, any>) => void;
        shouldCollapseSidebar: () => Promise<boolean>;
        showLoading: () => void;
        showError: (message: string) => void;
        updateActiveNavItem: (clickedItem: Element) => void;
        shouldCollapseSidebarSync: () => boolean;

        // Global functions for onclick handlers
        toggleSidebar: () => void;
        setSidebarFull: () => void;
        setSidebarExpanded: () => void;
        setSidebarIcon: () => void;
        setSidebarCollapsed: () => void;
        toggleRightSidebar: () => void;
        showRightSidebar: () => void;
        hideRightSidebar: () => void;
        playSong: (id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number) => void;
        loadSong: (id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number) => void;
        pauseSong: () => void;
        resumeSong: () => void;
        stopSong: () => void;
        nextSong: () => void;
        previousSong: () => void;
        setVolume: (volume: number) => void;
        setRepeatMode: (mode: string) => void;
        toggleShuffle: () => void;
        loadHome: () => void;
        loadPlaylists: () => Promise<void>;
        loadPlaylist: (id: string, title: string) => void;
        loadAlbum: (id: string, title: string) => void;
        loadArtist: (id: string, name: string) => void;
    }
}

// Make this a module
export { };
