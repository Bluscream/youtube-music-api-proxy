# Getting Started

Welcome to the YouTube Music API Proxy! This guide will help you get up and running quickly.

## 🚀 Quick Setup

### Prerequisites

- **.NET 8.0 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js** (for YouTubeSessionGenerator) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bluscream/youtube-music-api-proxy.git
   cd youtube-music-api-proxy
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Run the application**
   ```bash
   dotnet run
   ```

The API will be available at:
- **HTTPS**: `https://localhost:5001`
- **HTTP**: `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

You can configure the API using environment variables:

```bash
# Set environment variables
export YTM_COOKIES="your_base64_encoded_cookies"
export YTM_GEOGRAPHICAL_LOCATION="US"
export YTM_VISITORDATA="your_visitor_data"
export YTM_POTOKEN="your_proof_of_origin_token"
```

### Configuration File

Alternatively, you can use `appsettings.json`:

```json
{
  "YouTubeMusic": {
    "Cookies": "your_base64_encoded_cookies",
    "GeographicalLocation": "US",
    "VisitorData": "your_visitor_data",
    "ProofOfOriginToken": "your_proof_of_origin_token"
  }
}
```

## 🔐 Authentication Setup

### Getting YouTube Cookies

1. **Log into YouTube Music**
   - Go to [music.youtube.com](https://music.youtube.com)
   - Sign in with your Google account

2. **Open Developer Tools**
   - Press `F12` or right-click and select "Inspect"
   - Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)

3. **Find Cookies**
   - In the left sidebar, expand **Cookies**
   - Click on `https://music.youtube.com`
   - You'll see a list of cookies

4. **Extract Cookie String**
   ```javascript
   // In the browser console, run:
   document.cookie.split(';').map(c => c.trim()).join('; ')
   ```

5. **Base64 Encode**
   ```bash
   echo "your_cookie_string_here" | base64
   ```

### Using Cookies

```bash
# Set as environment variable
export YTM_COOKIES="eyJjb29raWVzIjoi..."

# Or pass as query parameter
curl "https://localhost:5001/api/search?query=despacito&cookies=eyJjb29raWVzIjoi..."
```

## 📖 Your First API Call

### Test the API

1. **Check if the API is running**
   ```bash
   curl "https://localhost:5001/api/search?query=test"
   ```

2. **Search for a song**
   ```bash
   curl "https://localhost:5001/api/search?query=despacito&category=Songs"
   ```

3. **Get song information**
   ```bash
   curl "https://localhost:5001/api/song/dQw4w9WgXcQ"
   ```

### Interactive Documentation

Once the API is running, visit the root URL to access **Swagger documentation**:
- **Swagger UI**: `https://localhost:5001/swagger`
- **OpenAPI JSON**: `https://localhost:5001/swagger/v1/swagger.json`

## 🛠️ Development

### Project Structure

```
YoutubeMusicAPIProxy/
├── Controllers/          # API controllers
│   └── YouTubeMusicController.cs
├── Models/              # Response models
│   ├── ApiResponse.cs
│   └── SongVideoInfoResponse.cs
├── Services/            # Business logic
│   ├── IYouTubeMusicService.cs
│   └── YouTubeMusicService.cs
├── Configuration/       # Configuration classes
│   └── YouTubeMusicConfig.cs
├── Program.cs           # Application entry point
└── appsettings.json     # Configuration file
```

### Building

```bash
# Build the project
dotnet build

# Build for release
dotnet build --configuration Release

# Publish for deployment
dotnet publish --configuration Release --output ./publish
```

### Running in Different Environments

```bash
# Development
dotnet run --environment Development

# Production
dotnet run --environment Production

# Custom environment
dotnet run --environment Staging
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :5001
   
   # Kill the process or change the port in launchSettings.json
   ```

2. **SSL Certificate issues**
   ```bash
   # Trust the development certificate
   dotnet dev-certs https --trust
   ```

3. **Missing dependencies**
   ```bash
   # Clean and restore
   dotnet clean
   dotnet restore
   ```

4. **Authentication errors**
   - Make sure cookies are properly Base64 encoded
   - Check if cookies are still valid (they expire)
   - Try logging out and back into YouTube Music

### Logs

Enable detailed logging by setting the log level in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "YoutubeMusicAPIProxy": "Debug"
    }
  }
}
```

## 📚 Next Steps

- Read the [API Reference](index.md) for detailed endpoint documentation
- Check out [Examples](examples.md) for common use cases
- Explore [Authentication](authentication.md) for advanced setup
- Learn about [Error Handling](error-handling.md) for robust applications

## 🆘 Need Help?

- **GitHub Issues**: [Create an issue](https://github.com/Bluscream/youtube-music-api-proxy/issues)
- **Documentation**: Check the [API Reference](index.md)
- **Examples**: See [Usage Examples](examples.md) 