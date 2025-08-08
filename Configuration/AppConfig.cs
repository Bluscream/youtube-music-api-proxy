namespace YoutubeMusicAPIProxy.Configuration;

/// <summary>
/// Configuration settings for the main application
/// </summary>
public class AppConfig
{
    /// <summary>
    /// HTTP port for the application (from appsettings, defaults to 80)
    /// </summary>
    public int HttpPort { get; set; } = 80;

    /// <summary>
    /// HTTPS port for the application (from appsettings, defaults to 443)
    /// </summary>
    public int HttpsPort { get; set; } = 443;

    /// <summary>
    /// Enable automatic HTTP to HTTPS redirection (from appsettings, environment variable ENABLE_HTTPS_REDIRECTION, defaults to false)
    /// </summary>
    public bool EnableHttpsRedirection { get; set; } = false;
}
