import {
    SearchCategory,
    SearchResponse,
    SongVideoInfoResponse,
    StreamingData,
    AlbumInfo,
    ArtistInfo,
    LibraryResponse,
    LibrarySongsResponse,
    LibraryAlbumsResponse,
    LibraryArtistsResponse,
    LibrarySubscriptionsResponse,
    LibraryPodcastsResponse,
    LibraryPlaylistsResponse,
    PlaylistResponse,
    HealthResponse
} from './api-types';

// API Service for communicating with the backend
export class ApiService {
    private baseUrl = '/api';

    /**
     * Get health and version information
     */
    async getHealth(): Promise<HealthResponse> {
        const response = await fetch(this.baseUrl);
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Search for content
     */
    async search(query: string, category?: SearchCategory, location?: string): Promise<SearchResponse> {
        const url = new URL(`${this.baseUrl}/search`, window.location.origin);
        url.searchParams.set('query', query);
        if (category) {
            url.searchParams.set('category', category);
        }
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get detailed information about a song or video including streaming URLs
     */
    async getSongVideoInfo(id: string, location?: string): Promise<SongVideoInfoResponse> {
        const url = new URL(`${this.baseUrl}/song/${id}`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load song/video info: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get streaming data for a song or video
     */
    async getStreamingData(id: string, location?: string): Promise<StreamingData> {
        const url = new URL(`${this.baseUrl}/streaming/${id}`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load streaming data: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Stream audio directly from YouTube Music
     */
    async streamAudio(id: string, location?: string, quality?: string): Promise<Response> {
        const url = new URL(`${this.baseUrl}/stream/${id}`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }
        if (quality) {
            url.searchParams.set('quality', quality);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to stream audio: ${response.statusText}`);
        }
        return response;
    }

    /**
     * Get album information
     */
    async getAlbumInfo(browseId: string, location?: string): Promise<AlbumInfo> {
        const url = new URL(`${this.baseUrl}/album/${browseId}`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load album info: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get artist information
     */
    async getArtistInfo(browseId: string, location?: string): Promise<ArtistInfo> {
        const url = new URL(`${this.baseUrl}/artist/${browseId}`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load artist info: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library (requires authentication)
     */
    async getLibrary(location?: string): Promise<LibraryResponse> {
        const url = new URL(`${this.baseUrl}/library`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library songs (requires authentication)
     */
    async getLibrarySongs(location?: string): Promise<LibrarySongsResponse> {
        const url = new URL(`${this.baseUrl}/library/songs`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library songs: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library albums (requires authentication)
     */
    async getLibraryAlbums(location?: string): Promise<LibraryAlbumsResponse> {
        const url = new URL(`${this.baseUrl}/library/albums`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library albums: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library artists (requires authentication)
     */
    async getLibraryArtists(location?: string): Promise<LibraryArtistsResponse> {
        const url = new URL(`${this.baseUrl}/library/artists`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library artists: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library subscriptions (requires authentication)
     */
    async getLibrarySubscriptions(location?: string): Promise<LibrarySubscriptionsResponse> {
        const url = new URL(`${this.baseUrl}/library/subscriptions`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library subscriptions: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library podcasts (requires authentication)
     */
    async getLibraryPodcasts(location?: string): Promise<LibraryPodcastsResponse> {
        const url = new URL(`${this.baseUrl}/library/podcasts`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library podcasts: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get user's library playlists (requires authentication)
     */
    async getLibraryPlaylists(location?: string): Promise<LibraryPlaylistsResponse> {
        const url = new URL(`${this.baseUrl}/library/playlists`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load library playlists: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get playlist information by ID (no authentication required)
     */
    async getPlaylist(id: string, location?: string): Promise<PlaylistResponse> {
        const url = new URL(`${this.baseUrl}/playlist/${id}`, window.location.origin);
        if (location) {
            url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to load playlist: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Clear the session cache
     */
    async clearSessionCache(): Promise<{ message: string }> {
        const response = await fetch(`${this.baseUrl}/cache/clear`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error(`Failed to clear cache: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get session cache statistics
     */
    async getSessionCacheStats(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/cache/stats`);
        if (!response.ok) {
            throw new Error(`Failed to get cache stats: ${response.statusText}`);
        }
        return await response.json();
    }
}
