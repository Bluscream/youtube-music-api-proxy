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
    /// Gets PoToken server URL with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetPoTokenServer(string? queryPoTokenServer = null, bool print = false)
    {
        return GetStringValue(queryPoTokenServer, _config.PoTokenServer, YouTubeMusicConfigSources.PoTokenServer, print);
    }

    /// <summary>
    /// Gets geographical location with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string GetGeographicalLocation(string? queryLocation = null, bool print = false)
    {
        return GetStringValueNullable(queryLocation, _config.GeographicalLocation, YouTubeMusicConfigSources.GeographicalLocation, print) ?? "US";
    }

    /// <summary>
    /// Gets user agent with priority: appsettings > environment variable > default
    /// </summary>
    public string GetUserAgent(bool print = false)
    {
        return GetStringValue(_config.UserAgent, YouTubeMusicConfigSources.UserAgent, print) ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
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

    /// <summary>
    /// Logs the final resolved configuration values
    /// </summary>
    public void LogResolvedConfiguration()
    {
        Console.WriteLine("=== Resolved Configuration Values ===");
        Console.WriteLine($"Cookies: {(GetCookies() != null ? "Set" : "Not set")}");
        Console.WriteLine($"PoTokenServer: {(GetPoTokenServer() != null ? "Set" : "Not set")}");
        Console.WriteLine($"GeographicalLocation: {GetGeographicalLocation()}");
        Console.WriteLine($"UserAgent: {GetUserAgent()}");
        Console.WriteLine($"TimeoutSeconds: {GetTimeoutSeconds()}");
        Console.WriteLine($"MaxRetries: {GetMaxRetries()}");
        Console.WriteLine($"Debug: {GetDebug()}");
        Console.WriteLine($"AddLyricsToSongResponse: {GetAddLyricsToSongResponse()}");
        Console.WriteLine("=== End Resolved Configuration Values ===");
    }
} 