# YouTube Music API Proxy with Tailscale Support

This guide explains how to deploy the YouTube Music API Proxy with Tailscale support on Unraid.

## Prerequisites

1. Unraid server with Docker support
2. Tailscale account and network setup
3. Tailscale plugin installed on Unraid (optional, but recommended)

## Deployment Options

### Option 1: Using the Updated Unraid Template (Recommended)

1. **Install the Container Template**
   - Go to the Apps section in Unraid
   - Search for "YouTube Music API Proxy"
   - Install the template

2. **Configure Tailscale**
   - In the container configuration, set `Privileged` to `true`
   - Add your Tailscale auth key in the `TS_AUTHKEY` environment variable
   - Configure other environment variables as needed

3. **Start the Container**
   - The container will automatically start Tailscale and then the application

### Option 2: Using Docker Compose

1. **Clone the Repository**
   ```bash
   git clone https://github.com/bluscream/youtube-music-api-proxy.git
   cd youtube-music-api-proxy
   ```

2. **Set Environment Variables**
   ```bash
   export TS_AUTHKEY="your_tailscale_auth_key_here"
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker/docker-compose.tailscale.yml up -d
   ```

## Getting a Tailscale Auth Key

1. **Access Tailscale Admin Console**
   - Go to https://login.tailscale.com/admin/authkeys

2. **Create a New Auth Key**
   - Click "Generate auth key"
   - Set a descriptive name (e.g., "YouTube Music API Proxy")
   - Choose appropriate settings:
     - **Reusable**: Yes (if you plan to restart the container)
     - **Ephemeral**: No (for persistent access)
     - **Tags**: Add any relevant tags for your network

3. **Copy the Auth Key**
   - Copy the generated key and use it in the `TS_AUTHKEY` environment variable

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TS_AUTHKEY` | Tailscale authentication key | - | Yes (for Tailscale) |
| `YTM_GEOGRAPHICAL_LOCATION` | Geographical location for YouTube Music | US | No |
| `YTM_COOKIES` | Base64 encoded YouTube cookies | - | No |
| `YTM_VISITORDATA` | Visitor data for session tailoring | - | No |
| `YTM_POTOKEN` | Proof of Origin Token | - | No |
| `YTM_USER_AGENT` | Custom user agent string | - | No |
| `YTM_TIMEOUT` | Request timeout in seconds | 30 | No |
| `YTM_MAX_RETRIES` | Maximum retry attempts | 3 | No |
| `YTM_DEBUG` | Enable debug logging | false | No |

### Network Configuration

The container runs with the following network capabilities:
- `privileged: true` - Required for Tailscale
- `NET_ADMIN` capability - For network interface management
- `SYS_MODULE` capability - For kernel module loading
- `seccomp:unconfined` - For Tailscale compatibility

## Troubleshooting

### Common Issues

1. **"No root privileges!" Error**
   - **Solution**: Ensure the container is running in privileged mode
   - In Unraid: Set `Privileged` to `true` in container settings

2. **Tailscale Not Starting**
   - **Solution**: Check that the `TS_AUTHKEY` is correctly set
   - Verify the auth key is valid and not expired

3. **Network Connectivity Issues**
   - **Solution**: Ensure the container has proper network access
   - Check Unraid's network configuration

4. **Port Conflicts**
   - **Solution**: Change the default ports (80/443) if they conflict with other services
   - Update the port mappings in the container configuration

### Logs

To view container logs:
```bash
docker logs youtube-music-api-proxy-tailscale
```

To view Tailscale status inside the container:
```bash
docker exec -it youtube-music-api-proxy-tailscale tailscale status
```

## Security Considerations

1. **Privileged Mode**: The container runs in privileged mode to support Tailscale. This is necessary but increases the attack surface.

2. **Auth Key Security**: Keep your Tailscale auth key secure and don't share it publicly.

3. **Network Access**: The container will have access to your Tailscale network. Ensure proper network segmentation.

4. **Updates**: Regularly update both the container and Tailscale to get security patches.

## Performance

- The container includes both the application and Tailscale, which may increase resource usage
- Monitor CPU and memory usage, especially on lower-end systems
- Consider using resource limits if needed

## Support

For issues related to:
- **YouTube Music API Proxy**: [GitHub Issues](https://github.com/bluscream/youtube-music-api-proxy/issues)
- **Tailscale**: [Tailscale Support](https://tailscale.com/support/)
- **Unraid**: [Unraid Forums](https://forums.unraid.net/)

## Changelog

### v1.0.0
- Initial Tailscale support
- Privileged container configuration
- Automatic Tailscale startup script
- Unraid template updates
