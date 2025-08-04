# Docker Setup for YouTube Music API Proxy

This directory contains all Docker-related files for building, running, and publishing the YouTube Music API Proxy.

## Quick Start

### Using Docker Compose (Recommended)

1. **Development mode:**
   ```bash
   cd docker
   docker-compose up --build
   ```

2. **Production mode:**
   ```bash
   cd docker
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

### Using PowerShell Scripts

1. **Build the image:**
   ```powershell
   cd docker
   .\build.ps1
   ```

2. **Run the container:**
   ```powershell
   .\run.ps1
   ```

3. **Publish to registries:**
   ```powershell
   .\publish.ps1
   ```

## Files Overview

- **`Dockerfile`** - Multi-stage Docker build for the .NET 9.0 application
- **`.dockerignore`** - Excludes unnecessary files from Docker build context
- **`docker-compose.yml`** - Development environment with volume mounts and debugging
- **`docker-compose.prod.yml`** - Production environment with resource limits
- **`build.ps1`** - PowerShell script to build Docker image locally
- **`run.ps1`** - PowerShell script to run container locally
- **`publish.ps1`** - PowerShell script to publish to Docker Hub and GitHub CR

## Docker Images

The application will be published to:

- **Docker Hub:** `bluscream/youtube-music-api-proxy`
- **GitHub Container Registry:** `ghcr.io/bluscream/youtube-music-api-proxy`

## Environment Variables

### Required
- `ASPNETCORE_URLS` - Set to `http://+:8080` in container
- `ASPNETCORE_ENVIRONMENT` - Set to `Production` in container

### Optional
- `YTM_COOKIES` - Base64 encoded YouTube cookies for authentication
- `YTM_VISITORDATA` - Visitor data for session tailoring
- `YTM_POTOKEN` - Proof of Origin Token for attestation
- `YTM_GEOGRAPHICAL_LOCATION` - Geographical location (defaults to "US")

## Usage Examples

### Pull and Run from Registry

```bash
# From Docker Hub
docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest

# From GitHub Container Registry
docker run -d -p 8080:8080 --name ytm-api ghcr.io/bluscream/youtube-music-api-proxy:latest
```

### With Environment Variables

```bash
docker run -d -p 8080:8080 \
  -e YTM_COOKIES="your_base64_cookies" \
  -e YTM_GEOGRAPHICAL_LOCATION="US" \
  --name ytm-api \
  bluscream/youtube-music-api-proxy:latest
```

### Using Docker Compose with Custom Config

```yaml
version: '3.8'
services:
  youtube-music-api-proxy:
    image: bluscream/youtube-music-api-proxy:latest
    ports:
      - "8080:8080"
    environment:
      - YTM_COOKIES=your_base64_cookies_here
      - YTM_GEOGRAPHICAL_LOCATION=US
    restart: unless-stopped
```

## Health Checks

The container includes a health check that verifies the API is responding:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' container_name
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Change the port mapping
   docker run -p 8081:8080 bluscream/youtube-music-api-proxy:latest
   ```

2. **Authentication issues:**
   - Ensure YouTube cookies are properly base64 encoded
   - Check that cookies are not expired

3. **Node.js dependency issues:**
   - The Dockerfile includes Node.js installation for YouTubeSessionGenerator
   - If you encounter issues, try rebuilding with `--no-cache`

### Logs and Debugging

```bash
# View container logs
docker logs container_name

# Follow logs in real-time
docker logs -f container_name

# Execute commands in running container
docker exec -it container_name /bin/bash
```

## Publishing to Registries

### Prerequisites

1. **Docker Hub:**
   ```bash
   docker login
   ```

2. **GitHub Container Registry:**
   ```bash
   docker login ghcr.io
   ```

### Publishing

```powershell
# Publish to both registries
.\publish.ps1

# Publish to specific registry
.\publish.ps1 -DockerHub
.\publish.ps1 -GitHub

# Publish with specific tag
.\publish.ps1 -Tag "v1.0.0"
```

## Security Considerations

- The container runs as a non-root user (`appuser`)
- Health checks are enabled to monitor container status
- Resource limits can be set in production deployments
- Environment variables should be properly secured in production

## Performance Optimization

- Multi-stage build reduces final image size
- Alpine-based runtime image for smaller footprint
- Layer caching optimized for faster rebuilds
- Production compose file includes resource limits 