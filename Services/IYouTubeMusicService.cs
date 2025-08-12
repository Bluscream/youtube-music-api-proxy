using YouTubeMusicAPI.Models.Info;
using YouTubeMusicAPI.Models.Search;
using YouTubeMusicAPI.Models.Streaming;
using YouTubeMusicAPI.Pagination;
using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service interface for YouTube Music API operations
/// </summary>
public interface IYouTubeMusicService
{
    /// <summary>
    /// Search for content on YouTube Music
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="category">Optional category filter</param>
    /// <param name="cookies">Optional base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>Paginated search results</returns>
    Task<PaginatedAsyncEnumerable<SearchResult>> SearchAsync(
        string query, 
        SearchCategory? category = null,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get detailed information about a song or video
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="cookies">Optional base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>Song/video information including streaming URLs</returns>
    Task<SongVideoInfoResponse> GetSongVideoInfoAsync(
        string id,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get streaming data for a song or video
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="cookies">Optional base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>Streaming data with URLs</returns>
    Task<StreamingData> GetStreamingDataAsync(
        string id,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get album information
    /// </summary>
    /// <param name="browseId">Album browse ID</param>
    /// <param name="cookies">Optional base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>Album information</returns>
    Task<AlbumInfo> GetAlbumInfoAsync(
        string browseId,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get artist information
    /// </summary>
    /// <param name="browseId">Artist browse ID</param>
    /// <param name="cookies">Optional base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>Artist information</returns>
    Task<ArtistInfo> GetArtistInfoAsync(
        string browseId,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null);



    /// <summary>
    /// Get user's library (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library</returns>
    Task<object> GetLibraryAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get user's library songs (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library songs</returns>
    Task<object> GetLibrarySongsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get user's library albums (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library albums</returns>
    Task<object> GetLibraryAlbumsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get user's library artists (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library artists</returns>
    Task<object> GetLibraryArtistsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get user's library subscriptions (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library subscriptions</returns>
    Task<object> GetLibrarySubscriptionsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get user's library podcasts (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library podcasts</returns>
    Task<object> GetLibraryPodcastsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get user's library playlists (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>User's library playlists</returns>
    Task<object> GetLibraryPlaylistsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Get playlist information by ID (no authentication required)
    /// </summary>
    /// <param name="id">Playlist ID</param>
    /// <param name="cookies">Optional base64 encoded cookies for authentication</param>
    /// <param name="geographicalLocation">Geographical location (defaults to "US")</param>
    /// <param name="poTokenServer">Optional PoToken server URL for external PoToken generation</param>
    /// <returns>Playlist information</returns>
    Task<object> GetPlaylistAsync(
        string id,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null);

    /// <summary>
    /// Clear the session cache (useful for testing or when cookies change)
    /// </summary>
    void ClearSessionCache();

    /// <summary>
    /// Get session cache statistics
    /// </summary>
    /// <returns>Cache statistics</returns>
    object GetSessionCacheStats();
} 