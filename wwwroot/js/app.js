// Responsive breakpoints - these values are used throughout the application
// and are synchronized with CSS custom properties for consistent responsive behavior
const MOBILE_BREAKPOINT = 768;      // Tablet and mobile devices
const SMALL_MOBILE_BREAKPOINT = 480; // Small mobile devices (phones)
const SIDEBAR_COLLAPSE_BREAKPOINT = 1024; // Desktop breakpoint for sidebar collapse

let currentAudio = null;
let isPlaying = false;
let currentSongId = null;
let playlists = [];
let currentPlaylist = null;
let currentPlaylistSongs = [];
let currentSongIndex = -1;
let autoPlayEnabled = true;
let isMobileMenuOpen = false;
let isSidebarCollapsed = false;

// Default title for the application
const DEFAULT_TITLE = 'YouTube Music';

// Helper functions for responsive design
function getWindowWidth() {
    return window.innerWidth;
}

function isMobile() {
    return getWindowWidth() <= MOBILE_BREAKPOINT;
}

function isSmallMobile() {
    return getWindowWidth() <= SMALL_MOBILE_BREAKPOINT;s
}

function shouldCollapseSidebar() {
    return getWindowWidth() <= SIDEBAR_COLLAPSE_BREAKPOINT;
}

// Update CSS variables to match JavaScript constants
function updateCSSBreakpoints() {
    document.documentElement.style.setProperty('--mobile-breakpoint', `${MOBILE_BREAKPOINT}px`);
    document.documentElement.style.setProperty('--small-mobile-breakpoint', `${SMALL_MOBILE_BREAKPOINT}px`);
    document.documentElement.style.setProperty('--sidebar-collapse-breakpoint', `${SIDEBAR_COLLAPSE_BREAKPOINT}px`);
}

// Unified sidebar toggle functionality for both desktop and mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    if (isMobile()) {
        // Mobile behavior - simple toggle with backdrop
        isMobileMenuOpen = !isMobileMenuOpen;

        if (isMobileMenuOpen) {
            sidebar.classList.remove('collapsed');
            mobileMenuToggle.textContent = '✕';
            addMobileMenuBackdrop();
        } else {
            sidebar.classList.add('collapsed');
            mobileMenuToggle.textContent = '☰';
            removeMobileMenuBackdrop();
        }
    } else {
        // Desktop behavior - simple open/closed toggle
        isSidebarCollapsed = !isSidebarCollapsed;

        if (isSidebarCollapsed) {
            // Close sidebar
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
            sidebarToggle.textContent = '▶';
            sidebarToggle.title = 'Expand sidebar';
        } else {
            // Open sidebar
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
            sidebarToggle.textContent = '◀';
            sidebarToggle.title = 'Collapse sidebar';
        }

        // Store sidebar state in localStorage (desktop only)
        localStorage.setItem('sidebarState', JSON.stringify({
            collapsed: isSidebarCollapsed
        }));
    }
}

function restoreSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');

    try {
        const savedState = localStorage.getItem('sidebarState');
        if (savedState) {
            const state = JSON.parse(savedState);

            if (state.collapsed && !isMobile()) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('sidebar-collapsed');
                sidebarToggle.textContent = '▶';
                sidebarToggle.title = 'Expand sidebar';
                isSidebarCollapsed = true;
            }
        }
    } catch (error) {
        console.error('Error restoring sidebar state:', error);
    }
}

function handleWindowResize() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');

    if (isMobile()) {
        // On mobile, always use mobile menu behavior
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
        isSidebarCollapsed = false;
        sidebarToggle.style.display = 'none';
    } else {
        // On desktop, show toggle button
        sidebarToggle.style.display = 'flex';
    }
}

// Mobile-specific touch handling
function addMobileTouchHandlers() {
    // Add touch feedback for control buttons
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach(button => {
        button.addEventListener('touchstart', function (e) {
            this.style.transform = 'scale(0.95)';
            this.style.backgroundColor = '#404040';
        });

        button.addEventListener('touchend', function (e) {
            this.style.transform = 'scale(1)';
            this.style.backgroundColor = '';
        });

        button.addEventListener('touchcancel', function (e) {
            this.style.transform = 'scale(1)';
            this.style.backgroundColor = '';
        });
    });

    // Improve progress bar touch handling
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('touchstart', function (e) {
            e.preventDefault();
            const rect = this.getBoundingClientRect();
            const touch = e.touches[0];
            const clickX = touch.clientX - rect.left;
            const percentage = (clickX / rect.width) * 100;

            if (currentAudio) {
                const newTime = (percentage / 100) * currentAudio.duration;
                currentAudio.currentTime = newTime;
                updateProgressBar();
            }
        });
    }

    // Improve volume slider touch handling
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('touchstart', function (e) {
            e.preventDefault();
            const rect = this.getBoundingClientRect();
            const touch = e.touches[0];
            const clickX = touch.clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

            if (currentAudio) {
                currentAudio.volume = percentage / 100;
                updateVolumeDisplay();
            }
        });
    }
}



