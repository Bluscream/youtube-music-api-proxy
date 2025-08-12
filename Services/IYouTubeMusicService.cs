using YouTubeMusicAPI.Models.Info;
using YouTubeMusicAPI.Models.Search;
using YouTubeMusicAPI.Models.Streaming;
using YouTubeMusicAPI.Pagination;
using YoutubeMusicAPIProxy.Models;
using YoutubeMusicAPIProxy.Configuration;

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
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>Paginated search results</returns>
    Task<PaginatedAsyncEnumerable<SearchResult>> SearchAsync(
        string query, 
        SearchCategory? category = null,
        YouTubeMusicSessionConfig? sessionConfig = null);

    /// <summary>
    /// Get detailed information about a song or video
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>Song/video information including streaming URLs</returns>
    Task<SongVideoInfoResponse> GetSongVideoInfoAsync(
        string id,
        YouTubeMusicSessionConfig? sessionConfig = null);

    /// <summary>
    /// Get streaming data for a song or video
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>Streaming data with URLs</returns>
    Task<StreamingData> GetStreamingDataAsync(
        string id,
        YouTubeMusicSessionConfig? sessionConfig = null);

    /// <summary>
    /// Get album information
    /// </summary>
    /// <param name="browseId">Album browse ID</param>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>Album information</returns>
    Task<AlbumInfo> GetAlbumInfoAsync(
        string browseId,
        YouTubeMusicSessionConfig? sessionConfig = null);

    /// <summary>
    /// Get artist information
    /// </summary>
    /// <param name="browseId">Artist browse ID</param>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>Artist information</returns>
    Task<ArtistInfo> GetArtistInfoAsync(
        string browseId,
        YouTubeMusicSessionConfig? sessionConfig = null);

    /// <summary>
    /// Get user's library (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library</returns>
    Task<object> GetLibraryAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get user's library songs (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library songs</returns>
    Task<object> GetLibrarySongsAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get user's library albums (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library albums</returns>
    Task<object> GetLibraryAlbumsAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get user's library artists (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library artists</returns>
    Task<object> GetLibraryArtistsAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get user's library subscriptions (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library subscriptions</returns>
    Task<object> GetLibrarySubscriptionsAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get user's library podcasts (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library podcasts</returns>
    Task<object> GetLibraryPodcastsAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get user's library playlists (requires authentication)
    /// </summary>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>User's library playlists</returns>
    Task<object> GetLibraryPlaylistsAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Get playlist information by ID (no authentication required)
    /// </summary>
    /// <param name="id">Playlist ID</param>
    /// <param name="sessionConfig">Session configuration</param>
    /// <returns>Playlist information</returns>
    Task<object> GetPlaylistAsync(
        string id,
        YouTubeMusicSessionConfig? sessionConfig = null);
} 