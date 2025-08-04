let currentAudio = null;
let isPlaying = false;
let currentSongId = null;
let playlists = [];

// Get all query parameters from the current URL
function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}

// Convert query parameters to URL string
function buildQueryString(params) {
    return Object.keys(params)
        .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query) {
            performSearch(query);
        }
    }
}

async function performSearch(query) {
    showLoading();
    try {
        const queryParams = getQueryParams();
        queryParams.query = query;
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/search?${queryString}`);
        const data = await response.json();

        if (response.ok) {
            console.log('Search results:', data.results); // Debug log
            displaySearchResults(data.results || []);
        } else {
            showError(data.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error); // Debug log
        showError('Network error');
    }
}

function displaySearchResults(results) {
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

        // Safely escape quotes for onclick
        const safeTitle = title.replace(/'/g, "\\'");
        const safeArtist = artist.replace(/'/g, "\\'");

        return `
            <div class="result-card" ${isPlayable ? `onclick="playSong('${songId}', '${safeTitle}', '${safeArtist}')"` : ''}>
                <div class="result-thumbnail">
                    ${result.thumbnail ? `<img src="${result.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                </div>
                <div class="result-title">${title}</div>
                <div class="result-artist">${artist}</div>
                ${!isPlayable ? '<div style="font-size: 10px; color: #666; margin-top: 4px;">Not playable</div>' : ''}
            </div>
        `;
    }).join('');
}

async function playSong(songId, title, artist) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    currentSongId = songId;
    document.getElementById('nowPlayingTitle').textContent = title;
    document.getElementById('nowPlayingArtist').textContent = artist;
    document.getElementById('playButton').textContent = '⏸';
    isPlaying = true;

    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const audioUrl = `/api/stream/${songId}?${queryString}`;

        const audio = new Audio(audioUrl);
        audio.addEventListener('loadeddata', () => {
            audio.play();
        });

        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        });

        audio.addEventListener('ended', () => {
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
        });

        currentAudio = audio;
    } catch (error) {
        showError('Failed to play song');
    }
}

function togglePlay() {
    if (currentAudio) {
        if (isPlaying) {
            currentAudio.pause();
            document.getElementById('playButton').textContent = '▶';
            isPlaying = false;
        } else {
            currentAudio.play();
            document.getElementById('playButton').textContent = '⏸';
            isPlaying = true;
        }
    }
}

function seek(event) {
    if (currentAudio) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        currentAudio.currentTime = percentage * currentAudio.duration;
    }
}

function setVolume(event) {
    if (currentAudio) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const volume = clickX / rect.width;
        currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.querySelector('.welcome-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
}

function showError(message) {
    document.getElementById('error').textContent = message;
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.querySelector('.welcome-section').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
}

function updateActiveNavItem(clickedItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    // Add active class to clicked item
    clickedItem.classList.add('active');
}

function loadLibrary(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    loadLibraryData();
}

function loadHome(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    document.querySelector('.welcome-section').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

function loadExplore(event) {
    if (event && event.target) {
        updateActiveNavItem(event.target.closest('.nav-item'));
    }
    // TODO: Implement explore loading
    document.querySelector('.welcome-section').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('libraryContent').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

async function loadLibraryData() {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/library?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayLibraryContent(data);
        } else {
            showError('Failed to load library. Please check your authentication.');
        }
    } catch (error) {
        console.error('Library error:', error);
        showError('Failed to load library');
    }
}

async function loadPlaylists() {
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/library/playlists?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            playlists = data.playlists || [];
            displayPlaylistsInSidebar();
        }
    } catch (error) {
        console.error('Playlists error:', error);
    }
}

