using System.Text.Json.Serialization;

namespace YoutubeMusicAPIProxy.Models;

/// <summary>
/// Lyrics data from SimpMusic Lyrics API
/// </summary>
public class LyricsData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("videoId")]
    public string VideoId { get; set; } = string.Empty;

    [JsonPropertyName("songTitle")]
    public string SongTitle { get; set; } = string.Empty;

    [JsonPropertyName("artistName")]
    public string ArtistName { get; set; } = string.Empty;

    [JsonPropertyName("albumName")]
    public string AlbumName { get; set; } = string.Empty;

    [JsonPropertyName("durationSeconds")]
    public int DurationSeconds { get; set; }

    [JsonPropertyName("plainLyric")]
    public string PlainLyric { get; set; } = string.Empty;

    [JsonPropertyName("syncedLyrics")]
    public string SyncedLyrics { get; set; } = string.Empty;

    [JsonPropertyName("richSyncLyrics")]
    public string RichSyncLyrics { get; set; } = string.Empty;

    [JsonPropertyName("vote")]
    public int Vote { get; set; }

    [JsonPropertyName("contributor")]
    public string Contributor { get; set; } = string.Empty;

    [JsonPropertyName("contributorEmail")]
    public string ContributorEmail { get; set; } = string.Empty;
}

/// <summary>
/// Success response from SimpMusic Lyrics API
/// </summary>
public class LyricsSuccessResponse
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public List<LyricsData> Data { get; set; } = new();

    [JsonPropertyName("success")]
    public bool Success { get; set; }
}

/// <summary>
/// Error response from SimpMusic Lyrics API
/// </summary>
public class LyricsErrorResponse
{
    [JsonPropertyName("error")]
    public bool Error { get; set; }

    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("timeout")]
    public TimeSpan? Timeout { get; set; }

    [JsonPropertyName("videoId")]
    public string? VideoId { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }
}

/// <summary>
/// Processing response from SimpMusic Lyrics API
/// </summary>
public class LyricsProcessingResponse
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Wrapper for all possible lyrics API responses
/// </summary>
public class LyricsApiResponse
{
    [JsonPropertyName("data")]
    public List<LyricsData>? Data { get; set; }

    [JsonPropertyName("error")]
    public LyricsErrorResponse? Error { get; set; }

    [JsonPropertyName("processing")]
    public LyricsProcessingResponse? Processing { get; set; }

    [JsonPropertyName("success")]
    public bool Success { get; set; }
}
