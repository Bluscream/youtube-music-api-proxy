import { PLAYER_STATES, REPEAT_MODES, DEFAULTS, PlayerState, RepeatMode } from './constants';
import { formatDuration } from './utils';

// Player Manager
export class PlayerManager {
    private currentState: PlayerState = PLAYER_STATES.STOPPED;
    private currentVolume: number = DEFAULTS.VOLUME;
    private repeatMode: RepeatMode = REPEAT_MODES.NONE;
    private isShuffled: boolean = false;
    private currentPlaylist: any[] = [];
    private currentIndex: number = -1;
    private originalPlaylist: any[] = [];

    constructor() {
        this.init();
    }

    init(): void {
        this.setupEventListeners();
        this.restoreState();
        this.updateUI();
    }

    setupEventListeners(): void {
        // Player controls
        const playButton = document.getElementById('playButton');
        const pauseButton = document.getElementById('pauseButton');
        const stopButton = document.getElementById('stopButton');
        const nextButton = document.getElementById('nextButton');
        const prevButton = document.getElementById('prevButton');
        const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
        const repeatButton = document.getElementById('repeatButton');
        const shuffleButton = document.getElementById('shuffleButton');

        if (playButton) playButton.addEventListener('click', () => this.resumeSong());
        if (pauseButton) pauseButton.addEventListener('click', () => this.pauseSong());
        if (stopButton) stopButton.addEventListener('click', () => this.stopSong());
        if (nextButton) nextButton.addEventListener('click', () => this.nextSong());
        if (prevButton) prevButton.addEventListener('click', () => this.previousSong());

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                this.setVolume(parseFloat(target.value));
            });
        }

        if (repeatButton) repeatButton.addEventListener('click', () => this.cycleRepeatMode());
        if (shuffleButton) shuffleButton.addEventListener('click', () => this.toggleShuffle());

        // Audio element events
        if (window.currentAudio) {
            window.currentAudio.addEventListener('ended', () => this.handleSongEnd());
            window.currentAudio.addEventListener('timeupdate', () => this.updateProgress());
            window.currentAudio.addEventListener('loadedmetadata', () => this.updateDuration());
        }
    }

    playSong(id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number): void {
        this.loadSong(id, title, artist, thumbnail, playlist, index);
        this.resumeSong();
    }

    loadSong(id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number): void {
        // Stop current audio
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio.currentTime = 0;
        }

        // Create new audio element
        const audio = new Audio();
        audio.src = `/api/stream/${id}`;
        audio.volume = this.currentVolume;
        audio.preload = 'metadata';

        // Set up event listeners
        audio.addEventListener('ended', () => this.handleSongEnd());
        audio.addEventListener('timeupdate', () => this.updateProgress());
        audio.addEventListener('loadedmetadata', () => this.updateDuration());
        audio.addEventListener('error', (e) => this.handleAudioError(e));

        window.currentAudio = audio;
        window.currentSongInfo = { id, title, artist, thumbnail };

        // Update playlist info
        if (playlist) {
            this.currentPlaylist = playlist;
            this.originalPlaylist = [...playlist];
            this.currentIndex = index !== undefined ? index : -1;
        }

        // Update UI
        this.updateSongInfo(title, artist, thumbnail);
        this.currentState = PLAYER_STATES.STOPPED;
        this.updateUI();

        // Update info panel
        if (window.rightSidebarManager) {
            window.rightSidebarManager.updateInfoPanel(window.currentSongInfo);
        }
    }

    pauseSong(): void {
        if (window.currentAudio && this.currentState === PLAYER_STATES.PLAYING) {
            window.currentAudio.pause();
            this.currentState = PLAYER_STATES.PAUSED;
            this.updateUI();
        }
    }

    resumeSong(): void {
        if (window.currentAudio && this.currentState !== PLAYER_STATES.PLAYING) {
            window.currentAudio.play().then(() => {
                this.currentState = PLAYER_STATES.PLAYING;
                this.updateUI();
            }).catch(error => {
                console.error('Error playing audio:', error);
                if (window.notificationManager) {
                    window.notificationManager.showErrorNotification('Failed to play audio');
                }
            });
        }
    }

    stopSong(): void {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio.currentTime = 0;
            this.currentState = PLAYER_STATES.STOPPED;
            this.updateUI();
        }
    }

    nextSong(): void {
        if (this.currentPlaylist.length > 0 && this.currentIndex < this.currentPlaylist.length - 1) {
            this.currentIndex++;
            const song = this.currentPlaylist[this.currentIndex];
            this.playSong(
                song.id || song.videoId,
                song.name || song.title,
                song.artists && song.artists.length > 0 ? song.artists[0].name : '',
                song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '',
                this.currentPlaylist,
                this.currentIndex
            );
        }
    }

    previousSong(): void {
        if (this.currentPlaylist.length > 0 && this.currentIndex > 0) {
            this.currentIndex--;
            const song = this.currentPlaylist[this.currentIndex];
            this.playSong(
                song.id || song.videoId,
                song.name || song.title,
                song.artists && song.artists.length > 0 ? song.artists[0].name : '',
                song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '',
                this.currentPlaylist,
                this.currentIndex
            );
        }
    }

    setVolume(volume: number): void {
        this.currentVolume = Math.max(0, Math.min(1, volume));
        if (window.currentAudio) {
            window.currentAudio.volume = this.currentVolume;
        }
        this.updateVolumeUI();
        this.saveState();
    }

    setRepeatMode(mode: RepeatMode): void {
        this.repeatMode = mode;
        this.updateRepeatUI();
        this.saveState();
    }

    cycleRepeatMode(): void {
        const modes = [REPEAT_MODES.NONE, REPEAT_MODES.ALL, REPEAT_MODES.ONE];
        const currentIndex = modes.indexOf(this.repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setRepeatMode(modes[nextIndex]);
    }

    toggleShuffle(): void {
        this.isShuffled = !this.isShuffled;
        if (this.isShuffled && this.currentPlaylist.length > 0) {
            this.originalPlaylist = [...this.currentPlaylist];
            this.shufflePlaylist();
        } else if (!this.isShuffled && this.originalPlaylist.length > 0) {
            this.currentPlaylist = [...this.originalPlaylist];
        }
        this.updateShuffleUI();
        this.saveState();
    }

    shufflePlaylist(): void {
        for (let i = this.currentPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentPlaylist[i], this.currentPlaylist[j]] = [this.currentPlaylist[j], this.currentPlaylist[i]];
        }
    }

    handleSongEnd(): void {
        switch (this.repeatMode) {
            case REPEAT_MODES.ONE:
                // Replay current song
                if (window.currentAudio) {
                    window.currentAudio.currentTime = 0;
                    window.currentAudio.play();
                }
                break;
            case REPEAT_MODES.ALL:
                // Play next song or restart playlist
                if (this.currentIndex < this.currentPlaylist.length - 1) {
                    this.nextSong();
                } else {
                    this.currentIndex = -1;
                    this.nextSong();
                }
                break;
            case REPEAT_MODES.NONE:
            default:
                // Play next song if available
                if (this.currentIndex < this.currentPlaylist.length - 1) {
                    this.nextSong();
                } else {
                    this.stopSong();
                }
                break;
        }
    }

    handleAudioError(error: Event): void {
        console.error('Audio error:', error);
        if (window.notificationManager) {
            window.notificationManager.showErrorNotification('Failed to load audio');
        }
    }

    updateProgress(): void {
        if (!window.currentAudio) return;

        const progressBar = document.getElementById('progressBar') as HTMLInputElement;
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');

        if (progressBar) {
            progressBar.value = window.currentAudio.currentTime.toString();
            progressBar.max = window.currentAudio.duration.toString();
        }

        if (currentTime) {
            currentTime.textContent = formatDuration(window.currentAudio.currentTime);
        }

        if (duration) {
            duration.textContent = formatDuration(window.currentAudio.duration);
        }
    }

    updateDuration(): void {
        if (!window.currentAudio) return;

        const progressBar = document.getElementById('progressBar') as HTMLInputElement;
        const duration = document.getElementById('duration');

        if (progressBar) {
            progressBar.max = window.currentAudio.duration.toString();
        }

        if (duration) {
            duration.textContent = formatDuration(window.currentAudio.duration);
        }
    }

    updateSongInfo(title: string, artist: string, thumbnail: string): void {
        const songTitle = document.getElementById('songTitle');
        const songArtist = document.getElementById('songArtist');
        const songThumbnail = document.getElementById('songThumbnail') as HTMLImageElement;

        if (songTitle) songTitle.textContent = title;
        if (songArtist) songArtist.textContent = artist;
        if (songThumbnail) songThumbnail.src = thumbnail;
    }

    updateUI(): void {
        const playButton = document.getElementById('playButton');
        const pauseButton = document.getElementById('pauseButton');

        if (playButton) playButton.style.display = this.currentState === PLAYER_STATES.PLAYING ? 'none' : 'block';
        if (pauseButton) pauseButton.style.display = this.currentState === PLAYER_STATES.PLAYING ? 'block' : 'none';
    }

    updateVolumeUI(): void {
        const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
        if (volumeSlider) {
            volumeSlider.value = this.currentVolume.toString();
        }
    }

    updateRepeatUI(): void {
        const repeatButton = document.getElementById('repeatButton');
        if (repeatButton) {
            repeatButton.textContent = this.repeatMode === REPEAT_MODES.ONE ? '🔂' :
                this.repeatMode === REPEAT_MODES.ALL ? '🔁' : '↩️';
        }
    }

    updateShuffleUI(): void {
        const shuffleButton = document.getElementById('shuffleButton');
        if (shuffleButton) {
            shuffleButton.classList.toggle('active', this.isShuffled);
        }
    }

    addMobileTouchHandlers(): void {
        // Add touch handlers for mobile devices
        const progressBar = document.getElementById('progressBar') as HTMLInputElement;
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                if (window.currentAudio) {
                    window.currentAudio.currentTime = parseFloat(target.value);
                }
            });
        }
    }

    enhancePlayerControls(): void {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.currentState === PLAYER_STATES.PLAYING) {
                        this.pauseSong();
                    } else {
                        this.resumeSong();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSong();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSong();
                    break;
            }
        });
    }

    setCurrentPlaylist(playlistId: string): void {
        // Store current playlist ID for highlighting
        this.currentPlaylistId = playlistId;
    }

    highlightCurrentPlaylist(): void {
        // Highlight current playlist in sidebar
        const playlistElements = document.querySelectorAll('[data-playlist-id]');
        playlistElements.forEach(element => {
            element.classList.remove('current-playlist');
            if (element.getAttribute('data-playlist-id') === this.currentPlaylistId) {
                element.classList.add('current-playlist');
            }
        });
    }

    saveState(): void {
        localStorage.setItem('playerState', JSON.stringify({
            volume: this.currentVolume,
            repeatMode: this.repeatMode,
            isShuffled: this.isShuffled
        }));
    }

    restoreState(): void {
        try {
            const savedState = localStorage.getItem('playerState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.currentVolume = state.volume || DEFAULTS.VOLUME;
                this.repeatMode = state.repeatMode || REPEAT_MODES.NONE;
                this.isShuffled = state.isShuffled || false;
            }
        } catch (error) {
            console.error('Error restoring player state:', error);
        }
    }

    private currentPlaylistId: string = '';
}

// Create global instance
window.playerManager = new PlayerManager();

// Global functions for onclick handlers
window.playSong = (id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number) =>
    window.playerManager.playSong(id, title, artist, thumbnail, playlist, index);
window.loadSong = (id: string, title: string, artist: string, thumbnail: string, playlist?: any[], index?: number) =>
    window.playerManager.loadSong(id, title, artist, thumbnail, playlist, index);
window.pauseSong = () => window.playerManager.pauseSong();
window.resumeSong = () => window.playerManager.resumeSong();
window.stopSong = () => window.playerManager.stopSong();
window.nextSong = () => window.playerManager.nextSong();
window.previousSong = () => window.playerManager.previousSong();
window.setVolume = (volume: number) => window.playerManager.setVolume(volume);
window.setRepeatMode = (mode: RepeatMode) => window.playerManager.setRepeatMode(mode);
window.toggleShuffle = () => window.playerManager.toggleShuffle();
