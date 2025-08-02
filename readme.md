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

The API supports the following configuration variables:

### Environment Variables

- `YTM_COOKIES`: Base64 encoded YouTube cookies for authentication
- `YTM_VISITORDATA`: Visitor data for session tailoring
- `YTM_POTOKEN`: Proof of Origin Token for attestation
- `YTM_GEOGRAPHICAL_LOCATION`: Geographical location (defaults to "US")

### Query Parameters

- `cookies`: Base64 encoded YouTube cookies (alternative to environment variable)
- `location`: Geographical location (alternative to environment variable)

## API Endpoints

### Search
```
GET /api/youtubemusic/search?query={query}&category={category}&cookies={cookies}&location={location}
```

**Parameters:**
- `query` (required): Search query
- `category` (optional): Search category (Songs, Videos, Albums, Artists, etc.)
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Song/Video Information
```
GET /api/youtubemusic/song/{id}?cookies={cookies}&location={location}
```

**Parameters:**
- `id` (required): YouTube video/song ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

**Response:** Includes song/video information plus streaming URLs

### Direct Audio Streaming
```
GET /api/youtubemusic/stream/{id}.m4a?cookies={cookies}&location={location}
```

**Parameters:**
- `id` (required): YouTube video/song ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

**Response:** Direct audio stream

### Album Information
```
GET /api/youtubemusic/album/{browseId}?cookies={cookies}&location={location}
```

**Parameters:**
- `browseId` (required): Album browse ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Artist Information
```
GET /api/youtubemusic/artist/{browseId}?cookies={cookies}&location={location}
```

**Parameters:**
- `browseId` (required): Artist browse ID
- `cookies` (optional): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library (Requires Authentication)
```
GET /api/youtubemusic/library?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

**Response:** Complete library including songs, albums, artists, subscriptions, podcasts, and playlists

### Library Songs (Requires Authentication)
```
GET /api/youtubemusic/library/songs?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Albums (Requires Authentication)
```
GET /api/youtubemusic/library/albums?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Artists (Requires Authentication)
```
GET /api/youtubemusic/library/artists?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Subscriptions (Requires Authentication)
```
GET /api/youtubemusic/library/subscriptions?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Podcasts (Requires Authentication)
```
GET /api/youtubemusic/library/podcasts?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

### Library Playlists (Requires Authentication)
```
GET /api/youtubemusic/library/playlists?cookies={cookies}&location={location}
```

**Parameters:**
- `cookies` (required): Base64 encoded YouTube cookies
- `location` (optional): Geographical location

## Setup and Running

### Prerequisites

- .NET 8.0 SDK
- Node.js (required for YouTubeSessionGenerator)

### Installation

1. Clone the repository
2. Navigate to the `YoutubeMusicAPIProxy` directory
3. Restore dependencies:
   ```bash
   dotnet restore
   ```
4. Run the application:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:5001` (or `http://localhost:5000`).

### Swagger Documentation

Once running, visit the root URL to access the interactive Swagger documentation.

## Usage Examples

### Search for Songs
```bash
curl "https://localhost:5001/api/youtubemusic/search?query=despacito&category=Songs"
```

### Get Song Information
```bash
curl "https://localhost:5001/api/youtubemusic/song/dQw4w9WgXcQ"
```

### Stream Audio
```bash
curl "https://localhost:5001/api/youtubemusic/stream/dQw4w9WgXcQ.m4a" -o audio.m4a
```

### With Authentication
```bash
# Base64 encode your YouTube cookies
COOKIES=$(echo "your_cookies_here" | base64)

curl "https://localhost:5001/api/youtubemusic/search?query=despacito&cookies=$COOKIES"
```

### Get Library Content
```bash
# Get complete library
curl "https://localhost:5001/api/youtubemusic/library?cookies=$COOKIES"

# Get specific library sections
curl "https://localhost:5001/api/youtubemusic/library/songs?cookies=$COOKIES"
curl "https://localhost:5001/api/youtubemusic/library/albums?cookies=$COOKIES"
curl "https://localhost:5001/api/youtubemusic/library/artists?cookies=$COOKIES"
curl "https://localhost:5001/api/youtubemusic/library/subscriptions?cookies=$COOKIES"
curl "https://localhost:5001/api/youtubemusic/library/podcasts?cookies=$COOKIES"
curl "https://localhost:5001/api/youtubemusic/library/playlists?cookies=$COOKIES"
```

## Authentication

For endpoints that require authentication (like accessing premium content or avoiding rate limits), you can provide YouTube cookies:

1. Log into YouTube Music in your browser
2. Extract cookies from your browser's developer tools
3. Base64 encode the cookie string
4. Pass as the `cookies` parameter or set the `YTM_COOKIES` environment variable

## Dependencies

- [YouTubeMusicAPI](https://github.com/IcySnex/YouTubeMusicAPI) - Core YouTube Music API functionality
- [YouTubeSessionGenerator](https://github.com/IcySnex/YouTubeSessionGenerator) - Session generation for authentication
- [Swashbuckle.AspNetCore](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) - Swagger documentation

## License

This project is licensed under the same license as the underlying YouTubeMusicAPI library.