import { SongSearchResult, RepeatMode } from './types';
import { settings } from './settings';

// Audio state
export let currentAudio: HTMLAudioElement | null = null;
export let isPlaying: boolean = false;
export let currentSongInfo: SongSearchResult | null = null;
export let errorRecoveryTimeout: number | null = null;
export let autoSkip: boolean = false;

const DEFAULT_TITLE = 'YouTube Music';

/**
 * Setup media key listeners for system media controls
 */
export function setupMediaKeyListeners(): void {
    if (!navigator.mediaSession) return;

    navigator.mediaSession.setActionHandler('play', () => {
        if (currentAudio && !isPlaying) {
            togglePlay();
        }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        if (currentAudio && isPlaying) {
            togglePlay();
        }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (settings.playlist && (window as any).currentPlaylistSongs?.length > 0) {
            playPreviousSong();
        }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (settings.playlist && (window as any).currentPlaylistSongs?.length > 0) {
            playNextSong();
        }
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (currentAudio && details.seekTime !== undefined) {
            currentAudio.currentTime = details.seekTime;
        }
    });

    navigator.mediaSession.setActionHandler('stop', () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            isPlaying = false;
            const playButton = document.getElementById('playButton') as HTMLButtonElement;
            if (playButton) {
                playButton.textContent = '▶';
            }
            document.title = DEFAULT_TITLE;
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'none';
            }
        }
    });

    // Keyboard media key listeners
    document.addEventListener('keydown', (event) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'MediaPlayPause':
                event.preventDefault();
                if (currentAudio) {
                    togglePlay();
                }
                break;
            case 'MediaTrackNext':
                event.preventDefault();
                if (settings.playlist && (window as any).currentPlaylistSongs?.length > 0) {
                    playNextSong();
                }
                break;
            case 'MediaTrackPrevious':
                event.preventDefault();
                if (settings.playlist && (window as any).currentPlaylistSongs?.length > 0) {
                    playPreviousSong();
                }
                break;
        }
    });
}

/**
 * Stop all audio playback
 */
export function stopAllAudio(): void {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    // Stop all audio elements
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== currentAudio) {
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

    currentSongInfo = null;
    clearInfoPanel();
    console.log('Stopped all audio playback');
}

/**
 * Handle playback errors
 */
export function handlePlaybackError(title: string, artist: string): void {
    if (errorRecoveryTimeout) {
        clearTimeout(errorRecoveryTimeout);
        errorRecoveryTimeout = null;
    }

    if (autoSkip && settings.playlist && (window as any).currentPlaylistSongs?.length > 0) {
        errorRecoveryTimeout = window.setTimeout(() => {
            console.log(`Auto-advancing playlist due to playback error: ${title}`);
            playNextSong();
            errorRecoveryTimeout = null;
        }, 3000);
    }
}

/**
 * Toggle play/pause state
 */
export function togglePlay(): void {
    if (!currentAudio) return;

    if (isPlaying) {
        currentAudio.pause();
        isPlaying = false;
        const playButton = document.getElementById('playButton') as HTMLButtonElement;
        if (playButton) {
            playButton.textContent = '▶';
        }
        if (navigator.mediaSession) {
            navigator.mediaSession.playbackState = 'paused';
        }
    } else {
        currentAudio.play().then(() => {
            isPlaying = true;
            const playButton = document.getElementById('playButton') as HTMLButtonElement;
            if (playButton) {
                playButton.textContent = '⏸';
            }
            if (navigator.mediaSession) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }).catch(error => {
            console.error('Error playing audio:', error);
            showErrorNotification('Failed to play audio');
        });
    }
}

/**
 * Play a song by ID
 */
export async function playSong(songId: string, title: string, artist: string, thumbnail?: string): Promise<void> {
    try {
        // Stop any currently playing audio
        stopAllAudio();

        // Create audio element
        currentAudio = new Audio();
        
        // Set up audio event listeners
        setupAudioEventListeners(currentAudio);

        // Set the audio source
        const audioUrl = `/api/stream/${songId}`;
        currentAudio.src = audioUrl;

        // Update current song info
        currentSongInfo = {
            id: songId,
            name: title,
            artists: [{ name: artist, id: '' }],
            album: { name: '', id: '' },
            duration: '00:00',
            isExplicit: false,
            playsInfo: '',
            thumbnails: thumbnail ? [{ url: thumbnail, width: 0, height: 0 }] : [],
            category: 'Songs' as any
        };

        // Update media session metadata
        updateMediaSessionMetadata(currentSongInfo);

        // Start playing
        await currentAudio.play();
        isPlaying = true;

        // Update UI
        updateNowPlayingUI(currentSongInfo, true);
        
        console.log(`Now playing: ${title} by ${artist}`);
    } catch (error) {
        console.error('Error playing song:', error);
        showErrorNotification(`Failed to play ${title}`);
        handlePlaybackError(title, artist);
    }
}

/**
 * Setup audio event listeners
 */
function setupAudioEventListeners(audio: HTMLAudioElement): void {
    audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
    });

    audio.addEventListener('canplay', () => {
        console.log('Audio can start playing');
    });

    audio.addEventListener('play', () => {
        isPlaying = true;
        updateNowPlayingUI(currentSongInfo, true);
    });

    audio.addEventListener('pause', () => {
        isPlaying = false;
        updateNowPlayingUI(currentSongInfo, false);
    });

    audio.addEventListener('ended', () => {
        console.log('Audio playback ended');
        isPlaying = false;
        updateNowPlayingUI(currentSongInfo, false);
        
        // Auto-play next song if in playlist mode
        if (settings.repeat === 'all' && (window as any).currentPlaylistSongs?.length > 0) {
            playNextSong();
        }
    });

    audio.addEventListener('error', (event) => {
        console.error('Audio error:', event);
        const error = event as ErrorEvent;
        showErrorNotification(`Audio error: ${error.message}`);
        
        if (currentSongInfo) {
            handlePlaybackError(currentSongInfo.name, currentSongInfo.artists?.[0]?.name || 'Unknown Artist');
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (currentAudio) {
            updateProgressBar(currentAudio.currentTime, currentAudio.duration);
        }
    });

    audio.addEventListener('volumechange', () => {
        if (currentAudio) {
            updateVolumeDisplay(currentAudio.volume);
        }
    });
}

