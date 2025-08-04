# Linux Usage Guide

Quick reference for running YouTube Music API Proxy on Linux devices.

## Prerequisites

- Docker installed on your Linux system
- Port 8080 available

## Quick Start

### From Docker Hub
```bash
# Pull and run
docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest

# Check if it's running
docker ps

# View logs
docker logs ytm-api

# Test the API
curl http://localhost:8080/
```

### From GitHub Container Registry
```bash
# Pull and run
docker run -d -p 8080:8080 --name ytm-api ghcr.io/bluscream/youtube-music-api-proxy:latest

# Check if it's running
docker ps

# View logs
docker logs ytm-api

# Test the API
curl http://localhost:8080/
```

## Usage Examples

### Search for songs
```bash
curl "http://localhost:8080/api/search?query=despacito"
```

### Get song information
```bash
curl "http://localhost:8080/api/song/dQw4w9WgXcQ"
```

### Stream audio
```bash
curl "http://localhost:8080/api/stream/dQw4w9WgXcQ.m4a" -o audio.m4a
```

## Management Commands

```bash
# Stop the container
docker stop ytm-api

# Start the container
docker start ytm-api

# Restart the container
docker restart ytm-api

# Remove the container
docker rm ytm-api

# Update to latest version
docker stop ytm-api
docker rm ytm-api
docker pull bluscream/youtube-music-api-proxy:latest
docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest
```

## Environment Variables

You can customize the behavior with environment variables:

```bash
docker run -d -p 8080:8080 \
  -e YTM_GEOGRAPHICAL_LOCATION="US" \
  --name ytm-api \
  bluscream/youtube-music-api-proxy:latest
```

## Docker Compose (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  youtube-music-api-proxy:
    image: bluscream/youtube-music-api-proxy:latest
    ports:
      - "8080:8080"
    environment:
      - YTM_GEOGRAPHICAL_LOCATION=US
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

## Troubleshooting

### Port already in use
```bash
# Use a different port
docker run -d -p 8081:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest
```

### Container won't start
```bash
# Check logs
docker logs ytm-api

# Check if port is available
netstat -tulpn | grep :8080
```

### Permission denied
```bash
# Run with sudo if needed
sudo docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest
```

## API Endpoints

- **Swagger UI**: http://localhost:8080/
- **Search**: GET /api/search?query={query}
- **Song Info**: GET /api/song/{id}
- **Stream**: GET /api/stream/{id}.m4a
- **Album**: GET /api/album/{browseId}
- **Artist**: GET /api/artist/{browseId}
- **Library**: GET /api/library (requires cookies)

## Health Check

The container includes a health check. Monitor it with:

```bash
docker ps
# Look for "healthy" status

# Or check health directly
docker inspect --format='{{.State.Health.Status}}' ytm-api
``` 