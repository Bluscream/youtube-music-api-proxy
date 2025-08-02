namespace YoutubeMusicAPIProxy.Configuration;

/// <summary>
/// Configuration settings for YouTube Music API
/// </summary>
public class YouTubeMusicConfig
{
    /// <summary>
    /// YouTube cookies for authentication (from environment variable YTM_COOKIES)
    /// </summary>
    public string? Cookies { get; set; }

    /// <summary>
    /// Visitor data for session tailoring (from environment variable YTM_VISITORDATA)
    /// </summary>
    public string? VisitorData { get; set; }

    /// <summary>
    /// Proof of Origin Token for attestation (from environment variable YTM_POTOKEN)
    /// </summary>
    public string? PoToken { get; set; }

    /// <summary>
    /// Geographical location for the payload (from environment variable YTM_GEOGRAPHICAL_LOCATION, defaults to "US")
    /// </summary>
    public string GeographicalLocation { get; set; } = "US";
} 