using System.Text.Json.Serialization;

namespace YoutubeMusicAPIProxy.Models;

/// <summary>
/// Response model for PoToken server
/// </summary>
public class PoTokenResponse
{
    /// <summary>
    /// Content binding data
    /// </summary>
    [JsonPropertyName("contentBinding")]
    public string? ContentBinding { get; set; }

    /// <summary>
    /// The generated Proof of Origin Token
    /// </summary>
    [JsonPropertyName("poToken")]
    public string? PoToken { get; set; }

    /// <summary>
    /// When the token expires (ISO 8601 format)
    /// </summary>
    [JsonPropertyName("expiresAt")]
    public string? ExpiresAt { get; set; }
}
