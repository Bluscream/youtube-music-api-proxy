// Event delegation for data attributes instead of inline onclick handlers
export function setupEventDelegation(): void {
    // Handle song clicks with data attributes
    document.addEventListener('click', function (event: Event): void {
        const target = event.target as Element;
        const songElement = target.closest('[data-song-id]') as HTMLElement;
        if (songElement) {
            const songId = songElement.dataset.songId!;
            const songName = songElement.dataset.songName || '';
            const songArtist = songElement.dataset.songArtist || '';
            const songThumbnail = songElement.dataset.songThumbnail || '';
            const playlistId = songElement.dataset.playlistId || null;
            const songIndex = songElement.dataset.songIndex ? parseInt(songElement.dataset.songIndex) : -1;

            window.playerManager.playSong(songId, songName, songArtist, songThumbnail, playlistId ? [playlistId] : undefined, songIndex);
            event.stopPropagation(); // Prevent event from bubbling up to parent elements
            return; // Exit early to prevent other handlers from running
        }

        // Handle playlist clicks with data attributes
        const playlistElement = target.closest('[data-playlist-id]') as HTMLElement;
        if (playlistElement) {
            const playlistId = playlistElement.dataset.playlistId!;
            const playlistTitle = playlistElement.dataset.playlistTitle || '';

            window.contentManager.loadPlaylist(playlistId, playlistTitle);
            event.stopPropagation(); // Prevent event from bubbling up
            return; // Exit early to prevent other handlers from running
        }

        // Handle album clicks with data attributes
        const albumElement = target.closest('[data-album-id]') as HTMLElement;
        if (albumElement) {
            const albumId = albumElement.dataset.albumId!;
            const albumTitle = albumElement.dataset.albumTitle || '';

            window.contentManager.loadAlbum(albumId, albumTitle);
            event.stopPropagation(); // Prevent event from bubbling up
            return; // Exit early to prevent other handlers from running
        }

        // Handle artist clicks with data attributes
        const artistElement = target.closest('[data-artist-id]') as HTMLElement;
        if (artistElement) {
            const artistId = artistElement.dataset.artistId!;
            const artistName = artistElement.dataset.artistName || '';

            window.contentManager.loadArtist(artistId, artistName);
            event.stopPropagation(); // Prevent event from bubbling up
            return; // Exit early to prevent other handlers from running
        }
    });
}
