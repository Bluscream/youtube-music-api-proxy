using Microsoft.AspNetCore.Mvc;
using YouTubeMusicAPI.Models.Search;
using YouTubeMusicAPI.Models.Info;
using YouTubeMusicAPI.Models.Streaming;
using YouTubeMusicAPI.Models.Library;
using YoutubeMusicAPIProxy.Services;
using YoutubeMusicAPIProxy.Models;
using YoutubeMusicAPIProxy.Configuration;
using Swashbuckle.AspNetCore.Annotations;

namespace YoutubeMusicAPIProxy.Controllers;

/// <summary>
/// YouTube Music API endpoints
/// </summary>
[ApiController]
[Route("api")]
[Produces("application/json")]
public class ApiController : ControllerBase
{
    private readonly IYouTubeMusicService _service;
    private readonly IConfigurationService _configService;
    private readonly IAuthService _authService;
    private readonly ILogger<ApiController> _logger;

    public ApiController(
        IYouTubeMusicService service,
        IConfigurationService configService,
        IAuthService authService,
        ILogger<ApiController> logger)
    {
        _service = service;
        _configService = configService;
        _authService = authService;
        _logger = logger;
    }



    /// <summary>
    /// Get health and version information
    /// </summary>
    /// <returns>Health status and version information</returns>
    /// <response code="200">Returns health status and version information</response>
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), 200)]
    public async Task<IActionResult> GetHealth()
    {
        var process = System.Diagnostics.Process.GetCurrentProcess();
        var runtimeInfo = new RuntimeInfo
        {
            Framework = Environment.Version.ToString(),
            OS = Environment.OSVersion.ToString(),
            UptimeSeconds = (DateTime.UtcNow - process.StartTime.ToUniversalTime()).TotalSeconds,
            MemoryUsageMB = process.WorkingSet64 / 1024 / 1024
        };

        var environmentInfo = new EnvironmentInfo
        {
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
            CookiesConfigured = !string.IsNullOrWhiteSpace(_configService.GetCookies())
        };

        // Get authentication status for debugging
        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.FromMainConfig(_configService.GetYouTubeMusicConfig());
            environmentInfo.AuthStatus = await _authService.GetAuthStatusAsync(sessionConfig);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get authentication status for health check");
            environmentInfo.AuthStatus = new AuthStatus
            {
                ErrorMessage = ex.Message
            };
        }

        var healthResponse = new HealthResponse
        {
            Status = "healthy",
            Version = GetType().Assembly.GetName().Version?.ToString() ?? "1.0.0",
            Name = "YouTube Music API Proxy",
            Timestamp = DateTime.UtcNow,
            Runtime = runtimeInfo,
            Environment = environmentInfo
        };

        return Ok(healthResponse);
    }

    /// <summary>
    /// Search for content on YouTube Music
    /// </summary>
    /// <param name="query">Search query</param>
    /// <param name="category">Optional category filter. Available values: Songs, Videos, Albums, CommunityPlaylists, Artists, Podcasts, Episodes, Profiles</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>Search results</returns>
    /// <response code="200">Returns search results containing songs, videos, albums, artists, playlists, podcasts, episodes, or profiles</response>
    /// <response code="400">If the query is invalid or missing</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("search")]
    [ProducesResponseType(typeof(SearchResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> Search(
        [FromQuery] string query,
        [FromQuery] SearchCategory? category = null,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new ErrorResponse { Error = "Query parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var searchResults = await _service.SearchAsync(query, category, sessionConfig);
            var results = new List<SearchResult>();
            
            await foreach (var result in searchResults)
            {
                results.Add(result);
            }

            var response = new SearchResponse
            {
                Results = results,
                TotalCount = results.Count,
                Query = query,
                Category = category?.ToString()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching for query: {Query}", query);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get detailed information about a song or video including streaming URLs
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>Song/video information with streaming data</returns>
    /// <response code="200">Returns song/video information including metadata and streaming URLs</response>
    /// <response code="400">If the ID is invalid or missing</response>
    /// <response code="404">If the song/video is not found</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("song/{id}")]
    [ProducesResponseType(typeof(SongVideoInfoResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetSongVideoInfo(
        [FromRoute] string id,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ErrorResponse { Error = "ID parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetSongVideoInfoAsync(id, sessionConfig);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid ID provided: {Id}", id);
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting song/video info for ID: {Id}", id);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get streaming data for a song or video
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>Streaming data including audio and video URLs</returns>
    /// <response code="200">Returns streaming data with available audio and video streams</response>
    /// <response code="400">If the ID is invalid or missing</response>
    /// <response code="404">If the song/video is not found</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("streaming/{id}")]
    [ProducesResponseType(typeof(StreamingData), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetStreamingData(
        [FromRoute] string id,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ErrorResponse { Error = "ID parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetStreamingDataAsync(id, sessionConfig);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid ID provided: {Id}", id);
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting streaming data for ID: {Id}", id);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Stream audio directly from YouTube Music
    /// </summary>
    /// <param name="id">YouTube video/song ID</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <param name="quality">Audio quality preference (e.g., "AUDIO_QUALITY_MEDIUM")</param>
    /// <returns>Audio stream</returns>
    /// <response code="200">Returns audio stream in M4A format (accessible with or without .m4a extension)</response>
    /// <response code="400">If the ID is invalid or missing</response>
    /// <response code="404">If the song/video is not found or no audio stream available</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("stream/{id}.m4a")]
    [HttpGet("stream/{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> StreamAudio(
        [FromRoute] string id,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null,
        [FromQuery] string? quality = null)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ErrorResponse { Error = "ID parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var streamingData = await _service.GetStreamingDataAsync(id, sessionConfig);
            
            _logger.LogDebug("Retrieved streaming data for ID: {Id}. Stream count: {Count}", 
                id, streamingData.StreamInfo?.Count() ?? 0);
            
            // Find the best audio stream
            var audioStream = streamingData.StreamInfo
                ?.OfType<YouTubeMusicAPI.Models.Streaming.AudioStreamInfo>()
                .OrderByDescending(s => s.Bitrate)
                .FirstOrDefault();

            if (audioStream == null)
            {
                return NotFound(new ErrorResponse { Error = "No audio stream available" });
            }

            // Stream the audio content
            using var httpClient = new HttpClient();
            
            // Validate and log the audio URL
            var audioUrl = audioStream.Url;
            _logger.LogDebug("Audio stream URL (encoded): {Url}", audioUrl);
            
            if (string.IsNullOrWhiteSpace(audioUrl))
            {
                _logger.LogError("Audio stream URL is null or empty for ID: {Id}", id);
                return StatusCode(500, new ErrorResponse { Error = "Audio stream URL is missing" });
            }
            
            // Decode the URL if it's percent-encoded
            try
            {
                audioUrl = Uri.UnescapeDataString(audioUrl);
                _logger.LogDebug("Audio stream URL (decoded): {Url}", audioUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to decode audio stream URL: {Url}", audioUrl);
                // Continue with the original URL if decoding fails
            }
            
            if (!Uri.IsWellFormedUriString(audioUrl, UriKind.Absolute))
            {
                _logger.LogWarning("Audio stream URL is not absolute after decoding: {Url}", audioUrl);
                return StatusCode(500, new ErrorResponse { Error = "Invalid audio stream URL format" });
            }
            
            var audioResponse = await httpClient.GetAsync(audioUrl, HttpCompletionOption.ResponseHeadersRead);
            
            if (!audioResponse.IsSuccessStatusCode)
            {
                return StatusCode((int)audioResponse.StatusCode, new ErrorResponse { Error = "Failed to fetch audio stream" });
            }

            Response.Headers["Content-Type"] = "audio/mpeg";
            Response.Headers["Content-Length"] = audioStream.ContentLenght.ToString();
            
            await audioResponse.Content.CopyToAsync(Response.Body);
            return new EmptyResult();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid ID provided: {Id}", id);
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming audio for ID: {Id}", id);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get album information
    /// </summary>
    /// <param name="browseId">Album browse ID</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>Album information including songs and metadata</returns>
    /// <response code="200">Returns album information with songs, artists, and metadata</response>
    /// <response code="400">If the browse ID is invalid or missing</response>
    /// <response code="404">If the album is not found</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("album/{browseId}")]
    [ProducesResponseType(typeof(AlbumInfo), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetAlbumInfo(
        [FromRoute] string browseId,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        if (string.IsNullOrWhiteSpace(browseId))
        {
            return BadRequest(new ErrorResponse { Error = "Browse ID parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetAlbumInfoAsync(browseId, sessionConfig);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid browse ID provided: {BrowseId}", browseId);
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting album info for browse ID: {BrowseId}", browseId);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get artist information
    /// </summary>
    /// <param name="browseId">Artist browse ID</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>Artist information including albums, songs, and metadata</returns>
    /// <response code="200">Returns artist information with albums, songs, and metadata</response>
    /// <response code="400">If the browse ID is invalid or missing</response>
    /// <response code="404">If the artist is not found</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("artist/{browseId}")]
    [ProducesResponseType(typeof(ArtistInfo), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetArtistInfo(
        [FromRoute] string browseId,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        if (string.IsNullOrWhiteSpace(browseId))
        {
            return BadRequest(new ErrorResponse { Error = "Browse ID parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetArtistInfoAsync(browseId, sessionConfig);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid browse ID provided: {BrowseId}", browseId);
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting artist info for browse ID: {BrowseId}", browseId);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's complete library including songs, albums, artists, subscriptions, podcasts, and playlists</returns>
    /// <response code="200">Returns user's complete library with all content types</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library")]
    [ProducesResponseType(typeof(LibraryResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibrary(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibraryAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library songs (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's library songs</returns>
    /// <response code="200">Returns user's library songs</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library/songs")]
    [ProducesResponseType(typeof(LibrarySongsResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibrarySongs(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibrarySongsAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library songs");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library albums (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's library albums</returns>
    /// <response code="200">Returns user's library albums</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library/albums")]
    [ProducesResponseType(typeof(LibraryAlbumsResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibraryAlbums(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibraryAlbumsAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library albums");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library artists (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's library artists</returns>
    /// <response code="200">Returns user's library artists</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library/artists")]
    [ProducesResponseType(typeof(LibraryArtistsResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibraryArtists(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibraryArtistsAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library artists");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library subscriptions (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's library subscriptions</returns>
    /// <response code="200">Returns user's library subscriptions</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library/subscriptions")]
    [ProducesResponseType(typeof(LibrarySubscriptionsResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibrarySubscriptions(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibrarySubscriptionsAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library subscriptions");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library podcasts (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's library podcasts</returns>
    /// <response code="200">Returns user's library podcasts</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library/podcasts")]
    [ProducesResponseType(typeof(LibraryPodcastsResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibraryPodcasts(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibraryPodcastsAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library podcasts");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's library playlists (requires authentication)
    /// </summary>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>User's library playlists</returns>
    /// <response code="200">Returns user's library playlists</response>
    /// <response code="401">If authentication is required but not provided</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("library/playlists")]
    [ProducesResponseType(typeof(LibraryPlaylistsResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetLibraryPlaylists(
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        var authCookies = _configService.GetCookies(cookies);
        if (string.IsNullOrWhiteSpace(authCookies))
        {
            return Unauthorized(new ErrorResponse { Error = "Authentication required. Please provide cookies parameter, set 'YTM_COOKIES' environment variable, or configure in appsettings." });
        }

        try
        {
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetLibraryPlaylistsAsync(sessionConfig);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting library playlists");
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get playlist information by ID (no authentication required)
    /// </summary>
    /// <param name="id">Playlist ID</param>
    /// <param name="cookies">Base64 encoded YouTube cookies for authentication (optional)</param>
    /// <param name="location">Geographical location (defaults to "US")</param>
    /// <returns>Playlist information including songs and metadata</returns>
    /// <response code="200">Returns playlist information with songs and metadata</response>
    /// <response code="400">If the playlist ID is invalid or missing</response>
    /// <response code="404">If the playlist is not found</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpGet("playlist/{id}")]
    [ProducesResponseType(typeof(PlaylistResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> GetPlaylist(
        [FromRoute] string id,
        [FromQuery, Swashbuckle.AspNetCore.Annotations.SwaggerIgnore] string? cookies = null,
        [FromQuery] string? location = null)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ErrorResponse { Error = "Playlist ID parameter is required" });
        }

        try
        {
            var authCookies = _configService.GetCookies(cookies);
            var sessionConfig = YouTubeMusicSessionConfig.Create(
                _configService.GetYouTubeMusicConfig(),
                authCookies,
                location);
            var result = await _service.GetPlaylistAsync(id, sessionConfig);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid playlist ID provided: {Id}", id);
            return BadRequest(new ErrorResponse { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting playlist for ID: {Id}", id);
            return StatusCode(500, new ErrorResponse { Error = "Internal server error" });
        }
    }


} 