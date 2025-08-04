# YouTube Music API Proxy - UNRAID Template

This is the UNRAID template for the YouTube Music API Proxy, a .NET API wrapper around YouTubeMusicAPI for accessing YouTube Music data and streaming functionality.

## Features

- 🔍 **Search**: Search for songs, videos, albums, artists, and playlists
- 🎵 **Streaming**: Direct audio streaming from YouTube Music
- 📚 **Library Access**: Access your personal music library (with authentication)
- 🔐 **Authentication**: Support for YouTube cookies authentication
- 📖 **API Documentation**: Built-in Swagger/OpenAPI documentation
- 🔒 **HTTPS Support**: Self-signed certificate generation on first start

## Installation

1. **Add the template to UNRAID:**
   - Go to the **Apps** tab in UNRAID
   - Click **Add Another App**
   - Select **My Apps** tab
   - Search for "YouTube Music API Proxy"
   - Click **Install**

2. **Configure the container:**
   - **HTTP Port**: The port for HTTP access (default: 80)
   - **HTTPS Port**: The port for HTTPS access (default: 443)
   - **Geographical Location**: Your location for YouTube Music (default: US)
   - **Cookies**: Base64 encoded YouTube cookies for authentication (optional)
   - **Visitor Data**: Visitor data for session tailoring (optional)
   - **Proof of Origin Token**: Proof of Origin Token for attestation (optional)
   - **User Agent**: Custom user agent string (optional)
   - **Timeout**: Request timeout in seconds (default: 30)
   - **Max Retries**: Maximum retry attempts (default: 3)
   - **Debug**: Enable debug logging (default: false)

3. **Start the container:**
   - Click **Apply** to start the container

## Usage

### Access the API

Once the container is running, you can access the API at:

- **HTTP**: `http://[UNRAID-IP]:80/`
- **HTTPS**: `https://[UNRAID-IP]:443/`

### API Endpoints

#### Search
```bash
# Search for songs
curl "http://[UNRAID-IP]:80/api/search?query=despacito&category=Songs"

# Search for videos
curl "http://[UNRAID-IP]:80/api/search?query=despacito&category=Videos"
```

#### Get Song Information
```bash
curl "http://[UNRAID-IP]:80/api/song/dQw4w9WgXcQ"
```

#### Stream Audio
```bash
curl "http://[UNRAID-IP]:80/api/stream/dQw4w9WgXcQ" -o audio.m4a
```

#### Library Access (requires authentication)
```bash
curl "http://[UNRAID-IP]:80/api/library?cookies=$COOKIES"
curl "http://[UNRAID-IP]:80/api/library/songs?cookies=$COOKIES"
curl "http://[UNRAID-IP]:80/api/library/albums?cookies=$COOKIES"
curl "http://[UNRAID-IP]:80/api/library/artists?cookies=$COOKIES"
curl "http://[UNRAID-IP]:80/api/library/subscriptions?cookies=$COOKIES"
curl "http://[UNRAID-IP]:80/api/library/podcasts?cookies=$COOKIES"
curl "http://[UNRAID-IP]:80/api/library/playlists?cookies=$COOKIES"
```

### API Documentation

Once the container is running, you can access:

- **Swagger UI**: `http://[UNRAID-IP]:80/swagger`
- **OpenAPI JSON**: `http://[UNRAID-IP]:80/swagger/v1/swagger.json`

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

3. **Add to container configuration:**
   - Set the **Cookies** variable in the container configuration
   - Restart the container

## Troubleshooting

### Common Issues

1. **Port Conflict**: Ensure ports 80 and 443 (or your chosen ports) are not in use
2. **Container won't start**: Check the container logs in UNRAID
3. **Certificate issues**: The application creates a self-signed certificate on first start
4. **Authentication errors**: Ensure cookies are properly encoded and not expired

### Health Check

1. **Check if the service is running:**
   - Visit `http://[UNRAID-IP]:80/` to verify the service is running
   - Check the container status in UNRAID

2. **View container logs:**
   - Go to the **Docker** tab in UNRAID
   - Click on the YouTube Music API Proxy container
   - Click **Logs** to view container logs

## Configuration

### Environment Variables

The container supports the following environment variables:

- `YTM_GEOGRAPHICAL_LOCATION`: Geographical location for YouTube Music
- `YTM_COOKIES`: Base64 encoded YouTube cookies for authentication
- `YTM_VISITORDATA`: Visitor data for session tailoring
- `YTM_POTOKEN`: Proof of Origin Token for attestation
- `YTM_USER_AGENT`: Custom user agent string
- `YTM_TIMEOUT`: Request timeout in seconds
- `YTM_MAX_RETRIES`: Maximum retry attempts
- `YTM_DEBUG`: Enable debug logging

### SSL/TLS

The application automatically creates a self-signed certificate on first start. For production use, you should replace it with a proper SSL certificate.

## Support

For issues and questions:

- **GitHub Issues**: [Create an issue](https://github.com/Bluscream/youtube-music-api-proxy/issues)
- **Documentation**: [Read the docs](https://github.com/Bluscream/youtube-music-api-proxy)
- **Examples**: [View examples](https://github.com/Bluscream/youtube-music-api-proxy/blob/main/docs/examples.md)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Bluscream/youtube-music-api-proxy/blob/main/LICENSE) file for details. 