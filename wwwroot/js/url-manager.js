import { getQueryParams, buildQueryString, updateURL } from './utils.js';

// URL Manager
export class URLManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize URL manager
    }

    // Load content from URL parameters on page load
    async loadFromURL() {
        const params = getQueryParams();

        if (params.playlist) {
            // Load playlist from URL parameter
            try {
                const response = await fetch(`/api/playlist/${params.playlist}?${buildQueryString(params)}`);
                if (response.ok) {
                    const data = await response.json();
                    const playlistTitle = data.name || data.title || 'Playlist';
                    
                    if (window.contentManager) {
                        window.contentManager.displayPlaylistContent(data, playlistTitle);
                    }

                    // Set current playlist
                    if (window.playerManager) {
                        window.playerManager.setCurrentPlaylist(params.playlist);
                        window.playerManager.highlightCurrentPlaylist();

                        // If song parameter is also present, load that specific song
                        if (params.song) {
                            const songIndex = window.playerManager.currentPlaylistSongs.findIndex(song => song.id === params.song);
                            if (songIndex !== -1) {
                                const song = window.playerManager.currentPlaylistSongs[songIndex];
                                const title = song.name || song.title || 'Unknown Title';
                                const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                                const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                                // If play parameter is present, auto-play the song
                                if (params.play) {
                                    window.playerManager.playSong(song.id || '', title, artist, thumbnail, window.playerManager.currentPlaylist, songIndex);
                                } else {
                                    window.playerManager.loadSong(song.id || '', title, artist, thumbnail, window.playerManager.currentPlaylist, songIndex);
                                }
                            }
                        }
                    }
                } else {
                    console.error(`Failed to load playlist: HTTP ${response.status}`);
                    if (window.notificationManager) {
                        window.notificationManager.showErrorNotification('Failed to load playlist from URL');
                    }
                }
            } catch (error) {
                console.error('Error loading playlist from URL:', error);
                if (window.notificationManager) {
                    window.notificationManager.showErrorNotification('Error loading playlist from URL');
                }
            }
        } else if (params.song) {
            // Load specific song from URL parameter
            try {
                const response = await fetch(`/api/song/${params.song}?${buildQueryString(params)}`);
                if (response.ok) {
                    const data = await response.json();
                    const title = data.name || data.title || 'Unknown Title';
                    const artist = data.artists && data.artists.length > 0 ? data.artists[0].name : '';
                    const thumbnail = data.thumbnails && data.thumbnails.length > 0 ? data.thumbnails[0].url : '';

                    // If play parameter is present, auto-play the song
                    if (window.playerManager) {
                        if (params.play) {
                            window.playerManager.playSong(params.song, title, artist, thumbnail, null, -1);
                        } else {
                            window.playerManager.loadSong(params.song, title, artist, thumbnail, null, -1);
                        }
                    }
                } else {
                    console.error(`Failed to load song: HTTP ${response.status}`);
                    if (window.notificationManager) {
                        window.notificationManager.showErrorNotification('Failed to load song from URL');
                    }
                }
            } catch (error) {
                console.error('Error loading song from URL:', error);
                if (window.notificationManager) {
                    window.notificationManager.showErrorNotification('Error loading song from URL');
                }
            }
        }
    }
}

// Create global instance
window.urlManager = new URLManager();

// Make functions globally accessible
window.loadFromURL = () => window.urlManager.loadFromURL();
