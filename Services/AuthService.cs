using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using YouTubeSessionGenerator;
using YouTubeSessionGenerator.Js.Environments;
using YoutubeMusicAPIProxy.Models;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Service for handling YouTube Music authentication including cookies, visitor data, and PoToken generation
/// </summary>
public class AuthService : IAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AuthService> _logger;
    
    // Cache for generated session data to avoid regenerating on every request
    private readonly Dictionary<string, (string VisitorData, string PoToken, DateTime Expiry)> _sessionCache = new();
    private readonly object _sessionCacheLock = new object();

    public AuthService(IHttpClientFactory httpClientFactory, ILogger<AuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Generates visitor data using YouTubeSessionGenerator
    /// </summary>
    public async Task<string> GenerateVisitorDataAsync(string? cookies = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Generating visitor data using YouTubeSessionGenerator");
            
            var httpClient = _httpClientFactory.CreateClient();
            
            // Add cookies to request if provided
            if (!string.IsNullOrEmpty(cookies))
            {
                httpClient.DefaultRequestHeaders.Add("Cookie", cookies);
                _logger.LogDebug("Added cookies to visitor data generation request");
            }

            using var jsEnvironment = new NodeEnvironment();
            var sessionCreator = new YouTubeSessionCreator(new()
            {
                Logger = _logger,
                HttpClient = httpClient,
                JsEnvironment = jsEnvironment
            });

            var visitorData = await sessionCreator.VisitorDataAsync();
            
            if (string.IsNullOrEmpty(visitorData))
            {
                throw new InvalidOperationException("Failed to generate visitor data - result was empty");
            }

            _logger.LogInformation("Successfully generated visitor data: {VisitorDataPrefix}...", 
                visitorData.Substring(0, Math.Min(50, visitorData.Length)));
            
            return visitorData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate visitor data");
            throw new InvalidOperationException($"Failed to generate visitor data: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a PoToken using local YouTubeSessionGenerator
    /// </summary>
    public async Task<string> GeneratePoTokenLocalAsync(string visitorData, string? cookies = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(visitorData))
        {
            throw new ArgumentException("Visitor data is required for PoToken generation", nameof(visitorData));
        }

        try
        {
            _logger.LogInformation("Generating PoToken locally using YouTubeSessionGenerator");
            var httpClient = _httpClientFactory.CreateClient();
            
            if (!string.IsNullOrEmpty(cookies))
            {
                httpClient.DefaultRequestHeaders.Add("Cookie", cookies);
                _logger.LogDebug("Added cookies to local PoToken generation request");
            }

            using var jsEnvironment = new NodeEnvironment();
            var sessionCreator = new YouTubeSessionCreator(new()
            {
                Logger = _logger,
                HttpClient = httpClient,
                JsEnvironment = jsEnvironment
            });

            var localPoToken = await sessionCreator.ProofOfOriginTokenAsync(visitorData);
            
            if (string.IsNullOrEmpty(localPoToken))
            {
                throw new InvalidOperationException("Failed to generate PoToken locally - result was empty");
            }

            _logger.LogInformation("Successfully generated PoToken locally: {PoTokenPrefix}...", 
                localPoToken.Substring(0, Math.Min(50, localPoToken.Length)));
            
            return localPoToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate PoToken locally");
            throw new InvalidOperationException($"Failed to generate PoToken locally: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a PoToken using an external server
    /// </summary>
    public async Task<string> GeneratePoTokenRemoteAsync(string visitorData, string poTokenServer, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(visitorData))
        {
            throw new ArgumentException("Visitor data is required for PoToken generation", nameof(visitorData));
        }

        if (string.IsNullOrEmpty(poTokenServer))
        {
            throw new ArgumentException("PoToken server URL is required for remote generation", nameof(poTokenServer));
        }

        try
        {
            _logger.LogInformation("Using external PoToken server: {PoTokenServer}", poTokenServer);
            var poToken = await GeneratePoTokenFromServerAsync(poTokenServer, visitorData, cancellationToken);
            _logger.LogInformation("Successfully generated PoToken from external server: {PoTokenPrefix}...", 
                poToken.Substring(0, Math.Min(50, poToken.Length)));
            return poToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate PoToken from external server");
            throw new InvalidOperationException($"Failed to generate PoToken from external server: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates a PoToken using either external server or local generation (legacy method)
    /// </summary>
    public async Task<string> GeneratePoTokenAsync(string visitorData, string? poTokenServer = null, string? cookies = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(visitorData))
        {
            throw new ArgumentException("Visitor data is required for PoToken generation", nameof(visitorData));
        }

        try
        {
            // Try external PoToken server first if configured
            if (!string.IsNullOrEmpty(poTokenServer))
            {
                try
                {
                    return await GeneratePoTokenRemoteAsync(visitorData, poTokenServer, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate PoToken from external server, falling back to local generation");
                }
            }

            // Fallback to local generation
            return await GeneratePoTokenLocalAsync(visitorData, cookies, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate PoToken");
            throw new InvalidOperationException($"Failed to generate PoToken: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Generates both visitor data and PoToken in a single operation with caching
    /// </summary>
    public async Task<(string VisitorData, string PoToken)> GenerateSessionDataAsync(string? cookies = null, string? poTokenServer = null, CancellationToken cancellationToken = default)
    {
        // Create a cache key based on the cookies and PoToken server
        var cacheKey = $"cookies:{cookies ?? "none"}|server:{poTokenServer ?? "local"}";
        
        lock (_sessionCacheLock)
        {
            // Check if we have valid cached session data
            if (_sessionCache.TryGetValue(cacheKey, out var cachedData) && cachedData.Expiry > DateTime.UtcNow)
            {
                _logger.LogDebug("Using cached session data");
                return (cachedData.VisitorData, cachedData.PoToken);
            }
            
            // Remove expired entries
            var expiredKeys = _sessionCache.Keys.Where(k => _sessionCache[k].Expiry <= DateTime.UtcNow).ToList();
            foreach (var key in expiredKeys)
            {
                _sessionCache.Remove(key);
            }
        }

        // Generate new session data
        _logger.LogInformation("Generating new session data");
        
        try
        {
            var visitorData = await GenerateVisitorDataAsync(cookies, cancellationToken);
            
            // Generate PoToken using the appropriate method
            string poToken;
            if (!string.IsNullOrEmpty(poTokenServer))
            {
                try
                {
                    poToken = await GeneratePoTokenRemoteAsync(visitorData, poTokenServer, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate PoToken remotely, falling back to local generation");
                    poToken = await GeneratePoTokenLocalAsync(visitorData, cookies, cancellationToken);
                }
            }
            else
            {
                poToken = await GeneratePoTokenLocalAsync(visitorData, cookies, cancellationToken);
            }

            // Cache the session data for 1 hour
            var expiry = DateTime.UtcNow.AddHours(1);
            
            lock (_sessionCacheLock)
            {
                _sessionCache[cacheKey] = (visitorData, poToken, expiry);
            }

            _logger.LogInformation("Successfully generated and cached session data");
            return (visitorData, poToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate session data");
            throw;
        }
    }

    /// <summary>
    /// Validates that the parsed cookies contain the essential YouTube Music authentication cookies
    /// </summary>
    /// <param name="cookies">Collection of parsed cookies to validate</param>
    /// <returns>Validation result with details about missing or invalid cookies</returns>
    public CookieValidationResult ValidateYouTubeCookies(IEnumerable<Cookie> cookies)
    {
        var cookieList = cookies.ToList();
        var result = new CookieValidationResult
        {
            IsValid = true,
            MissingCookies = new List<string>(),
            PresentCookies = new List<string>()
        };

        // Essential YouTube Music authentication cookies
        var essentialCookies = new[]
        {
            "SID",           // Session ID
            "HSID",          // Host Session ID
            "SSID",          // Secure Session ID
            "APISID",        // API Session ID
            "SAPISID",       // Secure API Session ID
            "__Secure-1PSID", // Secure Primary Session ID
            "__Secure-3PSID", // Secure Third Party Session ID
            "LOGIN_INFO",    // Login information
            "SIDCC",         // Session ID Cookie Consent
            "__Secure-1PSIDCC", // Secure Primary Session ID Cookie Consent
            "__Secure-3PSIDCC"  // Secure Third Party Session ID Cookie Consent
        };

        // Check for presence of essential cookies
        foreach (var essentialCookie in essentialCookies)
        {
            var foundCookie = cookieList.FirstOrDefault(c => string.Equals(c.Name, essentialCookie, StringComparison.OrdinalIgnoreCase));
            
            if (foundCookie != null)
            {
                result.PresentCookies.Add(essentialCookie);
                
                // Additional validation for specific cookies
                if (essentialCookie == "LOGIN_INFO" && string.IsNullOrEmpty(foundCookie.Value))
                {
                    result.IsValid = false;
                    result.MissingCookies.Add($"{essentialCookie} (empty value)");
                }
                else if (essentialCookie.StartsWith("__Secure-") && !foundCookie.Secure)
                {
                    result.IsValid = false;
                    result.MissingCookies.Add($"{essentialCookie} (not secure)");
                }
            }
            else
            {
                result.IsValid = false;
                result.MissingCookies.Add(essentialCookie);
            }
        }

        // Additional validation for cookie values
        var sidCookie = cookieList.FirstOrDefault(c => string.Equals(c.Name, "SID", StringComparison.OrdinalIgnoreCase));
        if (sidCookie != null && (string.IsNullOrEmpty(sidCookie.Value) || sidCookie.Value.Length < 10))
        {
            result.IsValid = false;
            result.MissingCookies.Add("SID (invalid value)");
        }

        var loginInfoCookie = cookieList.FirstOrDefault(c => string.Equals(c.Name, "LOGIN_INFO", StringComparison.OrdinalIgnoreCase));
        if (loginInfoCookie != null && (string.IsNullOrEmpty(loginInfoCookie.Value) || !loginInfoCookie.Value.Contains(":")))
        {
            result.IsValid = false;
            result.MissingCookies.Add("LOGIN_INFO (invalid format)");
        }

        _logger.LogDebug("Cookie validation result: Valid={IsValid}, Present={PresentCount}, Missing={MissingCount}", 
            result.IsValid, result.PresentCookies.Count, result.MissingCookies.Count);

        return result;
    }

    /// <summary>
    /// Parses cookie string into Cookie collection with validation
    /// </summary>
    public IEnumerable<Cookie> ParseCookies(string cookieString)
    {
        if (string.IsNullOrWhiteSpace(cookieString))
        {
            _logger.LogWarning("Empty or null cookie string provided");
            return Enumerable.Empty<Cookie>();
        }

        try
        {
            var cookies = new List<Cookie>();
            var cookiePairs = cookieString.Split(';', StringSplitOptions.RemoveEmptyEntries);

            foreach (var pair in cookiePairs)
            {
                var trimmedPair = pair.Trim();
                var separatorIndex = trimmedPair.IndexOf('=');
                
                if (separatorIndex > 0)
                {
                    var name = trimmedPair.Substring(0, separatorIndex).Trim();
                    var value = trimmedPair.Substring(separatorIndex + 1).Trim();
                    
                    if (!string.IsNullOrEmpty(name))
                    {
                        var cookie = new Cookie(name, value);
                        
                        // Set secure flag for cookies that should be secure
                        if (name.StartsWith("__Secure-", StringComparison.OrdinalIgnoreCase))
                        {
                            cookie.Secure = true;
                        }
                        
                        cookies.Add(cookie);
                    }
                }
            }

            _logger.LogDebug("Successfully parsed {CookieCount} cookies", cookies.Count);

            // Validate the parsed cookies
            var validationResult = ValidateYouTubeCookies(cookies);
            
            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Cookie validation failed. Missing cookies: {MissingCookies}", 
                    string.Join(", ", validationResult.MissingCookies));
                
                if (validationResult.MissingCookies.Any(c => !c.Contains("(empty value)") && !c.Contains("(invalid") && !c.Contains("(not secure)")))
                {
                    _logger.LogError("Critical YouTube Music authentication cookies are missing. This may cause authentication failures.");
                }
            }
            else
            {
                _logger.LogInformation("Cookie validation passed. All essential YouTube Music cookies are present.");
            }

            return cookies;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse cookies: {CookieString}", cookieString);
            return Enumerable.Empty<Cookie>();
        }
    }

    /// <summary>
    /// Tests the connection to a PoToken server
    /// </summary>
    public async Task<bool> TestPoTokenServerAsync(string serverUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Testing PoToken server connection: {ServerUrl}", serverUrl);

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10); // Short timeout for testing

            // Send a simple test request
            var testPayload = new { content_binding = "test", context = "gvs" };
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

    /// <summary>
    /// Gets the current authentication status and generated tokens for debugging
    /// </summary>
    public async Task<AuthStatus> GetAuthStatusAsync(string? cookies = null, string? poTokenServer = null, CancellationToken cancellationToken = default)
    {
        var status = new AuthStatus
        {
            CookiesConfigured = !string.IsNullOrEmpty(cookies),
            PoTokenServerConfigured = !string.IsNullOrEmpty(poTokenServer),
            LastGenerated = DateTime.UtcNow
        };

        try
        {
            // Validate cookies if provided
            if (!string.IsNullOrEmpty(cookies))
            {
                var parsedCookies = ParseCookies(cookies);
                var cookieValidation = ValidateYouTubeCookies(parsedCookies);
                status.CookieValidationResult = cookieValidation;
                status.CookiesValid = cookieValidation.IsValid;
            }

            // Test PoToken server if configured
            if (!string.IsNullOrEmpty(poTokenServer))
            {
                status.PoTokenServerReachable = await TestPoTokenServerAsync(poTokenServer, cancellationToken);
            }

            // Generate visitor data for debugging
            var visitorData = await GenerateVisitorDataAsync(cookies, cancellationToken);
            status.VisitorData = TruncateForDebug(visitorData);
            status.ContentBinding = TruncateForDebug(visitorData); // Content binding is typically the visitor data

            // Generate PoToken using the appropriate method
            string poToken;
            if (!string.IsNullOrEmpty(poTokenServer) && status.PoTokenServerReachable)
            {
                try
                {
                    poToken = await GeneratePoTokenRemoteAsync(visitorData, poTokenServer, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate PoToken remotely, falling back to local generation");
                    poToken = await GeneratePoTokenLocalAsync(visitorData, cookies, cancellationToken);
                }
            }
            else
            {
                poToken = await GeneratePoTokenLocalAsync(visitorData, cookies, cancellationToken);
            }
            
            status.PoToken = TruncateForDebug(poToken);
        }
        catch (Exception ex)
        {
            status.ErrorMessage = ex.Message;
            _logger.LogWarning(ex, "Error while getting auth status");
        }

        return status;
    }

    /// <summary>
    /// Generates a PoToken using the specified external server
    /// </summary>
    private async Task<string> GeneratePoTokenFromServerAsync(string serverUrl, string visitorData, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Generating PoToken from server: {ServerUrl}", serverUrl);

            var httpClient = _httpClientFactory.CreateClient();
            
            // Prepare the request payload
            var requestPayload = new
            {
                content_binding = visitorData,
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
    /// Truncates sensitive data for debugging output
    /// </summary>
    private static string? TruncateForDebug(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        
        return value.Length > 50 ? $"{value.Substring(0, 50)}..." : value;
    }
}
