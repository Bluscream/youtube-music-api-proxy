using YouTubeMusicAPI.Models.Info;
using YouTubeMusicAPI.Models.Streaming;

namespace YoutubeMusicAPIProxy.Models;

/// <summary>
/// Extended song/video information response including streaming URLs and lyrics
/// </summary>
public class SongVideoInfoResponse : SongVideoInfo
{
    /// <summary>
    /// Streaming data including URLs for audio/video streams
    /// </summary>
    public StreamingData? StreamingData { get; set; }

    /// <summary>
    /// Lyrics data if available
    /// </summary>
    public LyricsData? Lyrics { get; set; }

    /// <summary>
    /// Lyrics error information if lyrics request failed
    /// </summary>
    public LyricsErrorResponse? LyricsError { get; set; }

    /// <summary>
    /// Constructor for SongVideoInfoResponse
    /// </summary>
    public SongVideoInfoResponse(
        SongVideoInfo songVideoInfo,
        StreamingData? streamingData = null,
        LyricsData? lyrics = null,
        LyricsErrorResponse? lyricsError = null) 
        : base(
            songVideoInfo.Name,
            songVideoInfo.Id,
            songVideoInfo.BrowseId,
            songVideoInfo.Description,
            songVideoInfo.Artists,
            songVideoInfo.Album,
            songVideoInfo.Duration,
            songVideoInfo.Radio,
            songVideoInfo.PlayabilityStatus,
            songVideoInfo.IsRatingsAllowed,
            songVideoInfo.IsPrivate,
            songVideoInfo.IsUnlisted,
            songVideoInfo.IsLiveContent,
            songVideoInfo.IsFamiliyFriendly,
            songVideoInfo.IsExplicit,
            songVideoInfo.ViewsCount,
            songVideoInfo.PublishedAt,
            songVideoInfo.UploadedAt,
            songVideoInfo.PlaybackTracking,
            songVideoInfo.Thumbnails,
            songVideoInfo.Tags)
    {
        StreamingData = streamingData;
        Lyrics = lyrics;
        LyricsError = lyricsError;
    }
} 