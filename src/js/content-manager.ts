import { formatNumber, formatDate } from './utils';
import apiService from './services/api-service';
import {
    SearchResponse,
    SearchResult,
    SongSearchResult,
    AlbumSearchResult,
    ArtistSearchResult,
    LibraryResponse,
    LibrarySongsResponse,
    LibraryArtistsResponse,
    LibraryAlbumsResponse,
    LibraryPlaylistsResponse,
    PlaylistResponse,
    AlbumInfo,
    ArtistInfo,
    SongVideoInfoResponse,
    SearchCategory
} from './lib/youtube-music-api-proxy/youtube-music-api-proxy';

// Content Manager
export class ContentManager {
    private currentView: string = 'home';
    private playlists: any[] = [];
    private searchResults: SearchResult[] = [];

    constructor() {
        this.init();
    }

    init(): void {
        this.setupEventListeners();
    }

    setupEventListeners(): void {
        // Search functionality
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('keypress', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e);
                }
            });
        }
    }

    async loadHome(): Promise<void> {
        this.currentView = 'home';
        this.updateActiveNavItem('home');

        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="welcome-section">
                <h1>Welcome to YouTube Music API Proxy</h1>
                <p>Search for music, browse your library, or explore playlists.</p>
                <div class="search-box">
                    <input type="text" id="homeSearchInput" placeholder="Search for songs, artists, or albums...">
                    <button onclick="document.getElementById('homeSearchInput').value && handleSearch({key:'Enter',target:document.getElementById('homeSearchInput')})">Search</button>
                </div>
            </div>
        `;

        // Set up home search
        const homeSearchInput = document.getElementById('homeSearchInput') as HTMLInputElement;
        if (homeSearchInput) {
            homeSearchInput.addEventListener('keypress', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e);
                }
            });
        }
    }

    async loadLibrary(): Promise<void> {
        this.currentView = 'library';
        this.updateActiveNavItem('library');

        try {
            const api = apiService.getAPI();
            const data: LibraryResponse = await api.getLibrary();
            this.displayLibraryContent(data);
        } catch (error) {
            console.error('Error loading library:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load library');
            }
        }
    }

    async loadSongs(): Promise<void> {
        this.currentView = 'songs';
        this.updateActiveNavItem('songs');

        try {
            const api = apiService.getAPI();
            const data: LibrarySongsResponse = await api.getLibrarySongs();
            this.displaySongsContent(data);
        } catch (error) {
            console.error('Error loading songs:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load songs');
            }
        }
    }

    async loadArtists(): Promise<void> {
        this.currentView = 'artists';
        this.updateActiveNavItem('artists');

        try {
            const api = apiService.getAPI();
            const data: LibraryArtistsResponse = await api.getLibraryArtists();
            this.displayArtistsContent(data);
        } catch (error) {
            console.error('Error loading artists:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load artists');
            }
        }
    }

    async loadAlbums(): Promise<void> {
        this.currentView = 'albums';
        this.updateActiveNavItem('albums');

        try {
            const api = apiService.getAPI();
            const data: LibraryAlbumsResponse = await api.getLibraryAlbums();
            this.displayAlbumsContent(data);
        } catch (error) {
            console.error('Error loading albums:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load albums');
            }
        }
    }

    async loadPlaylists(): Promise<void> {
        try {
            const api = apiService.getAPI();
            const data: LibraryPlaylistsResponse = await api.getLibraryPlaylists();
            this.playlists = data.playlists;
            this.updatePlaylistsSidebar();
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    }

    async loadPlaylist(id: string, title: string): Promise<void> {
        this.currentView = 'playlist';
        this.updateActiveNavItem('playlist');

        try {
            const api = apiService.getAPI();
            const data: PlaylistResponse = await api.getPlaylist(id);
            this.displayPlaylistContent(data, title);
        } catch (error) {
            console.error('Error loading playlist:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load playlist');
            }
        }
    }

    async loadAlbum(id: string, title: string): Promise<void> {
        this.currentView = 'album';
        this.updateActiveNavItem('album');

        try {
            const api = apiService.getAPI();
            const data: AlbumInfo = await api.getAlbumInfo(id);
            this.displayAlbumContent(data, title);
        } catch (error) {
            console.error('Error loading album:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load album');
            }
        }
    }

    async loadArtist(id: string, name: string): Promise<void> {
        this.currentView = 'artist';
        this.updateActiveNavItem('artist');

        try {
            const api = apiService.getAPI();
            const data: ArtistInfo = await api.getArtistInfo(id);
            this.displayArtistContent(data, name);
        } catch (error) {
            console.error('Error loading artist:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load artist');
            }
        }
    }

    async handleSearch(event: KeyboardEvent): Promise<void> {
        const target = event.target as HTMLInputElement;
        const query = target.value.trim();

        if (!query) return;

        this.currentView = 'search';
        this.updateActiveNavItem('search');

        try {
            const api = apiService.getAPI();
            const data: SearchResponse = await api.search(query);
            this.searchResults = data.results;
            this.displaySearchResults(data, query);
        } catch (error) {
            console.error('Error searching:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Search failed');
            }
        }
    }

    displayLibraryContent(data: LibraryResponse): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="library-content">
                <h2>Your Library</h2>
                <div class="library-stats">
                    <div class="stat">
                        <span class="stat-number">${data.songs?.length || 0}</span>
                        <span class="stat-label">Songs</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${data.artists?.length || 0}</span>
                        <span class="stat-label">Artists</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${data.albums?.length || 0}</span>
                        <span class="stat-label">Albums</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${data.playlists?.length || 0}</span>
                        <span class="stat-label">Playlists</span>
                    </div>
                </div>
            </div>
        `;
    }

    displaySongsContent(data: LibrarySongsResponse): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || [];
        const songsHtml = songs.map((song) => `
            <div class="song-item" data-song-id="${song.id}" 
                 data-song-name="${song.name}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}">
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name}">
                <div class="song-info">
                    <h3>${song.name}</h3>
                    <p>${song.artists && song.artists.length > 0 ? song.artists[0].name : 'Unknown Artist'}</p>
                </div>
                <div class="song-duration">${song.duration || ''}</div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <div class="songs-content">
                <h2>Your Songs (${songs.length})</h2>
                <div class="songs-list">
                    ${songsHtml}
                </div>
            </div>
        `;
    }

    displayArtistsContent(data: LibraryArtistsResponse): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const artists = data.artists || [];
        const artistsHtml = artists.map((artist) => `
            <div class="artist-item" data-artist-id="${artist.id}" 
                 data-artist-name="${artist.name}">
                <img src="${artist.thumbnails && artist.thumbnails.length > 0 ? artist.thumbnails[0].url : ''}" alt="${artist.name}">
                <div class="artist-info">
                    <h3>${artist.name}</h3>
                    <p>${artist.songCount || 0} songs</p>
                </div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <div class="artists-content">
                <h2>Your Artists (${artists.length})</h2>
                <div class="artists-list">
                    ${artistsHtml}
                </div>
            </div>
        `;
    }

    displayAlbumsContent(data: LibraryAlbumsResponse): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const albums = data.albums || [];
        const albumsHtml = albums.map((album) => `
            <div class="album-item" data-album-id="${album.id}" 
                 data-album-title="${album.name}">
                <img src="${album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[0].url : ''}" alt="${album.name}">
                <div class="album-info">
                    <h3>${album.name}</h3>
                    <p>${album.artists && album.artists.length > 0 ? album.artists[0].name : 'Unknown Artist'}</p>
                    <p>${album.year || ''}</p>
                </div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <div class="albums-content">
                <h2>Your Albums (${albums.length})</h2>
                <div class="albums-list">
                    ${albumsHtml}
                </div>
            </div>
        `;
    }

    displayPlaylistContent(data: PlaylistResponse, title: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || [];
        const songsHtml = songs.map((song: SearchResult) => {
            if (song instanceof SongSearchResult) {
                const songItem = song as SongSearchResult;
                return `
                    <div class="song-item" data-song-id="${songItem.id}" 
                         data-song-name="${songItem.name}" 
                         data-song-artist="${songItem.artists && songItem.artists.length > 0 ? songItem.artists[0].name : ''}"
                         data-song-thumbnail="${songItem.thumbnails && songItem.thumbnails.length > 0 ? songItem.thumbnails[0].url : ''}">
                        <img src="${songItem.thumbnails && songItem.thumbnails.length > 0 ? songItem.thumbnails[0].url : ''}" alt="${songItem.name}">
                        <div class="song-info">
                            <h3>${songItem.name}</h3>
                            <p>${songItem.artists && songItem.artists.length > 0 ? songItem.artists[0].name : 'Unknown Artist'}</p>
                        </div>
                        <div class="song-duration">${songItem.duration || ''}</div>
                    </div>
                `;
            }
            return '';
        }).join('');

        mainContent.innerHTML = `
            <div class="playlist-content">
                <h2>${title}</h2>
                <p>${songs.length} songs</p>
                <div class="songs-list">
                    ${songsHtml}
                </div>
            </div>
        `;
    }

    displayAlbumContent(data: AlbumInfo, title: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || [];
        const songsHtml = songs.map((song) => `
            <div class="song-item" data-song-id="${song.id}" 
                 data-song-name="${song.name}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}">
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name}">
                <div class="song-info">
                    <h3>${song.name}</h3>
                    <p>${song.artists && song.artists.length > 0 ? song.artists[0].name : 'Unknown Artist'}</p>
                </div>
                <div class="song-duration">${song.duration || ''}</div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <div class="album-content">
                <h2>${title}</h2>
                <p>${songs.length} songs</p>
                <div class="songs-list">
                    ${songsHtml}
                </div>
            </div>
        `;
    }

    displayArtistContent(data: ArtistInfo, name: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || [];
        const songsHtml = songs.map((song) => `
            <div class="song-item" data-song-id="${song.id}" 
                 data-song-name="${song.name}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}">
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name}">
                <div class="song-info">
                    <h3>${song.name}</h3>
                    <p>${song.artists && song.artists.length > 0 ? song.artists[0].name : 'Unknown Artist'}</p>
                </div>
                <div class="song-duration">${song.duration || ''}</div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <div class="artist-content">
                <h2>${name}</h2>
                <p>${songs.length} songs</p>
                <div class="songs-list">
                    ${songsHtml}
                </div>
            </div>
        `;
    }

    displaySearchResults(data: SearchResponse, query: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const results = data.results || [];
        const resultsHtml = results.map((item: SearchResult) => {
            if (item instanceof SongSearchResult) {
                const songItem = item as SongSearchResult;
                return `
                    <div class="song-item" data-song-id="${songItem.id}" 
                         data-song-name="${songItem.name}" 
                         data-song-artist="${songItem.artists && songItem.artists.length > 0 ? songItem.artists[0].name : ''}"
                         data-song-thumbnail="${songItem.thumbnails && songItem.thumbnails.length > 0 ? songItem.thumbnails[0].url : ''}">
                        <img src="${songItem.thumbnails && songItem.thumbnails.length > 0 ? songItem.thumbnails[0].url : ''}" alt="${songItem.name}">
                        <div class="song-info">
                            <h3>${songItem.name}</h3>
                            <p>${songItem.artists && songItem.artists.length > 0 ? songItem.artists[0].name : 'Unknown Artist'}</p>
                        </div>
                        <div class="song-duration">${songItem.duration || ''}</div>
                    </div>
                `;
            } else if (item instanceof AlbumSearchResult) {
                const albumItem = item as AlbumSearchResult;
                return `
                    <div class="album-item" data-album-id="${albumItem.id}" 
                         data-album-title="${albumItem.name}">
                        <img src="${albumItem.thumbnails && albumItem.thumbnails.length > 0 ? albumItem.thumbnails[0].url : ''}" alt="${albumItem.name}">
                        <div class="album-info">
                            <h3>${albumItem.name}</h3>
                            <p>${albumItem.artists && albumItem.artists.length > 0 ? albumItem.artists[0].name : 'Unknown Artist'}</p>
                        </div>
                    </div>
                `;
            } else if (item instanceof ArtistSearchResult) {
                const artistItem = item as ArtistSearchResult;
                return `
                    <div class="artist-item" data-artist-id="${artistItem.id}" 
                         data-artist-name="${artistItem.name}">
                        <img src="${artistItem.thumbnails && artistItem.thumbnails.length > 0 ? artistItem.thumbnails[0].url : ''}" alt="${artistItem.name}">
                        <div class="artist-info">
                            <h3>${artistItem.name}</h3>
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');

        mainContent.innerHTML = `
            <div class="search-results">
                <h2>Search Results for "${query}"</h2>
                <p>${results.length} results found</p>
                <div class="results-list">
                    ${resultsHtml}
                </div>
            </div>
        `;
    }

    updatePlaylistsSidebar(): void {
        const playlistsContainer = document.getElementById('playlistsList');
        const playlistsSection = document.getElementById('playlistsSection');

        if (!playlistsContainer) return;

        const playlistsHtml = this.playlists.map((playlist: any) => `
            <div class="playlist-item" data-playlist-id="${playlist.id || playlist.playlistId}" 
                 data-playlist-title="${playlist.name || playlist.title}">
                <div class="playlist-info">
                    <h4>${playlist.name || playlist.title}</h4>
                    <p>${playlist.songCount || 0} songs</p>
                </div>
            </div>
        `).join('');

        playlistsContainer.innerHTML = playlistsHtml;

        // Show the playlists section if we have playlists
        if (playlistsSection && this.playlists.length > 0) {
            playlistsSection.style.display = 'block';
        }
    }

    updateActiveNavItem(view: string): void {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current view
        const navItem = document.querySelector(`[data-view="${view}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
    }
}

// Create global instance
window.contentManager = new ContentManager();

// Global functions for onclick handlers
window.loadHome = () => window.contentManager.loadHome();
window.loadLibrary = () => window.contentManager.loadLibrary();
window.loadSongs = () => window.contentManager.loadSongs();
window.loadArtists = () => window.contentManager.loadArtists();
window.loadAlbums = () => window.contentManager.loadAlbums();
window.loadPlaylists = () => window.contentManager.loadPlaylists();
window.loadPlaylist = (id: string, title: string) => window.contentManager.loadPlaylist(id, title);
window.loadAlbum = (id: string, title: string) => window.contentManager.loadAlbum(id, title);
window.loadArtist = (id: string, name: string) => window.contentManager.loadArtist(id, name);
window.handleSearch = (event: KeyboardEvent) => window.contentManager.handleSearch(event);
