# UNRAID Deployment Guide

This guide provides detailed instructions for deploying the YouTube Music API Proxy on UNRAID.

## Prerequisites

- UNRAID 6.8.0 or later
- Community Applications plugin installed
- Docker enabled
- Internet connection for downloading the container

## Installation Methods

### Method 1: Community Applications (Recommended)

1. **Install Community Applications** (if not already installed):
   - Go to **Apps** → **Install Community Applications**
   - Follow the installation instructions

2. **Search and Install**:
   - Go to **Apps** → Search for "YouTube Music API Proxy"
   - Click **Install** on the YouTube Music API Proxy template
   - Configure the settings as needed
   - Click **Apply**

### Method 2: Manual Template Installation

1. **Download Template**:
   - Download the `my-Youtube-Music-API-Proxy.xml` file from this repository
   - Place it in `/boot/config/plugins/dockerMan/templates-user/`

2. **Install Container**:
   - Go to **Docker** → **Add Container**
   - Select "YouTube Music API Proxy" from the template dropdown
   - Configure settings and click **Apply**

### Method 3: Docker CLI

If you prefer using the command line:

```bash
# Pull the image
docker pull bluscream/youtube-music-api-proxy:latest

# Run the container
docker run -d \
  --name youtube-music-api-proxy \
  -p 80:80 \
  -p 443:443 \
  -e YTM_GEOGRAPHICAL_LOCATION=US \
  --restart unless-stopped \
  bluscream/youtube-music-api-proxy:latest
```

## Configuration

### Required Settings

- **HTTP Port**: The port for HTTP access (default: 80)
- **HTTPS Port**: The port for HTTPS access (default: 443)
- **Geographical Location**: Your location for YouTube Music (default: US)

### Optional Settings

- **Cookies**: Base64 encoded YouTube cookies for authentication
- **Visitor Data**: Visitor data for session tailoring
- **Proof of Origin Token**: Proof of Origin Token for attestation
- **User Agent**: Custom user agent string
- **Timeout**: Request timeout in seconds (default: 30)
- **Max Retries**: Maximum retry attempts (default: 3)
- **Debug**: Enable debug logging (default: false)

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `YTM_GEOGRAPHICAL_LOCATION` | Geographical location | US | No |
| `YTM_COOKIES` | Base64 encoded cookies | - | No |
| `YTM_VISITORDATA` | Visitor data | - | No |
| `YTM_POTOKEN` | Proof of origin token | - | No |
| `YTM_USER_AGENT` | Custom user agent string | - | No |
| `YTM_TIMEOUT` | Request timeout in seconds | 30 | No |
| `YTM_MAX_RETRIES` | Maximum retry attempts | 3 | No |
| `YTM_DEBUG` | Enable debug logging | false | No |

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

## Authentication Setup

### Getting YouTube Cookies

1. **Log into YouTube Music**:
   - Go to [music.youtube.com](https://music.youtube.com)
   - Sign in with your Google account

2. **Open Developer Tools**:
   - Press `F12` or right-click and select "Inspect"
   - Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)

3. **Find Cookies**:
   - In the left sidebar, expand **Cookies**
   - Click on `https://music.youtube.com`
   - You'll see a list of cookies

4. **Extract Cookie String**:
   ```javascript
   // In the browser console, run:
   document.cookie.split(';').map(c => c.trim()).join('; ')
   ```

5. **Base64 Encode**:
   ```bash
   echo -n "your_cookie_string_here" | base64
   ```

6. **Add to Container**:
   - Set the **Cookies** variable in the container configuration
   - Restart the container

## Troubleshooting

### Common Issues

1. **Port Conflict**:
   - Ensure ports 80 and 443 (or your chosen ports) are not in use
   - Check if other containers are using these ports
   - Change the port mapping if needed

2. **Container Won't Start**:
   - Check the container logs in UNRAID
   - Go to **Docker** → YouTube Music API Proxy → **Logs**
   - Look for error messages

3. **Certificate Issues**:
   - The application creates a self-signed certificate on first start
   - You may need to accept the certificate in your browser
   - For production, replace with a proper SSL certificate

4. **Authentication Errors**:
   - Ensure cookies are properly encoded
   - Check that cookies are not expired
   - Verify the cookie format

### Health Check

1. **Check if the service is running**:
   - Visit `http://[UNRAID-IP]:80/` to verify the service is running
   - Check the container status in UNRAID

2. **View container logs**:
   - Go to the **Docker** tab in UNRAID
   - Click on the YouTube Music API Proxy container
   - Click **Logs** to view container logs

### Debug Mode

For debugging, enable debug logging:

1. **Set Debug Environment Variable**:
   - Set `YTM_DEBUG=true` in the container configuration
   - Restart the container

2. **View Debug Logs**:
   - Check the container logs for detailed debug information

## SSL/TLS Configuration

The application automatically creates a self-signed certificate on first start. For production use, you should replace it with a proper SSL certificate.

### Using Custom Certificate

1. **Prepare your certificate**:
   - Convert your certificate to PFX format
   - Ensure it has the password "dev123" or update the application code

2. **Mount the certificate**:
   - Add a volume mapping to mount your certificate
   - Map `/path/to/your/cert.pfx` to `/app/dev-cert.pfx`

3. **Restart the container**:
   - The application will use your custom certificate

## Performance Tuning

### Resource Limits

You can set resource limits for the container:

1. **Memory Limit**:
   - Set memory limit to 512MB or 1GB depending on your usage

2. **CPU Limit**:
   - Set CPU limit to 0.5 or 1.0 cores

3. **Network Optimization**:
   - Use bridge networking for optimal performance

### Monitoring

1. **Resource Usage**:
   - Monitor CPU and memory usage in UNRAID
   - Check container statistics

2. **Log Monitoring**:
   - Regularly check container logs
   - Set up log rotation if needed

## Security Considerations

1. **Use non-root user**: The container runs as a non-root user by default
2. **Limit resource usage**: Set appropriate memory and CPU limits
3. **Use proper SSL certificates**: Replace self-signed certificates in production
4. **Regular updates**: Keep the Docker image updated
5. **Network isolation**: Use Docker networks to isolate containers

## Support

For issues and questions:

- **GitHub Issues**: [Create an issue](https://github.com/Bluscream/youtube-music-api-proxy/issues)
- **Documentation**: [Read the docs](https://github.com/Bluscream/youtube-music-api-proxy)
- **Examples**: [View examples](https://github.com/Bluscream/youtube-music-api-proxy/blob/main/docs/examples.md)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Bluscream/youtube-music-api-proxy/blob/main/LICENSE) file for details. 