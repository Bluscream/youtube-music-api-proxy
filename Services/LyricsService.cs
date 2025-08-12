using System.Text.Json;
using Microsoft.Extensions.Logging;
using YoutubeMusicAPIProxy.Configuration;
using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service for fetching lyrics from SimpMusic Lyrics API
/// </summary>
public class LyricsService : ILyricsService
{
    private readonly HttpClient _httpClient;
    private readonly IHttpClientService _httpClientService;
    private readonly ILogger<LyricsService> _logger;
    private readonly string _baseUrl = "https://api-lyrics.simpmusic.org/v1";

    public LyricsService(HttpClient httpClient, IHttpClientService httpClientService, ILogger<LyricsService> logger)
    {
        _httpClient = httpClient;
        _httpClientService = httpClientService;
        _logger = logger;
    }

    /// <summary>
    /// Get lyrics for a video ID with timeout using the default HTTP client
    /// </summary>
    /// <param name="videoId">YouTube video ID</param>
    /// <param name="timeout">Timeout duration (default: 1 second)</param>
    /// <returns>Raw lyrics API response or null if timeout/client error</returns>
    public async Task<LyricsApiResponse?> GetLyricsAsync(string videoId, TimeSpan timeout = default)
    {
        return await GetLyricsWithClientAsync(videoId, _httpClient, timeout);
    }

    /// <summary>
    /// Get lyrics for a video ID with timeout using a cached HTTP client
    /// </summary>
    /// <param name="videoId">YouTube video ID</param>
    /// <param name="timeout">Timeout duration (default: 1 second)</param>
    /// <param name="cookies">Optional cookies for the request</param>
    /// <returns>Raw lyrics API response or null if timeout/client error</returns>
    public async Task<LyricsApiResponse?> GetLyricsWithCachedClientAsync(string videoId, TimeSpan timeout = default, string? cookies = null)
    {
        var sessionConfig = new YouTubeMusicSessionConfig { Cookies = cookies };
        var cachedClient = await _httpClientService.GetAuthClientAsync(sessionConfig);
        return await GetLyricsWithClientAsync(videoId, cachedClient, timeout);
    }

    /// <summary>
    /// Get lyrics for a video ID with timeout using the specified HTTP client
    /// </summary>
    /// <param name="videoId">YouTube video ID</param>
    /// <param name="httpClient">HTTP client to use for the request</param>
    /// <param name="timeout">Timeout duration (default: 1 second)</param>
    /// <returns>Raw lyrics API response or null if timeout/client error</returns>
    private async Task<LyricsApiResponse?> GetLyricsWithClientAsync(string videoId, HttpClient httpClient, TimeSpan timeout = default)
    {
        if (timeout == default)
        {
            timeout = TimeSpan.FromSeconds(1);
        }

        var url = $"{_baseUrl}/{videoId}";
        
        try
        {
            using var cts = new CancellationTokenSource(timeout);
            
            _logger.LogDebug("Fetching lyrics for videoId: {VideoId} with timeout: {Timeout}", videoId, timeout);
            
            var response = await _httpClient.GetAsync(url, cts.Token);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Lyrics API returned status code {StatusCode} for videoId: {VideoId}", 
                    response.StatusCode, videoId);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync(cts.Token);
            var lyricsResponse = JsonSerializer.Deserialize<LyricsApiResponse>(content);

            if (lyricsResponse != null)
            {
                _logger.LogDebug("Successfully retrieved lyrics response for videoId: {VideoId}", videoId);
                return lyricsResponse;
            }
            else
            {
                _logger.LogDebug("No lyrics response found for videoId: {VideoId}", videoId);
                return null;
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Lyrics request timed out for videoId: {VideoId} after {Timeout}", videoId, timeout);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "HTTP error fetching lyrics for videoId: {VideoId}", videoId);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "JSON parsing error for lyrics response of videoId: {VideoId}", videoId);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching lyrics for videoId: {VideoId}", videoId);
            return null;
        }
    }
}