function addMobileMenuBackdrop() {
    if (!document.getElementById('mobileMenuBackdrop')) {
        const backdrop = document.createElement('div');
        backdrop.id = 'mobileMenuBackdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 199;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(backdrop);

        // Animate backdrop in
        setTimeout(() => {
            backdrop.style.opacity = '1';
        }, 10);

        // Close menu when backdrop is clicked
        backdrop.addEventListener('click', toggleSidebar);
    }
}

function removeMobileMenuBackdrop() {
    const backdrop = document.getElementById('mobileMenuBackdrop');
    if (backdrop) {
        backdrop.style.opacity = '0';
        setTimeout(() => {
            if (backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        }, 300);
    }
}

// Enhanced player controls for mobile
function enhancePlayerControls() {
    // Add swipe gestures for next/previous on mobile
    if (isMobile()) {
        let startX = 0;
        let startY = 0;
        let isSwiping = false;

        const playerBar = document.querySelector('.player-bar');
        if (playerBar) {
            playerBar.addEventListener('touchstart', function (e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwiping = false;
            });

            playerBar.addEventListener('touchmove', function (e) {
                if (!isSwiping) {
                    const deltaX = Math.abs(e.touches[0].clientX - startX);
                    const deltaY = Math.abs(e.touches[0].clientY - startY);

                    if (deltaX > deltaY && deltaX > 50) {
                        isSwiping = true;
                    }
                }
            });

            playerBar.addEventListener('touchend', function (e) {
                if (isSwiping) {
                    const deltaX = e.changedTouches[0].clientX - startX;
                    const minSwipeDistance = 100;

                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0) {
                            // Swipe right - previous song
                            playPreviousSong();
                        } else {
                            // Swipe left - next song
                            playNextSong();
                        }
                    }
                }
            });
        }
    }
}

// Notification System
let notificationCounter = 0;

