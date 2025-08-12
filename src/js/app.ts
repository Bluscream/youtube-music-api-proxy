// Main application entry point with new architecture
import { AppSettingsManager } from './managers/app-settings-manager';
import { AudioManager } from './managers/audio-manager';
import { NotificationManager } from './managers/notification-manager';
import { SidebarManager } from './sidebar-manager';
import { RightSidebarManager } from './right-sidebar-manager';

// Global state interface
declare global {
    interface Window {
        app: App;
        settingsManager: AppSettingsManager;
        audioManager: AudioManager;
        notificationManager: NotificationManager;
        sidebarManager: SidebarManager;
        rightSidebarManager: RightSidebarManager;
    }
}

// Main application class
export class App {
    private settingsManager: AppSettingsManager;
    private audioManager: AudioManager;
    private notificationManager: NotificationManager;
    private sidebarManager: SidebarManager;
    private rightSidebarManager: RightSidebarManager;
    private isInitialized: boolean = false;

    constructor() {
        // Initialize managers
        this.settingsManager = AppSettingsManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.notificationManager = NotificationManager.getInstance();
        this.sidebarManager = new SidebarManager();
        this.rightSidebarManager = new RightSidebarManager();

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
    async init(): Promise<void> {
        if (this.isInitialized) return;

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
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.notificationManager.error('Initialization Error', 'Failed to initialize the application');
        }
    }

