# YouTube Music API Proxy for UNRAID

This template allows you to easily deploy the YouTube Music API Proxy on your UNRAID server using Community Applications.

## Features

- 🎵 **YouTube Music Integration** - Access YouTube Music data through RESTful API
- 🔍 **Search Functionality** - Search for songs, videos, albums, and playlists
- 📱 **Video Information** - Get detailed video metadata and streaming URLs
- 🐳 **Docker Container** - Lightweight and efficient deployment
- 🔧 **Configurable** - Customizable geographical location and authentication
- 📊 **Health Monitoring** - Built-in health checks and logging

## Installation

### Method 1: Community Applications (Recommended)

1. **Install Community Applications** (if not already installed)
   - Go to Apps → Install Community Applications
   - Follow the installation instructions

2. **Search and Install**
   - Go to Apps → Search for "YouTube Music API Proxy"
   - Click "Install" on the YouTube Music API Proxy template
   - Configure the settings as needed
   - Click "Apply"

### Method 2: Manual Template Installation

1. **Download Template**
   - Download the `template.xml` file from this repository
   - Place it in `/boot/config/plugins/dockerMan/templates-user/`

2. **Install Container**
   - Go to Docker → Add Container
   - Select "YouTube Music API Proxy" from the template dropdown
   - Configure settings and click "Apply"

## Configuration

### Required Settings

- **WebUI Port**: The port for accessing the web interface (default: 8080)
- **Geographical Location**: Your location for YouTube Music (e.g., US, UK, DE)

### Optional Settings

- **YouTube Cookies**: Base64 encoded cookies for authentication
- **Visitor Data**: Session tailoring data
- **Proof of Origin Token**: Attestation token
- **AppData Config**: Configuration directory path
- **Logs**: Log directory path

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `YTM_GEOGRAPHICAL_LOCATION` | Geographical location | US | No |
| `YTM_COOKIES` | Base64 encoded cookies | - | No |
| `YTM_VISITORDATA` | Visitor data | - | No |
| `YTM_POTOKEN` | Proof of origin token | - | No |

## Usage

### Web Interface

Once installed, access the web interface at:
```
http://[UNRAID-IP]:[PORT]/swagger
```

### API Endpoints

- **Search**: `GET /api/search?query=despacito`
- **Video Info**: `GET /api/video/{videoId}`
- **Health Check**: `GET /`

### Example API Calls

```bash
# Search for a song
curl "http://[UNRAID-IP]:8080/api/search?query=despacito"

# Get video information
curl "http://[UNRAID-IP]:8080/api/video/L9OTnZI9gYo"

# Health check
curl "http://[UNRAID-IP]:8080/"
```

## Troubleshooting

### Container Won't Start

1. **Check Logs**: Go to Docker → YouTube Music API Proxy → Logs
2. **Port Conflict**: Ensure port 8080 (or your chosen port) is not in use
3. **Permissions**: Check that the appdata directory has proper permissions

### API Not Responding

1. **Health Check**: Visit `http://[UNRAID-IP]:8080/` to verify the service is running
2. **Network**: Ensure the container has network access
3. **Configuration**: Verify environment variables are set correctly

### Authentication Issues

1. **Cookies**: Ensure YouTube cookies are properly base64 encoded
2. **Location**: Set the correct geographical location
3. **Session**: Some features may require valid YouTube Music session

## Support

- **GitHub**: https://github.com/Bluscream/youtube-music-api-proxy-1
- **Issues**: https://github.com/Bluscream/youtube-music-api-proxy-1/issues
- **Documentation**: https://github.com/Bluscream/youtube-music-api-proxy-1/blob/main/readme.md

## Version Information

- **Container**: bluscream1/youtube-music-api-proxy-1:latest
- **Framework**: .NET 9.0
- **Base Image**: mcr.microsoft.com/dotnet/aspnet:9.0
- **Architecture**: Linux (amd64, arm64)

## License

This project is open source. See the main repository for license information. 