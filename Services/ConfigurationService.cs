using Microsoft.Extensions.Options;
using YoutubeMusicAPIProxy.Configuration;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Implementation of configuration service with priority order: query parameter > appsettings > environment variable
/// </summary>
public class ConfigurationService : IConfigurationService
{
    private readonly YouTubeMusicConfig _config;

    public ConfigurationService(IOptions<YouTubeMusicConfig> config)
    {
        _config = config.Value;
    }

    /// <summary>
    /// Gets cookies with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetCookies(string? queryCookies = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryCookies))
        {
            return queryCookies;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.Cookies))
        {
            return _config.Cookies;
        }

        // Priority 3: Environment variable
        return Environment.GetEnvironmentVariable("YTM_COOKIES");
    }

    /// <summary>
    /// Gets visitor data with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetVisitorData(string? queryVisitorData = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryVisitorData))
        {
            return queryVisitorData;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.VisitorData))
        {
            return _config.VisitorData;
        }

        // Priority 3: Environment variable
        return Environment.GetEnvironmentVariable("YTM_VISITORDATA");
    }

    /// <summary>
    /// Gets PoToken with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetPoToken(string? queryPoToken = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryPoToken))
        {
            return queryPoToken;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.PoToken))
        {
            return _config.PoToken;
        }

        // Priority 3: Environment variable
        return Environment.GetEnvironmentVariable("YTM_POTOKEN");
    }

    /// <summary>
    /// Gets geographical location with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string GetGeographicalLocation(string? queryLocation = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryLocation))
        {
            return queryLocation;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.GeographicalLocation))
        {
            return _config.GeographicalLocation;
        }

        // Priority 3: Environment variable
        var envLocation = Environment.GetEnvironmentVariable("YTM_GEOGRAPHICAL_LOCATION");
        if (!string.IsNullOrWhiteSpace(envLocation))
        {
            return envLocation;
        }

        // Default
        return "US";
    }

    /// <summary>
    /// Gets user agent with priority: appsettings > environment variable > default
    /// </summary>
    public string GetUserAgent()
    {
        // Priority 1: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.UserAgent))
        {
            return _config.UserAgent;
        }

        // Priority 2: Environment variable
        var envUserAgent = Environment.GetEnvironmentVariable("YTM_USER_AGENT");
        if (!string.IsNullOrWhiteSpace(envUserAgent))
        {
            return envUserAgent;
        }

        // Default
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }

    /// <summary>
    /// Gets timeout in seconds with priority: appsettings > environment variable > default
    /// </summary>
    public int GetTimeoutSeconds()
    {
        // Priority 1: Appsettings
        if (_config.TimeoutSeconds > 0)
        {
            return _config.TimeoutSeconds;
        }

        // Priority 2: Environment variable
        var envTimeout = Environment.GetEnvironmentVariable("YTM_TIMEOUT");
        if (int.TryParse(envTimeout, out var timeout) && timeout > 0)
        {
            return timeout;
        }

        // Default
        return 30;
    }

    /// <summary>
    /// Gets max retries with priority: appsettings > environment variable > default
    /// </summary>
    public int GetMaxRetries()
    {
        // Priority 1: Appsettings
        if (_config.MaxRetries >= 0)
        {
            return _config.MaxRetries;
        }

        // Priority 2: Environment variable
        var envRetries = Environment.GetEnvironmentVariable("YTM_MAX_RETRIES");
        if (int.TryParse(envRetries, out var retries) && retries >= 0)
        {
            return retries;
        }

        // Default
        return 3;
    }

    /// <summary>
    /// Gets debug flag with priority: appsettings > environment variable > default
    /// </summary>
    public bool GetDebug()
    {
        // Priority 1: Appsettings
        if (_config.Debug)
        {
            return true;
        }

        // Priority 2: Environment variable
        var envDebug = Environment.GetEnvironmentVariable("YTM_DEBUG");
        if (!string.IsNullOrWhiteSpace(envDebug))
        {
            return bool.TryParse(envDebug, out var debug) && debug;
        }

        // Default
        return false;
    }
} 