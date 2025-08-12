import { StateManager } from '../core/state-manager';
import { EventEmitter } from '../core/event-emitter';
import { SongSearchResult, RepeatMode } from '../types';
import { AppSettingsManager } from './app-settings-manager';

// Audio state interface
interface AudioState {
    currentAudio: HTMLAudioElement | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    currentSong: SongSearchResult | null;
    currentPlaylistSongs: SongSearchResult[];
    currentSongIndex: number;
    errorRecoveryTimeout: number | null;
    autoSkip: boolean;
}

// Audio events
export interface AudioEvents {
    play: { song: SongSearchResult };
    pause: { song: SongSearchResult };
    stop: void;
    timeUpdate: { currentTime: number; duration: number };
    volumeChange: { volume: number };
    error: { error: Error; song: SongSearchResult };
    songEnd: { song: SongSearchResult };
    playlistChange: { songs: SongSearchResult[] };
    songChange: { song: SongSearchResult; index: number };
}

// Audio Manager with comprehensive state management
export class AudioManager extends StateManager<AudioState> {
    private static instance: AudioManager;
    private settingsManager: AppSettingsManager;
    private mediaSession: MediaSession | null = null;

    private constructor() {
        const initialState: AudioState = {
            currentAudio: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            currentSong: null,
            currentPlaylistSongs: [],
            currentSongIndex: -1,
            errorRecoveryTimeout: null,
            autoSkip: false
        };

        super(initialState, 'audio-state');
        this.settingsManager = AppSettingsManager.getInstance();
        this.setupMediaSession();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Setup Media Session API
     */
    private setupMediaSession(): void {
        if (!navigator.mediaSession) {
            console.log('Media Session API not supported');
            return;
        }

        this.mediaSession = navigator.mediaSession;

        this.mediaSession.setActionHandler('play', () => this.play());
        this.mediaSession.setActionHandler('pause', () => this.pause());
        this.mediaSession.setActionHandler('previoustrack', () => this.previous());
        this.mediaSession.setActionHandler('nexttrack', () => this.next());
        this.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) {
                this.seek(details.seekTime);
            }
        });
        this.mediaSession.setActionHandler('stop', () => this.stop());
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Keyboard media key listeners
        document.addEventListener('keydown', (event) => {
            if (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.code) {
                case 'MediaPlayPause':
                    event.preventDefault();
                    this.togglePlay();
                    break;
                case 'MediaTrackNext':
                    event.preventDefault();
                    this.next();
                    break;
                case 'MediaTrackPrevious':
                    event.preventDefault();
                    this.previous();
                    break;
            }
        });
    }

    /**
     * Play a song
     */
    async playSong(song: SongSearchResult, songIndex: number = -1): Promise<void> {
        try {
            // Stop any currently playing audio
            this.stopAllAudio();

            // Create audio element
            const audio = new Audio();

            // Set up audio event listeners
            this.setupAudioEventListeners(audio);

            // Set the audio source
            const audioUrl = `/api/stream/${song.id}`;
            audio.src = audioUrl;

            // Update state
            this.setState({
                currentAudio: audio,
                currentSong: song,
                currentSongIndex: songIndex,
                isPlaying: false
            });

            // Update media session metadata
            this.updateMediaSessionMetadata(song);

            // Start playing
            await audio.play();

            this.setState({ isPlaying: true });
            this.emit('play', { song });

            console.log(`Now playing: ${song.name} by ${song.artists?.[0]?.name || 'Unknown Artist'}`);
        } catch (error) {
            console.error('Error playing song:', error);
            this.emit('error', { error: error as Error, song });
        }
    }

    /**
     * Setup audio event listeners
     */
    private setupAudioEventListeners(audio: HTMLAudioElement): void {
        audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });

        audio.addEventListener('canplay', () => {
            console.log('Audio can start playing');
        });

        audio.addEventListener('play', () => {
            this.setState({ isPlaying: true });
            if (this.state.currentSong) {
                this.emit('play', { song: this.state.currentSong });
            }
        });

        audio.addEventListener('pause', () => {
            this.setState({ isPlaying: false });
            if (this.state.currentSong) {
                this.emit('pause', { song: this.state.currentSong });
            }
        });

        audio.addEventListener('ended', () => {
            console.log('Audio playback ended');
            this.setState({ isPlaying: false });

            if (this.state.currentSong) {
                this.emit('songEnd', { song: this.state.currentSong });
            }

            // Auto-play next song if in playlist mode
            const settings = this.settingsManager.getState();
            if (settings.repeat === 'all' && this.state.currentPlaylistSongs.length > 0) {
                this.next();
            }
        });

        audio.addEventListener('error', (event) => {
            console.error('Audio error:', event);
            const error = event as ErrorEvent;

            if (this.state.currentSong) {
                this.emit('error', { error: new Error(error.message), song: this.state.currentSong });
            }
        });

        audio.addEventListener('timeupdate', () => {
            if (audio) {
                this.setState({
                    currentTime: audio.currentTime,
                    duration: audio.duration
                });
                this.emit('timeUpdate', { currentTime: audio.currentTime, duration: audio.duration });
            }
        });

        audio.addEventListener('volumechange', () => {
            if (audio) {
                this.setState({ volume: audio.volume });
                this.emit('volumeChange', { volume: audio.volume });
            }
        });
    }

    /**
     * Update media session metadata
     */
    private updateMediaSessionMetadata(song: SongSearchResult): void {
        if (!this.mediaSession) return;

        this.mediaSession.metadata = new MediaMetadata({
            title: song.name,
            artist: song.artists?.[0]?.name || 'Unknown Artist',
            album: song.album?.name || '',
            artwork: song.thumbnails?.map(thumb => ({
                src: thumb.url,
                sizes: `${thumb.width}x${thumb.height}`,
                type: 'image/jpeg'
            })) || []
        });
    }

    /**
     * Toggle play/pause
     */
    togglePlay(): void {
        if (this.state.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Play current audio
     */
    play(): void {
        if (this.state.currentAudio && !this.state.isPlaying) {
            this.state.currentAudio.play().then(() => {
                this.setState({ isPlaying: true });
                if (this.mediaSession) {
                    this.mediaSession.playbackState = 'playing';
                }
            }).catch(error => {
                console.error('Error playing audio:', error);
                if (this.state.currentSong) {
                    this.emit('error', { error, song: this.state.currentSong });
                }
            });
        }
    }

    /**
     * Pause current audio
     */
    pause(): void {
        if (this.state.currentAudio && this.state.isPlaying) {
            this.state.currentAudio.pause();
            this.setState({ isPlaying: false });
            if (this.mediaSession) {
                this.mediaSession.playbackState = 'paused';
            }
        }
    }

    /**
     * Stop all audio
     */
    stop(): void {
        this.stopAllAudio();
        if (this.mediaSession) {
            this.mediaSession.playbackState = 'none';
        }
        this.emit('stop');
    }

    /**
     * Stop all audio playback
     */
    private stopAllAudio(): void {
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            this.state.currentAudio.currentTime = 0;
        }

        // Stop all audio elements
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            if (audio !== this.state.currentAudio) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // Stop all video elements with audio tracks
        const allVideoElements = document.querySelectorAll('video');
        allVideoElements.forEach(video => {
            if ((video as any).audioTracks && (video as any).audioTracks.length > 0) {
                video.pause();
                video.currentTime = 0;
            }
        });

        // Suspend audio context if available
        if (window.AudioContext || (window as any).webkitAudioContext) {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (audioContext.state === 'running') {
                    audioContext.suspend();
                }
            } catch (e) {
                // Ignore errors
            }
        }

        // Stop all media elements
        const mediaElements = document.querySelectorAll('audio, video');
        mediaElements.forEach(media => {
            const mediaElement = media as HTMLMediaElement;
            if (!mediaElement.paused) {
                mediaElement.pause();
                mediaElement.currentTime = 0;
            }
        });

        this.setState({
            currentAudio: null,
            currentSong: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0
        });

        console.log('Stopped all audio playback');
    }

    /**
     * Play next song in playlist
     */
    next(): void {
        const { currentPlaylistSongs, currentSongIndex } = this.state;

        if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
            console.log('No playlist songs available');
            return;
        }

        let nextIndex = currentSongIndex + 1;
        const settings = this.settingsManager.getState();

        // Handle repeat modes
        if (nextIndex >= currentPlaylistSongs.length) {
            if (settings.repeat === 'all') {
                nextIndex = 0; // Loop back to beginning
            } else {
                console.log('Reached end of playlist');
                return;
            }
        }

        const nextSong = currentPlaylistSongs[nextIndex];
        if (nextSong) {
            this.playSong(nextSong, nextIndex);
        }
    }

    /**
     * Play previous song in playlist
     */
    previous(): void {
        const { currentPlaylistSongs, currentSongIndex } = this.state;

        if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
            console.log('No playlist songs available');
            return;
        }

        let prevIndex = currentSongIndex - 1;
        const settings = this.settingsManager.getState();

        // Handle repeat modes
        if (prevIndex < 0) {
            if (settings.repeat === 'all') {
                prevIndex = currentPlaylistSongs.length - 1; // Loop to end
            } else {
                console.log('Reached beginning of playlist');
                return;
            }
        }

        const prevSong = currentPlaylistSongs[prevIndex];
        if (prevSong) {
            this.playSong(prevSong, prevIndex);
        }
    }

    /**
     * Set volume
     */
    setVolume(volume: number): void {
        if (this.state.currentAudio) {
            this.state.currentAudio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Seek to position
     */
    seek(position: number): void {
        if (this.state.currentAudio && !isNaN(position)) {
            this.state.currentAudio.currentTime = Math.max(0, Math.min(this.state.currentAudio.duration, position));
        }
    }

    /**
     * Set playlist songs
     */
    setPlaylistSongs(songs: SongSearchResult[]): void {
        this.setState({ currentPlaylistSongs: songs });
        this.emit('playlistChange', { songs });
    }

    /**
     * Get current audio state
     */
    getCurrentState(): AudioState {
        return this.state;
    }

    /**
     * Get current song
     */
    getCurrentSong(): SongSearchResult | null {
        return this.state.currentSong;
    }

    /**
     * Get current playlist songs
     */
    getCurrentPlaylistSongs(): SongSearchResult[] {
        return this.state.currentPlaylistSongs;
    }

    /**
     * Get current song index
     */
    getCurrentSongIndex(): number {
        return this.state.currentSongIndex;
    }

    /**
     * Check if currently playing
     */
    isCurrentlyPlaying(): boolean {
        return this.state.isPlaying;
    }

    /**
     * Get current time
     */
    getCurrentTime(): number {
        return this.state.currentTime;
    }

    /**
     * Get duration
     */
    getDuration(): number {
        return this.state.duration;
    }

    /**
     * Get volume
     */
    getVolume(): number {
        return this.state.volume;
    }
}
