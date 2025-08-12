using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Implementation of PoToken service for external PoToken generation
/// </summary>
public class PoTokenService : IPoTokenService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PoTokenService> _logger;

    public PoTokenService(IHttpClientFactory httpClientFactory, ILogger<PoTokenService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Generates a PoToken using the specified external server
    /// </summary>
    public async Task<string> GeneratePoTokenAsync(string serverUrl, string? visitorData = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Generating PoToken from server: {ServerUrl}", serverUrl);

            var httpClient = _httpClientFactory.CreateClient();
            
            // Prepare the request payload
            var requestPayload = new
            {
                visitor_data = visitorData ?? string.Empty,
                context = "gvs" // Default context for YouTube Music
            };

            var jsonContent = JsonSerializer.Serialize(requestPayload);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Send POST request to the PoToken server
            var response = await httpClient.PostAsync(serverUrl, content, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("PoToken server returned error status {StatusCode}: {ErrorContent}", 
                    response.StatusCode, errorContent);
                throw new HttpRequestException($"PoToken server returned error status {response.StatusCode}: {errorContent}");
            }

            // Parse the response
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogDebug("PoToken server response: {ResponseContent}", responseContent);

            // Try to parse as JSON first
            try
            {
                // First try to deserialize as our expected PoTokenResponse model
                var poTokenResponse = JsonSerializer.Deserialize<PoTokenResponse>(responseContent);
                if (poTokenResponse?.PoToken != null)
                {
                    _logger.LogDebug("Successfully generated PoToken from server using PoTokenResponse model");
                    return poTokenResponse.PoToken;
                }

                // Fallback: Try to parse as generic JSON
                var jsonResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                // Check if the response has a 'poToken' field (actual server response format)
                if (jsonResponse.TryGetProperty("poToken", out var poTokenElement))
                {
                    var token = poTokenElement.GetString();
                    if (!string.IsNullOrEmpty(token))
                    {
                        _logger.LogDebug("Successfully generated PoToken from server");
                        return token;
                    }
                }
                
                // Fallback: Check if the response has a 'token' field (alternative format)
                if (jsonResponse.TryGetProperty("token", out var tokenElement))
                {
                    var token = tokenElement.GetString();
                    if (!string.IsNullOrEmpty(token))
                    {
                        _logger.LogDebug("Successfully generated PoToken from server (token field)");
                        return token;
                    }
                }
                
                // If no token fields found, try to get the root value as string
                if (jsonResponse.ValueKind == JsonValueKind.String)
                {
                    var token = jsonResponse.GetString();
                    if (!string.IsNullOrEmpty(token))
                    {
                        _logger.LogDebug("Successfully generated PoToken from server (string response)");
                        return token;
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogDebug(ex, "Failed to parse PoToken response as JSON, treating as plain text");
            }

            // If JSON parsing failed or no token found, treat the entire response as the token
            if (!string.IsNullOrWhiteSpace(responseContent))
            {
                _logger.LogDebug("Using response content as PoToken");
                return responseContent.Trim();
            }

            throw new InvalidOperationException("PoToken server returned empty or invalid response");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while generating PoToken from server: {ServerUrl}", serverUrl);
            throw new InvalidOperationException($"Failed to connect to PoToken server at {serverUrl}: {ex.Message}", ex);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout while generating PoToken from server: {ServerUrl}", serverUrl);
            throw new InvalidOperationException($"Timeout while connecting to PoToken server at {serverUrl}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while generating PoToken from server: {ServerUrl}", serverUrl);
            throw new InvalidOperationException($"Unexpected error while generating PoToken from server: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Tests the connection to a PoToken server
    /// </summary>
    public async Task<bool> TestServerAsync(string serverUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Testing PoToken server connection: {ServerUrl}", serverUrl);

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10); // Short timeout for testing

            // Send a simple test request
            var testPayload = new { visitor_data = "test", context = "gvs" };
            var jsonContent = JsonSerializer.Serialize(testPayload);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(serverUrl, content, cancellationToken);
            
            var isSuccess = response.IsSuccessStatusCode;
            _logger.LogDebug("PoToken server test result: {IsSuccess} (Status: {StatusCode})", isSuccess, response.StatusCode);
            
            return isSuccess;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "PoToken server test failed: {ServerUrl}", serverUrl);
            return false;
        }
    }
}
