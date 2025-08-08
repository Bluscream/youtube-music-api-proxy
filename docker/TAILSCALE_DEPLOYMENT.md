# Tailscale Deployment Guide for YouTube Music API Proxy

This guide explains how to deploy the YouTube Music API Proxy with Tailscale support on Unraid.

## Prerequisites

1. **Tailscale Account**: You need a Tailscale account and access to the admin console
2. **Unraid Server**: Running Unraid with Docker support
3. **Tailscale Plugin**: Install the Tailscale plugin from the Unraid Community Applications

## Setup Steps

### 1. Install Tailscale Plugin on Unraid

1. Go to the **Apps** tab in your Unraid web interface
2. Search for "Tailscale" and install the plugin
3. Configure Tailscale with your account credentials
4. Enable Tailscale on your Unraid server

### 2. Generate Tailscale Auth Key

1. Log into your [Tailscale Admin Console](https://login.tailscale.com/admin/authkeys)
2. Go to **Settings** → **Keys**
3. Click **Generate auth key**
4. Set the following options:
   - **Reusable**: Yes (if you plan to redeploy)
   - **Ephemeral**: No
   - **Tags**: Add tags like `tag:youtube-music` for organization
   - **Expires**: Set an appropriate expiration date
5. Copy the generated auth key

### 3. Deploy with Docker Compose (Recommended)

#### Option A: Using the Tailscale-specific compose file

```bash
# Clone the repository
git clone https://github.com/bluscream/youtube-music-api-proxy.git
cd youtube-music-api-proxy

# Copy the Tailscale compose file
cp docker/docker-compose.tailscale.yml docker-compose.yml

# Edit the environment variables
nano docker-compose.yml
```

Set the following environment variables in `docker-compose.yml`:
```yaml
environment:
  - TAILSCALE_ENABLED=true
  - TAILSCALE_HOSTNAME=youtube-music-api-proxy
  - TAILSCALE_AUTHKEY=tskey-auth-xxxxxxxxx
  - TAILSCALE_TAGS=tag:youtube-music,env:production
```

#### Option B: Using the Tailscale Dockerfile

```bash
# Build the Tailscale-enabled image
docker build -f docker/Dockerfile.tailscale -t youtube-music-api-proxy:tailscale .

# Run the container
docker run -d \
  --name youtube-music-api-proxy-tailscale \
  --network host \
  -e TAILSCALE_ENABLED=true \
  -e TAILSCALE_HOSTNAME=youtube-music-api-proxy \
  -e TAILSCALE_AUTHKEY=tskey-auth-xxxxxxxxx \
  -e TAILSCALE_TAGS=tag:youtube-music \
  -v /var/run/tailscale/tailscaled.sock:/var/run/tailscale/tailscaled.sock \
  youtube-music-api-proxy:tailscale
```

### 4. Deploy via Unraid Community Applications

1. Go to the **Apps** tab in your Unraid web interface
2. Search for "YouTube Music API Proxy"
3. Click **Install**
4. Configure the following settings:
   - **Tailscale Enabled**: `true`
   - **Tailscale Hostname**: `youtube-music-api-proxy` (or your preferred hostname)
   - **Tailscale Auth Key**: Paste your auth key from step 2
   - **Tailscale Tags**: `tag:youtube-music` (or your preferred tags)
5. Click **Apply**

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TAILSCALE_ENABLED` | Enable Tailscale networking | `false` | No |
| `TAILSCALE_HOSTNAME` | Hostname in Tailscale network | `youtube-music-api-proxy` | No |
| `TAILSCALE_AUTHKEY` | Tailscale authentication key | - | Yes (if enabled) |
| `TAILSCALE_TAGS` | Comma-separated list of tags | `tag:youtube-music` | No |

### Network Configuration

The container uses `host` network mode to ensure proper Tailscale integration. This means:
- The container shares the host's network stack
- Tailscale can properly route traffic
- No port mapping is required (the app binds directly to host ports)

### Security Considerations

1. **Auth Key Security**: Keep your Tailscale auth key secure and rotate it regularly
2. **Network Access**: Only devices in your Tailscale network can access the API
3. **Tags**: Use tags to organize and control access to your devices
4. **Ephemeral Keys**: Consider using ephemeral keys for temporary deployments

## Accessing the API

Once deployed and connected to Tailscale, you can access the API using:

- **HTTP**: `http://youtube-music-api-proxy.your-tailnet:80`
- **HTTPS**: `https://youtube-music-api-proxy.your-tailnet:443`
- **Web UI**: `http://youtube-music-api-proxy.your-tailnet:80/`

Replace `youtube-music-api-proxy` with your configured hostname and `your-tailnet` with your Tailscale network name.

## Troubleshooting

### Container Won't Start

1. Check if Tailscale is running on the host:
   ```bash
   tailscale status
   ```

2. Verify the auth key is valid:
   ```bash
   tailscale up --authkey=tskey-auth-xxxxxxxxx --hostname=test
   ```

3. Check container logs:
   ```bash
   docker logs youtube-music-api-proxy-tailscale
   ```

### Tailscale Connection Issues

1. Ensure the host has Tailscale installed and running
2. Verify the auth key has the correct permissions
3. Check if the hostname is already in use in your Tailscale network
4. Review the Tailscale admin console for any connection issues

### API Not Accessible

1. Verify the container is running:
   ```bash
   docker ps | grep youtube-music-api-proxy
   ```

2. Check if the application is listening on the correct ports:
   ```bash
   netstat -tlnp | grep :80
   netstat -tlnp | grep :443
   ```

3. Test connectivity from another Tailscale device:
   ```bash
   curl http://youtube-music-api-proxy.your-tailnet:80/
   ```

## Advanced Configuration

### Custom Tailscale Configuration

You can customize Tailscale behavior by modifying the startup script or adding additional environment variables:

```yaml
environment:
  - TAILSCALE_ENABLED=true
  - TAILSCALE_HOSTNAME=youtube-music-api-proxy
  - TAILSCALE_AUTHKEY=tskey-auth-xxxxxxxxx
  - TAILSCALE_TAGS=tag:youtube-music,env:production
  - TAILSCALE_ACCEPT_DNS=false
  - TAILSCALE_ACCEPT_ROUTES=false
  - TAILSCALE_SHIELDS_UP=false
```

### Integration with Other Services

The API proxy can be integrated with other services in your Tailscale network:

- **Reverse Proxy**: Use nginx or traefik to route traffic
- **Load Balancer**: Distribute load across multiple instances
- **Monitoring**: Use Prometheus/Grafana for metrics
- **Logging**: Centralize logs with ELK stack or similar

## Support

For issues related to:
- **Tailscale**: Check the [Tailscale documentation](https://tailscale.com/kb/)
- **YouTube Music API Proxy**: Open an issue on [GitHub](https://github.com/bluscream/youtube-music-api-proxy/issues)
- **Unraid**: Check the [Unraid forums](https://forums.unraid.net/)
