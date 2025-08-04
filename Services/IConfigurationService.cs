using YoutubeMusicAPIProxy.Configuration;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service for managing configuration with priority order: query parameter > appsettings > environment variable
/// </summary>
public interface IConfigurationService
{
    /// <summary>
    /// Gets cookies with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryCookies">Cookies from query parameter</param>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Cookies string or null if not found</returns>
    string? GetCookies(string? queryCookies = null, bool print = false);

    /// <summary>
    /// Gets visitor data with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryVisitorData">Visitor data from query parameter</param>
    /// <returns>Visitor data string or null if not found</returns>
    string? GetVisitorData(string? queryVisitorData = null);

    /// <summary>
    /// Gets PoToken with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryPoToken">PoToken from query parameter</param>
    /// <returns>PoToken string or null if not found</returns>
    string? GetPoToken(string? queryPoToken = null);

    /// <summary>
    /// Gets geographical location with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryLocation">Location from query parameter</param>
    /// <returns>Geographical location string (defaults to "US")</returns>
    string GetGeographicalLocation(string? queryLocation = null);

    /// <summary>
    /// Gets user agent with priority: appsettings > environment variable > default
    /// </summary>
    /// <returns>User agent string</returns>
    string GetUserAgent();

    /// <summary>
    /// Gets timeout in seconds with priority: appsettings > environment variable > default
    /// </summary>
    /// <returns>Timeout in seconds</returns>
    int GetTimeoutSeconds();

    /// <summary>
    /// Gets max retries with priority: appsettings > environment variable > default
    /// </summary>
    /// <returns>Maximum retry attempts</returns>
    int GetMaxRetries();

    /// <summary>
    /// Gets debug flag with priority: appsettings > environment variable > default
    /// </summary>
    /// <returns>Debug flag</returns>
    bool GetDebug();
} 