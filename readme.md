# YouTube Music API Proxy

A .NET API wrapper around YouTubeMusicAPI for accessing YouTube Music data and streaming functionality.

## Features

- 🔍 **Search**: Search for songs, videos, albums, artists, and playlists
- 🎵 **Streaming**: Direct audio streaming from YouTube Music
- 📚 **Library Access**: Access your personal music library (with authentication)
- 🔐 **Authentication**: Support for YouTube cookies authentication
- 🐳 **Docker Support**: Ready-to-use Docker containers
- 📖 **API Documentation**: Built-in Swagger/OpenAPI documentation
- 🔒 **HTTPS Support**: Self-signed certificate generation on first start

## Quick Start

### Using Docker (Recommended)

```bash
# Pull and run the latest version
docker run -d -p 80:80 -p 443:443 --name ytm-api bluscream/youtube-music-api-proxy:latest

# Access the API
curl "http://localhost:80/api/search?query=despacito"
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/Bluscream/youtube-music-api-proxy.git
cd youtube-music-api-proxy

# Build and run
dotnet build
dotnet run

# Access the API
curl "https://localhost:443/api/search?query=despacito"
```

## API Endpoints

### Search
```bash
# Search for songs
curl "https://localhost:443/api/search?query=despacito&category=Songs"

# Search for videos
curl "https://localhost:443/api/search?query=despacito&category=Videos"
```

### Get Song Information
```bash
curl "https://localhost:443/api/song/dQw4w9WgXcQ"
```

### Stream Audio
```bash
curl "https://localhost:443/api/stream/dQw4w9WgXcQ" -o audio.m4a
```

### Library Access (requires authentication)
```bash
curl "https://localhost:443/api/library?cookies=$COOKIES"
curl "https://localhost:443/api/library/songs?cookies=$COOKIES"
curl "https://localhost:443/api/library/albums?cookies=$COOKIES"
curl "https://localhost:443/api/library/artists?cookies=$COOKIES"
curl "https://localhost:443/api/library/subscriptions?cookies=$COOKIES"
curl "https://localhost:443/api/library/podcasts?cookies=$COOKIES"
curl "https://localhost:443/api/library/playlists?cookies=$COOKIES"
```

## Configuration

### Environment Variables

```bash
# Set geographical location
export YTM_GEOGRAPHICAL_LOCATION=US

# Set cookies for authentication
export YTM_COOKIES=your_base64_encoded_cookies_here

# Set visitor data
export YTM_VISITORDATA=your_visitor_data_here

# Set proof of origin token
export YTM_POTOKEN=your_proof_of_origin_token_here
```

### Configuration File

```json
{
  "YouTubeMusic": {
    "GeographicalLocation": "US",
    "Cookies": null,
    "VisitorData": null,
    "PoToken": null,
    "UserAgent": null,
    "TimeoutSeconds": 30,
    "MaxRetries": 3,
    "Debug": false
  }
}
```

## Docker Deployment

### Using Docker Compose

```bash
# Development
cd docker
docker-compose up -d

# Production
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

### Using Docker Run

```bash
# Basic run
docker run -d -p 80:80 -p 443:443 --name ytm-api bluscream/youtube-music-api-proxy:latest

# With custom configuration
docker run -d -p 80:80 -p 443:443 \
  -e YTM_GEOGRAPHICAL_LOCATION=US \
  -e YTM_COOKIES=your_cookies_here \
  --name ytm-api bluscream/youtube-music-api-proxy:latest
```

## Authentication

Most endpoints support optional authentication via YouTube cookies:

1. **Get your YouTube cookies:**
   - Open YouTube Music in your browser
   - Open Developer Tools (F12)
   - Go to Application/Storage > Cookies
   - Copy the cookie values

2. **Encode cookies:**
   ```bash
   echo -n "your_cookies_here" | base64
   ```

3. **Use in API calls:**
   ```bash
   curl "https://localhost:443/api/library?cookies=your_base64_encoded_cookies"
   ```

## API Documentation

Once the API is running, you can access:

- **Swagger UI**: `https://localhost:443/swagger`
- **OpenAPI JSON**: `https://localhost:443/swagger/v1/swagger.json`

## Development

### Prerequisites

- .NET 9.0 SDK or later
- Node.js (for YouTubeSessionGenerator)
- Git

### Building

```bash
# Build the project
dotnet build

# Build for release
dotnet build --configuration Release

# Publish for deployment
dotnet publish --configuration Release --output ./publish
```

### Running

```bash
# Development
dotnet run

# Production
dotnet run --environment Production

# Custom environment
dotnet run --environment Staging
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :443
   
   # Kill the process
   taskkill /PID <process_id> /F
   ```

2. **Certificate issues:**
   - The application creates a self-signed certificate on first start
   - You may need to accept the certificate in your browser
   - For production, replace with a proper SSL certificate

3. **Authentication errors:**
   - Ensure cookies are properly encoded
   - Check that cookies are not expired
   - Verify the cookie format

### Logs

```bash
# Docker logs
docker logs ytm-api

# Application logs
tail -f logs/app.log
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **GitHub Issues**: [Create an issue](https://github.com/Bluscream/youtube-music-api-proxy/issues)
- **Documentation**: [Read the docs](https://github.com/Bluscream/youtube-music-api-proxy)
- **Examples**: [View examples](docs/examples.md)

## Acknowledgments

- [YouTubeMusicAPI](https://github.com/kuylar/YouTubeMusicAPI) - The underlying library
- [.NET](https://dotnet.microsoft.com/) - The framework
- [Docker](https://www.docker.com/) - Containerization platform