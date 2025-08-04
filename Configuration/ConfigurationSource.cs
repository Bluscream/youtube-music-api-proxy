namespace YoutubeMusicAPIProxy.Configuration;

/// <summary>
/// Defines a configuration source with its environment variable name and default value
/// </summary>
/// <typeparam name="T">The type of the configuration value</typeparam>
public class ConfigurationSource<T>
{
    /// <summary>
    /// The environment variable name for this configuration
    /// </summary>
    public string EnvironmentVariableName { get; }

    /// <summary>
    /// The default value if no configuration is found
    /// </summary>
    public T DefaultValue { get; }

    /// <summary>
    /// Whether this configuration supports base64 decoding
    /// </summary>
    public bool SupportsBase64Decoding { get; }

    /// <summary>
    /// Creates a new configuration source
    /// </summary>
    /// <param name="environmentVariableName">The environment variable name</param>
    /// <param name="defaultValue">The default value</param>
    /// <param name="supportsBase64Decoding">Whether to support base64 decoding</param>
    public ConfigurationSource(string environmentVariableName, T defaultValue, bool supportsBase64Decoding = true)
    {
        EnvironmentVariableName = environmentVariableName;
        DefaultValue = defaultValue;
        SupportsBase64Decoding = supportsBase64Decoding;
    }
}

/// <summary>
/// Static configuration sources for YouTube Music API
/// </summary>
public static class YouTubeMusicConfigSources
{
    public static readonly ConfigurationSource<string?> Cookies = new("YTM_COOKIES", null);
    public static readonly ConfigurationSource<string?> VisitorData = new("YTM_VISITORDATA", null);
    public static readonly ConfigurationSource<string?> PoToken = new("YTM_POTOKEN", null);
    public static readonly ConfigurationSource<string> GeographicalLocation = new("YTM_GEOGRAPHICAL_LOCATION", "US");
    public static readonly ConfigurationSource<string> UserAgent = new("YTM_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    public static readonly ConfigurationSource<int> TimeoutSeconds = new("YTM_TIMEOUT", 30, false);
    public static readonly ConfigurationSource<int> MaxRetries = new("YTM_MAX_RETRIES", 3, false);
    public static readonly ConfigurationSource<bool> Debug = new("YTM_DEBUG", false, false);
} 