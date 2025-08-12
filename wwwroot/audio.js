"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoSkip = exports.errorRecoveryTimeout = exports.currentSongInfo = exports.isPlaying = exports.currentAudio = void 0;
exports.setupMediaKeyListeners = setupMediaKeyListeners;
exports.stopAllAudio = stopAllAudio;
exports.handlePlaybackError = handlePlaybackError;
exports.togglePlay = togglePlay;
exports.playNextSong = playNextSong;
exports.playPreviousSong = playPreviousSong;
exports.toggleRepeatMode = toggleRepeatMode;
const settings_1 = require("./settings");
// Audio state
exports.currentAudio = null;
exports.isPlaying = false;
exports.currentSongInfo = null;
exports.errorRecoveryTimeout = null;
exports.autoSkip = false;
const DEFAULT_TITLE = 'YouTube Music';
/**
 * Setup media key listeners for system media controls
 */
function setupMediaKeyListeners() {
    if (!navigator.mediaSession)
        return;
    navigator.mediaSession.setActionHandler('play', () => {
        if (exports.currentAudio && !exports.isPlaying) {
            togglePlay();
        }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        if (exports.currentAudio && exports.isPlaying) {
            togglePlay();
        }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (settings_1.settings.playlist && window.currentPlaylistSongs?.length > 0) {
            playPreviousSong();
        }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (settings_1.settings.playlist && window.currentPlaylistSongs?.length > 0) {
            playNextSong();
        }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (exports.currentAudio && details.seekTime !== undefined) {
            exports.currentAudio.currentTime = details.seekTime;
        }
    });
    navigator.mediaSession.setActionHandler('stop', () => {
        if (exports.currentAudio) {
            exports.currentAudio.pause();
            exports.currentAudio.currentTime = 0;
            exports.isPlaying = false;
            const playButton = document.getElementById('playButton');
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
                if (exports.currentAudio) {
                    togglePlay();
                }
                break;
            case 'MediaTrackNext':
                event.preventDefault();
                if (settings_1.settings.playlist && window.currentPlaylistSongs?.length > 0) {
                    playNextSong();
                }
                break;
            case 'MediaTrackPrevious':
                event.preventDefault();
                if (settings_1.settings.playlist && window.currentPlaylistSongs?.length > 0) {
                    playPreviousSong();
                }
                break;
        }
    });
}
/**
 * Stop all audio playback
 */
function stopAllAudio() {
    if (exports.currentAudio) {
        exports.currentAudio.pause();
        exports.currentAudio.currentTime = 0;
        exports.currentAudio = null;
    }
    // Stop all audio elements
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        if (audio !== exports.currentAudio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    // Stop all video elements with audio tracks
    const allVideoElements = document.querySelectorAll('video');
    allVideoElements.forEach(video => {
        if (video.audioTracks && video.audioTracks.length > 0) {
            video.pause();
            video.currentTime = 0;
        }
    });
    // Suspend audio context if available
    if (window.AudioContext || window.webkitAudioContext) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'running') {
                audioContext.suspend();
            }
        }
        catch (e) {
            // Ignore errors
        }
    }
    // Stop all media elements
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach(media => {
        const mediaElement = media;
        if (!mediaElement.paused) {
            mediaElement.pause();
            mediaElement.currentTime = 0;
        }
    });
    exports.currentSongInfo = null;
    clearInfoPanel();
    console.log('Stopped all audio playback');
}
/**
 * Handle playback errors
 */
function handlePlaybackError(title, artist) {
    if (exports.errorRecoveryTimeout) {
        clearTimeout(exports.errorRecoveryTimeout);
        exports.errorRecoveryTimeout = null;
    }
    if (exports.autoSkip && settings_1.settings.playlist && window.currentPlaylistSongs?.length > 0) {
        exports.errorRecoveryTimeout = window.setTimeout(() => {
            console.log(`Auto-advancing playlist due to playback error: ${title}`);
            playNextSong();
            exports.errorRecoveryTimeout = null;
        }, 3000);
    }
}
/**
 * Toggle play/pause state
 */
