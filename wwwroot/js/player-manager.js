import { NotificationManager } from './notification-manager.js';

// Player Manager - Handles audio playback using the YouTube Music API
export class PlayerManager {
    constructor(ytmAPI) {
        this.api = ytmAPI;
        this.audio = new Audio();
        this.currentPlaylist = [];
        this.currentIndex = -1;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.volume = 1;
        this.isPlaying = false;
        this.currentTrack = null;
        this.notificationManager = new NotificationManager();

        // Player state
        this.state = {
            currentTime: 0,
            duration: 0,
            volume: 1,
            muted: false
        };

        // Event listeners
        this.listeners = {
            play: [],
            pause: [],
            ended: [],
            timeupdate: [],
            volumechange: [],
            error: [],
            trackchange: []
        };

        this.init();
    }

    init() {
        console.log('Player Manager initialized with YouTube Music API');
        this.setupAudioEvents();
        this.setupEventListeners();
        this.setVolume(this.volume);
    }

    setupAudioEvents() {
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.emit('play', this.currentTrack);
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.emit('pause', this.currentTrack);
        });

        this.audio.addEventListener('ended', () => {
            this.handleTrackEnd();
        });

        this.audio.addEventListener('timeupdate', () => {
            this.state.currentTime = this.audio.currentTime;
            this.state.duration = this.audio.duration;
            this.emit('timeupdate', {
                currentTime: this.audio.currentTime,
                duration: this.audio.duration,
                progress: this.audio.duration > 0 ? (this.audio.currentTime / this.audio.duration) * 100 : 0
            });
        });

        this.audio.addEventListener('volumechange', () => {
            this.state.volume = this.audio.volume;
            this.state.muted = this.audio.muted;
            this.emit('volumechange', {
                volume: this.audio.volume,
                muted: this.audio.muted
            });
        });

        this.audio.addEventListener('error', (error) => {
            this.emit('error', error);
        });
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
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
        // Listen to player events
        this.on('play', (track) => {
            this.isPlaying = true;
            this.currentTrack = track;
            this.updatePlayButton();
            this.updateNowPlaying();
            this.notificationManager.showInfoNotification(`Now playing: ${track.title}`);
        });

        this.on('pause', (track) => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.on('ended', () => {
            this.handleTrackEnd();
        });

        this.on('timeupdate', (data) => {
            this.updateProgress(data);
        });

        this.on('volumechange', (data) => {
            this.updateVolumeDisplay(data.volume);
        });

        this.on('error', (error) => {
            console.error('Player error:', error);
            this.notificationManager.showErrorNotification('Playback error occurred');
        });

        this.on('trackchange', (track) => {
            this.currentTrack = track;
            this.updateNowPlaying();
            this.notificationManager.showInfoNotification(`Now playing: ${track.title}`);
        });

        console.log('Player events setup complete');
    }

    // Playback controls
    async togglePlay() {
        try {
            if (this.isPlaying) {
                this.audio.pause();
            } else {
                await this.audio.play();
            }
        } catch (error) {
            console.error('Error toggling play:', error);
            this.notificationManager.showErrorNotification('Failed to toggle playback');
        }
    }

    async playPreviousSong() {
        try {
            if (this.currentPlaylist.length === 0) return;

            let prevIndex = this.currentIndex - 1;
            if (prevIndex < 0) {
                if (this.repeatMode === 'all') {
                    prevIndex = this.currentPlaylist.length - 1;
                } else {
                    return;
                }
            }

            await this.playTrackByIndex(prevIndex);
        } catch (error) {
            console.error('Error playing previous song:', error);
            this.notificationManager.showErrorNotification('Failed to play previous song');
        }
    }

    async playNextSong() {
        try {
            if (this.currentPlaylist.length === 0) return;

            let nextIndex = this.currentIndex + 1;
            if (nextIndex >= this.currentPlaylist.length) {
                if (this.repeatMode === 'all') {
                    nextIndex = 0;
                } else {
                    return;
                }
            }

            await this.playTrackByIndex(nextIndex);
        } catch (error) {
            console.error('Error playing next song:', error);
            this.notificationManager.showErrorNotification('Failed to play next song');
        }
    }

    async playSong(songId, songInfo = null) {
        try {
            const success = await this.playTrack(songId, songInfo);
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

    async playTrack(trackId, trackInfo = null) {
        try {
            // Get streaming data
            const streamingData = await this.api.getStreamingData(trackId);

            // Find the best audio stream
            const audioStream = streamingData.StreamInfo
                ?.filter(stream => stream.Url && stream.Bitrate)
                .sort((a, b) => b.Bitrate - a.Bitrate)[0];

            if (!audioStream) {
                throw new Error('No audio stream available');
            }

            // Set track info
            this.currentTrack = {
                id: trackId,
                title: trackInfo?.title || 'Unknown Title',
                artist: trackInfo?.artist || 'Unknown Artist',
                thumbnail: trackInfo?.thumbnail || '',
                duration: trackInfo?.duration || 0,
                ...trackInfo
            };

            // Set audio source
            this.audio.src = this.api.getAudioStreamUrl(trackId);

            // Play the audio
            await this.audio.play();

            this.emit('trackchange', this.currentTrack);
            return true;
        } catch (error) {
            this.emit('error', error);
            return false;
        }
    }

    async playTrackByIndex(index) {
        if (index < 0 || index >= this.currentPlaylist.length) {
            return false;
        }

        this.currentIndex = index;
        const track = this.currentPlaylist[index];
        return this.playTrack(track.id, track);
    }

    // Playlist management
    setPlaylist(playlist) {
        this.currentPlaylist = playlist;
        this.currentIndex = -1;
    }

    addToPlaylist(track) {
        this.currentPlaylist.push(track);
    }

    removeFromPlaylist(index) {
        if (index >= 0 && index < this.currentPlaylist.length) {
            this.currentPlaylist.splice(index, 1);
            if (index <= this.currentIndex) {
                this.currentIndex--;
            }
        }
    }

    clearPlaylist() {
        this.currentPlaylist = [];
        this.currentIndex = -1;
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    // Repeat and shuffle
    toggleRepeatMode() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.repeatMode = modes[nextIndex];

        this.updateRepeatButton();
        this.notificationManager.showInfoNotification(`Repeat: ${this.repeatMode}`);
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        if (this.isShuffled && this.currentPlaylist.length > 0) {
            this.shufflePlaylist();
        }
        this.updateShuffleButton();
        this.notificationManager.showInfoNotification(`Shuffle: ${this.isShuffled ? 'on' : 'off'}`);
    }

    shufflePlaylist() {
        for (let i = this.currentPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentPlaylist[i], this.currentPlaylist[j]] = [this.currentPlaylist[j], this.currentPlaylist[i]];
        }
    }

    // Volume control
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
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

        if (this.audio.duration) {
            const seekTime = progress * this.audio.duration;
            this.audio.currentTime = seekTime;
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
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.playNextSong();
        }
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
        return {
            ...this.state,
            isPlaying: this.isPlaying,
            currentTrack: this.currentTrack,
            currentIndex: this.currentIndex,
            playlistLength: this.currentPlaylist.length,
            repeatMode: this.repeatMode,
            isShuffled: this.isShuffled
        };
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getCurrentPlaylist() {
        return this.currentPlaylist;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    // Cleanup
    destroy() {
        this.audio.pause();
        this.audio.src = '';
        this.listeners = {};
        this.currentPlaylist = [];
        this.currentTrack = null;
        console.log('Player Manager destroyed');
    }
}

// Create global instance
window.playerManager = new PlayerManager(window.ytmAPI);

// Global functions for onclick handlers
window.togglePlay = () => window.playerManager.togglePlay();
window.playPreviousSong = () => window.playerManager.playPreviousSong();
window.playNextSong = () => window.playerManager.playNextSong();
window.toggleRepeatMode = () => window.playerManager.toggleRepeatMode();
window.toggleShuffle = () => window.playerManager.toggleShuffle();
window.seek = (event) => window.playerManager.handleSeek(event);
