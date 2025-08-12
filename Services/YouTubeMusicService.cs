using Microsoft.Extensions.Options;
using System.Net;
using System.Text;
using YouTubeMusicAPI.Client;
using YouTubeMusicAPI.Models.Info;
using YouTubeMusicAPI.Models.Search;
using YouTubeMusicAPI.Models.Streaming;
using YouTubeMusicAPI.Pagination;
using YouTubeSessionGenerator;
using YouTubeSessionGenerator.Js.Environments;
using YoutubeMusicAPIProxy.Configuration;
using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service implementation for YouTube Music API operations
/// </summary>
public class YouTubeMusicService : IYouTubeMusicService
{
    private readonly IOptions<YouTubeMusicConfig> _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<YouTubeMusicService> _logger;
    private readonly ILyricsService _lyricsService;
    private readonly IConfigurationService _configService;
    private readonly IPoTokenService _poTokenService;
    
    // Cache for generated session data to avoid regenerating on every request
    private readonly Dictionary<string, (string VisitorData, string PoToken, DateTime Expiry)> _sessionCache = new();
    private readonly object _sessionCacheLock = new object();

    public YouTubeMusicService(
        IOptions<YouTubeMusicConfig> config,
        IHttpClientFactory httpClientFactory,
        ILogger<YouTubeMusicService> logger,
        ILyricsService lyricsService,
        IConfigurationService configService,
        IPoTokenService poTokenService)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _lyricsService = lyricsService;
        _configService = configService;
        _poTokenService = poTokenService;
    }

    /// <summary>
    /// Create a YouTube Music client with the specified configuration
    /// </summary>
    private async Task<YouTubeMusicClient> CreateClientAsync(
        string? cookies = null,
        string? geographicalLocation = null,
        string? visitorData = null,
        string? poToken = null,
        string? poTokenServer = null)
    {
        var config = _config.Value;
        var location = geographicalLocation ?? config.GeographicalLocation;
        
        // Parse cookies if provided
        IEnumerable<Cookie>? cookieCollection = null;
        if (!string.IsNullOrEmpty(cookies))
        {
            try
            {
                cookieCollection = ParseCookies(cookies);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse cookies from query parameter");
            }
        }
        else if (!string.IsNullOrEmpty(config.Cookies))
        {
            try
            {
                cookieCollection = ParseCookies(config.Cookies);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse cookies from configuration");
            }
        }

        // Get visitor data, poToken, and poTokenServer if not provided
        var finalVisitorData = visitorData ?? config.VisitorData;
        var finalPoToken = poToken ?? config.PoToken;
        var finalPoTokenServer = poTokenServer ?? config.PoTokenServer;

        // Generate session data if needed using cached data when possible
        if (cookieCollection != null && (string.IsNullOrEmpty(finalVisitorData) || string.IsNullOrEmpty(finalPoToken)))
        {
            var (cachedVisitorData, cachedPoToken) = await GetOrGenerateSessionDataAsync(cookieCollection, finalPoTokenServer);
            
            if (string.IsNullOrEmpty(finalVisitorData))
            {
                finalVisitorData = cachedVisitorData;
            }
            
            if (string.IsNullOrEmpty(finalPoToken))
            {
                finalPoToken = cachedPoToken;
            }
        }

        return new YouTubeMusicClient(
            _logger,
            location,
            finalVisitorData,
            finalPoToken,
            cookieCollection,
            _httpClientFactory.CreateClient());
    }

    /// <summary>
    /// Get or generate session data (visitor data and proof of origin token) with caching
    /// </summary>
    private async Task<(string VisitorData, string PoToken)> GetOrGenerateSessionDataAsync(IEnumerable<Cookie> cookieCollection, string? poTokenServer = null)
    {
        // Create a cache key based on the cookie collection
        var cookieKey = string.Join("|", cookieCollection.Select(c => $"{c.Name}={c.Value}").OrderBy(s => s));
        
        lock (_sessionCacheLock)
        {
            // Check if we have valid cached session data
            if (_sessionCache.TryGetValue(cookieKey, out var cachedData) && cachedData.Expiry > DateTime.UtcNow)
            {
                _logger.LogDebug("Using cached session data");
                return (cachedData.VisitorData, cachedData.PoToken);
            }
            
            // Remove expired entries
            var expiredKeys = _sessionCache.Keys.Where(k => _sessionCache[k].Expiry <= DateTime.UtcNow).ToList();
            foreach (var key in expiredKeys)
            {
                _sessionCache.Remove(key);
            }
        }

        // Generate new session data
        _logger.LogInformation("Generating new session data using YouTubeSessionGenerator");
        
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var cookieString = string.Join("; ", cookieCollection.Select(c => $"{c.Name}={c.Value}"));
            
            // Only add cookie header if we have actual cookies
            if (!string.IsNullOrEmpty(cookieString))
            {
                httpClient.DefaultRequestHeaders.Add("Cookie", cookieString);
            }

            using var jsEnvironment = new NodeEnvironment();
            var sessionCreator = new YouTubeSessionCreator(new()
            {
                Logger = _logger,
                HttpClient = httpClient,
                JsEnvironment = jsEnvironment
            });

            // Generate visitor data
            var visitorData = await sessionCreator.VisitorDataAsync();
            _logger.LogDebug("Generated visitor data: {VisitorData}", visitorData?.Substring(0, Math.Min(50, visitorData?.Length ?? 0)));

            // Generate proof of origin token
            string? poToken;
            
            // Try external PoToken server first if configured
            if (!string.IsNullOrEmpty(poTokenServer))
            {
                try
                {
                    _logger.LogInformation("Using external PoToken server: {PoTokenServer}", poTokenServer);
                    poToken = await _poTokenService.GeneratePoTokenAsync(poTokenServer, visitorData ?? string.Empty);
                    _logger.LogDebug("Generated PoToken from external server: {PoToken}", poToken?.Substring(0, Math.Min(50, poToken?.Length ?? 0)));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate PoToken from external server, falling back to local generation");
                    poToken = await sessionCreator.ProofOfOriginTokenAsync(visitorData ?? string.Empty);
                    _logger.LogDebug("Generated PoToken locally: {PoToken}", poToken?.Substring(0, Math.Min(50, poToken?.Length ?? 0)));
                }
            }
            else
            {
                poToken = await sessionCreator.ProofOfOriginTokenAsync(visitorData ?? string.Empty);
                _logger.LogDebug("Generated PoToken locally: {PoToken}", poToken?.Substring(0, Math.Min(50, poToken?.Length ?? 0)));
            }

            // Cache the session data for 1 hour
            var expiry = DateTime.UtcNow.AddHours(1);
            
            lock (_sessionCacheLock)
            {
                _sessionCache[cookieKey] = (visitorData ?? string.Empty, poToken ?? string.Empty, expiry);
            }

            _logger.LogInformation("Successfully generated and cached session data");
            return (visitorData ?? string.Empty, poToken ?? string.Empty);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate session data using YouTubeSessionGenerator");
            
            // Provide more specific error messages based on the exception type
            if (ex.Message.Contains("Sign in to confirm you're not a bot"))
            {
                throw new InvalidOperationException("YouTube requires authentication. Please provide valid YouTube cookies to access this content.", ex);
            }
            else if (ex.Message.Contains("network") || ex.Message.Contains("timeout"))
            {
                throw new InvalidOperationException("Network error while generating session data. Please check your internet connection and try again.", ex);
            }
            else
            {
                throw new InvalidOperationException("Failed to generate YouTube session data. This may be due to network issues, invalid cookies, or YouTube's anti-bot measures.", ex);
            }
        }
    }

    /// <summary>
    /// Clear the session cache (useful for testing or when cookies change)
    /// </summary>
    public void ClearSessionCache()
    {
        lock (_sessionCacheLock)
        {
            _sessionCache.Clear();
            _logger.LogInformation("Session cache cleared");
        }
    }

    /// <summary>
    /// Get session cache statistics
    /// </summary>
    public object GetSessionCacheStats()
    {
        lock (_sessionCacheLock)
        {
            var now = DateTime.UtcNow;
            var totalEntries = _sessionCache.Count;
            var validEntries = _sessionCache.Count(kvp => kvp.Value.Expiry > now);
            var expiredEntries = totalEntries - validEntries;
            
            return new
            {
                totalEntries,
                validEntries,
                expiredEntries,
                cacheSize = _sessionCache.Count
            };
        }
    }

    /// <summary>
    /// Parse base64 encoded cookies string into Cookie collection
    /// </summary>
    private IEnumerable<Cookie> ParseCookies(string base64Cookies)
    {
        if (string.IsNullOrWhiteSpace(base64Cookies))
        {
            _logger.LogWarning("Empty or null cookies string provided");
            return new List<Cookie>();
        }

        // URL-decode the cookies parameter first
        var urlDecodedCookies = Uri.UnescapeDataString(base64Cookies);
        _logger.LogDebug("URL-decoded cookies. Original length: {OriginalLength}, Decoded length: {DecodedLength}", 
            base64Cookies.Length, urlDecodedCookies.Length);

        try
        {
            var cookieString = Encoding.UTF8.GetString(Convert.FromBase64String(urlDecodedCookies));
            _logger.LogDebug("Successfully decoded base64 cookies. Length: {Length}", cookieString.Length);
            
            var cookies = new List<Cookie>();
            
            foreach (var cookiePair in cookieString.Split(';', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = cookiePair.Trim().Split('=', 2);
                if (parts.Length == 2)
                {
                    var cookie = new Cookie(parts[0].Trim(), parts[1].Trim())
                    {
                        Domain = ".youtube.com"
                    };
                    cookies.Add(cookie);
                }
            }
            
            _logger.LogDebug("Parsed {Count} cookies from base64 string", cookies.Count);
            return cookies;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Base64 decoding failed, trying plain cookie string");
            
            // If base64 decoding fails, try parsing as plain cookie string
            var cookies = new List<Cookie>();
            foreach (var cookiePair in urlDecodedCookies.Split(';', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = cookiePair.Trim().Split('=', 2);
                if (parts.Length == 2)
                {
                    var cookie = new Cookie(parts[0].Trim(), parts[1].Trim())
                    {
                        Domain = ".youtube.com"
                    };
                    cookies.Add(cookie);
                }
            }
            
            _logger.LogDebug("Parsed {Count} cookies from plain string", cookies.Count);
            return cookies;
        }
    }

    public async Task<PaginatedAsyncEnumerable<SearchResult>> SearchAsync(
        string query,
        SearchCategory? category = null,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        return client.SearchAsync(query, category);
    }

    public async Task<SongVideoInfoResponse> GetSongVideoInfoAsync(
        string id,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        
        // Get song/video info
        var songVideoInfo = await client.GetSongVideoInfoAsync(id);
        
        // Get streaming data
        StreamingData? streamingData = null;
        try
        {
            streamingData = await client.GetStreamingDataAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get streaming data for song/video {Id}", id);
        }

        // Get lyrics if enabled
        LyricsApiResponse? lyrics = null;
        if (_configService.GetAddLyricsToSongResponse())
        {
            lyrics = await GetLyricsWithTimeoutAsync(id);
        }
        else
        {
            _logger.LogDebug("Lyrics disabled for song/video {Id} - skipping lyrics fetch", id);
        }

        return new SongVideoInfoResponse(songVideoInfo, streamingData, lyrics);
    }

    private async Task<LyricsApiResponse?> GetLyricsWithTimeoutAsync(string videoId)
    {
        const int timeoutSeconds = 2;
        
        try
        {
            var lyricsTask = _lyricsService.GetLyricsAsync(videoId, TimeSpan.FromSeconds(timeoutSeconds));
            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(timeoutSeconds));
            
            var completedTask = await Task.WhenAny(lyricsTask, timeoutTask);
            
            if (completedTask == lyricsTask)
            {
                var lyrics = await lyricsTask;
                
                // If lyrics service returned null due to client-side errors, create error response
                if (lyrics == null)
                {
                    _logger.LogDebug("Lyrics service returned null for videoId: {Id} - creating error response", videoId);
                    return CreateLyricsErrorResponse(videoId, "Lyrics request failed for videoId: {0} - client-side error");
                }
                
                return lyrics;
            }
            else
            {
                // Timeout occurred
                _logger.LogDebug("Lyrics request timed out for videoId: {Id}", videoId);
                return CreateLyricsErrorResponse(videoId, "Lyrics response took too long for videoId: {0}", timeout: TimeSpan.FromSeconds(timeoutSeconds));
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error during lyrics fetch for song/video {Id}", videoId);
            return CreateLyricsErrorResponse(videoId, "Lyrics request failed for videoId: {0} - {1}", ex.Message);
        }
    }

    private static LyricsApiResponse CreateLyricsErrorResponse(string videoId, string reasonFormat, string? additionalInfo = null, TimeSpan? timeout = null)
    {
        var reason = string.Format(reasonFormat, videoId, additionalInfo).TrimEnd();
        
        return new LyricsApiResponse
        {
            Success = false,
            Error = new LyricsErrorResponse
            {
                Error = true,
                Code = 500,
                Reason = reason,
                VideoId = videoId,
                Url = $"https://api-lyrics.simpmusic.org/v1/{videoId}",
                Timeout = timeout
            }
        };
    }

    public async Task<StreamingData> GetStreamingDataAsync(
        string id,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        return await client.GetStreamingDataAsync(id);
    }

    public async Task<AlbumInfo> GetAlbumInfoAsync(
        string browseId,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        return await client.GetAlbumInfoAsync(browseId);
    }

    public async Task<ArtistInfo> GetArtistInfoAsync(
        string browseId,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        return await client.GetArtistInfoAsync(browseId);
    }



    public async Task<object> GetLibraryAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        
        var songs = await client.GetLibrarySongsAsync();
        var albums = await client.GetLibraryAlbumsAsync();
        var artists = await client.GetLibraryArtistsAsync();
        var subscriptions = await client.GetLibrarySubscriptionsAsync();
        var podcasts = await client.GetLibraryPodcastsAsync();
        var playlists = await client.GetLibraryCommunityPlaylistsAsync();

        return new
        {
            songs = songs.ToList(),
            albums = albums.ToList(),
            artists = artists.ToList(),
            subscriptions = subscriptions.ToList(),
            podcasts = podcasts.ToList(),
            playlists = playlists.ToList()
        };
    }

    public async Task<object> GetLibrarySongsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        var songs = await client.GetLibrarySongsAsync();
        return new { songs = songs.ToList() };
    }

    public async Task<object> GetLibraryAlbumsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        var albums = await client.GetLibraryAlbumsAsync();
        return new { albums = albums.ToList() };
    }

    public async Task<object> GetLibraryArtistsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        var artists = await client.GetLibraryArtistsAsync();
        return new { artists = artists.ToList() };
    }

    public async Task<object> GetLibrarySubscriptionsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        var subscriptions = await client.GetLibrarySubscriptionsAsync();
        return new { subscriptions = subscriptions.ToList() };
    }

    public async Task<object> GetLibraryPodcastsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        var podcasts = await client.GetLibraryPodcastsAsync();
        return new { podcasts = podcasts.ToList() };
    }

    public async Task<object> GetLibraryPlaylistsAsync(
        string cookies,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        var playlists = await client.GetLibraryCommunityPlaylistsAsync();
        return new { playlists = playlists.ToList() };
    }

    public async Task<object> GetPlaylistAsync(
        string id,
        string? cookies = null,
        string? geographicalLocation = null,
        string? poTokenServer = null)
    {
        var client = await CreateClientAsync(cookies, geographicalLocation, null, null, poTokenServer);
        
        try
        {
            // Validate playlist ID format
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentException("Playlist ID cannot be empty");
            }
            
            // Check if this looks like a valid playlist ID
            // YouTube playlist IDs typically start with "PL" followed by alphanumeric characters
            if (!id.StartsWith("PL", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException($"Invalid playlist ID format. Expected playlist ID starting with 'PL', got: {id}. This appears to be a channel ID or other YouTube ID format.");
            }
            
            // Convert playlist ID to browse ID
            var browseId = client.GetCommunityPlaylistBrowseId(id);
            
            // Get playlist information
            var playlistInfo = await client.GetCommunityPlaylistInfoAsync(browseId);
            
            // Get all playlist songs
            var songsEnumerable = client.GetCommunityPlaylistSongsAsync(browseId);
            var allSongs = new List<object>();
            
            // Fetch all songs by iterating through all pages
            await foreach (var song in songsEnumerable)
            {
                allSongs.Add(song);
            }
            
            return new { 
                id = id,
                browseId = browseId,
                playlist = playlistInfo,
                songs = allSongs,
                totalSongs = allSongs.Count
            };
        }
        catch (ArgumentException)
        {
            // Re-throw argument exceptions as-is
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting playlist for ID: {Id}", id);
            throw new ArgumentException($"Failed to retrieve playlist with ID '{id}'. The playlist may not exist or may be private. Error: {ex.Message}");
        }
    }
} 