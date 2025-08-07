import { getQueryParams, buildQueryString, updateURL, showLoading, showError, updateActiveNavItem } from './utils.js';

// Helper function to escape HTML content to prevent XSS
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to create a library item element
function createLibraryItem(data, type = 'song', onClick = null) {
    const item = document.createElement('div');
    item.className = 'library-item';

    if (onClick) {
        item.onclick = onClick;
    }

    // Set data attributes for songs
    if (type === 'song') {
        item.setAttribute('data-song-id', data.id || data.browseId || '');
        item.setAttribute('data-song-name', data.title || data.name || 'Unknown Title');
        item.setAttribute('data-song-artist', data.artist || data.author || '');
        item.setAttribute('data-song-thumbnail', data.thumbnails?.[0]?.url || data.thumbnail || '');
    }

    // Create thumbnail container
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'library-item-thumbnail';

    const thumbnail = data.thumbnails?.[0]?.url || data.thumbnail || '';
    if (thumbnail) {
        const img = document.createElement('img');
        img.src = thumbnail;
        img.alt = data.title || data.name || 'Unknown';
        thumbnailDiv.appendChild(img);
    } else {
        // Default icons based on type
        const defaultIcons = {
            song: '🎵',
            album: '💿',
            artist: '👤'
        };
        thumbnailDiv.textContent = defaultIcons[type] || '🎵';
    }
    item.appendChild(thumbnailDiv);

    // Create title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'library-item-title';
    titleDiv.textContent = data.title || data.name || 'Unknown';
    item.appendChild(titleDiv);

    // Create artist (for songs and albums)
    if (type !== 'artist' && (data.artist || data.author)) {
        const artistDiv = document.createElement('div');
        artistDiv.className = 'library-item-artist';
        artistDiv.textContent = data.artist || data.author;
        item.appendChild(artistDiv);
    }

    return item;
}

// Content Manager - Uses the YouTube Music API
export class ContentManager {
    constructor(ytmAPI) {
        this.api = ytmAPI;
        this.playlists = [];
        this.initialized = false;

        // Wait for API to be ready before initializing
        if (window.onApiReady) {
            window.onApiReady(() => {
                this.init();
            });
        } else {
            // Fallback: check if API is already available
            if (window.ytmAPI) {
                this.api = window.ytmAPI;
                this.init();
            } else {
                console.warn('YouTube Music API not ready for content manager, will retry...');
                this.initializeWithRetry();
            }
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create result cards programmatically
        results.forEach(result => {
            // Get the correct ID based on result type
            let songId = result.id || result.browseId || '';
            let title = result.title || result.name || 'Unknown Title';
            let artist = result.artist || result.author || '';

            // Only show playable items (songs and videos)
            const isPlayable = result.type === 'SongSearchResult' || result.type === 'VideoSearchResult';

            const thumbnail = result.thumbnails && result.thumbnails.length > 0 ? result.thumbnails[0].url : (result.thumbnail || '');

            // Create result card
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';

            if (isPlayable) {
                resultCard.setAttribute('data-song-id', songId);
                resultCard.setAttribute('data-song-name', title);
                resultCard.setAttribute('data-song-artist', artist);
                resultCard.setAttribute('data-song-thumbnail', thumbnail);
            }

            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';

            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            resultCard.appendChild(thumbnailDiv);

            // Create title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            resultCard.appendChild(titleDiv);

            // Create artist
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(artistDiv);

            // Add "Not playable" indicator if needed
            if (!isPlayable) {
                const notPlayableDiv = document.createElement('div');
                notPlayableDiv.style.fontSize = '10px';
                notPlayableDiv.style.color = '#666';
                notPlayableDiv.style.marginTop = '4px';
                notPlayableDiv.textContent = 'Not playable';
                resultCard.appendChild(notPlayableDiv);
            }

            container.appendChild(resultCard);
        });
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

            // Clear existing content
            while (playlistsList.firstChild) {
                playlistsList.removeChild(playlistsList.firstChild);
            }

            // Create playlist items programmatically
            this.playlists.forEach(playlist => {
                const playlistItem = document.createElement('div');
                playlistItem.className = 'nav-item playlist-item';
                playlistItem.onclick = () => window.contentManager.loadPlaylist(playlist.browseId, playlist.name);

                const navIcon = document.createElement('div');
                navIcon.className = 'nav-icon';
                navIcon.textContent = '📜';
                playlistItem.appendChild(navIcon);

                const navText = document.createElement('span');
                navText.className = 'nav-text';
                navText.textContent = playlist.name;
                playlistItem.appendChild(navText);

                playlistsList.appendChild(playlistItem);
            });
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create playlist header
        const playlistHeader = document.createElement('div');
        playlistHeader.className = 'playlist-header';

        const headerTitle = document.createElement('h2');
        headerTitle.textContent = playlistTitle;
        playlistHeader.appendChild(headerTitle);

        const songCount = document.createElement('p');
        songCount.textContent = `${songs.length} songs`;
        playlistHeader.appendChild(songCount);

        container.appendChild(playlistHeader);

        // Create song cards programmatically
        songs.forEach(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const artist = song.artist || song.author || '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            // Create result card
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', songId);
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);

            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';

            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            resultCard.appendChild(thumbnailDiv);

            // Create title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            resultCard.appendChild(titleDiv);

            // Create artist
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(artistDiv);

            container.appendChild(resultCard);
        });
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create library section
        const librarySection = document.createElement('div');
        librarySection.className = 'library-section';

