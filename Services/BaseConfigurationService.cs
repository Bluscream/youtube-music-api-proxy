using YoutubeMusicAPIProxy.Configuration;

namespace YoutubeMusicAPIProxy.Services;

/// <summary>
/// Base configuration service that provides common functionality for getting configuration values
/// </summary>
public abstract class BaseConfigurationService
{
    protected readonly YouTubeMusicConfig _config;

    protected BaseConfigurationService(YouTubeMusicConfig config)
    {
        _config = config;
    }

    /// <summary>
    /// Gets a string configuration value with priority: query parameter > appsettings > environment variable > default
    /// </summary>
    /// <param name="queryValue">Value from query parameter</param>
    /// <param name="configValue">Value from appsettings</param>
    /// <param name="source">Configuration source metadata</param>
    /// <param name="print">Whether to print debug information</param>
    /// <returns>Configuration value</returns>
    protected string? GetStringValue(string? queryValue, string? configValue, ConfigurationSource<string?> source, bool print = false)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryValue))
        {
            if (print) Console.WriteLine($"Query parameter {source.EnvironmentVariableName}: {queryValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(queryValue) ?? queryValue : queryValue;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(configValue))
        {
            if (print) Console.WriteLine($"Appsettings {source.EnvironmentVariableName}: {configValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(configValue) ?? configValue : configValue;
        }

        // Priority 3: Environment variable
        var envValue = Environment.GetEnvironmentVariable(source.EnvironmentVariableName);
        if (!string.IsNullOrWhiteSpace(envValue))
        {
            if (print) Console.WriteLine($"Environment variable {source.EnvironmentVariableName}: {envValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(envValue) ?? envValue : envValue;
        }

        return source.DefaultValue;
    }

    /// <summary>
    /// Gets a string configuration value with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="configValue">Value from appsettings</param>
    /// <param name="source">Configuration source metadata</param>
    /// <param name="print">Whether to print debug information</param>
    /// <returns>Configuration value</returns>
    protected string GetStringValue(string? configValue, ConfigurationSource<string> source, bool print = false)
    {
        // Priority 1: Appsettings
        if (!string.IsNullOrWhiteSpace(configValue))
        {
            if (print) Console.WriteLine($"Appsettings {source.EnvironmentVariableName}: {configValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(configValue) ?? configValue : configValue;
        }

        // Priority 2: Environment variable
        var envValue = Environment.GetEnvironmentVariable(source.EnvironmentVariableName);
        if (!string.IsNullOrWhiteSpace(envValue))
        {
            if (print) Console.WriteLine($"Environment variable {source.EnvironmentVariableName}: {envValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(envValue) ?? envValue : envValue;
        }

        return source.DefaultValue;
    }

    /// <summary>
    /// Gets a nullable string configuration value with priority: query parameter > appsettings > environment variable > default
    /// </summary>
    /// <param name="queryValue">Value from query parameter</param>
    /// <param name="configValue">Value from appsettings</param>
    /// <param name="source">Configuration source metadata</param>
    /// <param name="print">Whether to print debug information</param>
    /// <returns>Configuration value</returns>
    protected string? GetStringValueNullable(string? queryValue, string? configValue, ConfigurationSource<string?> source, bool print = false)
    {
        // Priority 1: Query parameter
        if (!string.IsNullOrWhiteSpace(queryValue))
        {
            if (print) Console.WriteLine($"Query parameter {source.EnvironmentVariableName}: {queryValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(queryValue) ?? queryValue : queryValue;
        }

        // Priority 2: Appsettings
        if (!string.IsNullOrWhiteSpace(configValue))
        {
            if (print) Console.WriteLine($"Appsettings {source.EnvironmentVariableName}: {configValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(configValue) ?? configValue : configValue;
        }

        // Priority 3: Environment variable
        var envValue = Environment.GetEnvironmentVariable(source.EnvironmentVariableName);
        if (!string.IsNullOrWhiteSpace(envValue))
        {
            if (print) Console.WriteLine($"Environment variable {source.EnvironmentVariableName}: {envValue}");
            return source.SupportsBase64Decoding ? TryDecodeBase64(envValue) ?? envValue : envValue;
        }

        return source.DefaultValue;
    }

    /// <summary>
    /// Gets an integer configuration value with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="configValue">Value from appsettings</param>
    /// <param name="source">Configuration source metadata</param>
    /// <param name="print">Whether to print debug information</param>
    /// <returns>Configuration value</returns>
    protected int GetIntValue(int configValue, ConfigurationSource<int> source, bool print = false)
    {
        // Priority 1: Appsettings
        if (configValue > 0)
        {
            if (print) Console.WriteLine($"Appsettings {source.EnvironmentVariableName}: {configValue}");
            return configValue;
        }

        // Priority 2: Environment variable
        var envValue = Environment.GetEnvironmentVariable(source.EnvironmentVariableName);
        if (int.TryParse(envValue, out var envInt) && envInt > 0)
        {
            if (print) Console.WriteLine($"Environment variable {source.EnvironmentVariableName}: {envInt}");
            return envInt;
        }

        if (print) Console.WriteLine($"Using default {source.EnvironmentVariableName}: {source.DefaultValue}");
        return source.DefaultValue;
    }

    /// <summary>
    /// Gets a boolean configuration value with priority: appsettings > environment variable > default
    /// </summary>
    /// <param name="configValue">Value from appsettings</param>
    /// <param name="source">Configuration source metadata</param>
    /// <param name="print">Whether to print debug information</param>
    /// <returns>Configuration value</returns>
    protected bool GetBoolValue(bool configValue, ConfigurationSource<bool> source, bool print = false)
    {
        // Priority 1: Appsettings
        if (configValue)
        {
            if (print) Console.WriteLine($"Appsettings {source.EnvironmentVariableName}: {configValue}");
            return true;
        }

        // Priority 2: Environment variable
        var envValue = Environment.GetEnvironmentVariable(source.EnvironmentVariableName);
        if (!string.IsNullOrWhiteSpace(envValue))
        {
            if (bool.TryParse(envValue, out var envBool) && envBool)
            {
                if (print) Console.WriteLine($"Environment variable {source.EnvironmentVariableName}: {envBool}");
                return true;
            }
        }

        if (print) Console.WriteLine($"Using default {source.EnvironmentVariableName}: {source.DefaultValue}");
        return source.DefaultValue;
    }

    /// <summary>
    /// Tries to decode a string as base64 and returns the decoded value if successful, otherwise returns null
    /// </summary>
    /// <param name="value">The string to try decoding</param>
    /// <returns>Decoded string if successful, null if not valid base64</returns>
    private static string? TryDecodeBase64(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        try
        {
            // Check if the string looks like base64 (contains only valid base64 characters)
            if (value.All(c => char.IsLetterOrDigit(c) || c == '+' || c == '/' || c == '='))
            {
                // Try to decode as base64
                var bytes = Convert.FromBase64String(value);
                return System.Text.Encoding.UTF8.GetString(bytes);
            }
        }
        catch (FormatException)
        {
            // Not valid base64, return null to use original value
        }

        return null;
    }
} 