function displayPlaylistsInSidebar() {
    const playlistsSection = document.getElementById('playlistsSection');
    const playlistsList = document.getElementById('playlistsList');

    if (playlists.length > 0) {
        playlistsSection.style.display = 'block';
        playlistsList.innerHTML = playlists.map(playlist => {
            const title = playlist.name || playlist.title || 'Unknown Playlist';
            const safeTitle = title.replace(/'/g, "\\'");

            return `
                <div class="playlist-item" onclick="loadPlaylist('${playlist.id || ''}', '${safeTitle}')">
                    <div class="playlist-icon">📋</div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
                        <div style="font-size: 12px; color: #666;">${playlist.songCount || 0} songs</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        playlistsSection.style.display = 'none';
    }
}

async function loadPlaylist(playlistId, playlistTitle) {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/playlist/${playlistId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayPlaylistContent(data, playlistTitle);
        } else {
            showError('Failed to load playlist');
        }
    } catch (error) {
        console.error('Playlist error:', error);
        showError('Failed to load playlist');
    }
}

function displayPlaylistContent(playlistData, playlistTitle) {
    const container = document.getElementById('searchResults');
    const welcomeSection = document.querySelector('.welcome-section');
    const libraryContent = document.getElementById('libraryContent');

    welcomeSection.style.display = 'none';
    libraryContent.style.display = 'none';
    container.style.display = 'grid';

    // Add playlist header
    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">${playlistTitle}</h2>
            <p style="color: #b3b3b3; margin: 0;">${playlistData.songs?.length || 0} songs</p>
        </div>
    `;

    // Add playlist songs
    if (playlistData.songs && playlistData.songs.length > 0) {
        container.innerHTML += playlistData.songs.map(song => {
            const title = song.title || 'Unknown Title';
            const artist = song.artist || '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}')">
                    <div class="result-thumbnail">
                        ${song.thumbnail ? `<img src="${song.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-artist">${artist}</div>
                </div>
            `;
        }).join('');
    } else {
        container.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; color: #b3b3b3;">No songs in this playlist</div>';
    }
}

function displayLibraryContent(libraryData) {
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
    if (libraryData.songs && libraryData.songs.length > 0) {
        songsContainer.innerHTML = libraryData.songs.slice(0, 10).map(song => {
            const title = song.title || 'Unknown Title';
            const artist = song.artist || '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}')">
                    <div class="library-item-thumbnail">
                        ${song.thumbnail ? `<img src="${song.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
                    </div>
                    <div class="library-item-info">
                        <div class="library-item-title">${title}</div>
                        <div class="library-item-subtitle">${artist}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        songsContainer.innerHTML = '<div style="color: #666; font-style: italic;">No songs in library</div>';
    }

    // Display albums
    const albumsContainer = document.getElementById('libraryAlbums');
    if (libraryData.albums && libraryData.albums.length > 0) {
        albumsContainer.innerHTML = libraryData.albums.slice(0, 10).map(album => {
            const title = album.title || 'Unknown Album';
            const artist = album.artist || '';
            const safeTitle = title.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="loadAlbum('${album.browseId || ''}', '${safeTitle}')">
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
        albumsContainer.innerHTML = '<div style="color: #666; font-style: italic;">No albums in library</div>';
    }

    // Display artists
    const artistsContainer = document.getElementById('libraryArtists');
    if (libraryData.artists && libraryData.artists.length > 0) {
        artistsContainer.innerHTML = libraryData.artists.slice(0, 10).map(artist => {
            const name = artist.name || 'Unknown Artist';
            const subscribers = artist.subscribers || '';
            const safeName = name.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="loadArtist('${artist.browseId || ''}', '${safeName}')">
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
        artistsContainer.innerHTML = '<div style="color: #666; font-style: italic;">No artists in library</div>';
    }
}

async function loadAlbum(browseId, albumTitle) {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/album/${browseId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayAlbumContent(data, albumTitle);
        } else {
            showError('Failed to load album');
        }
    } catch (error) {
        console.error('Album error:', error);
        showError('Failed to load album');
    }
}

async function loadArtist(browseId, artistName) {
    showLoading();
    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);

        const response = await fetch(`/api/artist/${browseId}?${queryString}`);
        if (response.ok) {
            const data = await response.json();
            displayArtistContent(data, artistName);
        } else {
            showError('Failed to load artist');
        }
    } catch (error) {
        console.error('Artist error:', error);
        showError('Failed to load artist');
    }
}

function displayAlbumContent(albumData, albumTitle) {
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
            const title = song.title || 'Unknown Title';
            const artist = song.artist || '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}')">
                    <div class="result-thumbnail">
                        ${song.thumbnail ? `<img src="${song.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
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

function displayArtistContent(artistData, artistName) {
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
            const title = song.title || 'Unknown Title';
            const artist = song.artist || '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}')">
                    <div class="result-thumbnail">
                        ${song.thumbnail ? `<img src="${song.thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` : '🎵'}
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

// Initialize
loadHome();
loadPlaylists(); 