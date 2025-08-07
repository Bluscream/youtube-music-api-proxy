namespace YoutubeMusicAPIProxy.Configuration;

/// <summary>
/// Configuration settings for YouTube Music API
/// </summary>
public class YouTubeMusicConfig
{
    /// <summary>
    /// YouTube cookies for authentication (from appsettings, environment variable YTM_COOKIES, or query parameter)
    /// </summary>
    public string? Cookies { get; set; }

    /// <summary>
    /// Visitor data for session tailoring (from appsettings, environment variable YTM_VISITORDATA, or query parameter)
    /// </summary>
    public string? VisitorData { get; set; }

    /// <summary>
    /// Proof of Origin Token for attestation (from appsettings, environment variable YTM_POTOKEN, or query parameter)
    /// </summary>
    public string? PoToken { get; set; }

    /// <summary>
    /// Geographical location for the payload (from appsettings, environment variable YTM_GEOGRAPHICAL_LOCATION, or query parameter, defaults to "US")
    /// </summary>
    public string GeographicalLocation { get; set; } = "US";

    /// <summary>
    /// User agent string (from appsettings, environment variable YTM_USER_AGENT, or defaults to standard browser UA)
    /// </summary>
    public string UserAgent { get; set; } = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    /// <summary>
    /// Request timeout in seconds (from appsettings, environment variable YTM_TIMEOUT, defaults to 30)
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Maximum retry attempts for failed requests (from appsettings, environment variable YTM_MAX_RETRIES, defaults to 3)
    /// </summary>
    public int MaxRetries { get; set; } = 3;

    /// <summary>
    /// Enable debug logging (from appsettings, environment variable YTM_DEBUG, defaults to false)
    /// </summary>
    public bool Debug { get; set; } = false;
} 