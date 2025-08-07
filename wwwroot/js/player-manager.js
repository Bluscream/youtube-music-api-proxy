import { NotificationManager } from './notification-manager.js';

// Player Manager V2 - Uses the YouTube Music API Proxy Library
export class PlayerManagerV2 {
    constructor(ytmLibrary) {
        this.ytm = ytmLibrary;
        this.currentPlaylist = [];
        this.currentIndex = -1;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.volume = 1;
        this.isPlaying = false;
        this.currentTrack = null;
        this.notificationManager = new NotificationManager();

        this.init();
    }

    init() {
        console.log('Player Manager V2 initialized with YouTube Music Library');
        this.setupEventListeners();
        this.setupPlayerEvents();
    }

    setupEventListeners() {
        // Player control buttons
        const playButton = document.getElementById('playButton');
        const repeatButton = document.getElementById('repeatButton');
        const shuffleButton = document.getElementById('shuffleButton');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeThumb = document.getElementById('volumeThumb');
        const volumeFill = document.getElementById('volumeFill');
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.getElementById('progressFill');

        if (playButton) {
            playButton.addEventListener('click', () => this.togglePlay());
        }

        if (repeatButton) {
            repeatButton.addEventListener('click', () => this.toggleRepeatMode());
        }

        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => this.toggleShuffle());
        }

        // Volume control
        if (volumeSlider) {
            volumeSlider.addEventListener('click', (e) => this.handleVolumeClick(e));
            volumeSlider.addEventListener('mousedown', (e) => this.startVolumeDrag(e));
        }

        // Progress bar
        if (progressBar) {
            progressBar.addEventListener('click', (e) => this.handleSeek(e));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Mobile touch handlers
        this.addMobileTouchHandlers();
    }

    setupPlayerEvents() {
        // Listen to player events from the library
        this.ytm.onPlayerEvent('play', (track) => {
            this.isPlaying = true;
            this.currentTrack = track;
            this.updatePlayButton();
            this.updateNowPlaying();
            this.notificationManager.showInfoNotification(`Now playing: ${track.title}`);
        });

        this.ytm.onPlayerEvent('pause', (track) => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.ytm.onPlayerEvent('ended', () => {
            this.handleTrackEnd();
        });

        this.ytm.onPlayerEvent('timeupdate', (data) => {
            this.updateProgress(data);
        });

        this.ytm.onPlayerEvent('volumechange', (data) => {
            this.updateVolumeDisplay(data.volume);
        });

        this.ytm.onPlayerEvent('error', (error) => {
            console.error('Player error:', error);
            this.notificationManager.showErrorNotification('Playback error occurred');
        });

        this.ytm.onPlayerEvent('trackchange', (track) => {
            this.currentTrack = track;
            this.updateNowPlaying();
            this.notificationManager.showInfoNotification(`Now playing: ${track.title}`);
        });
    }

    // Playback controls
    async togglePlay() {
        try {
            await this.ytm.togglePlay();
        } catch (error) {
            console.error('Error toggling play:', error);
            this.notificationManager.showErrorNotification('Failed to toggle playback');
        }
    }

    async playPreviousSong() {
        try {
            await this.ytm.previous();
        } catch (error) {
            console.error('Error playing previous song:', error);
            this.notificationManager.showErrorNotification('Failed to play previous song');
        }
    }

    async playNextSong() {
        try {
            await this.ytm.next();
        } catch (error) {
            console.error('Error playing next song:', error);
            this.notificationManager.showErrorNotification('Failed to play next song');
        }
    }

    async playSong(songId, songInfo = null) {
        try {
            const success = await this.ytm.playTrack(songId, songInfo);
            if (success) {
                this.currentTrack = songInfo || { id: songId };
            }
            return success;
        } catch (error) {
            console.error('Error playing song:', error);
            this.notificationManager.showErrorNotification('Failed to play song');
            return false;
        }
    }

    // Playlist management
    setPlaylist(playlist) {
        this.currentPlaylist = playlist;
        this.ytm.setPlaylist(playlist);
    }

    addToPlaylist(track) {
        this.currentPlaylist.push(track);
        this.ytm.addToPlaylist(track);
    }

    removeFromPlaylist(index) {
        if (index >= 0 && index < this.currentPlaylist.length) {
            this.currentPlaylist.splice(index, 1);
            this.ytm.removeFromPlaylist(index);
        }
    }

    clearPlaylist() {
        this.currentPlaylist = [];
        this.ytm.clearPlaylist();
    }

    // Repeat and shuffle
    toggleRepeatMode() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.repeatMode = modes[nextIndex];

        this.ytm.setRepeatMode(this.repeatMode);
        this.updateRepeatButton();
        this.notificationManager.showInfoNotification(`Repeat: ${this.repeatMode}`);
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.ytm.setShuffle(this.isShuffled);
        this.updateShuffleButton();
        this.notificationManager.showInfoNotification(`Shuffle: ${this.isShuffled ? 'on' : 'off'}`);
    }

    // Volume control
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.ytm.setVolume(this.volume);
        this.updateVolumeDisplay(this.volume);
    }

    handleVolumeClick(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const volume = clickX / rect.width;
        this.setVolume(volume);
    }

    startVolumeDrag(event) {
        const handleMouseMove = (e) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, clickX / rect.width));
            this.setVolume(volume);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    // Progress and seeking
    handleSeek(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;

        const playerState = this.ytm.getPlayerState();
        if (playerState.duration) {
            const seekTime = progress * playerState.duration;
            this.ytm.seek(seekTime);
        }
    }

    // UI updates
    updatePlayButton() {
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.textContent = this.isPlaying ? '⏸' : '▶';
            playButton.title = this.isPlaying ? 'Pause' : 'Play';
        }
    }

    updateNowPlaying() {
        const thumbnail = document.getElementById('nowPlayingThumbnail');
        const title = document.getElementById('nowPlayingTitle');
        const artist = document.getElementById('nowPlayingArtist');

        if (this.currentTrack) {
            if (thumbnail) {
                if (this.currentTrack.thumbnail) {
                    thumbnail.innerHTML = `<img src="${this.currentTrack.thumbnail}" alt="${this.currentTrack.title}">`;
                } else {
                    thumbnail.innerHTML = '🎵';
                }
            }

            if (title) {
                title.textContent = this.currentTrack.title || 'Unknown Title';
            }

            if (artist) {
                artist.textContent = this.currentTrack.artist || 'Unknown Artist';
            }
        } else {
            if (thumbnail) thumbnail.innerHTML = '';
            if (title) title.textContent = 'No song playing';
            if (artist) artist.textContent = '';
        }
    }

    updateProgress(data) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${data.progress}%`;
        }
    }

    updateVolumeDisplay(volume) {
        const volumeFill = document.getElementById('volumeFill');
        const volumeThumb = document.getElementById('volumeThumb');

        if (volumeFill) {
            volumeFill.style.width = `${volume * 100}%`;
        }

        if (volumeThumb) {
            volumeThumb.style.left = `${volume * 100}%`;
        }
    }

    updateRepeatButton() {
        const repeatButton = document.getElementById('repeatButton');
        if (repeatButton) {
            const icons = { none: '🔁', one: '🔂', all: '🔁' };
            const titles = { none: 'No repeat', one: 'Repeat one', all: 'Repeat all' };

            repeatButton.textContent = icons[this.repeatMode];
            repeatButton.title = titles[this.repeatMode];
        }
    }

    updateShuffleButton() {
        const shuffleButton = document.getElementById('shuffleButton');
        if (shuffleButton) {
            shuffleButton.textContent = this.isShuffled ? '🔀' : '🔀';
            shuffleButton.title = this.isShuffled ? 'Shuffle on' : 'Shuffle off';
        }
    }

    // Event handlers
    handleTrackEnd() {
        // The library handles track ending automatically
        console.log('Track ended');
    }

    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.playPreviousSong();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.playNextSong();
                break;
            case 'KeyR':
                event.preventDefault();
                this.toggleRepeatMode();
                break;
            case 'KeyS':
                event.preventDefault();
                this.toggleShuffle();
                break;
        }
    }

    // Mobile enhancements
    addMobileTouchHandlers() {
        const playerBar = document.querySelector('.player-bar');
        if (playerBar) {
            let touchStartX = 0;
            let touchStartY = 0;

            playerBar.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            playerBar.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                // Swipe left/right for previous/next
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        this.playPreviousSong();
                    } else {
                        this.playNextSong();
                    }
                }
            }, { passive: true });
        }
    }

    enhancePlayerControls() {
        // Add double-click to seek functionality
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('dblclick', (e) => {
                this.handleSeek(e);
            });
        }

        // Add volume wheel support
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const newVolume = Math.max(0, Math.min(1, this.volume + delta));
                this.setVolume(newVolume);
            });
        }
    }

    // Utility methods
    getCurrentTrack() {
        return this.currentTrack;
    }

    getPlayerState() {
        return this.ytm.getPlayerState();
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentPlaylist() {
        return this.currentPlaylist;
    }

    getCurrentIndex() {
        return this.ytm.getCurrentIndex();
    }

    // Cleanup
    destroy() {
        // Remove event listeners if needed
        console.log('Player Manager V2 destroyed');
    }
}
