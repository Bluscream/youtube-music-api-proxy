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
    public string? GetCookies(string? queryCookies = null, bool print = false)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryCookies))
        {
            if (print) Console.WriteLine($"Query parameter cookies: {queryCookies}");
            return TryDecodeBase64(queryCookies) ?? queryCookies;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.Cookies))
        {
            if (print) Console.WriteLine($"Appsettings cookies: {_config.Cookies}");
            return TryDecodeBase64(_config.Cookies) ?? _config.Cookies;
        }

        // Priority 3: Environment variable
        var envCookies = Environment.GetEnvironmentVariable("YTM_COOKIES");
        if (!string.IsNullOrWhiteSpace(envCookies))
        {
            if (print) Console.WriteLine($"Environment variable cookies: {envCookies}");
            return TryDecodeBase64(envCookies) ?? envCookies;
        }

        return null;
    }

    /// <summary>
    /// Gets visitor data with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetVisitorData(string? queryVisitorData = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryVisitorData))
        {
            return TryDecodeBase64(queryVisitorData) ?? queryVisitorData;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.VisitorData))
        {
            return TryDecodeBase64(_config.VisitorData) ?? _config.VisitorData;
        }

        // Priority 3: Environment variable
        var envVisitorData = Environment.GetEnvironmentVariable("YTM_VISITORDATA");
        if (!string.IsNullOrWhiteSpace(envVisitorData))
        {
            return TryDecodeBase64(envVisitorData) ?? envVisitorData;
        }

        return null;
    }

    /// <summary>
    /// Gets PoToken with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string? GetPoToken(string? queryPoToken = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryPoToken))
        {
            return TryDecodeBase64(queryPoToken) ?? queryPoToken;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.PoToken))
        {
            return TryDecodeBase64(_config.PoToken) ?? _config.PoToken;
        }

        // Priority 3: Environment variable
        var envPoToken = Environment.GetEnvironmentVariable("YTM_POTOKEN");
        if (!string.IsNullOrWhiteSpace(envPoToken))
        {
            return TryDecodeBase64(envPoToken) ?? envPoToken;
        }

        return null;
    }

    /// <summary>
    /// Gets geographical location with priority: query parameter > appsettings > environment variable
    /// </summary>
    public string GetGeographicalLocation(string? queryLocation = null)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryLocation))
        {
            return TryDecodeBase64(queryLocation) ?? queryLocation;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(_config.GeographicalLocation))
        {
            return TryDecodeBase64(_config.GeographicalLocation) ?? _config.GeographicalLocation;
        }

        // Priority 3: Environment variable
        var envLocation = Environment.GetEnvironmentVariable("YTM_GEOGRAPHICAL_LOCATION");
        if (!string.IsNullOrWhiteSpace(envLocation))
        {
            return TryDecodeBase64(envLocation) ?? envLocation;
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
            return TryDecodeBase64(_config.UserAgent) ?? _config.UserAgent;
        }

        // Priority 2: Environment variable
        var envUserAgent = Environment.GetEnvironmentVariable("YTM_USER_AGENT");
        if (!string.IsNullOrWhiteSpace(envUserAgent))
        {
            return TryDecodeBase64(envUserAgent) ?? envUserAgent;
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

    /// <summary>
    /// Tries to decode a string as base64 and returns the decoded value if successful, otherwise returns null
    /// </summary>
    /// <param name="value">The string to try decoding</param>
    /// <returns>Decoded string if successful, null if not valid base64</returns>
    private static string? TryDecodeBase64(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        try
        {
            // Check if the string looks like base64 (contains only valid base64 characters)
            if (value.All(c => char.IsLetterOrDigit(c) || c == '+' || c == '/' || c == '='))
            {
                // Try to decode as base64
                var bytes = Convert.FromBase64String(value);
                return System.Text.Encoding.UTF8.GetString(bytes);
            }
        }
        catch (FormatException)
        {
            // Not valid base64, return null to use original value
        }

        return null;
    }
} 