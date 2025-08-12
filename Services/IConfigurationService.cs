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
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Visitor data string or null if not found</returns>
    string? GetVisitorData(string? queryVisitorData = null, bool print = false);

    /// <summary>
    /// Gets PoToken with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryPoToken">PoToken from query parameter</param>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>PoToken string or null if not found</returns>
    string? GetPoToken(string? queryPoToken = null, bool print = false);

    /// <summary>
    /// Gets PoToken server URL with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryPoTokenServer">PoToken server URL from query parameter</param>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>PoToken server URL string or null if not found</returns>
    string? GetPoTokenServer(string? queryPoTokenServer = null, bool print = false);

    /// <summary>
    /// Gets geographical location with priority: query parameter > appsettings > environment variable
    /// </summary>
    /// <param name="queryLocation">Location from query parameter</param>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Geographical location string (defaults to "US")</returns>
    string GetGeographicalLocation(string? queryLocation = null, bool print = false);

    /// <summary>
    /// Gets user agent with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>User agent string</returns>
    string GetUserAgent(bool print = false);

    /// <summary>
    /// Gets timeout in seconds with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Timeout in seconds</returns>
    int GetTimeoutSeconds(bool print = false);

    /// <summary>
    /// Gets max retries with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Maximum retry attempts</returns>
    int GetMaxRetries(bool print = false);

    /// <summary>
    /// Gets debug flag with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Debug flag</returns>
    bool GetDebug(bool print = false);

    /// <summary>
    /// Gets whether to add lyrics to song responses with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="print">Whether to print debug information to console</param>
    /// <returns>Whether to add lyrics to song responses</returns>
    bool GetAddLyricsToSongResponse(bool print = false);

    /// <summary>
    /// Logs the final resolved configuration values
    /// </summary>
    void LogResolvedConfiguration();
} 