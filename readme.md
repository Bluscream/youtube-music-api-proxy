# YouTube Music API Proxy

A .NET Web API wrapper around the [YouTubeMusicAPI](https://github.com/IcySnex/YouTubeMusicAPI) library, providing RESTful endpoints for accessing YouTube Music data and streaming functionality.

## Features

- **Search**: Search for songs, videos, albums, artists, and more on YouTube Music
- **Song/Video Info**: Get detailed information about songs and videos including streaming URLs
- **Streaming**: Direct audio streaming from YouTube Music
- **Album/Artist Info**: Get detailed information about albums and artists
- **Authentication**: Support for YouTube cookies authentication
- **Session Generation**: Automatic generation of visitor data and proof-of-origin tokens
- **Swagger Documentation**: Interactive API documentation
- **Configuration**: Flexible configuration via environment variables or appsettings

## Configuration

The API supports flexible configuration with the following priority order:
1. **Query Parameters** (highest priority)
2. **AppSettings** (appsettings.json)
3. **Environment Variables** (lowest priority)

### AppSettings Configuration

You can configure the API using `appsettings.json`:

```json
{
    "YouTubeMusic": {
        "GeographicalLocation": "US",
        "Cookies": "your_base64_encoded_cookies_here",
        "VisitorData": "your_visitor_data_here",
        "PoToken": "your_potoken_here",
        "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "ApiKey": "your_api_key_here",
        "TimeoutSeconds": 30,
        "MaxRetries": 3,
        "Debug": false
    }
}
```

### Environment Variables

- `YTM_COOKIES`: Base64 encoded YouTube cookies for authentication
- `YTM_VISITORDATA`: Visitor data for session tailoring
- `YTM_POTOKEN`: Proof of Origin Token for attestation
- `YTM_GEOGRAPHICAL_LOCATION`: Geographical location (defaults to "US")
- `YTM_USER_AGENT`: Custom user agent string
- `YTM_API_KEY`: API key for additional features
- `YTM_TIMEOUT`: Request timeout in seconds (defaults to 30)
- `YTM_MAX_RETRIES`: Maximum retry attempts (defaults to 3)
- `YTM_DEBUG`: Enable debug logging (true/false, defaults to false)

### Query Parameters

- `cookies`: Base64 encoded YouTube cookies (alternative to appsettings/environment variable)
- `location`: Geographical location (alternative to appsettings/environment variable)
- `visitorData`: Visitor data (alternative to appsettings/environment variable)
- `poToken`: Proof of Origin Token (alternative to appsettings/environment variable)
- `apiKey`: API key (alternative to appsettings/environment variable)

## API Endpoints

### Search
```
GET /api/search?query={query}&category={category}&cookies={cookies}&location={location}
```

**Parameters:**
- `query` (required): Search query
- `category` (optional): Search category (Songs, Videos, Albums, Artists, etc.)
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Song/Video Information
```
GET /api/song/{id}?cookies={cookies}&location={location}
```

**Parameters:**
- `id` (required): YouTube video/song ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

**Response:** Includes song/video information plus streaming URLs

### Direct Audio Streaming
```
GET /api/stream/{id}.m4a?cookies={cookies}&location={location}
```

**Parameters:**
- `id` (required): YouTube video/song ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

**Response:** Direct audio stream

### Album Information
```
GET /api/album/{browseId}?cookies={cookies}&location={location}
```

**Parameters:**
- `browseId` (required): Album browse ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Artist Information
```
GET /api/artist/{browseId}?cookies={cookies}&location={location}
```

**Parameters:**
- `browseId` (required): Artist browse ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library (Requires Authentication)
```
GET /api/library?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

**Response:** Complete library including songs, albums, artists, subscriptions, podcasts, and playlists

### Library Songs (Requires Authentication)
```
GET /api/library/songs?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Albums (Requires Authentication)
```
GET /api/library/albums?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Artists (Requires Authentication)
```
GET /api/library/artists?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Subscriptions (Requires Authentication)
```
GET /api/library/subscriptions?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Podcasts (Requires Authentication)
```
GET /api/library/podcasts?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Playlists (Requires Authentication)
```
GET /api/library/playlists?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

## Setup and Running

### Prerequisites

- .NET 9.0 SDK
- Node.js (required for YouTubeSessionGenerator)

### Option 1: Docker (Recommended)

#### Quick Start with Docker Compose

1. Clone the repository
2. Navigate to the `docker` directory
3. Run the application:
   ```bash
   cd docker
   docker-compose up --build
   ```

The API will be available at `http://localhost:8080`.

#### Using Docker Images

```bash
# Pull and run from Docker Hub
docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest

# Or from GitHub Container Registry
docker run -d -p 8080:8080 --name ytm-api ghcr.io/bluscream/youtube-music-api-proxy:latest
```

### Option 2: Local Development

1. Clone the repository
2. Navigate to the project directory
3. Restore dependencies:
   ```bash
   dotnet restore
   ```
4. Run the application:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:5001` (or `http://localhost:5000`).

### Docker Images

The application is available as Docker images:

- **Docker Hub:** `bluscream/youtube-music-api-proxy`
- **GitHub Container Registry:** `ghcr.io/bluscream/youtube-music-api-proxy`

For detailed Docker setup instructions, see the [docker/README.md](docker/README.md) file.

### Swagger Documentation

Once running, visit the root URL to access the interactive Swagger documentation.

## Usage Examples

### Search for Songs
```bash
curl "https://localhost:5001/api/search?query=despacito&category=Songs"
```

### Get Song Information
```bash
curl "https://localhost:5001/api/song/dQw4w9WgXcQ"
```

### Stream Audio
```bash
curl "https://localhost:5001/api/stream/dQw4w9WgXcQ.m4a" -o audio.m4a
```

### With Authentication
```bash
# Base64 encode your YouTube cookies
COOKIES=$(echo "your_cookies_here" | base64)

curl "https://localhost:5001/api/search?query=despacito&cookies=$COOKIES"
```

### Get Library Content
```bash
# Get complete library
curl "https://localhost:5001/api/library?cookies=$COOKIES"

# Get specific library sections
curl "https://localhost:5001/api/library/songs?cookies=$COOKIES"
curl "https://localhost:5001/api/library/albums?cookies=$COOKIES"
curl "https://localhost:5001/api/library/artists?cookies=$COOKIES"
curl "https://localhost:5001/api/library/subscriptions?cookies=$COOKIES"
curl "https://localhost:5001/api/library/podcasts?cookies=$COOKIES"
curl "https://localhost:5001/api/library/playlists?cookies=$COOKIES"
```

## Authentication

For endpoints that require authentication (like accessing premium content or avoiding rate limits), you can provide YouTube cookies:

1. Log into YouTube Music in your browser
2. Extract cookies from your browser's developer tools
3. Base64 encode the cookie string
4. Configure using one of these methods (in order of priority):
   - **Query Parameter**: Pass as the `cookies` parameter in API requests
   - **AppSettings**: Add to `appsettings.json` under `YouTubeMusic.Cookies`
   - **Environment Variable**: Set the `YTM_COOKIES` environment variable

### Example Configuration Methods

**Query Parameter:**
```bash
curl "https://localhost:5001/api/library?cookies=your_base64_encoded_cookies"
```

**AppSettings (appsettings.json):**
```json
{
    "YouTubeMusic": {
        "Cookies": "your_base64_encoded_cookies_here"
    }
}
```

**Environment Variable:**
```bash
export YTM_COOKIES="your_base64_encoded_cookies"
```

## Dependencies

- [YouTubeMusicAPI](https://github.com/IcySnex/YouTubeMusicAPI) - Core YouTube Music API functionality
- [YouTubeSessionGenerator](https://github.com/IcySnex/YouTubeSessionGenerator) - Session generation for authentication
- [Swashbuckle.AspNetCore](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) - Swagger documentation

## License

This project is licensed under the same license as the underlying YouTubeMusicAPI library.