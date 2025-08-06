using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service interface for lyrics API operations
/// </summary>
public interface ILyricsService
{
    /// <summary>
    /// Get lyrics for a video ID with timeout
    /// </summary>
    /// <param name="videoId">YouTube video ID</param>
    /// <param name="timeout">Timeout duration (default: 1 second)</param>
    /// <returns>Lyrics data or null if timeout/error</returns>
    Task<LyricsData?> GetLyricsAsync(string videoId, TimeSpan timeout = default);
}
