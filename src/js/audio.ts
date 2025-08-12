import { SongInfo, RepeatMode } from './types';
import { settings } from './settings';

// Audio state
export let currentAudio: HTMLAudioElement | null = null;
export let isPlaying: boolean = false;
export let currentSongInfo: SongInfo | null = null;
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
 * Play next song in playlist
 */
export function playNextSong(): void {
    if (!settings.playlist || !(window as any).currentPlaylistSongs) return;

    const nextIndex = getNextSongIndex();
    if (nextIndex >= 0 && nextIndex < (window as any).currentPlaylistSongs.length) {
        const song = (window as any).currentPlaylistSongs[nextIndex];
        playSong(song.id, song.title, song.artist, song.thumbnail, settings.playlist, nextIndex);
    }
}

/**
 * Play previous song in playlist
 */
export function playPreviousSong(): void {
    if (!settings.playlist || !(window as any).currentPlaylistSongs) return;

    const prevIndex = getPreviousSongIndex();
    if (prevIndex >= 0 && prevIndex < (window as any).currentPlaylistSongs.length) {
        const song = (window as any).currentPlaylistSongs[prevIndex];
        playSong(song.id, song.title, song.artist, song.thumbnail, settings.playlist, prevIndex);
    }
}

/**
 * Get next song index based on repeat mode
 */
function getNextSongIndex(): number {
    if (!(window as any).currentPlaylistSongs || (window as any).currentSongIndex === -1) return -1;

    const currentIndex = (window as any).currentSongIndex;
    const totalSongs = (window as any).currentPlaylistSongs.length;

    if (settings.repeat === 'one') {
        return currentIndex; // Repeat current song
    } else if (settings.repeat === 'all') {
        return (currentIndex + 1) % totalSongs; // Loop playlist
    } else {
        return currentIndex + 1 < totalSongs ? currentIndex + 1 : -1; // Stop at end
    }
}

/**
 * Get previous song index
 */
function getPreviousSongIndex(): number {
    if (!(window as any).currentPlaylistSongs || (window as any).currentSongIndex === -1) return -1;

    const currentIndex = (window as any).currentSongIndex;
    const totalSongs = (window as any).currentPlaylistSongs.length;

    if (settings.repeat === 'one') {
        return currentIndex; // Repeat current song
    } else if (settings.repeat === 'all') {
        return currentIndex - 1 >= 0 ? currentIndex - 1 : totalSongs - 1; // Loop playlist
    } else {
        return currentIndex - 1 >= 0 ? currentIndex - 1 : -1; // Stop at beginning
    }
}

/**
 * Toggle repeat mode
 */
export function toggleRepeatMode(): void {
    const repeatModes: RepeatMode[] = ['none', 'one', 'all'];
    const currentIndex = repeatModes.indexOf(settings.repeat);
    const nextIndex = (currentIndex + 1) % repeatModes.length;
    settings.repeat = repeatModes[nextIndex];

    updateRepeatShuffleDisplay();
    showSuccessNotification(`Repeat mode: ${settings.repeat}`);
}

/**
 * Update repeat/shuffle display
 */
function updateRepeatShuffleDisplay(): void {
    const repeatButton = document.getElementById('repeatButton') as HTMLButtonElement;
    if (repeatButton) {
        const repeatModes = {
            'none': { icon: '🔁', title: 'No repeat' },
            'one': { icon: '🔂', title: 'Repeat one' },
            'all': { icon: '🔁', title: 'Repeat all' }
        };

        const mode = repeatModes[settings.repeat];
        repeatButton.textContent = mode.icon;
        repeatButton.title = mode.title;
    }
}

// Helper functions (these would be imported from other modules)
function playSong(songId: string, title: string, artist: string, thumbnail?: string, playlistId?: string, songIndex?: number): void {
    // This would be implemented in the main app module
    console.log('Playing song:', { songId, title, artist, thumbnail, playlistId, songIndex });
}

function clearInfoPanel(): void {
    // This would be implemented in the UI module
    console.log('Clearing info panel');
}

function showErrorNotification(message: string): void {
    // This would be implemented in the notification module
    console.error('Error notification:', message);
}

function showSuccessNotification(message: string): void {
    // This would be implemented in the notification module
    console.log('Success notification:', message);
}
