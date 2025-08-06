using System.ComponentModel.DataAnnotations;
using YouTubeMusicAPI.Models.Search;
using YouTubeMusicAPI.Models.Library;

namespace YoutubeMusicAPIProxy.Models;

/// <summary>
/// Base API response model
/// </summary>
public class ApiResponse<T>
{
    /// <summary>
    /// The response data
    /// </summary>
    public T Data { get; set; } = default!;

    /// <summary>
    /// Success status
    /// </summary>
    public bool Success { get; set; } = true;

    /// <summary>
    /// Error message if any
    /// </summary>
    public string? Error { get; set; }
}

/// <summary>
/// Error response model
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// Error message
    /// </summary>
    [Required]
    public string Error { get; set; } = string.Empty;

    /// <summary>
    /// Optional error details
    /// </summary>
    public string? Details { get; set; }
}

/// <summary>
/// Search response model
/// </summary>
public class SearchResponse
{
    /// <summary>
    /// List of search results (can be SongSearchResult, VideoSearchResult, AlbumSearchResult, ArtistSearchResult, etc.)
    /// </summary>
    public List<SearchResult> Results { get; set; } = new();

    /// <summary>
    /// Total number of results found
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Search query used
    /// </summary>
    public string Query { get; set; } = string.Empty;

    /// <summary>
    /// Category filter applied (if any)
    /// </summary>
    public string? Category { get; set; }
}

/// <summary>
/// Library response model
/// </summary>
public class LibraryResponse
{
    /// <summary>
    /// User's library songs
    /// </summary>
    public List<LibrarySong> Songs { get; set; } = new();

    /// <summary>
    /// User's library albums
    /// </summary>
    public List<LibraryAlbum> Albums { get; set; } = new();

    /// <summary>
    /// User's library artists
    /// </summary>
    public List<LibraryArtist> Artists { get; set; } = new();

    /// <summary>
    /// User's library subscriptions
    /// </summary>
    public List<LibrarySubscription> Subscriptions { get; set; } = new();

    /// <summary>
    /// User's library podcasts
    /// </summary>
    public List<LibraryPodcast> Podcasts { get; set; } = new();

    /// <summary>
    /// User's library playlists
    /// </summary>
    public List<LibraryCommunityPlaylist> Playlists { get; set; } = new();
}

/// <summary>
/// Library songs response model
/// </summary>
public class LibrarySongsResponse
{
    /// <summary>
    /// User's library songs
    /// </summary>
    public List<LibrarySong> Songs { get; set; } = new();

    /// <summary>
    /// Total number of songs in library
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Library albums response model
/// </summary>
public class LibraryAlbumsResponse
{
    /// <summary>
    /// User's library albums
    /// </summary>
    public List<LibraryAlbum> Albums { get; set; } = new();

    /// <summary>
    /// Total number of albums in library
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Library artists response model
/// </summary>
public class LibraryArtistsResponse
{
    /// <summary>
    /// User's library artists
    /// </summary>
    public List<LibraryArtist> Artists { get; set; } = new();

    /// <summary>
    /// Total number of artists in library
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Library subscriptions response model
/// </summary>
public class LibrarySubscriptionsResponse
{
    /// <summary>
    /// User's library subscriptions
    /// </summary>
    public List<LibrarySubscription> Subscriptions { get; set; } = new();

    /// <summary>
    /// Total number of subscriptions in library
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Library podcasts response model
/// </summary>
public class LibraryPodcastsResponse
{
    /// <summary>
    /// User's library podcasts
    /// </summary>
    public List<LibraryPodcast> Podcasts { get; set; } = new();

    /// <summary>
    /// Total number of podcasts in library
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Library playlists response model
/// </summary>
public class LibraryPlaylistsResponse
{
    /// <summary>
    /// User's library playlists
    /// </summary>
    public List<LibraryCommunityPlaylist> Playlists { get; set; } = new();

    /// <summary>
    /// Total number of playlists in library
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// Playlist response model
/// </summary>
public class PlaylistResponse
{
    /// <summary>
    /// Playlist ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Playlist browse ID
    /// </summary>
    public string BrowseId { get; set; } = string.Empty;

    /// <summary>
    /// Playlist information
    /// </summary>
    public object? Playlist { get; set; }

    /// <summary>
    /// List of songs in the playlist
    /// </summary>
    public List<object> Songs { get; set; } = new();

    /// <summary>
    /// Total number of songs in the playlist
    /// </summary>
    public int TotalSongs { get; set; }
}

/// <summary>
/// Health and version information response model
/// </summary>
public class HealthResponse
{
    /// <summary>
    /// Service status
    /// </summary>
    public string Status { get; set; } = "healthy";

    /// <summary>
    /// Application version
    /// </summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// Application name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Current timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Runtime information
    /// </summary>
    public RuntimeInfo Runtime { get; set; } = new();

    /// <summary>
    /// Environment information
    /// </summary>
    public EnvironmentInfo Environment { get; set; } = new();
}

/// <summary>
/// Runtime information
/// </summary>
public class RuntimeInfo
{
    /// <summary>
    /// .NET version
    /// </summary>
    public string Framework { get; set; } = string.Empty;

    /// <summary>
    /// Operating system
    /// </summary>
    public string OS { get; set; } = string.Empty;

    /// <summary>
    /// Process uptime in seconds
    /// </summary>
    public double UptimeSeconds { get; set; }

    /// <summary>
    /// Memory usage in MB
    /// </summary>
    public long MemoryUsageMB { get; set; }
}

/// <summary>
/// Environment information
/// </summary>
public class EnvironmentInfo
{
    /// <summary>
    /// Environment name (Development, Production, etc.)
    /// </summary>
    public string Environment { get; set; } = string.Empty;

    /// <summary>
    /// Whether cookies are configured
    /// </summary>
    public bool CookiesConfigured { get; set; }
} 