using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service interface for lyrics API operations
/// </summary>
public interface ILyricsService
{
    /// <summary>
    /// Get lyrics for a video ID with timeout using the default HTTP client
    /// </summary>
    /// <param name="videoId">YouTube video ID</param>
    /// <param name="timeout">Timeout duration (default: 1 second)</param>
    /// <returns>Raw lyrics API response or null if timeout/client error</returns>
    Task<LyricsApiResponse?> GetLyricsAsync(string videoId, TimeSpan timeout = default);

    /// <summary>
    /// Get lyrics for a video ID with timeout using a cached HTTP client
    /// </summary>
    /// <param name="videoId">YouTube video ID</param>
    /// <param name="timeout">Timeout duration (default: 1 second)</param>
    /// <param name="cookies">Optional cookies for the request</param>
    /// <returns>Raw lyrics API response or null if timeout/client error</returns>
    Task<LyricsApiResponse?> GetLyricsWithCachedClientAsync(string videoId, TimeSpan timeout = default, string? cookies = null);
}
