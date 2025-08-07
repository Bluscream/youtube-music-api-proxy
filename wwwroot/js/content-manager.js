import { getQueryParams, buildQueryString, updateURL, showLoading, showError, updateActiveNavItem } from './utils.js';

// Content Manager
export class ContentManager {
    constructor() {
        this.playlists = [];
        this.init();
    }

    init() {
        // Initialize content manager
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
        showLoading();
        try {
            const queryParams = getQueryParams();
            queryParams.query = query;
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/search?${queryString}`);
            const data = await response.json();

            if (response.ok) {
                console.log('Search results:', data.results); // Debug log
                this.displaySearchResults(data.results || []);
            } else {
                showError(data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error); // Debug log
            showError('Network error');
        }
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

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
                <div class="result-card" ${isPlayable ? `data-song-id="${songId}" data-song-name="${title}" data-song-artist="${artist}" data-song-thumbnail="${thumbnail}"` : ''}>
                    <div class="result-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-artist">${artist}</div>
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
            // Only clear URL parameters when explicitly navigating to home
            updateURL({ playlist: null, song: null });
        }

        document.querySelector('.welcome-section').style.display = 'block';
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('libraryContent').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
    }

    loadExplore(event) {
        if (event && event.target) {
            updateActiveNavItem(event.target.closest('.nav-item'));
        }
        // Clear URL parameters when going to explore
        updateURL({ playlist: null, song: null });

        // TODO: Implement explore loading
        document.querySelector('.welcome-section').style.display = 'block';
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('libraryContent').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
    }

    // Library data loading
    async loadLibraryData() {
        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/library?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displayLibraryContent(data);
            } else {
                showError('Failed to load library. Please check your authentication.');
            }
        } catch (error) {
            console.error('Library error:', error);
            showError('Failed to load library');
        }
    }

    async loadSongsData() {
        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/library/songs?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displaySongsContent(data);
            } else {
                showError('Failed to load songs. Please check your authentication.');
            }
        } catch (error) {
            console.error('Songs error:', error);
            showError('Failed to load songs');
        }
    }

    async loadArtistsData() {
        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/library/artists?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displayArtistsContent(data);
            } else {
                showError('Failed to load artists. Please check your authentication.');
            }
        } catch (error) {
            console.error('Artists error:', error);
            showError('Failed to load artists');
        }
    }

    async loadAlbumsData() {
        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/library/albums?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displayAlbumsContent(data);
            } else {
                showError('Failed to load albums. Please check your authentication.');
            }
        } catch (error) {
            console.error('Albums error:', error);
            showError('Failed to load albums');
        }
    }

    // Playlist management
    async loadPlaylists() {
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/library/playlists?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.playlists = data.playlists || [];
                this.displayPlaylistsInSidebar();

                if (this.playlists.length > 0) {
                    // showSuccessNotification(`Loaded ${this.playlists.length} playlist${this.playlists.length > 1 ? 's' : ''}`);
                }
            }
        } catch (error) {
            console.error('Playlists error:', error);
            window.notificationManager.showErrorNotification('Failed to load playlists');
        }
    }

    displayPlaylistsInSidebar() {
        const playlistsSection = document.getElementById('playlistsSection');
        const playlistsList = document.getElementById('playlistsList');

        if (this.playlists.length > 0) {
            playlistsSection.style.display = 'block';
            playlistsList.innerHTML = this.playlists.map(playlist => {
                const title = playlist.name || playlist.title || 'Unknown Playlist';

                // Get playlist thumbnail - try different possible properties
                const thumbnail = playlist.thumbnail ||
                    (playlist.thumbnails && playlist.thumbnails.length > 0 ? playlist.thumbnails[0].url : null) ||
                    (playlist.art && playlist.art.sources && playlist.art.sources.length > 0 ? playlist.art.sources[0].url : null);

                // Check if this playlist is currently active
                const isActive = window.playerManager.currentPlaylist === (playlist.id || '');
                const activeClass = isActive ? ' active' : '';

                return `
                    <div class="playlist-item${activeClass}" data-playlist-id="${playlist.id || ''}" data-playlist-title="${title}">
                        <div class="playlist-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${title}">` : '📋'}
                        </div>
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                            <div style="font-size: 12px; color: ${isActive ? '#000000' : '#666'}; opacity: ${isActive ? '0.7' : '1'};">
                                ${playlist.songCount || 0} songs
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            playlistsSection.style.display = 'none';
        }
    }

    async loadPlaylist(playlistId, playlistTitle) {
        // Close mobile menu after playlist selection
        if (window.sidebarManager && window.sidebarManager.isMobile && window.sidebarManager.isMobileMenuOpen) {
            window.sidebarManager.toggle();
        }

        // Update URL with playlist parameter
        updateURL({ playlist: playlistId, song: null });

        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/playlist/${playlistId}?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displayPlaylistContent(data, playlistTitle);

                // Update current playlist and highlight it in sidebar
                window.playerManager.setCurrentPlaylist(playlistId);
                window.playerManager.highlightCurrentPlaylist();
            } else {
                showError('Failed to load playlist');
            }
        } catch (error) {
            console.error('Playlist error:', error);
            showError('Failed to load playlist');
        }
    }

    displayPlaylistContent(playlistData, playlistTitle) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'block'; // Changed from 'grid' to 'block' for list layout

        // Store playlist information for queue management
        const playlistId = playlistData.id || playlistData.browseId || '';
        const songs = playlistData.songs || [];
        
        window.playerManager.setCurrentPlaylist(playlistId);
        window.playerManager.setCurrentPlaylistSongs(songs);

        // Initialize shuffle order if shuffle is enabled
        if (window.playerManager.shuffleEnabled && songs.length > 0) {
            window.playerManager.createShuffledOrder();
        }

        // Highlight the current playlist in sidebar
        window.playerManager.highlightCurrentPlaylist();

        // Add playlist header
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin-bottom: 8px;">${playlistTitle}</h2>
                <p style="color: #b3b3b3; margin: 0;">${songs.length} songs</p>
            </div>
        `;

        // Add playlist songs as a list
        if (songs.length > 0) {
            container.innerHTML += `
                <div class="playlist-songs-list">
                    ${songs.map((song, index) => {
                const title = song.name || song.title || 'Unknown Title';
                const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                // Check if this song is currently playing
                const isCurrentlyPlaying = window.playerManager.currentSongId === (song.id || '') && window.playerManager.currentPlaylist === playlistId;
                const playingClass = isCurrentlyPlaying ? ' playing' : '';

                return `
                            <div class="playlist-song-item${playingClass}" data-song-id="${song.id || ''}" data-song-name="${title}" data-song-artist="${artist}" data-song-thumbnail="${thumbnail}" data-playlist-id="${playlistId}" data-song-index="${index}">
                                <div class="playlist-song-thumbnail">
                                    ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                                </div>
                                <div class="playlist-song-info">
                                    <div class="playlist-song-title">${title}</div>
                                    <div class="playlist-song-artist">${artist}</div>
                                </div>
                                <div class="playlist-song-number">${index + 1}</div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        } else {
            container.innerHTML += '<div style="text-align: center; color: #b3b3b3;">No songs in this playlist</div>';
        }
    }

    // Content display methods
    displayLibraryContent(libraryData) {
        const libraryContent = document.getElementById('libraryContent');
        const welcomeSection = document.querySelector('.welcome-section');
        const searchResults = document.getElementById('searchResults');

        welcomeSection.style.display = 'none';
        searchResults.style.display = 'none';
        libraryContent.style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        // Display songs
        const songsContainer = document.getElementById('librarySongs');
        const songsSection = songsContainer.parentElement;
        if (libraryData.songs && libraryData.songs.length > 0) {
            songsSection.style.display = 'block';
            songsContainer.innerHTML = libraryData.songs.slice(0, 10).map(song => {
                const title = song.name || song.title || 'Unknown Title';
                const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                return `
                    <div class="library-item" data-song-id="${song.id || ''}" data-song-name="${title}" data-song-artist="${artist}" data-song-thumbnail="${thumbnail}">
                        <div class="library-item-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                        </div>
                        <div class="library-item-info">
                            <div class="library-item-title">${title}</div>
                            <div class="library-item-subtitle">${artist}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            songsSection.style.display = 'none';
        }

        // Display albums
        const albumsContainer = document.getElementById('libraryAlbums');
        const albumsSection = albumsContainer.parentElement;
        if (libraryData.albums && libraryData.albums.length > 0) {
            albumsSection.style.display = 'block';
            albumsContainer.innerHTML = libraryData.albums.slice(0, 10).map(album => {
                const title = album.name || album.title || 'Unknown Album';
                const artist = album.artist || '';

                return `
                    <div class="library-item" data-album-id="${album.browseId || ''}" data-album-title="${title}">
                        <div class="library-item-thumbnail">
                            ${album.thumbnail ? `<img src="${album.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '💿'}
                        </div>
                        <div class="library-item-info">
                            <div class="library-item-title">${title}</div>
                            <div class="library-item-subtitle">${artist}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            albumsSection.style.display = 'none';
        }

        // Display artists
        const artistsContainer = document.getElementById('libraryArtists');
        const artistsSection = artistsContainer.parentElement;
        if (libraryData.artists && libraryData.artists.length > 0) {
            artistsSection.style.display = 'block';
            artistsContainer.innerHTML = libraryData.artists.slice(0, 10).map(artist => {
                const name = artist.name || 'Unknown Artist';
                const subscribers = artist.subscribers || '';

                return `
                    <div class="library-item" data-artist-id="${artist.browseId || ''}" data-artist-name="${name}">
                        <div class="library-item-thumbnail">
                            ${artist.thumbnail ? `<img src="${artist.thumbnail}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '👤'}
                        </div>
                        <div class="library-item-info">
                            <div class="library-item-title">${name}</div>
                            <div class="library-item-subtitle">${subscribers}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            artistsSection.style.display = 'none';
        }
    }

    displaySongsContent(libraryData) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        // Add songs header
        container.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin-bottom: 8px;">Your Songs</h2>
                <p style="color: #b3b3b3; margin: 0;">${libraryData.songs?.length || 0} songs</p>
            </div>
        `;

        // Display songs
        if (libraryData.songs && libraryData.songs.length > 0) {
            container.innerHTML += libraryData.songs.map(song => {
                const title = song.name || song.title || 'Unknown Title';
                const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                return `
                    <div class="result-card" data-song-id="${song.id || ''}" data-song-name="${title}" data-song-artist="${artist}" data-song-thumbnail="${thumbnail}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                        </div>
                        <div class="result-title">${title}</div>
                        <div class="result-artist">${artist}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs in your library</div>';
        }
    }

    displayArtistsContent(libraryData) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        // Add artists header
        container.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin-bottom: 8px;">Your Artists</h2>
                <p style="color: #b3b3b3; margin: 0;">${libraryData.artists?.length || 0} artists</p>
            </div>
        `;

        // Display artists
        if (libraryData.artists && libraryData.artists.length > 0) {
            container.innerHTML += libraryData.artists.map(artist => {
                const name = artist.name || 'Unknown Artist';
                const subscribers = artist.subscribers || '';
                const thumbnail = artist.thumbnail || '';

                return `
                    <div class="result-card" data-artist-id="${artist.browseId || ''}" data-artist-name="${name}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '👤'}
                        </div>
                        <div class="result-title">${name}</div>
                        <div class="result-artist">${subscribers}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No artists in your library</div>';
        }
    }

    displayAlbumsContent(libraryData) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        // Add albums header
        container.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin-bottom: 8px;">Your Albums</h2>
                <p style="color: #b3b3b3; margin: 0;">${libraryData.albums?.length || 0} albums</p>
            </div>
        `;

        // Display albums
        if (libraryData.albums && libraryData.albums.length > 0) {
            container.innerHTML += libraryData.albums.map(album => {
                const title = album.name || album.title || 'Unknown Album';
                const artist = album.artist || '';
                const thumbnail = album.thumbnail || '';

                return `
                    <div class="result-card" data-album-id="${album.browseId || ''}" data-album-title="${title}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '💿'}
                        </div>
                        <div class="result-title">${title}</div>
                        <div class="result-artist">${artist}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No albums in your library</div>';
        }
    }

    // Album and artist loading
    async loadAlbum(browseId, albumTitle) {
        // Close mobile menu after album selection
        if (window.sidebarManager && window.sidebarManager.isMobile && window.sidebarManager.isMobileMenuOpen) {
            window.sidebarManager.toggle();
        }

        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/album/${browseId}?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displayAlbumContent(data, albumTitle);
            } else {
                showError('Failed to load album');
            }
        } catch (error) {
            console.error('Album error:', error);
            showError('Failed to load album');
        }
    }

    async loadArtist(browseId, artistName) {
        // Close mobile menu after artist selection
        if (window.sidebarManager && window.sidebarManager.isMobile && window.sidebarManager.isMobileMenuOpen) {
            window.sidebarManager.toggle();
        }

        showLoading();
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);

            const response = await fetch(`/api/artist/${browseId}?${queryString}`);
            if (response.ok) {
                const data = await response.json();
                this.displayArtistContent(data, artistName);
            } else {
                showError('Failed to load artist');
            }
        } catch (error) {
            console.error('Artist error:', error);
            showError('Failed to load artist');
        }
    }

    displayAlbumContent(albumData, albumTitle) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';

        // Add album header
        container.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin-bottom: 8px;">${albumTitle}</h2>
                <p style="color: #b3b3b3; margin: 0;">${albumData.songs?.length || 0} songs</p>
            </div>
        `;

        // Add album songs
        if (albumData.songs && albumData.songs.length > 0) {
            container.innerHTML += albumData.songs.map(song => {
                const title = song.name || song.title || 'Unknown Title';
                const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                return `
                    <div class="result-card" data-song-id="${song.id || ''}" data-song-name="${title}" data-song-artist="${artist}" data-song-thumbnail="${thumbnail}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                        </div>
                        <div class="result-title">${title}</div>
                        <div class="result-artist">${artist}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs in this album</div>';
        }
    }

    displayArtistContent(artistData, artistName) {
        const container = document.getElementById('searchResults');
        const welcomeSection = document.querySelector('.welcome-section');
        const libraryContent = document.getElementById('libraryContent');

        welcomeSection.style.display = 'none';
        libraryContent.style.display = 'none';
        container.style.display = 'grid';

        // Add artist header
        container.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin-bottom: 8px;">${artistName}</h2>
                <p style="color: #b3b3b3; margin: 0;">${artistData.songs?.length || 0} songs</p>
            </div>
        `;

        // Add artist songs
        if (artistData.songs && artistData.songs.length > 0) {
            container.innerHTML += artistData.songs.map(song => {
                const title = song.name || song.title || 'Unknown Title';
                const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                return `
                    <div class="result-card" data-song-id="${song.id || ''}" data-song-name="${title}" data-song-artist="${artist}" data-song-thumbnail="${thumbnail}">
                        <div class="result-thumbnail">
                            ${thumbnail ? `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                        </div>
                        <div class="result-title">${title}</div>
                        <div class="result-artist">${artist}</div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs by this artist</div>';
        }
    }
}

// Create global instance
window.contentManager = new ContentManager();

// Make functions globally accessible for onclick handlers
window.loadLibrary = (event) => window.contentManager.loadLibrary(event);
window.loadSongs = (event) => window.contentManager.loadSongs(event);
window.loadArtists = (event) => window.contentManager.loadArtists(event);
window.loadAlbums = (event) => window.contentManager.loadAlbums(event);
window.loadHome = (event) => window.contentManager.loadHome(event);
window.loadExplore = (event) => window.contentManager.loadExplore(event);
window.handleSearch = (event) => window.contentManager.handleSearch(event);
window.loadPlaylist = (playlistId, playlistTitle) => window.contentManager.loadPlaylist(playlistId, playlistTitle);
window.loadAlbum = (browseId, albumTitle) => window.contentManager.loadAlbum(browseId, albumTitle);
window.loadArtist = (browseId, artistName) => window.contentManager.loadArtist(browseId, artistName);
