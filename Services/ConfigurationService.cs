using Microsoft.Extensions.Options;
using YoutubeMusicAPIProxy.Configuration;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Implementation of configuration service with priority order: query parameter > appsettings > environment variable
/// </summary>
public class ConfigurationService : BaseConfigurationService, IConfigurationService
{
    private readonly LyricsConfig _lyricsConfig;

    public ConfigurationService(IOptions<YouTubeMusicConfig> config, IOptions<LyricsConfig> lyricsConfig) : base(config.Value)
    {
        _lyricsConfig = lyricsConfig.Value;
    }

    /// <summary>
    /// Gets cookies with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetCookies(string? queryCookies = null, bool print = false)
    {
        return GetStringValue(queryCookies, _config.Cookies, YouTubeMusicConfigSources.Cookies, print);
    }

    /// <summary>
    /// Gets visitor data with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetVisitorData(string? queryVisitorData = null, bool print = false)
    {
        return GetStringValue(queryVisitorData, _config.VisitorData, YouTubeMusicConfigSources.VisitorData, print);
    }

    /// <summary>
    /// Gets PoToken with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetPoToken(string? queryPoToken = null, bool print = false)
    {
        return GetStringValue(queryPoToken, _config.PoToken, YouTubeMusicConfigSources.PoToken, print);
    }

    /// <summary>
    /// Gets geographical location with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string GetGeographicalLocation(string? queryLocation = null, bool print = false)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryLocation))
        {
            if (print) Console.WriteLine($"Query parameter YTM_GEOGRAPHICAL_LOCATION: {queryLocation}");
            return queryLocation;
        }

        // Priority 2: Appsettings and environment variable
        return GetStringValue(_config.GeographicalLocation, YouTubeMusicConfigSources.GeographicalLocation, print);
    }

    /// <summary>
    /// Gets user agent with priority: appsettings > environment variable > default
    /// </summary>
    public string GetUserAgent(bool print = false)
    {
        return GetStringValue(_config.UserAgent, YouTubeMusicConfigSources.UserAgent, print);
    }

    /// <summary>
    /// Gets timeout in seconds with priority: appsettings > environment variable > default
    /// </summary>
    public int GetTimeoutSeconds(bool print = false)
    {
        return GetIntValue(_config.TimeoutSeconds, YouTubeMusicConfigSources.TimeoutSeconds, print);
    }

    /// <summary>
    /// Gets max retries with priority: appsettings > environment variable > default
    /// </summary>
    public int GetMaxRetries(bool print = false)
    {
        return GetIntValue(_config.MaxRetries, YouTubeMusicConfigSources.MaxRetries, print);
    }

    /// <summary>
    /// Gets debug flag with priority: appsettings > environment variable > default
    /// </summary>
    public bool GetDebug(bool print = false)
    {
        return GetBoolValue(_config.Debug, YouTubeMusicConfigSources.Debug, print);
    }

    /// <summary>
    /// Gets whether to add lyrics to song responses with priority: appsettings > environment variable > default
    /// </summary>
    public bool GetAddLyricsToSongResponse(bool print = false)
    {
        return GetBoolValue(_lyricsConfig.AddToSongResponse, LyricsConfigSources.AddToSongResponse, print);
    }
} 