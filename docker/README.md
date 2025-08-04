# Docker Setup for YouTube Music API Proxy

This directory contains all Docker-related files for building, running, and publishing the YouTube Music API Proxy.

## Available Versions

### Release Version (Production)
- **Tag**: `latest` or `latest-debug`
- **Environment**: Production optimized
- **Size**: ~641MB
- **Use case**: Production deployments

### Debug Version (Development)
- **Tag**: `latest-debug`
- **Environment**: Development with debugging tools
- **Size**: ~707MB (includes debugging tools)
- **Use case**: Development, debugging, troubleshooting

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

1. **Build both versions:**
   ```powershell
   cd docker
   .\build-and-publish-versions.ps1
   ```

2. **Run containers manually:**
   ```powershell
   # Release version
   docker run -d -p 8080:8080 --name ytm-api bluscream1/youtube-music-api-proxy:latest
   
   # Debug version
   docker run -d -p 8080:8080 --name ytm-api-debug bluscream1/youtube-music-api-proxy:latest-debug
   ```

3. **Publish to registries:**
   ```powershell
   .\build-and-publish-versions.ps1
   ```

## Files Overview

- **`Dockerfile`** - Multi-stage Docker build for Release version
- **`Dockerfile.debug`** - Multi-stage Docker build for Debug version with debugging tools
- **`.dockerignore`** - Excludes unnecessary files from Docker build context
- **`docker-compose.yml`** - Development environment setup
- **`docker-compose.prod.yml`** - Production environment with resource limits
- **`build-and-publish-versions.ps1`** - PowerShell script for building and publishing both versions
- **`README.md`** - This comprehensive guide

## Image Registries

### Docker Hub
- **Release**: `bluscream1/youtube-music-api-proxy:latest`
- **Debug**: `bluscream1/youtube-music-api-proxy:latest-debug`

### GitHub Container Registry
- **Release**: `ghcr.io/bluscream/youtube-music-api-proxy:latest`
- **Debug**: `ghcr.io/bluscream/youtube-music-api-proxy:latest-debug`

## Usage Examples

### Pull and Run Release Version
```bash
# From Docker Hub
docker run -d -p 8080:8080 --name ytm-api bluscream1/youtube-music-api-proxy:latest

# From GitHub Container Registry
docker run -d -p 8080:8080 --name ytm-api ghcr.io/bluscream/youtube-music-api-proxy:latest
```

### Pull and Run Debug Version
```bash
# From Docker Hub
docker run -d -p 8080:8080 --name ytm-api-debug bluscream1/youtube-music-api-proxy:latest-debug

# From GitHub Container Registry
docker run -d -p 8080:8080 --name ytm-api-debug ghcr.io/bluscream/youtube-music-api-proxy:latest-debug
```

### Using Docker Compose
```bash
# Development (uses debug version)
docker-compose up

# Production (uses release version)
docker-compose -f docker-compose.prod.yml up -d
```

## Version Differences

| Feature | Release | Debug |
|---------|---------|-------|
| Build Configuration | Release | Debug |
| Environment | Production | Development |
| Debug Symbols | No | Yes |
| Debugging Tools | No | Yes (procps, lsof, net-tools, vim) |
| File Watching | No | Yes |
| Container Size | ~641MB | ~707MB |
| Performance | Optimized | Development-friendly |

## Environment Variables

Both versions support the same environment variables:

- `ASPNETCORE_ENVIRONMENT`: Set automatically based on build configuration
- `YTM_GEOGRAPHICAL_LOCATION`: Geographic location for YouTube Music
- `YTM_COOKIES`: Base64 encoded cookies (optional)
- `YTM_VISITORDATA`: Visitor data (optional)
- `YTM_POTOKEN`: Proof of origin token (optional)

## Health Checks

Both versions include health checks that verify the API is responding:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' <container_name>
```

## Troubleshooting

### Debug Version Features
The debug version includes additional tools for troubleshooting:

```bash
# Access debug container shell
docker exec -it <container_name> /bin/bash

# Check processes
ps aux

# Check network connections
netstat -tulpn

# Check open files
lsof

# Edit files (vim included)
vim /app/appsettings.json
```

### Common Issues

1. **Port already in use**: Change the port mapping
   ```bash
   docker run -d -p 8081:8080 --name ytm-api bluscream1/youtube-music-api-proxy:latest
   ```

2. **Permission issues**: The container runs as non-root user `appuser`

3. **Memory issues**: Use the production compose file with resource limits

## Building Locally

### Build Release Version
```bash
docker build -t youtube-music-api-proxy:latest -f docker/Dockerfile .
```

### Build Debug Version
```bash
docker build -t youtube-music-api-proxy:debug -f docker/Dockerfile.debug .
```

### Build Both Versions
```powershell
.\docker\build-and-publish-versions.ps1 -SkipPush
```

## Publishing

### To Docker Hub
```bash
docker push bluscream1/youtube-music-api-proxy:latest
docker push bluscream1/youtube-music-api-proxy:latest-debug
```

### To GitHub Container Registry
```bash
docker push ghcr.io/bluscream/youtube-music-api-proxy:latest
docker push ghcr.io/bluscream/youtube-music-api-proxy:latest-debug
```

### Automated Publishing
```powershell
.\docker\build-and-publish-versions.ps1
```

## Manual Publishing Guide

### Prerequisites
1. **GitHub Personal Access Token** with `write:packages` permission
2. **Docker Hub account** (optional, for Docker Hub publishing)

### Publishing Steps
```bash
# 1. Login to GitHub Container Registry
docker login ghcr.io
# Username: your GitHub username
# Password: your GitHub Personal Access Token

# 2. Build and tag images
docker build -t ghcr.io/bluscream/youtube-music-api-proxy:latest -f docker/Dockerfile .
docker build -t ghcr.io/bluscream/youtube-music-api-proxy:latest-debug -f docker/Dockerfile.debug .

# 3. Push to GitHub Container Registry
docker push ghcr.io/bluscream/youtube-music-api-proxy:latest
docker push ghcr.io/bluscream/youtube-music-api-proxy:latest-debug
```

## Support

For issues and questions:
- Check the [main README](../readme.md)
- Review the comprehensive usage examples above 