function togglePlay() {
    if (!exports.currentAudio)
        return;
    if (exports.isPlaying) {
        exports.currentAudio.pause();
        exports.isPlaying = false;
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.textContent = '▶';
        }
        if (navigator.mediaSession) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }
    else {
        exports.currentAudio.play().then(() => {
            exports.isPlaying = true;
            const playButton = document.getElementById('playButton');
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
function playNextSong() {
    if (!settings_1.settings.playlist || !window.currentPlaylistSongs)
        return;
    const nextIndex = getNextSongIndex();
    if (nextIndex >= 0 && nextIndex < window.currentPlaylistSongs.length) {
        const song = window.currentPlaylistSongs[nextIndex];
        playSong(song.id, song.title, song.artist, song.thumbnail, settings_1.settings.playlist, nextIndex);
    }
}
/**
 * Play previous song in playlist
 */
function playPreviousSong() {
    if (!settings_1.settings.playlist || !window.currentPlaylistSongs)
        return;
    const prevIndex = getPreviousSongIndex();
    if (prevIndex >= 0 && prevIndex < window.currentPlaylistSongs.length) {
        const song = window.currentPlaylistSongs[prevIndex];
        playSong(song.id, song.title, song.artist, song.thumbnail, settings_1.settings.playlist, prevIndex);
    }
}
/**
 * Get next song index based on repeat mode
 */
function getNextSongIndex() {
    if (!window.currentPlaylistSongs || window.currentSongIndex === -1)
        return -1;
    const currentIndex = window.currentSongIndex;
    const totalSongs = window.currentPlaylistSongs.length;
    if (settings_1.settings.repeat === 'one') {
        return currentIndex; // Repeat current song
    }
    else if (settings_1.settings.repeat === 'all') {
        return (currentIndex + 1) % totalSongs; // Loop playlist
    }
    else {
        return currentIndex + 1 < totalSongs ? currentIndex + 1 : -1; // Stop at end
    }
}
/**
 * Get previous song index
 */
function getPreviousSongIndex() {
    if (!window.currentPlaylistSongs || window.currentSongIndex === -1)
        return -1;
    const currentIndex = window.currentSongIndex;
    const totalSongs = window.currentPlaylistSongs.length;
    if (settings_1.settings.repeat === 'one') {
        return currentIndex; // Repeat current song
    }
    else if (settings_1.settings.repeat === 'all') {
        return currentIndex - 1 >= 0 ? currentIndex - 1 : totalSongs - 1; // Loop playlist
    }
    else {
        return currentIndex - 1 >= 0 ? currentIndex - 1 : -1; // Stop at beginning
    }
}
/**
 * Toggle repeat mode
 */
function toggleRepeatMode() {
    const repeatModes = ['none', 'one', 'all'];
    const currentIndex = repeatModes.indexOf(settings_1.settings.repeat);
    const nextIndex = (currentIndex + 1) % repeatModes.length;
    settings_1.settings.repeat = repeatModes[nextIndex];
    updateRepeatShuffleDisplay();
    showSuccessNotification(`Repeat mode: ${settings_1.settings.repeat}`);
}
/**
 * Update repeat/shuffle display
 */
function updateRepeatShuffleDisplay() {
    const repeatButton = document.getElementById('repeatButton');
    if (repeatButton) {
        const repeatModes = {
            'none': { icon: '🔁', title: 'No repeat' },
            'one': { icon: '🔂', title: 'Repeat one' },
            'all': { icon: '🔁', title: 'Repeat all' }
        };
        const mode = repeatModes[settings_1.settings.repeat];
        repeatButton.textContent = mode.icon;
        repeatButton.title = mode.title;
    }
}
// Helper functions (these would be imported from other modules)
function playSong(songId, title, artist, thumbnail, playlistId, songIndex) {
    // This would be implemented in the main app module
    console.log('Playing song:', { songId, title, artist, thumbnail, playlistId, songIndex });
}
function clearInfoPanel() {
    // This would be implemented in the UI module
    console.log('Clearing info panel');
}
function showErrorNotification(message) {
    // This would be implemented in the notification module
    console.error('Error notification:', message);
}
function showSuccessNotification(message) {
    // This would be implemented in the notification module
    console.log('Success notification:', message);
}
//# sourceMappingURL=audio.js.map