/**
 * Update media session metadata
 */
function updateMediaSessionMetadata(song: SongSearchResult): void {
    if (!navigator.mediaSession) return;

    navigator.mediaSession.metadata = new MediaMetadata({
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
 * Update now playing UI
 */
function updateNowPlayingUI(song: SongSearchResult | null, isPlaying: boolean): void {
    const titleElement = document.getElementById('nowPlayingTitle');
    const artistElement = document.getElementById('nowPlayingArtist');
    const thumbnailElement = document.getElementById('nowPlayingThumbnail');
    const playButton = document.getElementById('playButton') as HTMLButtonElement;

    if (song) {
        if (titleElement) titleElement.textContent = song.name;
        if (artistElement) artistElement.textContent = song.artists?.[0]?.name || 'Unknown Artist';
        if (playButton) playButton.textContent = isPlaying ? '⏸' : '▶';

        if (thumbnailElement && song.thumbnails?.[0]?.url) {
            thumbnailElement.style.backgroundImage = `url(${song.thumbnails[0].url})`;
        }

        document.title = isPlaying ? `${song.name} - ${song.artists?.[0]?.name || 'Unknown Artist'}` : 'YouTube Music';
    } else {
        if (titleElement) titleElement.textContent = '';
        if (artistElement) artistElement.textContent = '';
        if (playButton) playButton.textContent = '▶';
        if (thumbnailElement) thumbnailElement.style.backgroundImage = '';

        document.title = 'YouTube Music';
    }
}

/**
 * Update progress bar
 */
function updateProgressBar(currentTime: number, duration: number): void {
    const progressFill = document.getElementById('progressFill') as HTMLElement;
    if (progressFill && duration > 0) {
        const percentage = (currentTime / duration) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

/**
 * Update volume display
 */
function updateVolumeDisplay(volume: number): void {
    const volumeFill = document.getElementById('volumeFill') as HTMLElement;
    if (volumeFill) {
        volumeFill.style.width = `${volume * 100}%`;
    }
}

/**
 * Clear info panel
 */
function clearInfoPanel(): void {
    const titleElement = document.getElementById('nowPlayingTitle');
    const artistElement = document.getElementById('nowPlayingArtist');
    const thumbnailElement = document.getElementById('nowPlayingThumbnail');
    const playButton = document.getElementById('playButton') as HTMLButtonElement;

    if (titleElement) titleElement.textContent = '';
    if (artistElement) artistElement.textContent = '';
    if (playButton) playButton.textContent = '▶';
    if (thumbnailElement) thumbnailElement.style.backgroundImage = '';

    document.title = DEFAULT_TITLE;
}

/**
 * Show error notification
 */
function showErrorNotification(message: string): void {
    if (window.notificationManager) {
        window.notificationManager.error('Audio Error', message);
    } else {
        console.error('Audio Error:', message);
    }
}

/**
 * Play next song in playlist
 */
export function playNextSong(): void {
    const currentPlaylistSongs = (window as any).currentPlaylistSongs as SongSearchResult[];
    const currentSongIndex = (window as any).currentSongIndex as number;

    if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
        console.log('No playlist songs available');
        return;
    }

    let nextIndex = currentSongIndex + 1;
    
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
        (window as any).currentSongIndex = nextIndex;
        playSong(nextSong.id, nextSong.name, nextSong.artists?.[0]?.name || 'Unknown Artist', nextSong.thumbnails?.[0]?.url);
    }
}

/**
 * Play previous song in playlist
 */
export function playPreviousSong(): void {
    const currentPlaylistSongs = (window as any).currentPlaylistSongs as SongSearchResult[];
    const currentSongIndex = (window as any).currentSongIndex as number;

    if (!currentPlaylistSongs || currentPlaylistSongs.length === 0) {
        console.log('No playlist songs available');
        return;
    }

    let prevIndex = currentSongIndex - 1;
    
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
        (window as any).currentSongIndex = prevIndex;
        playSong(prevSong.id, prevSong.name, prevSong.artists?.[0]?.name || 'Unknown Artist', prevSong.thumbnails?.[0]?.url);
    }
}

/**
 * Set volume
 */
export function setVolume(volume: number): void {
    if (currentAudio) {
        currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
}

/**
 * Seek to position
 */
export function seekTo(position: number): void {
    if (currentAudio && !isNaN(position)) {
        currentAudio.currentTime = Math.max(0, Math.min(currentAudio.duration, position));
    }
}

/**
 * Get current audio state
 */
export function getCurrentAudioState(): { currentTime: number; duration: number; volume: number; isPlaying: boolean } {
    if (currentAudio) {
        return {
            currentTime: currentAudio.currentTime,
            duration: currentAudio.duration,
            volume: currentAudio.volume,
            isPlaying: isPlaying
        };
    }
    return {
        currentTime: 0,
        duration: 0,
        volume: 1,
        isPlaying: false
    };
}

// Initialize media key listeners when the module loads
setupMediaKeyListeners();
