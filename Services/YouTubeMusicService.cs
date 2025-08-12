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
    private readonly IHttpClientService _httpClientService;
    private readonly ILogger<YouTubeMusicService> _logger;
    private readonly ILyricsService _lyricsService;
    private readonly IConfigurationService _configService;
    private readonly IAuthService _authService;

    public YouTubeMusicService(
        IOptions<YouTubeMusicConfig> config,
        IHttpClientService httpClientService,
        ILogger<YouTubeMusicService> logger,
        ILyricsService lyricsService,
        IConfigurationService configService,
        IAuthService authService)
    {
        _config = config;
        _httpClientService = httpClientService;
        _logger = logger;
        _lyricsService = lyricsService;
        _configService = configService;
        _authService = authService;
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
        
        // Create session configuration
        var sessionConfig = YouTubeMusicSessionConfig.Create(
            config, 
            cookies, 
            geographicalLocation, 
            visitorData, 
            poToken, 
            poTokenServer);
        
        // Parse cookies if provided
        IEnumerable<Cookie>? cookieCollection = null;
        var cookieString = sessionConfig.Cookies;
        
        if (!string.IsNullOrEmpty(cookieString))
        {
            try
            {
                cookieCollection = _authService.ParseCookies(cookieString);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse cookies");
            }
        }

        // Generate session data if needed
        if (cookieCollection != null && sessionConfig.NeedsSessionDataGeneration())
        {
            var (generatedVisitorData, generatedPoToken) = await _authService.GenerateSessionDataAsync(cookieString, sessionConfig.PoTokenServer);
            
            // Update session configuration with generated data
            sessionConfig = sessionConfig.With(
                visitorData: sessionConfig.VisitorData ?? generatedVisitorData,
                poToken: sessionConfig.PoToken ?? generatedPoToken);
        }

        // Get cached HTTP client with session data
        var httpClient = await _httpClientService.GetClientAsync(sessionConfig);

        return new YouTubeMusicClient(
            _logger,
            sessionConfig.GeographicalLocation ?? "US",
            sessionConfig.VisitorData,
            sessionConfig.PoToken,
            cookieCollection,
            httpClient);
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