        const libraryTitle = document.createElement('h2');
        libraryTitle.textContent = 'Your Library';
        librarySection.appendChild(libraryTitle);

        const libraryGrid = document.createElement('div');
        libraryGrid.className = 'library-grid';

        // Songs category
        const songsCategory = document.createElement('div');
        songsCategory.className = 'library-category';

        const songsTitle = document.createElement('h3');
        songsTitle.textContent = `Songs (${songs.length})`;
        songsCategory.appendChild(songsTitle);

        const songsItems = document.createElement('div');
        songsItems.className = 'library-items';

        songs.slice(0, 6).forEach(song => {
            const songItem = createLibraryItem(song, 'song');
            songsItems.appendChild(songItem);
        });
        songsCategory.appendChild(songsItems);
        libraryGrid.appendChild(songsCategory);

        // Albums category
        const albumsCategory = document.createElement('div');
        albumsCategory.className = 'library-category';

        const albumsTitle = document.createElement('h3');
        albumsTitle.textContent = `Albums (${albums.length})`;
        albumsCategory.appendChild(albumsTitle);

        const albumsItems = document.createElement('div');
        albumsItems.className = 'library-items';

        albums.slice(0, 6).forEach(album => {
            const albumItem = createLibraryItem(album, 'album', () =>
                window.contentManager.loadAlbum(album.browseId, album.title || album.name)
            );
            albumsItems.appendChild(albumItem);
        });
        albumsCategory.appendChild(albumsItems);
        libraryGrid.appendChild(albumsCategory);

        // Artists category
        const artistsCategory = document.createElement('div');
        artistsCategory.className = 'library-category';

        const artistsTitle = document.createElement('h3');
        artistsTitle.textContent = `Artists (${artists.length})`;
        artistsCategory.appendChild(artistsTitle);

        const artistsItems = document.createElement('div');
        artistsItems.className = 'library-items';

        artists.slice(0, 6).forEach(artist => {
            const artistItem = createLibraryItem(artist, 'artist', () =>
                window.contentManager.loadArtist(artist.browseId, artist.name)
            );
            artistsItems.appendChild(artistItem);
        });
        artistsCategory.appendChild(artistsItems);
        libraryGrid.appendChild(artistsCategory);

        librarySection.appendChild(libraryGrid);
        container.appendChild(librarySection);
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create library section
        const librarySection = document.createElement('div');
        librarySection.className = 'library-section';

        const libraryTitle = document.createElement('h2');
        libraryTitle.textContent = `Your Songs (${songs.length})`;
        librarySection.appendChild(libraryTitle);

        const libraryGrid = document.createElement('div');
        libraryGrid.className = 'library-grid';

        // Create song items
        songs.forEach(song => {
            const songItem = createLibraryItem(song, 'song');
            libraryGrid.appendChild(songItem);
        });

        librarySection.appendChild(libraryGrid);
        container.appendChild(librarySection);
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create library section
        const librarySection = document.createElement('div');
        librarySection.className = 'library-section';

        const libraryTitle = document.createElement('h2');
        libraryTitle.textContent = `Your Artists (${artists.length})`;
        librarySection.appendChild(libraryTitle);

        const libraryGrid = document.createElement('div');
        libraryGrid.className = 'library-grid';

        // Create artist items
        artists.forEach(artist => {
            const artistItem = createLibraryItem(artist, 'artist', () =>
                window.contentManager.loadArtist(artist.browseId, artist.name)
            );
            libraryGrid.appendChild(artistItem);
        });

        librarySection.appendChild(libraryGrid);
        container.appendChild(librarySection);
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create library section
        const librarySection = document.createElement('div');
        librarySection.className = 'library-section';

        const libraryTitle = document.createElement('h2');
        libraryTitle.textContent = `Your Albums (${albums.length})`;
        librarySection.appendChild(libraryTitle);

