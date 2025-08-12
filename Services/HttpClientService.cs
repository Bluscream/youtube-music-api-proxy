using System.Net;
using Microsoft.Extensions.Options;
using YoutubeMusicAPIProxy.Configuration;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Centralized HTTP client service for managing reusable HTTP clients with caching
/// </summary>
public interface IHttpClientService
{
    /// <summary>
    /// Gets a cached HTTP client for the specified session configuration
    /// </summary>
    /// <param name="sessionConfig">Session configuration containing all parameters</param>
    /// <returns>A configured HTTP client</returns>
    Task<HttpClient> GetClientAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Gets a cached HTTP client for YouTube Music API operations
    /// </summary>
    /// <param name="sessionConfig">Session configuration containing all parameters</param>
    /// <returns>A configured HTTP client for YouTube Music API</returns>
    Task<HttpClient> GetYouTubeMusicClientAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Gets a cached HTTP client for authentication operations
    /// </summary>
    /// <param name="sessionConfig">Session configuration containing all parameters</param>
    /// <returns>A configured HTTP client for authentication</returns>
    Task<HttpClient> GetAuthClientAsync(YouTubeMusicSessionConfig sessionConfig);

    /// <summary>
    /// Clears the client cache
    /// </summary>
    void ClearCache();
}

/// <summary>
/// Implementation of the centralized HTTP client service
/// </summary>
public class HttpClientService : IHttpClientService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IOptions<YouTubeMusicConfig> _config;
    private readonly ILogger<HttpClientService> _logger;
    
    // Cache for HTTP clients based on configuration
    private readonly Dictionary<string, (HttpClient Client, DateTime Expiry)> _clientCache = new();
    private readonly object _cacheLock = new object();

    public HttpClientService(
        IHttpClientFactory httpClientFactory,
        IOptions<YouTubeMusicConfig> config,
        ILogger<HttpClientService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<HttpClient> GetClientAsync(YouTubeMusicSessionConfig sessionConfig)
    {
        // Create cache key based on session configuration
        var cacheKey = sessionConfig.CreateCacheKey();
        
        lock (_cacheLock)
        {
            // Check if we have a valid cached client
            if (_clientCache.TryGetValue(cacheKey, out var cachedData) && cachedData.Expiry > DateTime.UtcNow)
            {
                _logger.LogDebug("Using cached HTTP client for key: {CacheKeyPrefix}...", 
                    cacheKey.Substring(0, Math.Min(20, cacheKey.Length)));
                return cachedData.Client;
            }
            
            // Remove expired entries
            CleanupExpiredCache();
        }

        // Create new client
        var client = CreateConfiguredClient(sessionConfig);
        
        // Cache the client for 30 minutes
        var expiry = DateTime.UtcNow.AddMinutes(30);
        
        lock (_cacheLock)
        {
            _clientCache[cacheKey] = (client, expiry);
        }

        _logger.LogDebug("Created and cached new HTTP client for key: {CacheKeyPrefix}...", 
            cacheKey.Substring(0, Math.Min(20, cacheKey.Length)));
        
        return client;
    }

    public async Task<HttpClient> GetYouTubeMusicClientAsync(YouTubeMusicSessionConfig sessionConfig)
    {
        // For YouTube Music clients, we use the provided session configuration
        // Session data generation is handled by the calling service to avoid circular dependencies
        return await GetClientAsync(sessionConfig);
    }

    public async Task<HttpClient> GetAuthClientAsync(YouTubeMusicSessionConfig sessionConfig)
    {
        // For authentication clients, we use the provided session configuration
        return await GetClientAsync(sessionConfig);
    }

    public void ClearCache()
    {
        lock (_cacheLock)
        {
            foreach (var (_, (client, _)) in _clientCache)
            {
                client.Dispose();
            }
            _clientCache.Clear();
            _logger.LogInformation("HTTP client cache cleared");
        }
    }

    private HttpClient CreateConfiguredClient(YouTubeMusicSessionConfig sessionConfig)
    {
        var client = _httpClientFactory.CreateClient();
        
        // Set default headers
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        client.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
        client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
        client.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate, br");
        client.DefaultRequestHeaders.Add("Connection", "keep-alive");
        client.DefaultRequestHeaders.Add("Sec-Fetch-Dest", "empty");
        client.DefaultRequestHeaders.Add("Sec-Fetch-Mode", "cors");
        client.DefaultRequestHeaders.Add("Sec-Fetch-Site", "same-origin");

        // Add cookies if provided
        if (!string.IsNullOrEmpty(sessionConfig.Cookies))
        {
            client.DefaultRequestHeaders.Add("Cookie", sessionConfig.Cookies);
        }

        // Add geographical location if provided
        if (!string.IsNullOrEmpty(sessionConfig.GeographicalLocation))
        {
            client.DefaultRequestHeaders.Add("X-Goog-Visitor-Id", sessionConfig.GeographicalLocation);
        }

        // Add visitor data if provided
        if (!string.IsNullOrEmpty(sessionConfig.VisitorData))
        {
            client.DefaultRequestHeaders.Add("X-Goog-Visitor-Data", sessionConfig.VisitorData);
        }

        // Add PoToken if provided
        if (!string.IsNullOrEmpty(sessionConfig.PoToken))
        {
            client.DefaultRequestHeaders.Add("X-Goog-PoToken", sessionConfig.PoToken);
        }

        return client;
    }



    private void CleanupExpiredCache()
    {
        var expiredKeys = _clientCache.Keys.Where(k => _clientCache[k].Expiry <= DateTime.UtcNow).ToList();
        foreach (var key in expiredKeys)
        {
            var (client, _) = _clientCache[key];
            client.Dispose();
            _clientCache.Remove(key);
        }
        
        if (expiredKeys.Count > 0)
        {
            _logger.LogDebug("Cleaned up {ExpiredCount} expired HTTP clients from cache", expiredKeys.Count);
        }
    }
}
