using System.Net;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service for handling YouTube Music authentication including cookies, visitor data, and PoToken generation
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Generates visitor data using YouTubeSessionGenerator
    /// </summary>
    /// <param name="cookies">Optional cookies to use for generation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The generated visitor data</returns>
    Task<string> GenerateVisitorDataAsync(string? cookies = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a PoToken using local YouTubeSessionGenerator
    /// </summary>
    /// <param name="visitorData">Visitor data to use for PoToken generation</param>
    /// <param name="cookies">Optional cookies to use for generation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The generated PoToken</returns>
    Task<string> GeneratePoTokenLocalAsync(string visitorData, string? cookies = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a PoToken using an external server
    /// </summary>
    /// <param name="visitorData">Visitor data to use for PoToken generation</param>
    /// <param name="poTokenServer">External PoToken server URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The generated PoToken</returns>
    Task<string> GeneratePoTokenRemoteAsync(string visitorData, string poTokenServer, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a PoToken using either external server or local generation (legacy method)
    /// </summary>
    /// <param name="visitorData">Visitor data to use for PoToken generation</param>
    /// <param name="poTokenServer">Optional external PoToken server URL</param>
    /// <param name="cookies">Optional cookies to use for generation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The generated PoToken</returns>
    Task<string> GeneratePoTokenAsync(string visitorData, string? poTokenServer = null, string? cookies = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates both visitor data and PoToken in a single operation
    /// </summary>
    /// <param name="cookies">Optional cookies to use for generation</param>
    /// <param name="poTokenServer">Optional external PoToken server URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Tuple containing visitor data and PoToken</returns>
    Task<(string VisitorData, string PoToken)> GenerateSessionDataAsync(string? cookies = null, string? poTokenServer = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates that the parsed cookies contain the essential YouTube Music authentication cookies
    /// </summary>
    /// <param name="cookies">Collection of parsed cookies to validate</param>
    /// <returns>Validation result with details about missing or invalid cookies</returns>
    CookieValidationResult ValidateYouTubeCookies(IEnumerable<Cookie> cookies);

    /// <summary>
    /// Parses cookie string into Cookie collection
    /// </summary>
    /// <param name="cookieString">Cookie string to parse</param>
    /// <returns>Collection of parsed cookies</returns>
    IEnumerable<Cookie> ParseCookies(string cookieString);

    /// <summary>
    /// Tests the connection to a PoToken server
    /// </summary>
    /// <param name="serverUrl">The URL of the PoToken server to test</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if the server is reachable and responding</returns>
    Task<bool> TestPoTokenServerAsync(string serverUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current authentication status and generated tokens for debugging
    /// </summary>
    /// <param name="cookies">Optional cookies to use for generation</param>
    /// <param name="poTokenServer">Optional external PoToken server URL</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Authentication status information</returns>
    Task<AuthStatus> GetAuthStatusAsync(string? cookies = null, string? poTokenServer = null, CancellationToken cancellationToken = default);
}

/// <summary>
/// Authentication status information for debugging
/// </summary>
public class AuthStatus
{
    /// <summary>
    /// Whether cookies are configured
    /// </summary>
    public bool CookiesConfigured { get; set; }

    /// <summary>
    /// Whether PoToken server is configured
    /// </summary>
    public bool PoTokenServerConfigured { get; set; }

    /// <summary>
    /// Whether PoToken server is reachable
    /// </summary>
    public bool PoTokenServerReachable { get; set; }

    /// <summary>
    /// Whether cookies are valid for YouTube Music authentication
    /// </summary>
    public bool CookiesValid { get; set; }

    /// <summary>
    /// Detailed cookie validation result
    /// </summary>
    public CookieValidationResult? CookieValidationResult { get; set; }

    /// <summary>
    /// Generated visitor data (truncated for security)
    /// </summary>
    public string? VisitorData { get; set; }

    /// <summary>
    /// Generated PoToken (truncated for security)
    /// </summary>
    public string? PoToken { get; set; }

    /// <summary>
    /// Content binding used for PoToken generation
    /// </summary>
    public string? ContentBinding { get; set; }

    /// <summary>
    /// Last generation timestamp
    /// </summary>
    public DateTime? LastGenerated { get; set; }

    /// <summary>
    /// Any error messages from generation
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// When the token expires (ISO 8601 format, from external server)
    /// </summary>
    public string? ExpiresAt { get; set; }
}

/// <summary>
/// Result of cookie validation for YouTube Music authentication
/// </summary>
public class CookieValidationResult
{
    /// <summary>
    /// Whether the cookies are valid for YouTube Music authentication
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// List of missing or invalid cookies
    /// </summary>
    public List<string> MissingCookies { get; set; } = new();

    /// <summary>
    /// List of present and valid cookies
    /// </summary>
    public List<string> PresentCookies { get; set; } = new();

    /// <summary>
    /// Summary message about the validation result
    /// </summary>
    public string Summary => IsValid 
        ? $"All essential cookies present ({PresentCookies.Count} cookies validated)"
        : $"Missing {MissingCookies.Count} essential cookies: {string.Join(", ", MissingCookies)}";
}