        const libraryGrid = document.createElement('div');
        libraryGrid.className = 'library-grid';

        // Create album items
        albums.forEach(album => {
            const albumItem = createLibraryItem(album, 'album', () =>
                window.contentManager.loadAlbum(album.browseId, album.title || album.name)
            );
            libraryGrid.appendChild(albumItem);
        });

        librarySection.appendChild(libraryGrid);
        container.appendChild(librarySection);
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create album header
        const albumHeader = document.createElement('div');
        albumHeader.className = 'album-header';

        const albumTitleElement = document.createElement('h2');
        albumTitleElement.textContent = albumTitle;
        albumHeader.appendChild(albumTitleElement);

        const songCount = document.createElement('p');
        songCount.textContent = `${songs.length} songs`;
        albumHeader.appendChild(songCount);

        container.appendChild(albumHeader);

        // Create song cards
        songs.forEach(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const artist = song.artist || song.author || '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            // Create result card
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', songId);
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artist);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);

            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';

            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            resultCard.appendChild(thumbnailDiv);

            // Create title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            resultCard.appendChild(titleDiv);

            // Create artist
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artist;
            resultCard.appendChild(artistDiv);

            container.appendChild(resultCard);
        });
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

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Create artist header
        const artistHeader = document.createElement('div');
        artistHeader.className = 'artist-header';

        const artistTitle = document.createElement('h2');
        artistTitle.textContent = artistName;
        artistHeader.appendChild(artistTitle);

        container.appendChild(artistHeader);

        // Create artist songs section
        const artistSongs = document.createElement('div');
        artistSongs.className = 'artist-songs';

        const songsTitle = document.createElement('h3');
        songsTitle.textContent = `Songs (${songs.length})`;
        artistSongs.appendChild(songsTitle);

        // Create song cards
        songs.forEach(song => {
            const songId = song.id || song.browseId || '';
            const title = song.title || song.name || 'Unknown Title';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : (song.thumbnail || '');

            // Create result card
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.setAttribute('data-song-id', songId);
            resultCard.setAttribute('data-song-name', title);
            resultCard.setAttribute('data-song-artist', artistName);
            resultCard.setAttribute('data-song-thumbnail', thumbnail);

            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';

            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '🎵';
            }
            resultCard.appendChild(thumbnailDiv);

            // Create title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            resultCard.appendChild(titleDiv);

            // Create artist
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artistName;
            resultCard.appendChild(artistDiv);

            artistSongs.appendChild(resultCard);
        });

        container.appendChild(artistSongs);

        // Create artist albums section
        const artistAlbums = document.createElement('div');
        artistAlbums.className = 'artist-albums';

        const albumsTitle = document.createElement('h3');
        albumsTitle.textContent = `Albums (${albums.length})`;
        artistAlbums.appendChild(albumsTitle);

        // Create album cards
        albums.forEach(album => {
            const albumId = album.browseId || '';
            const title = album.title || album.name || 'Unknown Album';
            const thumbnail = album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[0].url : (album.thumbnail || '');

            // Create result card
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.onclick = () => window.contentManager.loadAlbum(albumId, title);

            // Create thumbnail container
            const thumbnailDiv = document.createElement('div');
            thumbnailDiv.className = 'result-thumbnail';

            if (thumbnail) {
                const img = document.createElement('img');
                img.src = thumbnail;
                img.alt = title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '4px';
                thumbnailDiv.appendChild(img);
            } else {
                thumbnailDiv.textContent = '💿';
            }
            resultCard.appendChild(thumbnailDiv);

            // Create title
            const titleDiv = document.createElement('div');
            titleDiv.className = 'result-title';
            titleDiv.textContent = title;
            resultCard.appendChild(titleDiv);

            // Create artist
            const artistDiv = document.createElement('div');
            artistDiv.className = 'result-artist';
            artistDiv.textContent = artistName;
            resultCard.appendChild(artistDiv);

            artistAlbums.appendChild(resultCard);
        });

        container.appendChild(artistAlbums);
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

// Create global instance when API is ready
window.onApiReady(() => {
    window.contentManager = new ContentManager(window.ytmAPI);

    // Global functions for onclick handlers
    window.loadLibrary = (event) => window.contentManager.loadLibrary(event);
    window.loadSongs = (event) => window.contentManager.loadSongs(event);
    window.loadArtists = (event) => window.contentManager.loadArtists(event);
    window.loadAlbums = (event) => window.contentManager.loadAlbums(event);
    window.loadHome = (event) => window.contentManager.loadHome(event);
    window.loadExplore = (event) => window.contentManager.loadExplore(event);
    window.handleSearch = (event) => window.contentManager.handleSearch(event);
});
