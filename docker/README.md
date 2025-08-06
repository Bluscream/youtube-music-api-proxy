# Docker Deployment Guide

This guide covers deploying the YouTube Music API Proxy using Docker.

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Bluscream/youtube-music-api-proxy.git
cd youtube-music-api-proxy/docker

# Start the application
docker-compose up -d

# Access the API
curl "http://localhost:80/api/search?query=despacito"
```

### Using Docker Run

```bash
# Pull and run the latest version
docker run -d -p 80:80 -p 443:443 --name ytm-api bluscream/youtube-music-api-proxy:latest

# Access the API
curl "http://localhost:80/api/search?query=despacito"
```

## Docker Images

The application is available as Docker images from multiple registries:

### Docker Hub
```bash
# Latest version
docker pull bluscream/youtube-music-api-proxy:latest

# Specific version
docker pull bluscream/youtube-music-api-proxy:v1.0.0

# Debug version (with additional tools)
docker pull bluscream/youtube-music-api-proxy:latest-debug
```

### GitHub Container Registry
```bash
# Latest version
docker pull ghcr.io/bluscream/youtube-music-api-proxy:latest

# Specific version
docker pull ghcr.io/bluscream/youtube-music-api-proxy:v1.0.0

# Debug version
docker pull ghcr.io/bluscream/youtube-music-api-proxy:latest-debug
```

## Configuration

### Environment Variables

You can configure the application using environment variables:

```bash
docker run -d -p 80:80 -p 443:443 \
  -e YTM_GEOGRAPHICAL_LOCATION=US \
  -e YTM_COOKIES=your_base64_encoded_cookies_here \
  -e YTM_VISITORDATA=your_visitor_data_here \
  -e YTM_POTOKEN=your_proof_of_origin_token_here \
  --name ytm-api bluscream/youtube-music-api-proxy:latest
```

### Using Docker Compose

Create a `docker-compose.override.yml` file for custom configuration:

```yaml
version: '3.8'

services:
  youtube-music-api-proxy:
    environment:
      - YTM_GEOGRAPHICAL_LOCATION=US
      - YTM_COOKIES=your_base64_encoded_cookies_here
      - YTM_VISITORDATA=your_visitor_data_here
      - YTM_POTOKEN=your_proof_of_origin_token_here
    volumes:
      - ./logs:/app/logs
      - ./certs:/app/certs
```

## Production Deployment

### Using Production Docker Compose

```bash
# Start production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production deployment
docker-compose -f docker-compose.prod.yml down
```

### Using Docker Run (Production)

```bash
# Production deployment with resource limits
docker run -d \
  --name ytm-api-prod \
  -p 80:80 \
  -p 443:443 \
  --restart unless-stopped \
  --memory=512m \
  --cpus=0.5 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e YTM_GEOGRAPHICAL_LOCATION=US \
  bluscream/youtube-music-api-proxy:latest
```

## SSL/TLS Configuration

The application automatically creates a self-signed certificate on first start. For production, you should replace it with a proper SSL certificate:

### Using Custom Certificate

```bash
# Mount your certificate
docker run -d -p 80:80 -p 443:443 \
  -v /path/to/your/cert.pfx:/app/dev-cert.pfx \
  --name ytm-api bluscream/youtube-music-api-proxy:latest
```

### Using Docker Compose with Custom Certificate

```yaml
version: '3.8'

services:
  youtube-music-api-proxy:
    volumes:
      - ./certs/cert.pfx:/app/dev-cert.pfx:ro
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
```

## Health Checks

The application includes built-in health checks:

```bash
# Check container health
docker ps

# View health check logs
docker logs ytm-api

# Manual health check
curl -f http://localhost:80/ || echo "Health check failed"
```

## Logging

### View Logs

```bash
# View container logs
docker logs ytm-api

# Follow logs in real-time
docker logs -f ytm-api

# View logs with timestamps
docker logs -t ytm-api
```

### Mount Log Directory

```bash
# Mount logs directory
docker run -d -p 80:80 -p 443:443 \
  -v ./logs:/app/logs \
  --name ytm-api bluscream/youtube-music-api-proxy:latest
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :80
   netstat -ano | findstr :443
   
   # Kill the process
   taskkill /PID <process_id> /F
   ```

2. **Container won't start:**
   ```bash
   # Check container logs
   docker logs ytm-api
   
   # Check container status
   docker ps -a
   ```

3. **Certificate issues:**
   ```bash
   # Remove existing certificate
   docker exec ytm-api rm -f /app/dev-cert.pfx
   
   # Restart container to regenerate
   docker restart ytm-api
   ```

### Debug Mode

For debugging, use the debug version of the image:

```bash
# Run debug version
docker run -d -p 80:80 -p 443:443 \
  --name ytm-api-debug bluscream/youtube-music-api-proxy:latest-debug

# Access debug tools
docker exec -it ytm-api-debug bash
```

## Performance Tuning

### Resource Limits

```bash
# Set memory and CPU limits
docker run -d -p 80:80 -p 443:443 \
  --memory=1g \
  --cpus=1.0 \
  --name ytm-api bluscream/youtube-music-api-proxy:latest
```

### Using Docker Compose with Resource Limits

```yaml
version: '3.8'

services:
  youtube-music-api-proxy:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

## Security Considerations

1. **Use non-root user:** The container runs as a non-root user by default
2. **Limit resource usage:** Set appropriate memory and CPU limits
3. **Use proper SSL certificates:** Replace self-signed certificates in production
4. **Regular updates:** Keep the Docker image updated
5. **Network isolation:** Use Docker networks to isolate containers

## Examples

### Basic Development Setup

```bash
# Start development environment
cd docker
docker-compose up -d

# Test the API
curl "http://localhost:80/api/search?query=test"

# View logs
docker-compose logs -f
```

### Production Setup with Custom Configuration

```bash
# Create custom docker-compose file
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  youtube-music-api-proxy:
    image: bluscream/youtube-music-api-proxy:latest
    container_name: ytm-api-prod
    ports:
      - "80:80"
      - "443:443"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - YTM_GEOGRAPHICAL_LOCATION=US
    volumes:
      - ./logs:/app/logs
      - ./certs:/app/certs
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
EOF

# Start production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Multi-Container Setup

```bash
# Run multiple instances with different ports
docker run -d -p 8081:80 --name ytm-api-1 bluscream/youtube-music-api-proxy:latest
docker run -d -p 8082:80 --name ytm-api-2 bluscream/youtube-music-api-proxy:latest
docker run -d -p 8083:80 --name ytm-api-3 bluscream/youtube-music-api-proxy:latest
``` 