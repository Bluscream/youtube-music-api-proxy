import { DEFAULT_TITLE, REPEAT_MODES, ERROR_RECOVERY_TIMEOUT, MIN_SWIPE_DISTANCE, DEFAULTS } from './constants.js';
import { stopAllAudio, getQueryParams, buildQueryString, updateURL } from './utils.js';

// Player Manager
export class PlayerManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.currentSongId = null;
        this.currentSongIndex = -1;
        this.autoPlayEnabled = true;
        this.errorRecoveryTimeout = null;
        this.autoSkip = false;
        
        // Repeat and shuffle modes
        this.repeatMode = REPEAT_MODES.NONE;
        this.shuffleEnabled = false;
        this.originalPlaylistOrder = [];
        this.shuffledPlaylistOrder = [];
        
        // Global variables for current song info
        this.currentSongInfo = null;
        
        // Volume management
        this.isDraggingVolume = false;
        this.currentVolume = DEFAULTS.VOLUME;
        
        // Playlist management
        this.currentPlaylist = null;
        this.currentPlaylistSongs = [];
        
        this.init();
    }

    init() {
        this.setupMediaKeyListeners();
        this.initVolumeSlider();
        this.updateRepeatShuffleDisplay();
        this.restoreVolume();
    }

    // Media key event handling
    setupMediaKeyListeners() {
        // Handle media key events
        navigator.mediaSession.setActionHandler('play', () => {
            if (this.currentAudio && !this.isPlaying) {
                this.togglePlay();
            }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            if (this.currentAudio && this.isPlaying) {
                this.togglePlay();
            }
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (this.currentPlaylist && this.currentPlaylistSongs.length > 0) {
                this.playPreviousSong();
            }
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            if (this.currentPlaylist && this.currentPlaylistSongs.length > 0) {
                this.playNextSong();
            }
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (this.currentAudio && details.seekTime !== undefined) {
                this.currentAudio.currentTime = details.seekTime;
            }
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.isPlaying = false;
                document.getElementById('playButton').textContent = '▶';
                document.title = DEFAULT_TITLE;
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'none';
                }
            }
        });

        // Handle keyboard media keys
        document.addEventListener('keydown', (event) => {
            // Only handle media keys when the app is focused
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return; // Don't interfere with text input
            }

            switch (event.code) {
                case 'MediaPlayPause':
                    event.preventDefault();
                    if (this.currentAudio) {
                        this.togglePlay();
                    }
                    break;
                case 'MediaTrackNext':
                    event.preventDefault();
                    if (this.currentPlaylist && this.currentPlaylistSongs.length > 0) {
                        this.playNextSong();
                    }
                    break;
                case 'MediaTrackPrevious':
                    event.preventDefault();
                    if (this.currentPlaylist && this.currentPlaylistSongs.length > 0) {
                        this.playPreviousSong();
                    }
                    break;
            }
        });
    }

    // Function to handle automatic playlist advancement on error
    handlePlaybackError(title, artist) {
        // Clear any existing error recovery timeout
        if (this.errorRecoveryTimeout) {
            clearTimeout(this.errorRecoveryTimeout);
            this.errorRecoveryTimeout = null;
        }

        // If we're in a playlist, automatically advance to next song after 3 seconds
        if (this.autoSkip && this.currentPlaylist && this.currentPlaylistSongs.length > 0) {
            this.errorRecoveryTimeout = setTimeout(() => {
                console.log(`Auto-advancing playlist due to playback error: ${title}`);
                this.playNextSong();
                this.errorRecoveryTimeout = null;
            }, ERROR_RECOVERY_TIMEOUT);
        }
    }

    async loadSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
        // Clear any existing error recovery timeout
        if (this.errorRecoveryTimeout) {
            clearTimeout(this.errorRecoveryTimeout);
            this.errorRecoveryTimeout = null;
        }

        // Stop all audio playback before loading new song
        stopAllAudio();

        // Update URL with song parameter
        const urlParams = {};
        if (playlistId) {
            urlParams.playlist = playlistId;
            urlParams.song = songId;
        } else {
            urlParams.song = songId;
            urlParams.playlist = null;
        }
        updateURL(urlParams);

        this.currentSongId = songId;
        this.currentSongIndex = songIndex;
        document.getElementById('nowPlayingTitle').textContent = title;
        document.getElementById('nowPlayingArtist').textContent = artist;
        document.getElementById('playButton').textContent = '▶';
        this.isPlaying = false;

        // Reset repeat and shuffle if loading from search results (no playlist)
        if (!playlistId) {
            this.repeatMode = REPEAT_MODES.NONE;
            this.shuffleEnabled = false;
            this.updateRepeatShuffleDisplay();
        }

        // Update document title with current song
        document.title = `${title} by ${artist}`;

        // Highlight current song in playlist
        if (playlistId && songIndex >= 0) {
            this.highlightCurrentSong();
        }

        // Update current playlist and highlight it in sidebar if loading from a playlist
        if (playlistId) {
            this.currentPlaylist = playlistId;
            this.highlightCurrentPlaylist();
        } else {
            // Clear playlist highlighting if loading from search results
            this.currentPlaylist = null;
            this.highlightCurrentPlaylist();
        }

        // Set thumbnail if provided
        const thumbnailElement = document.getElementById('nowPlayingThumbnail');
        if (thumbnail && thumbnail.trim() !== '') {
            thumbnailElement.innerHTML = `<img src="${thumbnail}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
        } else {
            thumbnailElement.innerHTML = '🎵';
        }

        // Fetch detailed song information for the Info tab
        this.fetchSongInfo(songId);

        // Preload audio without playing
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);
            const audioUrl = `/api/stream/${songId}?${queryString}`;

            const audio = new Audio(audioUrl);
            audio.volume = this.currentVolume; // Set initial volume

            // Add error handling for audio loading
            audio.addEventListener('error', (e) => {
                console.error('Audio error:', e);
                this.isPlaying = false;
                document.getElementById('playButton').textContent = '▶';
                // Reset document title on error
                document.title = DEFAULT_TITLE;
                window.notificationManager.showErrorNotification(`Failed to load "${title}" by ${artist}. The song may be unavailable or restricted.`);
                this.handlePlaybackError(title, artist);
            });

            audio.addEventListener('abort', () => {
                console.log('Audio loading aborted');
                this.isPlaying = false;
                document.getElementById('playButton').textContent = '▶';
                // Reset document title on abort
                document.title = DEFAULT_TITLE;
                window.notificationManager.showWarningNotification(`Loading of "${title}" was interrupted.`);
            });

            audio.addEventListener('loadeddata', () => {
                // Update media session metadata for system media controls
                if (navigator.mediaSession) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: title,
                        artist: artist,
                        album: 'YouTube Music',
                        artwork: thumbnail ? [{ src: thumbnail, sizes: '300x300', type: 'image/jpeg' }] : []
                    });
                }
                window.notificationManager.showInfoNotification(`Loaded: "${title}" by ${artist}`);
            });

            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                document.getElementById('progressFill').style.width = progress + '%';

                // Update media session position state
                if (navigator.mediaSession && audio.duration) {
                    navigator.mediaSession.setPositionState({
                        duration: audio.duration,
                        position: audio.currentTime,
                        playbackRate: audio.playbackRate
                    });
                }
            });

            audio.addEventListener('ended', () => {
                this.isPlaying = false;
                document.getElementById('playButton').textContent = '▶';

                // Reset document title when song ends
                document.title = DEFAULT_TITLE;

                // Update media session state
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'none';
                }

                // Handle repeat one mode
                if (this.repeatMode === REPEAT_MODES.ONE) {
                    // Replay the same song
                    const currentSong = this.currentPlaylistSongs[this.currentSongIndex];
                    const title = currentSong.name || currentSong.title || 'Unknown Title';
                    const artist = currentSong.artists && currentSong.artists.length > 0 ? currentSong.artists[0].name : '';
                    const thumbnail = currentSong.thumbnails && currentSong.thumbnails.length > 0 ? currentSong.thumbnails[0].url : '';

                    this.playSong(currentSong.id || '', title, artist, thumbnail, this.currentPlaylist, this.currentSongIndex);
                    return;
                }

                // Auto-play next song if enabled and we're in a playlist
                if (this.autoPlayEnabled && this.currentPlaylist && this.currentPlaylistSongs.length > 0) {
                    this.playNextSong();
                } else {
                    // Clear song info when no more songs to play
                    this.currentSongInfo = null;
                    this.clearInfoPanel();
                    window.notificationManager.showInfoNotification('Song finished playing');
                }
            });

            this.currentAudio = audio;
        } catch (error) {
            console.error('LoadSong error:', error);
            this.isPlaying = false;
            document.getElementById('playButton').textContent = '▶';
            // Reset document title on error
            document.title = DEFAULT_TITLE;
            window.notificationManager.showErrorNotification(`Failed to load "${title}" by ${artist}. Please check your connection and try again.`);
        }
    }

    async playSong(songId, title, artist, thumbnail = null, playlistId = null, songIndex = -1) {
        // If no song is currently loaded or different song, load it first
        if (!this.currentSongId || this.currentSongId !== songId) {
            await this.loadSong(songId, title, artist, thumbnail, playlistId, songIndex);
        }

        // Start playback
        if (this.currentAudio && !this.isPlaying) {
            try {
                document.getElementById('playButton').textContent = '⏸';
                this.isPlaying = true;

                // Update media session state
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'playing';
                }

                await this.currentAudio.play();
                window.notificationManager.showSuccessNotification(`Now playing: "${title}" by ${artist}`);
            } catch (error) {
                console.error('Play error:', error);
                this.isPlaying = false;
                document.getElementById('playButton').textContent = '▶';
                window.notificationManager.showErrorNotification(`Failed to start playback of "${title}". Please try again.`);
                this.handlePlaybackError(title, artist);
            }
        }
    }

    togglePlay() {
        if (this.currentAudio) {
            if (this.isPlaying) {
                this.currentAudio.pause();
                document.getElementById('playButton').textContent = '▶';
                this.isPlaying = false;
                // Reset document title when paused
                document.title = DEFAULT_TITLE;
                // Update media session state
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'paused';
                }
            } else {
                this.currentAudio.play();
                document.getElementById('playButton').textContent = '⏸';
                this.isPlaying = true;
                // Update document title when resumed
                const title = document.getElementById('nowPlayingTitle').textContent;
                const artist = document.getElementById('nowPlayingArtist').textContent;
                document.title = `${title} by ${artist}`;
                // Update media session state
                if (navigator.mediaSession) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            }
        }
    }

    seek(event) {
        if (this.currentAudio) {
            const rect = event.target.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const percentage = clickX / rect.width;
            this.currentAudio.currentTime = percentage * this.currentAudio.duration;
        }
    }

    // Volume management
    saveVolume() {
        localStorage.setItem('playerVolume', this.currentVolume.toString());
    }

    restoreVolume() {
        try {
            const savedVolume = localStorage.getItem('playerVolume');
            if (savedVolume !== null) {
                this.currentVolume = parseFloat(savedVolume);
                // Ensure volume is within valid range
                this.currentVolume = Math.max(0, Math.min(1, this.currentVolume));
            } else {
                this.currentVolume = DEFAULTS.VOLUME; // Default volume
            }
        } catch (error) {
            console.error('Error restoring volume:', error);
            this.currentVolume = DEFAULTS.VOLUME; // Default volume on error
        }
    }

    setVolume(event) {
        if (this.currentAudio) {
            const rect = event.target.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, clickX / rect.width));
            this.currentAudio.volume = volume;
            this.currentVolume = volume;
            this.updateVolumeDisplay();
            this.saveVolume(); // Save volume when changed

            // Show volume notification for significant changes
            if (volume === 0) {
                window.notificationManager.showInfoNotification('Volume muted');
            }
        }
    }

    updateVolumeDisplay() {
        const volumeFill = document.getElementById('volumeFill');
        const volumeThumb = document.getElementById('volumeThumb');
        const percentage = this.currentVolume * 100;

        if (volumeFill) volumeFill.style.width = percentage + '%';
        if (volumeThumb) volumeThumb.style.left = percentage + '%';
    }

    updateProgressBar() {
        if (this.currentAudio) {
            const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
        }
    }

    initVolumeSlider() {
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeThumb = document.getElementById('volumeThumb');

        if (!volumeSlider || !volumeThumb) return;

        // Restore saved volume
        this.restoreVolume();

        // Set initial volume
        this.updateVolumeDisplay();

        // Mouse events for dragging
        volumeThumb.addEventListener('mousedown', (e) => {
            this.isDraggingVolume = true;
            e.preventDefault();
        });

        volumeSlider.addEventListener('mousedown', (e) => {
            this.isDraggingVolume = true;
            this.setVolume(e);
        });

        // Add click handler for volume slider
        volumeSlider.addEventListener('click', (e) => {
            this.setVolume(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingVolume) {
                const rect = volumeSlider.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const volume = Math.max(0, Math.min(1, clickX / rect.width));

                if (this.currentAudio) {
                    this.currentAudio.volume = volume;
                }
                this.currentVolume = volume;
                this.updateVolumeDisplay();
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDraggingVolume) {
                this.saveVolume(); // Save volume when dragging ends
            }
            this.isDraggingVolume = false;
        });
    }

    // Playlist navigation
    playNextSong() {
        const nextIndex = this.getNextSongIndex();
        if (nextIndex === -1) {
            window.notificationManager.showInfoNotification('No more songs in playlist');
            return;
        }

        const nextSong = this.currentPlaylistSongs[nextIndex];
        const title = nextSong.name || nextSong.title || 'Unknown Title';
        const artist = nextSong.artists && nextSong.artists.length > 0 ? nextSong.artists[0].name : '';
        const thumbnail = nextSong.thumbnails && nextSong.thumbnails.length > 0 ? nextSong.thumbnails[0].url : '';

        this.playSong(nextSong.id || '', title, artist, thumbnail, this.currentPlaylist, nextIndex);
    }

    playPreviousSong() {
        const prevIndex = this.getPreviousSongIndex();
        if (prevIndex === -1) {
            window.notificationManager.showInfoNotification('No previous song in playlist');
            return;
        }

        const prevSong = this.currentPlaylistSongs[prevIndex];
        const title = prevSong.name || prevSong.title || 'Unknown Title';
        const artist = prevSong.artists && prevSong.artists.length > 0 ? prevSong.artists[0].name : '';
        const thumbnail = prevSong.thumbnails && prevSong.thumbnails.length > 0 ? prevSong.thumbnails[0].url : '';

        this.playSong(prevSong.id || '', title, artist, thumbnail, this.currentPlaylist, prevIndex);
    }

    // Repeat and shuffle functionality
    toggleRepeatMode() {
        switch (this.repeatMode) {
            case REPEAT_MODES.NONE:
                this.repeatMode = REPEAT_MODES.ALL;
                window.notificationManager.showInfoNotification('Repeat all enabled');
                break;
            case REPEAT_MODES.ALL:
                this.repeatMode = REPEAT_MODES.ONE;
                window.notificationManager.showInfoNotification('Repeat one enabled');
                break;
            case REPEAT_MODES.ONE:
                this.repeatMode = REPEAT_MODES.NONE;
                window.notificationManager.showInfoNotification('Repeat disabled');
                break;
        }
        this.updateRepeatShuffleDisplay();
    }

    toggleShuffle() {
        this.shuffleEnabled = !this.shuffleEnabled;

        if (this.shuffleEnabled) {
            // Create shuffled order if we have a playlist
            if (this.currentPlaylistSongs.length > 0) {
                this.createShuffledOrder();
            }
            window.notificationManager.showInfoNotification('Shuffle enabled');
        } else {
            window.notificationManager.showInfoNotification('Shuffle disabled');
        }

        this.updateRepeatShuffleDisplay();
    }

    createShuffledOrder() {
        this.originalPlaylistOrder = [...Array(this.currentPlaylistSongs.length).keys()];
        this.shuffledPlaylistOrder = [...this.originalPlaylistOrder];

        // Fisher-Yates shuffle algorithm
        for (let i = this.shuffledPlaylistOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledPlaylistOrder[i], this.shuffledPlaylistOrder[j]] = [this.shuffledPlaylistOrder[j], this.shuffledPlaylistOrder[i]];
        }
    }

    getNextSongIndex() {
        if (this.currentPlaylistSongs.length === 0 || this.currentSongIndex === -1) return -1;

        if (this.shuffleEnabled) {
            // Find current song in shuffled order
            const currentShuffledIndex = this.shuffledPlaylistOrder.indexOf(this.currentSongIndex);
            const nextShuffledIndex = currentShuffledIndex + 1;

            if (nextShuffledIndex < this.shuffledPlaylistOrder.length) {
                return this.shuffledPlaylistOrder[nextShuffledIndex];
            } else if (this.repeatMode === REPEAT_MODES.ALL) {
                // Re-shuffle and start from beginning
                this.createShuffledOrder();
                return this.shuffledPlaylistOrder[0];
            }
        } else {
            const nextIndex = this.currentSongIndex + 1;
            if (nextIndex < this.currentPlaylistSongs.length) {
                return nextIndex;
            } else if (this.repeatMode === REPEAT_MODES.ALL) {
                return 0; // Start from beginning
            }
        }

        return -1; // No more songs
    }

    getPreviousSongIndex() {
        if (this.currentPlaylistSongs.length === 0 || this.currentSongIndex === -1) return -1;

        if (this.shuffleEnabled) {
            // Find current song in shuffled order
            const currentShuffledIndex = this.shuffledPlaylistOrder.indexOf(this.currentSongIndex);
            const prevShuffledIndex = currentShuffledIndex - 1;

            if (prevShuffledIndex >= 0) {
                return this.shuffledPlaylistOrder[prevShuffledIndex];
            } else if (this.repeatMode === REPEAT_MODES.ALL) {
                // Go to end of shuffled order
                return this.shuffledPlaylistOrder[this.shuffledPlaylistOrder.length - 1];
            }
        } else {
            const prevIndex = this.currentSongIndex - 1;
            if (prevIndex >= 0) {
                return prevIndex;
            } else if (this.repeatMode === REPEAT_MODES.ALL) {
                return this.currentPlaylistSongs.length - 1; // Go to end
            }
        }

        return -1; // No previous song
    }

    updateRepeatShuffleDisplay() {
        const repeatButton = document.getElementById('repeatButton');
        const shuffleButton = document.getElementById('shuffleButton');

        // Update repeat button
        switch (this.repeatMode) {
            case REPEAT_MODES.NONE:
                repeatButton.textContent = '🔁';
                repeatButton.title = 'No repeat';
                repeatButton.style.color = '';
                break;
            case REPEAT_MODES.ALL:
                repeatButton.textContent = '🔁';
                repeatButton.title = 'Repeat all';
                repeatButton.style.color = '#1db954';
                break;
            case REPEAT_MODES.ONE:
                repeatButton.textContent = '🔂';
                repeatButton.title = 'Repeat one';
                repeatButton.style.color = '#1db954';
                break;
        }

        // Update shuffle button
        if (this.shuffleEnabled) {
            shuffleButton.textContent = '🔀';
            shuffleButton.style.color = '#1db954';
            shuffleButton.title = 'Shuffle on';
        } else {
            shuffleButton.textContent = '🔀';
            shuffleButton.style.color = '';
            shuffleButton.title = 'Shuffle off';
        }
    }

    // Playlist highlighting
    highlightCurrentSong() {
        // Remove playing class from all playlist items
        document.querySelectorAll('.playlist-song-item').forEach(item => {
            item.classList.remove('playing');
        });

        // Add playing class to current song
        if (this.currentSongIndex >= 0 && this.currentPlaylistSongs.length > 0) {
            const currentSongElement = document.querySelector(`.playlist-song-item:nth-child(${this.currentSongIndex + 1})`);
            if (currentSongElement) {
                currentSongElement.classList.add('playing');
            }
        }
    }

    highlightCurrentPlaylist() {
        // Remove active class from all playlist items in sidebar
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('active');
            // Reset text color for song count
            const songCountElement = item.querySelector('div > div:last-child');
            if (songCountElement) {
                songCountElement.style.color = '#666';
                songCountElement.style.opacity = '1';
            }
        });

        // Add active class to current playlist
        if (this.currentPlaylist) {
            const currentPlaylistElement = document.querySelector(`.playlist-item[onclick*="${this.currentPlaylist}"]`);
            if (currentPlaylistElement) {
                currentPlaylistElement.classList.add('active');
                // Update text color for song count
                const songCountElement = currentPlaylistElement.querySelector('div > div:last-child');
                if (songCountElement) {
                    songCountElement.style.color = '#000000';
                    songCountElement.style.opacity = '0.7';
                }
            }
        }
    }

    // Song info management
    async fetchSongInfo(songId) {
        try {
            const queryParams = getQueryParams();
            const queryString = buildQueryString(queryParams);
            const response = await fetch(`/api/song/${songId}?${queryString}`);

            if (response.ok) {
                const songInfo = await response.json();
                this.currentSongInfo = songInfo;
                this.updateInfoPanel(songInfo);
                this.updateLyricsPanel(songInfo);
            } else {
                console.warn('Failed to fetch song info:', response.status);
                // Show basic info if detailed fetch fails
                this.updateInfoPanelWithBasicInfo();
            }
        } catch (error) {
            console.error('Error fetching song info:', error);
            // Show basic info if fetch fails
            this.updateInfoPanelWithBasicInfo();
        }
    }

    updateInfoPanel(songInfo) {
        const infoPanel = document.getElementById('infoPanel');
        if (!infoPanel) return;

        const panelContent = infoPanel.querySelector('.panel-content');
        if (!panelContent) return;

        // Import utility functions
        import('./utils.js').then(({ formatDuration, formatNumber, formatDate }) => {
            // Format duration
            const duration = songInfo.duration || '';
            const formattedDuration = duration ? formatDuration(duration) : 'Unknown';

            // Format view count
            const viewsCount = songInfo.viewsCount || 0;
            const formattedViews = viewsCount > 0 ? formatNumber(viewsCount) : 'Unknown';

            // Format publish date
            const publishedAt = songInfo.publishedAt || '';
            const formattedDate = publishedAt ? formatDate(publishedAt) : 'Unknown';

            // Get artist names
            const artists = songInfo.artists || [];
            const artistNames = artists.length > 0 ? artists.map(artist => artist.name || artist).join(', ') : 'Unknown Artist';

            // Get album name
            const album = songInfo.album || songInfo.albumName || 'Unknown Album';
            const albumName = typeof album === 'object' ? album.name : album;

            // Get description (truncate if too long)
            const description = songInfo.description || '';
            const truncatedDescription = description.length > 300 ? description.substring(0, 300) + '...' : description;

            // Get thumbnail - try to get the highest quality thumbnail
            const thumbnails = songInfo.thumbnails || [];
            let thumbnail = '';
            if (thumbnails.length > 0) {
                // Sort by width to get the highest quality thumbnail
                const sortedThumbnails = thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));
                thumbnail = sortedThumbnails[0].url;
            }

            panelContent.innerHTML = `
                <div class="song-info-container">
                    ${thumbnail ? `
                        <div class="song-info-thumbnail">
                            <img src="${thumbnail}" alt="${songInfo.name || songInfo.title || 'Song'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                        </div>
                    ` : ''}
                    
                    <div class="song-info-details">
                        <h3 class="song-info-title">${songInfo.name || songInfo.title || 'Unknown Title'}</h3>
                        <p class="song-info-artist">${artistNames}</p>
                        
                        ${albumName && albumName !== 'Unknown Album' ? `
                            <div class="song-info-section">
                                <h4>Album</h4>
                                <p>${albumName}</p>
                            </div>
                        ` : ''}
                        
                        <div class="song-info-section">
                            <h4>Duration</h4>
                            <p>${formattedDuration}</p>
                        </div>
                        
                        ${viewsCount > 0 ? `
                            <div class="song-info-section">
                                <h4>Views</h4>
                                <p>${formattedViews}</p>
                            </div>
                        ` : ''}
                        
                        ${publishedAt ? `
                            <div class="song-info-section">
                                <h4>Published</h4>
                                <p>${formattedDate}</p>
                            </div>
                        ` : ''}
                        
                        ${truncatedDescription ? `
                            <div class="song-info-section">
                                <h4>Description</h4>
                                <p class="song-info-description">${truncatedDescription}</p>
                            </div>
                        ` : ''}
                        
                        ${songInfo.tags && songInfo.tags.length > 0 ? `
                            <div class="song-info-section">
                                <h4>Tags</h4>
                                <div class="song-info-tags">
                                    ${songInfo.tags.slice(0, 10).map(tag => `<span class="tag">${tag}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    }

    updateLyricsPanel(songInfo) {
        const lyricsPanel = document.getElementById('lyricsPanel');
        if (!lyricsPanel) return;

        const panelContent = lyricsPanel.querySelector('.panel-content');
        if (!panelContent) return;

        // Check if lyrics are available
        const hasLyrics = songInfo.lyrics && songInfo.lyrics.data && songInfo.lyrics.data.length > 0;

        if (hasLyrics) {
            // Get lyrics text from the first lyric entry
            const firstLyric = songInfo.lyrics.data[0];
            const lyricsText = firstLyric.plainLyric || '';

            // Get song title and artist for header
            const title = songInfo.name || songInfo.title || 'Unknown Title';
            const artists = songInfo.artists || [];
            const artistNames = artists.length > 0 ? artists.map(artist => artist.name || artist).join(', ') : 'Unknown Artist';

            panelContent.innerHTML = `
                <div class="lyrics-container">
                    <div class="lyrics-content">
                        <pre class="lyrics-text">${lyricsText}</pre>
                    </div>
                </div>
            `;
        } else {
            // Show placeholder when no lyrics available
            panelContent.innerHTML = `
                <div class="lyrics-placeholder">
                    <div class="placeholder-icon">🎵</div>
                    <div class="placeholder-text">No lyrics available for this song</div>
                </div>
            `;
        }
    }

    updateInfoPanelWithBasicInfo() {
        const infoPanel = document.getElementById('infoPanel');
        if (!infoPanel) return;

        const panelContent = infoPanel.querySelector('.panel-content');
        if (!panelContent) return;

        const title = document.getElementById('nowPlayingTitle').textContent;
        const artist = document.getElementById('nowPlayingArtist').textContent;

        panelContent.innerHTML = `
            <div class="song-info-container">
                <div class="song-info-details">
                    <h3 class="song-info-title">${title}</h3>
                    <p class="song-info-artist">${artist}</p>
                    
                    <div class="song-info-section">
                        <p style="color: #666; font-style: italic;">Detailed information unavailable</p>
                    </div>
                </div>
            </div>
        `;
    }

    clearInfoPanel() {
        const infoPanel = document.getElementById('infoPanel');
        if (!infoPanel) return;

        const panelContent = infoPanel.querySelector('.panel-content');
        if (!panelContent) return;

        panelContent.innerHTML = `
            <div class="info-placeholder">
                <div class="placeholder-icon">ℹ️</div>
                <div class="placeholder-text">Song information will appear here</div>
            </div>
        `;
    }

    // Mobile touch handling
    addMobileTouchHandlers() {
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

                if (this.currentAudio) {
                    const newTime = (percentage / 100) * this.currentAudio.duration;
                    this.currentAudio.currentTime = newTime;
                    this.updateProgressBar();
                }
            }.bind(this));
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

                if (this.currentAudio) {
                    this.currentAudio.volume = percentage / 100;
                    this.currentVolume = percentage / 100;
                    this.updateVolumeDisplay();
                    this.saveVolume(); // Save volume on touch
                }
            }.bind(this));
        }
    }

    enhancePlayerControls() {
        // Add swipe gestures for next/previous on mobile
        if (window.innerWidth <= 800) {
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

                        if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
                            if (deltaX > 0) {
                                // Swipe right - previous song
                                this.playPreviousSong();
                            } else {
                                // Swipe left - next song
                                this.playNextSong();
                            }
                        }
                    }
                }.bind(this));
            }
        }
    }

    // Setter methods for external access
    setCurrentPlaylist(playlistId) {
        this.currentPlaylist = playlistId;
    }

    setCurrentPlaylistSongs(songs) {
        this.currentPlaylistSongs = songs;
    }

    setCurrentSongIndex(index) {
        this.currentSongIndex = index;
    }
}

// Create global instance
window.playerManager = new PlayerManager();

// Make functions globally accessible for onclick handlers
window.togglePlay = () => window.playerManager.togglePlay();
window.playNextSong = () => window.playerManager.playNextSong();
window.playPreviousSong = () => window.playerManager.playPreviousSong();
window.toggleRepeatMode = () => window.playerManager.toggleRepeatMode();
window.toggleShuffle = () => window.playerManager.toggleShuffle();
window.seek = (event) => window.playerManager.seek(event);
window.playSong = (songId, title, artist, thumbnail, playlistId, songIndex) => 
    window.playerManager.playSong(songId, title, artist, thumbnail, playlistId, songIndex);
window.fetchSongInfo = (songId) => window.playerManager.fetchSongInfo(songId);
window.updateInfoPanel = (songInfo) => window.playerManager.updateInfoPanel(songInfo);
window.updateLyricsPanel = (songInfo) => window.playerManager.updateLyricsPanel(songInfo);
window.updateInfoPanelWithBasicInfo = () => window.playerManager.updateInfoPanelWithBasicInfo();
window.clearInfoPanel = () => window.playerManager.clearInfoPanel();
window.stopAllAudio = () => stopAllAudio();
