namespace YoutubeMusicAPIProxy.Configuration;

/// <summary>
/// Configuration object containing all YouTube Music session-related parameters
/// </summary>
public class YouTubeMusicSessionConfig
{
    /// <summary>
    /// Cookies for authentication
    /// </summary>
    public string? Cookies { get; set; }

    /// <summary>
    /// Geographical location (e.g., "US")
    /// </summary>
    public string? GeographicalLocation { get; set; }

    /// <summary>
    /// Visitor data for session management
    /// </summary>
    public string? VisitorData { get; set; }

    /// <summary>
    /// PoToken for authentication
    /// </summary>
    public string? PoToken { get; set; }

    /// <summary>
    /// PoToken server URL
    /// </summary>
    public string? PoTokenServer { get; set; }

    /// <summary>
    /// Creates a new session configuration with default values from the main config
    /// </summary>
    /// <param name="mainConfig">The main YouTube Music configuration</param>
    /// <returns>A new session configuration</returns>
    public static YouTubeMusicSessionConfig FromMainConfig(YouTubeMusicConfig mainConfig)
    {
        return new YouTubeMusicSessionConfig
        {
            Cookies = mainConfig.Cookies,
            GeographicalLocation = mainConfig.GeographicalLocation,
            PoTokenServer = mainConfig.PoTokenServer
        };
    }

    /// <summary>
    /// Creates a new session configuration with overridden values
    /// </summary>
    /// <param name="mainConfig">The main YouTube Music configuration</param>
    /// <param name="cookies">Optional cookies override</param>
    /// <param name="geographicalLocation">Optional geographical location override</param>
    /// <param name="visitorData">Optional visitor data</param>
    /// <param name="poToken">Optional PoToken</param>
    /// <param name="poTokenServer">Optional PoToken server override</param>
    /// <returns>A new session configuration</returns>
    public static YouTubeMusicSessionConfig Create(
        YouTubeMusicConfig mainConfig,
        string? cookies = null,
        string? geographicalLocation = null,
        string? visitorData = null,
        string? poToken = null,
        string? poTokenServer = null)
    {
        return new YouTubeMusicSessionConfig
        {
            Cookies = cookies ?? mainConfig.Cookies,
            GeographicalLocation = geographicalLocation ?? mainConfig.GeographicalLocation,
            VisitorData = visitorData,
            PoToken = poToken,
            PoTokenServer = poTokenServer ?? mainConfig.PoTokenServer
        };
    }

    /// <summary>
    /// Creates a copy of this configuration with updated values
    /// </summary>
    /// <param name="cookies">Optional cookies override</param>
    /// <param name="geographicalLocation">Optional geographical location override</param>
    /// <param name="visitorData">Optional visitor data override</param>
    /// <param name="poToken">Optional PoToken override</param>
    /// <param name="poTokenServer">Optional PoToken server override</param>
    /// <returns>A new session configuration with updated values</returns>
    public YouTubeMusicSessionConfig With(
        string? cookies = null,
        string? geographicalLocation = null,
        string? visitorData = null,
        string? poToken = null,
        string? poTokenServer = null)
    {
        return new YouTubeMusicSessionConfig
        {
            Cookies = cookies ?? Cookies,
            GeographicalLocation = geographicalLocation ?? GeographicalLocation,
            VisitorData = visitorData ?? VisitorData,
            PoToken = poToken ?? PoToken,
            PoTokenServer = poTokenServer ?? PoTokenServer
        };
    }

    /// <summary>
    /// Creates a cache key for this configuration
    /// </summary>
    /// <returns>A deterministic cache key</returns>
    public string CreateCacheKey()
    {
        var parts = new[]
        {
            $"cookies:{Cookies ?? "none"}",
            $"location:{GeographicalLocation ?? "none"}",
            $"visitor:{VisitorData ?? "none"}",
            $"poToken:{PoToken ?? "none"}",
            $"server:{PoTokenServer ?? "none"}"
        };
        
        return string.Join("|", parts);
    }

    /// <summary>
    /// Checks if this configuration has all required session data
    /// </summary>
    /// <returns>True if the configuration has cookies and either visitor data or PoToken</returns>
    public bool HasSessionData()
    {
        return !string.IsNullOrEmpty(Cookies) && 
               (!string.IsNullOrEmpty(VisitorData) || !string.IsNullOrEmpty(PoToken));
    }

    /// <summary>
    /// Checks if this configuration needs session data generation
    /// </summary>
    /// <returns>True if cookies are present but session data is missing</returns>
    public bool NeedsSessionDataGeneration()
    {
        return !string.IsNullOrEmpty(Cookies) && 
               (string.IsNullOrEmpty(VisitorData) || string.IsNullOrEmpty(PoToken));
    }
}
