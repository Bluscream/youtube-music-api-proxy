namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service for generating Proof of Origin Tokens (PoTokens) from external servers
/// </summary>
public interface IPoTokenService
{
    /// <summary>
    /// Generates a PoToken using the specified external server
    /// </summary>
    /// <param name="serverUrl">The URL of the PoToken server</param>
    /// <param name="visitorData">Optional visitor data to include in the request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The generated PoToken</returns>
    Task<string> GeneratePoTokenAsync(string serverUrl, string? visitorData = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tests the connection to a PoToken server
    /// </summary>
    /// <param name="serverUrl">The URL of the PoToken server to test</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if the server is reachable and responding</returns>
    Task<bool> TestServerAsync(string serverUrl, CancellationToken cancellationToken = default);
}
