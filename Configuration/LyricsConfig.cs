namespace YoutubeMusicAPIProxy.Configuration;

/// <summary>
/// Configuration settings for lyrics functionality
/// </summary>
public class LyricsConfig
{
    /// <summary>
    /// Whether to add lyrics to song responses (from appsettings, environment variable LYRICS_ADD_TO_SONG_RESPONSE, defaults to true)
    /// </summary>
    public bool AddToSongResponse { get; set; } = true;
}