function showNotification(type, title, message, duration = 5000) {
    const container = document.getElementById('notificationContainer');
    const notificationId = `notification-${++notificationCounter}`;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.id = notificationId;

    const icons = {
        error: '❌',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️'
    };

    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="removeNotification('${notificationId}')">×</button>
    `;

    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notificationId);
        }, duration);
    }

    return notificationId;
}

function removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

function showErrorNotification(message) {
    return showNotification('error', 'Error', message, 8000);
}

function showSuccessNotification(message) {
    return showNotification('success', 'Success', message, 4000);
}

function showWarningNotification(message) {
    return showNotification('warning', 'Warning', message, 6000);
}

function showInfoNotification(message) {
    return showNotification('info', 'Info', message, 5000);
}

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

        const thumbnail = result.thumbnails && result.thumbnails.length > 0 ? result.thumbnails[0].url : (result.thumbnail || '');
        const safeThumbnail = thumbnail.replace(/'/g, "\\'");

        return `
            <div class="result-card" ${isPlayable ? `onclick="playSong('${songId}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)"` : ''}>
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

function highlightCurrentSong() {
    // Remove playing class from all playlist items
    document.querySelectorAll('.playlist-song-item').forEach(item => {
        item.classList.remove('playing');
    });

    // Add playing class to current song
    if (currentSongIndex >= 0 && currentPlaylistSongs.length > 0) {
        const currentSongElement = document.querySelector(`.playlist-song-item:nth-child(${currentSongIndex + 1})`);
        if (currentSongElement) {
            currentSongElement.classList.add('playing');
        }
    }
}

async function playSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    currentSongId = songId;
    currentSongIndex = songIndex;
    document.getElementById('nowPlayingTitle').textContent = title;
    document.getElementById('nowPlayingArtist').textContent = artist;
    document.getElementById('playButton').textContent = '⏸';
    isPlaying = true;

    // Update document title with current song
    document.title = `${title} by ${artist}`;

    // Highlight current song in playlist
    if (playlistId && songIndex >= 0) {
        highlightCurrentSong();
    }

    // Set thumbnail if provided
    const thumbnailElement = document.getElementById('nowPlayingThumbnail');
    if (thumbnail && thumbnail.trim() !== '') {
        thumbnailElement.innerHTML = `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
    } else {
        thumbnailElement.innerHTML = '🎵';
    }

    try {
        const queryParams = getQueryParams();
        const queryString = buildQueryString(queryParams);
        const audioUrl = `/api/stream/${songId}?${queryString}`;

        const audio = new Audio(audioUrl);
        audio.volume = currentVolume; // Set initial volume

        // Add error handling for audio loading
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title on error
            document.title = DEFAULT_TITLE;
            showErrorNotification(`Failed to play "${title}" by ${artist}. The song may be unavailable or restricted.`);
        });

        audio.addEventListener('abort', () => {
            console.log('Audio loading aborted');
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title on abort
            document.title = DEFAULT_TITLE;
            showWarningNotification(`Playback of "${title}" was interrupted.`);
        });

        audio.addEventListener('loadeddata', () => {
            audio.play().catch(error => {
                console.error('Play error:', error);
                isPlaying = false;
                document.getElementById('playButton').textContent = '▶';
                // Reset document title on play error
                document.title = DEFAULT_TITLE;
                showErrorNotification(`Failed to start playback of "${title}". Please try again.`);
            }).then(() => {
                // showSuccessNotification(`Now playing: "${title}" by ${artist}`);
            });
        });

        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        });

        audio.addEventListener('ended', () => {
            isPlaying = false;
            document.getElementById('playButton').textContent = '▶';

            // Reset document title when song ends
            document.title = DEFAULT_TITLE;

            // Auto-play next song if enabled and we're in a playlist
            if (autoPlayEnabled && currentPlaylist && currentPlaylistSongs.length > 0) {
                playNextSong();
            } else {
                showInfoNotification('Song finished playing');
            }
        });

        currentAudio = audio;
    } catch (error) {
        console.error('PlaySong error:', error);
        isPlaying = false;
        document.getElementById('playButton').textContent = '▶';
        // Reset document title on error
        document.title = DEFAULT_TITLE;
        showErrorNotification(`Failed to load "${title}" by ${artist}. Please check your connection and try again.`);
    }
}

function playNextSong() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return;

    const nextIndex = currentSongIndex + 1;
    if (nextIndex < currentPlaylistSongs.length) {
        const nextSong = currentPlaylistSongs[nextIndex];
        const title = nextSong.name || nextSong.title || 'Unknown Title';
        const artist = nextSong.artists && nextSong.artists.length > 0 ? nextSong.artists[0].name : '';
        const thumbnail = nextSong.thumbnails && nextSong.thumbnails.length > 0 ? nextSong.thumbnails[0].url : '';

        playSong(nextSong.id || '', title, artist, thumbnail, currentPlaylist, nextIndex);
    }
}

function playPreviousSong() {
    if (currentPlaylistSongs.length === 0 || currentSongIndex === -1) return;

    const prevIndex = currentSongIndex - 1;
    if (prevIndex >= 0) {
        const prevSong = currentPlaylistSongs[prevIndex];
        const title = prevSong.name || prevSong.title || 'Unknown Title';
        const artist = prevSong.artists && prevSong.artists.length > 0 ? prevSong.artists[0].name : '';
        const thumbnail = prevSong.thumbnails && prevSong.thumbnails.length > 0 ? prevSong.thumbnails[0].url : '';

        playSong(prevSong.id || '', title, artist, thumbnail, currentPlaylist, prevIndex);
    }
}

function togglePlay() {
    if (currentAudio) {
        if (isPlaying) {
            currentAudio.pause();
            document.getElementById('playButton').textContent = '▶';
            isPlaying = false;
            // Reset document title when paused
            document.title = DEFAULT_TITLE;
        } else {
            currentAudio.play();
            document.getElementById('playButton').textContent = '⏸';
            isPlaying = true;
            // Update document title when resumed
            const title = document.getElementById('nowPlayingTitle').textContent;
            const artist = document.getElementById('nowPlayingArtist').textContent;
            document.title = `${title} by ${artist}`;
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

let isDraggingVolume = false;
let currentVolume = 0.5;

function setVolume(event) {
    if (currentAudio) {
        const rect = event.target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const volume = Math.max(0, Math.min(1, clickX / rect.width));
        currentAudio.volume = volume;
        currentVolume = volume;
        updateVolumeDisplay();

        // Show volume notification for significant changes
        if (volume === 0) {
            showInfoNotification('Volume muted');
        }
    }
}

function updateVolumeDisplay() {
    const volumeFill = document.getElementById('volumeFill');
    const volumeThumb = document.getElementById('volumeThumb');
    const percentage = currentVolume * 100;

    if (volumeFill) volumeFill.style.width = percentage + '%';
    if (volumeThumb) volumeThumb.style.left = percentage + '%';
}

function updateProgressBar() {
    if (currentAudio) {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
    }
}

function initVolumeSlider() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeThumb = document.getElementById('volumeThumb');

    if (!volumeSlider || !volumeThumb) return;

    // Set initial volume
    updateVolumeDisplay();

    // Mouse events for dragging
    volumeThumb.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        e.preventDefault();
    });

    volumeSlider.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        setVolume(e);
    });

    // Add click handler for volume slider
    volumeSlider.addEventListener('click', (e) => {
        setVolume(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
            const rect = volumeSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, clickX / rect.width));

            if (currentAudio) {
                currentAudio.volume = volume;
            }
            currentVolume = volume;
            updateVolumeDisplay();
        }
    });

    document.addEventListener('mouseup', () => {
        isDraggingVolume = false;
    });
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

    // Close mobile menu after navigation
    if (isMobile() && isMobileMenuOpen) {
        toggleSidebar();
    }
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

            if (playlists.length > 0) {
                // showSuccessNotification(`Loaded ${playlists.length} playlist${playlists.length > 1 ? 's' : ''}`);
            }
        }
    } catch (error) {
        console.error('Playlists error:', error);
        showErrorNotification('Failed to load playlists');
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

            // Get playlist thumbnail - try different possible properties
            const thumbnail = playlist.thumbnail ||
                (playlist.thumbnails && playlist.thumbnails.length > 0 ? playlist.thumbnails[0].url : null) ||
                (playlist.art && playlist.art.sources && playlist.art.sources.length > 0 ? playlist.art.sources[0].url : null);

            return `
                <div class="playlist-item" onclick="loadPlaylist('${playlist.id || ''}', '${safeTitle}')">
                    <div class="playlist-thumbnail">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}">` : '📋'}
                    </div>
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
    // Close mobile menu after playlist selection
    if (isMobile() && isMobileMenuOpen) {
        toggleSidebar();
    }

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
    container.style.display = 'block'; // Changed from 'grid' to 'block' for list layout

    // Store playlist information for queue management
    currentPlaylist = playlistData.id || playlistData.browseId || '';
    currentPlaylistSongs = playlistData.songs || [];

    // Add playlist header
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin-bottom: 8px;">${playlistTitle}</h2>
            <p style="color: #b3b3b3; margin: 0;">${playlistData.songs?.length || 0} songs</p>
        </div>
    `;

    // Add playlist songs as a list
    if (playlistData.songs && playlistData.songs.length > 0) {
        container.innerHTML += `
            <div class="playlist-songs-list">
                ${playlistData.songs.map((song, index) => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            // Check if this song is currently playing
            const isCurrentlyPlaying = currentSongId === (song.id || '') && currentPlaylist === (playlistData.id || playlistData.browseId || '');
            const playingClass = isCurrentlyPlaying ? ' playing' : '';

            return `
                        <div class="playlist-song-item${playingClass}" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', '${currentPlaylist}', ${index})">
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
    const songsSection = songsContainer.parentElement;
    if (libraryData.songs && libraryData.songs.length > 0) {
        songsSection.style.display = 'block';
        songsContainer.innerHTML = libraryData.songs.slice(0, 10).map(song => {
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="library-item" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
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
        artistsSection.style.display = 'none';
    }
}

async function loadAlbum(browseId, albumTitle) {
    // Close mobile menu after album selection
    if (isMobile() && isMobileMenuOpen) {
        toggleSidebar();
    }

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
    // Close mobile menu after artist selection
    if (isMobile() && isMobileMenuOpen) {
        toggleSidebar();
    }

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
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
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
            const title = song.name || song.title || 'Unknown Title';
            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';
            const safeTitle = title.replace(/'/g, "\\'");
            const safeArtist = artist.replace(/'/g, "\\'");
            const safeThumbnail = thumbnail.replace(/'/g, "\\'");

            return `
                <div class="result-card" onclick="playSong('${song.id || ''}', '${safeTitle}', '${safeArtist}', '${safeThumbnail}', null, -1)">
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

function toggleAutoPlay() {
    autoPlayEnabled = !autoPlayEnabled;
    const autoPlayButton = document.getElementById('autoPlayButton');
    if (autoPlayButton) {
        autoPlayButton.textContent = autoPlayEnabled ? '🔁' : '⏸';
        autoPlayButton.title = autoPlayEnabled ? 'Auto-play enabled' : 'Auto-play disabled';
    }

    if (autoPlayEnabled) {
        showSuccessNotification('Auto-play enabled');
    } else {
        showInfoNotification('Auto-play disabled');
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function (event) {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');

    if (isMobileMenuOpen &&
        !sidebar.contains(event.target) &&
        !mobileMenuToggle.contains(event.target)) {
        toggleSidebar();
    }
});

// Handle window resize events
window.addEventListener('resize', function () {
    // Handle mobile menu
    if (!isMobile() && isMobileMenuOpen) {
        toggleSidebar();
    }

    // Handle sidebar auto-collapse
    handleWindowResize();
});

// Initialize
updateCSSBreakpoints();
loadHome();
loadPlaylists();
initVolumeSlider();

// Initialize mobile enhancements
addMobileTouchHandlers();
enhancePlayerControls();

// Initialize sidebar state
restoreSidebarState();
handleWindowResize(); 