    /**
     * Setup global event listeners
     */
    private setupEventListeners(): void {
        // Event delegation for dynamic content
        document.addEventListener('click', (event) => this.handleGlobalClick(event));

        // Search functionality
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (event) => this.handleSearch(event));
        }

        // Navigation events
        this.setupNavigationEvents();
    }

    /**
     * Setup audio manager events
     */
    private setupAudioEvents(): void {
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
    private setupSettingsEvents(): void {
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
    private setupNavigationEvents(): void {
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
    private handleGlobalClick(event: Event): void {
        const target = event.target as Element;

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
    private handleSongClick(element: Element): void {
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
    private handlePlaylistClick(element: Element): void {
        const playlistId = element.getAttribute('data-playlist-id') || '';
        const playlistTitle = element.getAttribute('data-playlist-title') || '';
        this.loadPlaylist(playlistId, playlistTitle);
    }

    /**
     * Handle album click
     */
    private handleAlbumClick(element: Element): void {
        const albumId = element.getAttribute('data-album-id') || '';
        const albumTitle = element.getAttribute('data-album-title') || '';
        this.loadAlbum(albumId, albumTitle);
    }

    /**
     * Handle artist click
     */
    private handleArtistClick(element: Element): void {
        const artistId = element.getAttribute('data-artist-id') || '';
        const artistName = element.getAttribute('data-artist-name') || '';
        this.loadArtist(artistId, artistName);
    }

    /**
     * Handle navigation click
     */
    private handleNavigationClick(event: Event): void {
        const target = event.target as Element;
        const navItem = target.closest('.nav-item');
        if (!navItem) return;

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
    private handleSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const query = input.value.trim();

        if (query.length > 2) {
            this.performSearch(query);
        } else if (query.length === 0) {
            this.clearSearch();
        }
    }

    /**
     * Load content from URL parameters
     */
    private async loadFromURL(): Promise<void> {
        const urlParams = new URLSearchParams(window.location.search);
        const playlistId = urlParams.get('playlist');
        const songId = urlParams.get('song');

        if (playlistId) {
            try {
                await this.loadPlaylist(playlistId, '');
            } catch (error) {
                console.error('Error loading playlist from URL:', error);
                this.notificationManager.error('Load Error', 'Failed to load playlist from URL');
            }
        } else if (songId) {
            try {
                await this.loadSong(songId, '', '', '');
            } catch (error) {
                console.error('Error loading song from URL:', error);
                this.notificationManager.error('Load Error', 'Failed to load song from URL');
            }
        }
    }

    // Public methods for external use
    async playSong(songId: string, title: string, artist: string, thumbnail?: string, playlistId?: string, songIndex?: number): Promise<void> {
        const song = { id: songId, title, artist, thumbnail };
        await this.audioManager.playSong(song, songIndex || -1);

        if (playlistId) {
            this.settingsManager.setCurrentPlaylist(playlistId);
        }
        this.settingsManager.setCurrentSong(songId);
    }

    async loadPlaylist(playlistId: string, playlistTitle: string): Promise<void> {
        console.log('Loading playlist:', { playlistId, playlistTitle });
        // TODO: Implement playlist loading logic
        this.notificationManager.info('Loading Playlist', `Loading ${playlistTitle || playlistId}...`);
    }

    async loadAlbum(albumId: string, albumTitle: string): Promise<void> {
        console.log('Loading album:', { albumId, albumTitle });
        // TODO: Implement album loading logic
        this.notificationManager.info('Loading Album', `Loading ${albumTitle || albumId}...`);
    }

    async loadArtist(artistId: string, artistName: string): Promise<void> {
        console.log('Loading artist:', { artistId, artistName });
        // TODO: Implement artist loading logic
        this.notificationManager.info('Loading Artist', `Loading ${artistName || artistId}...`);
    }

    async loadSong(songId: string, title: string, artist: string, thumbnail?: string): Promise<void> {
        console.log('Loading song:', { songId, title, artist, thumbnail });
        // TODO: Implement song loading logic
        this.notificationManager.info('Loading Song', `Loading ${title || songId}...`);
    }

    async performSearch(query: string): Promise<void> {
        console.log('Performing search:', query);
        // TODO: Implement search logic
        this.notificationManager.info('Searching', `Searching for "${query}"...`);
    }

    clearSearch(): void {
        console.log('Clearing search');
        // TODO: Implement clear search logic
    }

    loadLibrary(): void {
        console.log('Loading library');
        // TODO: Implement library loading
    }

    loadSongs(): void {
        console.log('Loading songs');
        // TODO: Implement songs loading
    }

    loadArtists(): void {
        console.log('Loading artists');
        // TODO: Implement artists loading
    }

    loadAlbums(): void {
        console.log('Loading albums');
        // TODO: Implement albums loading
    }

    // UI update methods
    private updateNowPlaying(song: any, isPlaying: boolean = true): void {
        const titleElement = document.getElementById('nowPlayingTitle');
        const artistElement = document.getElementById('nowPlayingArtist');
        const thumbnailElement = document.getElementById('nowPlayingThumbnail');
        const playButton = document.getElementById('playButton') as HTMLButtonElement;

        if (titleElement) titleElement.textContent = song.title;
        if (artistElement) artistElement.textContent = song.artist;
        if (playButton) playButton.textContent = isPlaying ? '⏸' : '▶';

        if (thumbnailElement && song.thumbnail) {
            thumbnailElement.style.backgroundImage = `url(${song.thumbnail})`;
        }

        document.title = isPlaying ? `${song.title} - ${song.artist}` : 'YouTube Music';
    }

    private updateProgressBar(currentTime: number, duration: number): void {
        const progressFill = document.getElementById('progressFill') as HTMLElement;
        if (progressFill && duration > 0) {
            const percentage = (currentTime / duration) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }

    private updateVolumeDisplay(volume: number): void {
        const volumeFill = document.getElementById('volumeFill') as HTMLElement;
        if (volumeFill) {
            volumeFill.style.width = `${volume * 100}%`;
        }
    }

    private updateRepeatButton(repeatMode: string): void {
        const repeatButton = document.getElementById('repeatButton') as HTMLButtonElement;
        if (repeatButton) {
            const repeatModes = {
                'none': { icon: '🔁', title: 'No repeat' },
                'one': { icon: '🔂', title: 'Repeat one' },
                'all': { icon: '🔁', title: 'Repeat all' }
            };

            const mode = repeatModes[repeatMode as keyof typeof repeatModes];
            repeatButton.textContent = mode.icon;
            repeatButton.title = mode.title;
        }
    }
}

// Global functions for HTML onclick handlers
(window as any).toggleSidebar = function (): void {
    window.sidebarManager.toggle();
};

(window as any).toggleRightSidebar = function (): void {
    window.rightSidebarManager.toggle();
};

(window as any).togglePlay = function (): void {
    window.audioManager.togglePlay();
};

(window as any).playNextSong = function (): void {
    window.audioManager.next();
};

(window as any).playPreviousSong = function (): void {
    window.audioManager.previous();
};

(window as any).toggleRepeatMode = function (): void {
    const newMode = window.settingsManager.cycleRepeatMode();
    window.notificationManager.success('Repeat Mode', `Repeat mode: ${newMode}`);
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    window.app = app;
    await app.init();
});
