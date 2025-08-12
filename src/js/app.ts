// Main application entry point with new architecture
import { AppSettingsManager } from './managers/app-settings-manager';
import { AudioManager } from './managers/audio-manager';
import { NotificationManager } from './managers/notification-manager';
import { SidebarManager } from './sidebar-manager';
import { RightSidebarManager } from './right-sidebar-manager';
import { ApiService } from './services/api-service';
import { SearchCategory, SongSearchResult, PlaylistResponse, SearchResponse, AlbumInfo, ArtistInfo } from './services/api-types';

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
    private apiService: ApiService;
    private isInitialized: boolean = false;

    constructor() {
        // Initialize managers
        this.settingsManager = AppSettingsManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.notificationManager = NotificationManager.getInstance();
        this.sidebarManager = new SidebarManager();
        this.rightSidebarManager = new RightSidebarManager();
        this.apiService = new ApiService();

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
        const song: SongSearchResult = {
            id: songId,
            name: title,
            artists: [{ name: artist, id: '' }],
            album: { name: '', id: '' },
            duration: '00:00',
            isExplicit: false,
            playsInfo: '',
            thumbnails: thumbnail ? [{ url: thumbnail, width: 0, height: 0 }] : [],
            category: SearchCategory.Songs
        };
        await this.audioManager.playSong(song, songIndex || -1);

        if (playlistId) {
            this.settingsManager.setCurrentPlaylist(playlistId);
        }
        this.settingsManager.setCurrentSong(songId);
    }

    async loadPlaylist(playlistId: string, playlistTitle: string): Promise<void> {
        console.log('Loading playlist:', { playlistId, playlistTitle });

        try {
            this.notificationManager.info('Loading Playlist', `Loading ${playlistTitle || playlistId}...`);

            const playlistData = await this.apiService.getPlaylist(playlistId);
            console.log('Playlist data:', playlistData);

            // Update the UI with playlist data
            this.displayPlaylist(playlistData);

            this.notificationManager.success('Playlist Loaded', `Loaded ${playlistData.id || playlistId}`);
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.notificationManager.error('Load Error', `Failed to load playlist: ${error.message}`);
        }
    }

    async loadAlbum(albumId: string, albumTitle: string): Promise<void> {
        console.log('Loading album:', { albumId, albumTitle });

        try {
            this.notificationManager.info('Loading Album', `Loading ${albumTitle || albumId}...`);

            const albumData = await this.apiService.getAlbumInfo(albumId);
            console.log('Album data:', albumData);

            // Update the UI with album data
            this.displayAlbum(albumData);

            this.notificationManager.success('Album Loaded', `Loaded ${albumData.name || albumId}`);
        } catch (error) {
            console.error('Error loading album:', error);
            this.notificationManager.error('Load Error', `Failed to load album: ${error.message}`);
        }
    }

    async loadArtist(artistId: string, artistName: string): Promise<void> {
        console.log('Loading artist:', { artistId, artistName });

        try {
            this.notificationManager.info('Loading Artist', `Loading ${artistName || artistId}...`);

            const artistData = await this.apiService.getArtistInfo(artistId);
            console.log('Artist data:', artistData);

            // Update the UI with artist data
            this.displayArtist(artistData);

            this.notificationManager.success('Artist Loaded', `Loaded ${artistData.name || artistId}`);
        } catch (error) {
            console.error('Error loading artist:', error);
            this.notificationManager.error('Load Error', `Failed to load artist: ${error.message}`);
        }
    }

    async loadSong(songId: string, title: string, artist: string, thumbnail?: string): Promise<void> {
        console.log('Loading song:', { songId, title, artist, thumbnail });

        try {
            this.notificationManager.info('Loading Song', `Loading ${title || songId}...`);

            const songData = await this.apiService.getSongVideoInfo(songId);
            console.log('Song data:', songData);

            // Update the UI with song data
            this.displaySong(songData);

            this.notificationManager.success('Song Loaded', `Loaded ${songData.name || songId}`);
        } catch (error) {
            console.error('Error loading song:', error);
            this.notificationManager.error('Load Error', `Failed to load song: ${error.message}`);
        }
    }

    async performSearch(query: string): Promise<void> {
        console.log('Performing search:', query);

        try {
            this.notificationManager.info('Searching', `Searching for "${query}"...`);

            const searchResults = await this.apiService.search(query);
            console.log('Search results:', searchResults);

            // Update the UI with search results
            this.displaySearchResults(searchResults);

            this.notificationManager.success('Search Complete', `Found ${searchResults.totalCount} results`);
        } catch (error) {
            console.error('Error performing search:', error);
            this.notificationManager.error('Search Error', `Failed to search: ${error.message}`);
        }
    }

    clearSearch(): void {
        console.log('Clearing search');
        const searchResults = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');

        if (searchResults) {
            searchResults.style.display = 'none';
        }

        if (welcomeSection) {
            (welcomeSection as HTMLElement).style.display = 'block';
        }
    }

    async loadLibrary(): Promise<void> {
        console.log('Loading library');

        try {
            this.notificationManager.info('Loading Library', 'Loading your library...');

            const libraryData = await this.apiService.getLibrary();
            console.log('Library data:', libraryData);

            // Update the UI with library data
            this.displayLibrary(libraryData);

            this.notificationManager.success('Library Loaded', 'Your library has been loaded');
        } catch (error) {
            console.error('Error loading library:', error);
            this.notificationManager.error('Load Error', `Failed to load library: ${error.message}`);
        }
    }

    async loadSongs(): Promise<void> {
        console.log('Loading songs');

        try {
            this.notificationManager.info('Loading Songs', 'Loading your songs...');

            const songsData = await this.apiService.getLibrarySongs();
            console.log('Songs data:', songsData);

            // Update the UI with songs data
            this.displaySongs(songsData);

            this.notificationManager.success('Songs Loaded', `Loaded ${songsData.totalCount} songs`);
        } catch (error) {
            console.error('Error loading songs:', error);
            this.notificationManager.error('Load Error', `Failed to load songs: ${error.message}`);
        }
    }

    async loadArtists(): Promise<void> {
        console.log('Loading artists');

        try {
            this.notificationManager.info('Loading Artists', 'Loading your artists...');

            const artistsData = await this.apiService.getLibraryArtists();
            console.log('Artists data:', artistsData);

            // Update the UI with artists data
            this.displayArtists(artistsData);

            this.notificationManager.success('Artists Loaded', `Loaded ${artistsData.totalCount} artists`);
        } catch (error) {
            console.error('Error loading artists:', error);
            this.notificationManager.error('Load Error', `Failed to load artists: ${error.message}`);
        }
    }

    async loadAlbums(): Promise<void> {
        console.log('Loading albums');

        try {
            this.notificationManager.info('Loading Albums', 'Loading your albums...');

            const albumsData = await this.apiService.getLibraryAlbums();
            console.log('Albums data:', albumsData);

            // Update the UI with albums data
            this.displayAlbums(albumsData);

            this.notificationManager.success('Albums Loaded', `Loaded ${albumsData.totalCount} albums`);
        } catch (error) {
            console.error('Error loading albums:', error);
            this.notificationManager.error('Load Error', `Failed to load albums: ${error.message}`);
        }
    }

    // UI update methods
    private updateNowPlaying(song: SongSearchResult, isPlaying: boolean = true): void {
        const titleElement = document.getElementById('nowPlayingTitle');
        const artistElement = document.getElementById('nowPlayingArtist');
        const thumbnailElement = document.getElementById('nowPlayingThumbnail');
        const playButton = document.getElementById('playButton') as HTMLButtonElement;

        if (titleElement) titleElement.textContent = song.name;
        if (artistElement) artistElement.textContent = song.artists?.[0]?.name || 'Unknown Artist';
        if (playButton) playButton.textContent = isPlaying ? '⏸' : '▶';

        if (thumbnailElement && song.thumbnails?.[0]?.url) {
            thumbnailElement.style.backgroundImage = `url(${song.thumbnails[0].url})`;
        }

        document.title = isPlaying ? `${song.name} - ${song.artists?.[0]?.name || 'Unknown Artist'}` : 'YouTube Music';
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

    /**
     * Helper method to create a song item element
     */
    private createSongItem(song: any, index: number = -1, playlistId?: string): HTMLElement {
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
    private createResultCard(type: 'artist' | 'album', data: any): HTMLElement {
        const card = document.createElement('div');
        card.className = 'result-card';

        if (type === 'artist') {
            card.setAttribute('data-artist-id', data.id);
            card.setAttribute('data-artist-name', data.name);
        } else {
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
        } else {
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
    private createHeader(title: string, subtitle: string): HTMLElement {
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
    private prepareSearchResultsContainer(): HTMLElement | null {
        const searchResults = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');

        if (welcomeSection) {
            (welcomeSection as HTMLElement).style.display = 'none';
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
    private displayPlaylist(playlistData: PlaylistResponse): void {
        console.log('Displaying playlist:', playlistData);

        // Update page title
        document.title = `${playlistData.id} - YouTube Music`;

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            playlistData.id || 'Playlist',
            `${playlistData.totalSongs || 0} songs`
        );
        searchResults.appendChild(header);

        // Create songs list container
        const songsList = document.createElement('div');
        songsList.className = 'songs-list';

        if (playlistData.songs && playlistData.songs.length > 0) {
            playlistData.songs.forEach((song: any, index: number) => {
                const songItem = this.createSongItem(song, index, playlistData.id);
                songsList.appendChild(songItem);
            });
        } else {
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
    private displaySearchResults(searchResults: SearchResponse): void {
        console.log('Displaying search results:', searchResults);

        const searchResultsElement = this.prepareSearchResultsContainer();
        if (!searchResultsElement) return;

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

            searchResults.results.forEach((result: any) => {
                if (result.category === SearchCategory.Songs) {
                    const song = result as SongSearchResult;
                    const songItem = this.createSongItem(song);
                    songsList.appendChild(songItem);
                }
            });

            searchResultsElement.appendChild(songsList);
        } else {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No results found';
            searchResultsElement.appendChild(noResults);
        }
    }

    /**
     * Display album data in the UI
     */
    private displayAlbum(albumData: AlbumInfo): void {
        console.log('Displaying album:', albumData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            albumData.name,
            `${albumData.songs?.length || 0} songs`
        );
        searchResults.appendChild(header);

        // Create songs list container
        const songsList = document.createElement('div');
        songsList.className = 'songs-list';

        if (albumData.songs && albumData.songs.length > 0) {
            albumData.songs.forEach((song: any, index: number) => {
                const songItem = this.createSongItem(song, index);
                songsList.appendChild(songItem);
            });
        } else {
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
    private displayArtist(artistData: ArtistInfo): void {
        console.log('Displaying artist:', artistData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            artistData.name,
            `${artistData.songs?.length || 0} songs`
        );
        searchResults.appendChild(header);

        // Create songs list container
        const songsList = document.createElement('div');
        songsList.className = 'songs-list';

        if (artistData.songs && artistData.songs.length > 0) {
            artistData.songs.forEach((song: any, index: number) => {
                const songItem = this.createSongItem(song, index);
                songsList.appendChild(songItem);
            });
        } else {
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
    private displaySong(songData: any): void {
        console.log('Displaying song:', songData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            songData.name,
            `by ${songData.artists?.[0]?.name || 'Unknown Artist'}`
        );
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
    private displayLibrary(libraryData: any): void {
        console.log('Displaying library:', libraryData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            'Your Library',
            `${libraryData.songs?.length || 0} songs, ${libraryData.albums?.length || 0} albums, ${libraryData.artists?.length || 0} artists`
        );
        searchResults.appendChild(header);
    }

    /**
     * Display songs data in the UI
     */
    private displaySongs(songsData: any): void {
        console.log('Displaying songs:', songsData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            'Your Songs',
            `${songsData.totalCount || 0} songs`
        );
        searchResults.appendChild(header);

        // Create songs list container
        const songsList = document.createElement('div');
        songsList.className = 'songs-list';

        if (songsData.songs && songsData.songs.length > 0) {
            songsData.songs.forEach((song: any, index: number) => {
                const songItem = this.createSongItem(song, index);
                songsList.appendChild(songItem);
            });
        } else {
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
    private displayArtists(artistsData: any): void {
        console.log('Displaying artists:', artistsData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            'Your Artists',
            `${artistsData.totalCount || 0} artists`
        );
        searchResults.appendChild(header);

        // Create results grid container
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';

        if (artistsData.artists && artistsData.artists.length > 0) {
            artistsData.artists.forEach((artist: any) => {
                const artistCard = this.createResultCard('artist', artist);
                resultsGrid.appendChild(artistCard);
            });
        } else {
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
    private displayAlbums(albumsData: any): void {
        console.log('Displaying albums:', albumsData);

        const searchResults = this.prepareSearchResultsContainer();
        if (!searchResults) return;

        // Create header
        const header = this.createHeader(
            'Your Albums',
            `${albumsData.totalCount || 0} albums`
        );
        searchResults.appendChild(header);

        // Create results grid container
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';

        if (albumsData.albums && albumsData.albums.length > 0) {
            albumsData.albums.forEach((album: any) => {
                const albumCard = this.createResultCard('album', album);
                resultsGrid.appendChild(albumCard);
            });
        } else {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No albums found in your library';
            resultsGrid.appendChild(noResults);
        }

        searchResults.appendChild(resultsGrid);
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
