import { getQueryParams, buildQueryString, updateURL, showLoading, showError, updateActiveNavItem } from './utils.js';

// Helper function to escape HTML content to prevent XSS
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Content Manager - Uses the YouTube Music API
export class ContentManager {
    constructor(ytmAPI) {
        this.api = ytmAPI;
        this.playlists = [];
        this.initialized = false;

        // Check if API is available
        if (!this.api) {
            console.warn('YouTube Music API not ready for content manager, will retry...');
            this.initializeWithRetry();
        } else {
            this.init();
        }
    }

    initializeWithRetry(maxRetries = 10, retryDelay = 200) {
        let retryCount = 0;
        
        const attemptInit = () => {
            if (window.ytmAPI) {
                this.api = window.ytmAPI;
                this.init();
                return;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`Content Manager: API not ready, retrying in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
                setTimeout(attemptInit, retryDelay);
            } else {
                console.error('Content Manager: Failed to initialize after maximum retries');
                this.initialized = false;
            }
        };
        
        attemptInit();
    }

    init() {
        // Initialize content manager
        console.log('Content Manager initialized with YouTube Music API');
        this.initialized = true;
    }

    // Search functionality
    handleSearch(event) {
        if (event.key === 'Enter') {
            const query = event.target.value.trim();
            if (query) {
                this.performSearch(query);
            }
        }
    }

    async performSearch(query) {
        if (!this.api || !this.initialized) {
            console.error('Content manager not initialized or API not available');
            showError('Content manager not ready. Please try again.');
            return;
        }

        showLoading();
        try {
            const data = await this.api.search(query);
            console.log('Search results:', data.results); // Debug log
            this.displaySearchResults(data.results || []);
        } catch (error) {
            console.error('Search error:', error); // Debug log
            showError(error.message || 'Search failed');
        }
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        if (!container || !welcomeSection || !libraryContent) {
            console.error('Required DOM elements not found for search results display');
            return;
        }

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';

        container.innerHTML = results.map(result => {
            // Get the correct ID based on result type
            let songId = result.id || result.browseId || '';
            let title = result.title || result.name || 'Unknown Title';
            let artist = result.artist || result.author || '';

            // Only show playable items (songs and videos)
            const isPlayable = result.type === 'SongSearchResult' || result.type === 'VideoSearchResult';

            const thumbnail = result.thumbnails && result.thumbnails.length > 0 ? result.thumbnails[0].url : (result.thumbnail || '');

            return `
                <div class="result-card" ${isPlayable ? `data-song-id="${escapeHtml(songId)}" data-song-name="${escapeHtml(title)}" data-song-artist="${escapeHtml(artist)}" data-song-thumbnail="${escapeHtml(thumbnail)}"` : ''}>
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="result-title">${escapeHtml(title)}</div>
                    <div class="result-artist">${escapeHtml(artist)}</div>
                    ${!isPlayable ? '<div style="font-size: 10px; color: #666; margin-top: 4px;">Not playable</div>' : ''}
                </div>
            `;
        }).join('');
    }

    // Library navigation
    loadLibrary(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to library
        updateURL({ playlist: null, song: null });
        this.loadLibraryData();
    }

    loadSongs(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to songs
        updateURL({ playlist: null, song: null });
        this.loadSongsData();
    }

    loadArtists(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to artists
        updateURL({ playlist: null, song: null });
        this.loadArtistsData();
    }

    loadAlbums(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to albums
        updateURL({ playlist: null, song: null });
        this.loadAlbumsData();
    }

    loadHome(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to home
        updateURL({ playlist: null, song: null });
        this.showWelcomeScreen();
    }

    loadExplore(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to explore
        updateURL({ playlist: null, song: null });
        this.showExploreScreen();
    }

    async loadLibraryData() {
        if (!this.api || !this.initialized) {
            console.error('Content manager not initialized or API not available');
            showError('Content manager not ready. Please try again.');
            return;
        }

        showLoading();
        try {
            const libraryData = await this.api.getLibrary();
            this.displayLibraryContent(libraryData);
        } catch (error) {
            console.error('Error loading library:', error);
            showError('Failed to load library. Please check your authentication.');
        }
    }

    async loadSongsData() {
        showLoading();
        try {
            const libraryData = await this.api.getLibrarySongs();
            this.displaySongsContent(libraryData);
        } catch (error) {
            console.error('Error loading songs:', error);
            showError('Failed to load songs. Please check your authentication.');
        }
    }

    async loadArtistsData() {
        showLoading();
        try {
            const libraryData = await this.api.getLibraryArtists();
            this.displayArtistsContent(libraryData);
        } catch (error) {
            console.error('Error loading artists:', error);
            showError('Failed to load artists. Please check your authentication.');
        }
    }

    async loadAlbumsData() {
        showLoading();
        try {
            const libraryData = await this.api.getLibraryAlbums();
            this.displayAlbumsContent(libraryData);
        } catch (error) {
            console.error('Error loading albums:', error);
            showError('Failed to load albums. Please check your authentication.');
        }
    }

    async loadPlaylists() {
        if (!this.api || !this.initialized) {
            console.error('Content manager not initialized or API not available for playlists');
            return;
        }

        try {
            const playlistsData = await this.api.getLibraryPlaylists();
            this.playlists = playlistsData.playlists || [];
            this.displayPlaylistsInSidebar();
        } catch (error) {
            console.error('Error loading playlists:', error);
            // Don't show error for playlists as they're loaded in background
        }
    }

    displayPlaylistsInSidebar() {
        const playlistsSection = document.getElementById('playlistsSection');
        const playlistsList = document.getElementById('playlistsList');

        if (!playlistsSection || !playlistsList) {
            console.error('Required DOM elements not found for playlists sidebar');
            return;
        }

        if (this.playlists.length > 0) {
            playlistsSection.style.display = 'block';
            playlistsList.innerHTML = this.playlists.map(playlist => `
                <div class="nav-item playlist-item" onclick="window.contentManager.loadPlaylist('${escapeHtml(playlist.browseId)}', '${escapeHtml(playlist.name)}')">
                    <div class="nav-icon">📜</div>
                    <span class="nav-text">${escapeHtml(playlist.name)}</span>
                </div>
            `).join('');
        } else {
            playlistsSection.style.display = 'none';
        }
    }

    async loadPlaylist(playlistId, playlistTitle) {
        showLoading();
        try {
            const playlistData = await this.api.getPlaylist(playlistId);
            this.displayPlaylistContent(playlistData, playlistTitle);

            // Update URL
            updateURL({ playlist: playlistId, song: null });
        } catch (error) {
            console.error('Error loading playlist:', error);
            showError('Failed to load playlist');
        }
    }

    displayPlaylistContent(playlistData, playlistTitle) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        if (!container || !welcomeSection || !libraryContent) {
            console.error('Required DOM elements not found for playlist display');
            return;
        }

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';

        const songs = playlistData.songs || [];

        container.innerHTML = `
            <div class="playlist-header">
                <h2>${escapeHtml(playlistTitle)}</h2>
                <p>${songs.length} songs</p>
            </div>
            ${songs.map(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const artist = song.artist || song.author || '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            return `
                    <div class="result-card" data-song-id="${escapeHtml(songId)}" data-song-name="${escapeHtml(title)}" data-song-artist="${escapeHtml(artist)}" data-song-thumbnail="${escapeHtml(thumbnail)}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                        </div>
                        <div class="result-title">${escapeHtml(title)}</div>
                        <div class="result-artist">${escapeHtml(artist)}</div>
                    </div>
                `;
        }).join('')}
        `;
    }

    displayLibraryContent(libraryData) {
        const container = document.getElementById('libraryContent');
        const welcomeSection = document.querySelector('.welcome-section');
        const searchResults = document.getElementById('searchResults');

        if (!container || !welcomeSection || !searchResults) {
            console.error('Required DOM elements not found for library display');
            return;
        }

        welcomeSection.style.display = 'none';
        searchResults.style.display = 'none';
        container.style.display = 'block';

        const songs = libraryData.songs || [];
        const albums = libraryData.albums || [];
        const artists = libraryData.artists || [];

        container.innerHTML = `
            <div class="library-section">
                <h2>Your Library</h2>
                <div class="library-grid">
                    <div class="library-category">
                        <h3>Songs (${songs.length})</h3>
                        <div class="library-items">
                            ${songs.slice(0, 6).map(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const artist = song.artist || song.author || '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            return `
                                    <div class="library-item" data-song-id="${escapeHtml(songId)}" data-song-name="${escapeHtml(title)}" data-song-artist="${escapeHtml(artist)}" data-song-thumbnail="${escapeHtml(thumbnail)}">
                                        <div class="library-item-thumbnail">
                                            ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}">` : '🎵'}
                                        </div>
                                        <div class="library-item-title">${escapeHtml(title)}</div>
                                        <div class="library-item-artist">${escapeHtml(artist)}</div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                    <div class="library-category">
                        <h3>Albums (${albums.length})</h3>
                        <div class="library-items">
                            ${albums.slice(0, 6).map(album => {
            const albumId = album.browseId || '';
            const title = album.title || album.name || 'Unknown Album';
            const artist = album.artist || album.author || '';
            const thumbnail = album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[0].url : (album.thumbnail || '');

            return `
                                    <div class="library-item" onclick="window.contentManager.loadAlbum('${escapeHtml(albumId)}', '${escapeHtml(title)}')">
                                        <div class="library-item-thumbnail">
                                            ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}">` : '💿'}
                                        </div>
                                        <div class="library-item-title">${escapeHtml(title)}</div>
                                        <div class="library-item-artist">${escapeHtml(artist)}</div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                    <div class="library-category">
                        <h3>Artists (${artists.length})</h3>
                        <div class="library-items">
                            ${artists.slice(0, 6).map(artist => {
            const artistId = artist.browseId || '';
            const name = artist.name || 'Unknown Artist';
            const thumbnail = artist.thumbnails && artist.thumbnails.length > 0 ? artist.thumbnails[0].url : (artist.thumbnail || '');

            return `
                                    <div class="library-item" onclick="window.contentManager.loadArtist('${escapeHtml(artistId)}', '${escapeHtml(name)}')">
                                        <div class="library-item-thumbnail">
                                            ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(name)}">` : '👤'}
                                        </div>
                                        <div class="library-item-title">${escapeHtml(name)}</div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    displaySongsContent(libraryData) {
        const container = document.getElementById('libraryContent');
        const welcomeSection = document.querySelector('.welcome-section');
        const searchResults = document.getElementById('searchResults');

        if (!container || !welcomeSection || !searchResults) {
            console.error('Required DOM elements not found for songs display');
            return;
        }

        welcomeSection.style.display = 'none';
        searchResults.style.display = 'none';
        container.style.display = 'block';

        const songs = libraryData.songs || [];

        container.innerHTML = `
            <div class="library-section">
                <h2>Your Songs (${songs.length})</h2>
                <div class="library-grid">
                    ${songs.map(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const artist = song.artist || song.author || '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            return `
                            <div class="library-item" data-song-id="${escapeHtml(songId)}" data-song-name="${escapeHtml(title)}" data-song-artist="${escapeHtml(artist)}" data-song-thumbnail="${escapeHtml(thumbnail)}">
                                <div class="library-item-thumbnail">
                                    ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}">` : '🎵'}
                                </div>
                                <div class="library-item-title">${escapeHtml(title)}</div>
                                <div class="library-item-artist">${escapeHtml(artist)}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    displayArtistsContent(libraryData) {
        const container = document.getElementById('libraryContent');
        const welcomeSection = document.querySelector('.welcome-section');
        const searchResults = document.getElementById('searchResults');

        if (!container || !welcomeSection || !searchResults) {
            console.error('Required DOM elements not found for artists display');
            return;
        }

        welcomeSection.style.display = 'none';
        searchResults.style.display = 'none';
        container.style.display = 'block';

        const artists = libraryData.artists || [];

        container.innerHTML = `
            <div class="library-section">
                <h2>Your Artists (${artists.length})</h2>
                <div class="library-grid">
                    ${artists.map(artist => {
            const artistId = artist.browseId || '';
            const name = artist.name || 'Unknown Artist';
            const thumbnail = artist.thumbnails && artist.thumbnails.length > 0 ? artist.thumbnails[0].url : (artist.thumbnail || '');

            return `
                            <div class="library-item" onclick="window.contentManager.loadArtist('${escapeHtml(artistId)}', '${escapeHtml(name)}')">
                                <div class="library-item-thumbnail">
                                    ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(name)}">` : '👤'}
                                </div>
                                <div class="library-item-title">${escapeHtml(name)}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    displayAlbumsContent(libraryData) {
        const container = document.getElementById('libraryContent');
        const welcomeSection = document.querySelector('.welcome-section');
        const searchResults = document.getElementById('searchResults');

        if (!container || !welcomeSection || !searchResults) {
            console.error('Required DOM elements not found for albums display');
            return;
        }

        welcomeSection.style.display = 'none';
        searchResults.style.display = 'none';
        container.style.display = 'block';

        const albums = libraryData.albums || [];

        container.innerHTML = `
            <div class="library-section">
                <h2>Your Albums (${albums.length})</h2>
                <div class="library-grid">
                    ${albums.map(album => {
            const albumId = album.browseId || '';
            const title = album.title || album.name || 'Unknown Album';
            const artist = album.artist || album.author || '';
            const thumbnail = album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[0].url : (album.thumbnail || '');

            return `
                            <div class="library-item" onclick="window.contentManager.loadAlbum('${escapeHtml(albumId)}', '${escapeHtml(title)}')">
                                <div class="library-item-thumbnail">
                                    ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}">` : '💿'}
                                </div>
                                <div class="library-item-title">${escapeHtml(title)}</div>
                                <div class="library-item-artist">${escapeHtml(artist)}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    async loadAlbum(browseId, albumTitle) {
        showLoading();
        try {
            const albumData = await this.api.getAlbumInfo(browseId);
            this.displayAlbumContent(albumData, albumTitle);

            // Update URL
            updateURL({ album: browseId, song: null });
        } catch (error) {
            console.error('Error loading album:', error);
            showError('Failed to load album');
        }
    }

    async loadArtist(browseId, artistName) {
        showLoading();
        try {
            const artistData = await this.api.getArtistInfo(browseId);
            this.displayArtistContent(artistData, artistName);

            // Update URL
            updateURL({ artist: browseId, song: null });
        } catch (error) {
            console.error('Error loading artist:', error);
            showError('Failed to load artist');
        }
    }

    displayAlbumContent(albumData, albumTitle) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        if (!container || !welcomeSection || !libraryContent) {
            console.error('Required DOM elements not found for album display');
            return;
        }

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';

        const songs = albumData.songs || [];

        container.innerHTML = `
            <div class="album-header">
                <h2>${escapeHtml(albumTitle)}</h2>
                <p>${songs.length} songs</p>
            </div>
            ${songs.map(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const artist = song.artist || song.author || '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            return `
                    <div class="result-card" data-song-id="${escapeHtml(songId)}" data-song-name="${escapeHtml(title)}" data-song-artist="${escapeHtml(artist)}" data-song-thumbnail="${escapeHtml(thumbnail)}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                        </div>
                        <div class="result-title">${escapeHtml(title)}</div>
                        <div class="result-artist">${escapeHtml(artist)}</div>
                    </div>
                `;
        }).join('')}
        `;
    }

    displayArtistContent(artistData, artistName) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        if (!container || !welcomeSection || !libraryContent) {
            console.error('Required DOM elements not found for artist display');
            return;
        }

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';

        const songs = artistData.songs || [];
        const albums = artistData.albums || [];

        container.innerHTML = `
            <div class="artist-header">
                <h2>${escapeHtml(artistName)}</h2>
            </div>
            <div class="artist-songs">
                <h3>Songs (${songs.length})</h3>
                ${songs.map(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            return `
                        <div class="result-card" data-song-id="${escapeHtml(songId)}" data-song-name="${escapeHtml(title)}" data-song-artist="${escapeHtml(artistName)}" data-song-thumbnail="${escapeHtml(thumbnail)}">
                            <div class="result-thumbnail">
                                ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                            </div>
                            <div class="result-title">${escapeHtml(title)}</div>
                            <div class="result-artist">${escapeHtml(artistName)}</div>
                        </div>
                    `;
        }).join('')}
            </div>
            <div class="artist-albums">
                <h3>Albums (${albums.length})</h3>
                ${albums.map(album => {
            const albumId = album.browseId || '';
            const title = album.title || album.name || 'Unknown Album';
            const thumbnail = album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[0].url : (album.thumbnail || '');

            return `
                        <div class="result-card" onclick="window.contentManager.loadAlbum('${escapeHtml(albumId)}', '${escapeHtml(title)}')">
                            <div class="result-thumbnail">
                                ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '💿'}
                            </div>
                            <div class="result-title">${escapeHtml(title)}</div>
                            <div class="result-artist">${escapeHtml(artistName)}</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    showWelcomeScreen() {
        const welcomeSection = document.querySelector('.welcome-section');
        const searchResults = document.getElementById('searchResults');
        const libraryContent = document.getElementById('libraryContent');

        if (!welcomeSection || !searchResults || !libraryContent) {
            console.error('Required DOM elements not found for welcome screen');
            return;
        }

        welcomeSection.style.display = 'block';
        searchResults.style.display = 'none';
        libraryContent.style.display = 'none';
    }

    showExploreScreen() {
        // For now, just show the welcome screen
        this.showWelcomeScreen();
    }
}

// Create global instance
window.contentManager = new ContentManager(window.ytmAPI);

// Global functions for onclick handlers
window.loadLibrary = (event) => window.contentManager.loadLibrary(event);
window.loadSongs = (event) => window.contentManager.loadSongs(event);
window.loadArtists = (event) => window.contentManager.loadArtists(event);
window.loadAlbums = (event) => window.contentManager.loadAlbums(event);
window.loadHome = (event) => window.contentManager.loadHome(event);
window.loadExplore = (event) => window.contentManager.loadExplore(event);
window.handleSearch = (event) => window.contentManager.handleSearch(event);
