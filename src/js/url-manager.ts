import { getQueryParams, buildQueryString, updateURL } from './utils';
import apiService from './services/api-service';

// URL Manager
export class URLManager {
    constructor() {
        this.init();
    }

    init(): void {
        // Initialize URL manager
    }

    // Load content from URL parameters on page load
    async loadFromURL(): Promise<void> {
        const params = getQueryParams();

        if (params.playlist) {
            // Load playlist from URL parameter
            try {
                const api = apiService.getAPI();
                const data = await api.getPlaylist(params.playlist);
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
                        // Try to find the song in the playlist data
                        const songs = data.songs || data.tracks || [];
                        const songIndex = songs.findIndex((song: any) => song.id === params.song || song.videoId === params.song);
                        if (songIndex !== -1) {
                            const song = songs[songIndex];
                            const title = song.name || song.title || 'Unknown Title';
                            const artist = song.artists && song.artists.length > 0 ? song.artists[0].name : '';
                            const thumbnail = song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '';

                            // If play parameter is present, auto-play the song
                            if (params.play) {
                                window.playerManager.playSong(song.id || song.videoId || '', title, artist, thumbnail, songs, songIndex);
                            } else {
                                window.playerManager.loadSong(song.id || song.videoId || '', title, artist, thumbnail, songs, songIndex);
                            }
                        } else {
                            // Song not found in playlist, try to load it directly
                            if (params.play) {
                                window.playerManager.playSong(params.song, 'Unknown Title', 'Unknown Artist', '', data, -1);
                            } else {
                                window.playerManager.loadSong(params.song, 'Unknown Title', 'Unknown Artist', '', data, -1);
                            }
                        }
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
                const api = apiService.getAPI();
                const data = await api.getSongInfo(params.song);
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
            } catch (error) {
                console.error('Error loading song from URL:', error);
                if (window.notificationManager) {
                    window.notificationManager.showErrorNotification('Error loading song from URL');
                }
            }
        }
    }
}

// Create global instance immediately
window.urlManager = new URLManager();

// Make functions globally accessible
window.loadFromURL = () => window.urlManager.loadFromURL();
