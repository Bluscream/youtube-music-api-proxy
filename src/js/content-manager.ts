import { formatNumber, formatDate } from './utils';

// Content Manager
export class ContentManager {
    private currentView: string = 'home';
    private playlists: any[] = [];
    private searchResults: any[] = [];

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
            const response = await fetch('/api/library');
            if (response.ok) {
                const data = await response.json();
                this.displayLibraryContent(data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const response = await fetch('/api/library/songs');
            if (response.ok) {
                const data = await response.json();
                this.displaySongsContent(data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const response = await fetch('/api/library/artists');
            if (response.ok) {
                const data = await response.json();
                this.displayArtistsContent(data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const response = await fetch('/api/library/albums');
            if (response.ok) {
                const data = await response.json();
                this.displayAlbumsContent(data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading albums:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Failed to load albums');
            }
        }
    }

    async loadPlaylists(): Promise<void> {
        try {
            const response = await fetch('/api/library/playlists');
            if (response.ok) {
                const data = await response.json();
                this.playlists = data.playlists || data || [];
                this.updatePlaylistsSidebar();
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
    }

    async loadPlaylist(id: string, title: string): Promise<void> {
        this.currentView = 'playlist';
        this.updateActiveNavItem('playlist');

        try {
            const response = await fetch(`/api/playlist/${id}`);
            if (response.ok) {
                const data = await response.json();
                this.displayPlaylistContent(data, title);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const response = await fetch(`/api/album/${id}`);
            if (response.ok) {
                const data = await response.json();
                this.displayAlbumContent(data, title);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const response = await fetch(`/api/artist/${id}`);
            if (response.ok) {
                const data = await response.json();
                this.displayArtistContent(data, name);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                this.displaySearchResults(data, query);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error searching:', error);
            if (window.notificationManager) {
                window.notificationManager.showErrorNotification('Search failed');
            }
        }
    }

    displayLibraryContent(data: any): void {
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

    displaySongsContent(data: any): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || data || [];
        const songsHtml = songs.map((song: any) => `
            <div class="song-item" data-song-id="${song.id || song.videoId}" 
                 data-song-name="${song.name || song.title}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}">
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name || song.title}">
                <div class="song-info">
                    <h3>${song.name || song.title}</h3>
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

    displayArtistsContent(data: any): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const artists = data.artists || data || [];
        const artistsHtml = artists.map((artist: any) => `
            <div class="artist-item" data-artist-id="${artist.browseId || artist.id}" 
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
                <div class="artists-grid">
                    ${artistsHtml}
                </div>
            </div>
        `;
    }

    displayAlbumsContent(data: any): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const albums = data.albums || data || [];
        const albumsHtml = albums.map((album: any) => `
            <div class="album-item" data-album-id="${album.browseId || album.id}" 
                 data-album-title="${album.name || album.title}">
                <img src="${album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[0].url : ''}" alt="${album.name || album.title}">
                <div class="album-info">
                    <h3>${album.name || album.title}</h3>
                    <p>${album.artists && album.artists.length > 0 ? album.artists[0].name : 'Unknown Artist'}</p>
                    <p>${album.year || ''}</p>
                </div>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <div class="albums-content">
                <h2>Your Albums (${albums.length})</h2>
                <div class="albums-grid">
                    ${albumsHtml}
                </div>
            </div>
        `;
    }

    displayPlaylistContent(data: any, title: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || data.tracks || [];
        const songsHtml = songs.map((song: any, index: number) => `
            <div class="song-item" data-song-id="${song.id || song.videoId}" 
                 data-song-name="${song.name || song.title}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}"
                 data-playlist-id="${data.id || data.playlistId}"
                 data-song-index="${index}">
                <div class="song-number">${index + 1}</div>
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name || song.title}">
                <div class="song-info">
                    <h3>${song.name || song.title}</h3>
                    <p>${song.artists && song.artists.length > 0 ? song.artists[0].name : 'Unknown Artist'}</p>
                </div>
                <div class="song-duration">${song.duration || ''}</div>
            </div>
        `).join('');

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

    displayAlbumContent(data: any, title: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || data.tracks || [];
        const songsHtml = songs.map((song: any, index: number) => `
            <div class="song-item" data-song-id="${song.id || song.videoId}" 
                 data-song-name="${song.name || song.title}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}">
                <div class="song-number">${index + 1}</div>
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name || song.title}">
                <div class="song-info">
                    <h3>${song.name || song.title}</h3>
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

    displayArtistContent(data: any, name: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const songs = data.songs || data.tracks || [];
        const songsHtml = songs.map((song: any) => `
            <div class="song-item" data-song-id="${song.id || song.videoId}" 
                 data-song-name="${song.name || song.title}" 
                 data-song-artist="${song.artists && song.artists.length > 0 ? song.artists[0].name : ''}"
                 data-song-thumbnail="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}">
                <img src="${song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''}" alt="${song.name || song.title}">
                <div class="song-info">
                    <h3>${song.name || song.title}</h3>
                    <p>${song.album || ''}</p>
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

    displaySearchResults(data: any, query: string): void {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const results = data.results || data || [];
        const resultsHtml = results.map((item: any) => {
            if (item.type === 'song') {
                return `
                    <div class="song-item" data-song-id="${item.id || item.videoId}" 
                         data-song-name="${item.name || item.title}" 
                         data-song-artist="${item.artists && item.artists.length > 0 ? item.artists[0].name : ''}"
                         data-song-thumbnail="${item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}">
                        <img src="${item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}" alt="${item.name || item.title}">
                        <div class="song-info">
                            <h3>${item.name || item.title}</h3>
                            <p>${item.artists && item.artists.length > 0 ? item.artists[0].name : 'Unknown Artist'}</p>
                        </div>
                        <div class="song-duration">${item.duration || ''}</div>
                    </div>
                `;
            } else if (item.type === 'album') {
                return `
                    <div class="album-item" data-album-id="${item.browseId || item.id}" 
                         data-album-title="${item.name || item.title}">
                        <img src="${item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}" alt="${item.name || item.title}">
                        <div class="album-info">
                            <h3>${item.name || item.title}</h3>
                            <p>${item.artists && item.artists.length > 0 ? item.artists[0].name : 'Unknown Artist'}</p>
                        </div>
                    </div>
                `;
            } else if (item.type === 'artist') {
                return `
                    <div class="artist-item" data-artist-id="${item.browseId || item.id}" 
                         data-artist-name="${item.name}">
                        <img src="${item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0].url : ''}" alt="${item.name}">
                        <div class="artist-info">
                            <h3>${item.name}</h3>
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
        const playlistsContainer = document.getElementById('playlistsContainer');
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
