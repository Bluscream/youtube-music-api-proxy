# UNRAID Community Applications Deployment Guide

This guide will help you publish your YouTube Music API Proxy to UNRAID Community Applications (CA).

## Prerequisites

1. **GitHub Repository** - Your code must be in a public GitHub repository
2. **Docker Images** - Images must be published to Docker Hub or GitHub Container Registry
3. **UNRAID Template** - A properly formatted XML template (already created)

## Files Created

### 1. `template.xml`
- UNRAID Community Applications template
- Defines container configuration, ports, environment variables
- Points to your Docker images and documentation

### 2. `README.md`
- Installation and configuration instructions
- Troubleshooting guide
- API usage examples

### 3. `icon.png` (placeholder)
- 128x128 PNG icon for the application
- Should be replaced with actual icon

## Publishing to UNRAID Community Applications

### Step 1: Submit to Community Applications

1. **Fork the CA Repository**
   ```bash
   git clone https://github.com/CommunityApplications/unraid-ca-templates.git
   cd unraid-ca-templates
   ```

2. **Add Your Template**
   - Copy `template.xml` to `templates/`
   - Copy `icon.png` to `templates/`
   - Update `templates.xml` to include your template

3. **Submit Pull Request**
   - Create a new branch
   - Commit your changes
   - Submit PR to the CA repository

### Step 2: Alternative - Manual Installation

Users can manually install your template:

1. **Download Template**
   ```bash
   wget https://raw.githubusercontent.com/Bluscream/youtube-music-api-proxy-1/main/unraid/template.xml
   ```

2. **Install on UNRAID**
   - Place `template.xml` in `/boot/config/plugins/dockerMan/templates-user/`
   - Restart Docker service
   - Template will appear in Docker → Add Container

## Template Configuration

### Container Settings
- **Repository**: `bluscream1/youtube-music-api-proxy-1`
- **Tag**: `latest` (default)
- **Network**: Bridge
- **Privileged**: False

### Ports
- **WebUI**: 8080 (configurable)
- **Protocol**: TCP

### Environment Variables
- `YTM_GEOGRAPHICAL_LOCATION`: US (default)
- `YTM_COOKIES`: Optional, masked
- `YTM_VISITORDATA`: Optional, masked
- `YTM_POTOKEN`: Optional, masked

### Volumes
- `/app/config`: Configuration directory
- `/app/logs`: Log directory

## Testing Your Template

### Local Testing
1. **Install Template Locally**
   ```bash
   # Copy template to UNRAID
   cp template.xml /boot/config/plugins/dockerMan/templates-user/
   ```

2. **Test Installation**
   - Go to Docker → Add Container
   - Select your template
   - Configure settings
   - Test container startup

### Validation
- ✅ Container starts successfully
- ✅ Web interface accessible
- ✅ API endpoints respond
- ✅ Environment variables work
- ✅ Volume mounts function

## Maintenance

### Updating Your Template
1. **Modify `template.xml`**
2. **Update version numbers**
3. **Test changes locally**
4. **Submit updated PR to CA**

### Monitoring
- Check GitHub issues for user feedback
- Monitor Docker Hub/GHCR image pulls
- Update documentation as needed

## Best Practices

### Template Design
- Use descriptive names and descriptions
- Provide sensible defaults
- Include all necessary environment variables
- Add proper categorization

### Documentation
- Clear installation instructions
- Configuration examples
- Troubleshooting guide
- API usage examples

### Support
- Maintain active GitHub repository
- Respond to issues promptly
- Keep documentation updated
- Provide multiple support channels

## Next Steps

1. **Create Icon**: Replace `icon.png` placeholder with actual icon
2. **Test Template**: Verify all functionality works in UNRAID
3. **Submit to CA**: Follow the Community Applications submission process
4. **Monitor**: Track usage and user feedback
5. **Maintain**: Keep template and documentation updated

## Resources

- [UNRAID Community Applications](https://github.com/CommunityApplications/unraid-ca-templates)
- [UNRAID Template Documentation](https://github.com/CommunityApplications/unraid-ca-templates/wiki)
- [Docker Template Format](https://github.com/CommunityApplications/unraid-ca-templates/wiki/Template-Format)
- [Your GitHub Repository](https://github.com/Bluscream/youtube-music-api-proxy-1) 