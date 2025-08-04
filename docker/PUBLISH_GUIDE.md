# Publishing Docker Images Guide

This guide will help you publish your YouTube Music API Proxy Docker images to Docker Hub and GitHub Container Registry.

## Prerequisites

1. **Docker Hub Account**: Create one at [hub.docker.com](https://hub.docker.com)
2. **GitHub Account**: You already have this
3. **GitHub Personal Access Token**: For GitHub Container Registry

## Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Docker Registry"
4. Select scopes:
   - `write:packages` (to push images)
   - `read:packages` (to pull images)
5. Click "Generate token"
6. **Copy the token** - you won't see it again!

## Step 2: Login to Docker Registries

### Docker Hub
```bash
docker login
# Enter your Docker Hub username and password
```

### GitHub Container Registry
```bash
docker login ghcr.io
# Username: your GitHub username
# Password: your GitHub Personal Access Token
```

## Step 3: Publish Images

### Option A: Use the Automated Script (Recommended)

```powershell
cd docker
.\publish-to-registries.ps1
```

### Option B: Manual Commands

```bash
# Build images
docker build -t bluscream/youtube-music-api-proxy:latest -f docker/Dockerfile .
docker build -t ghcr.io/bluscream/youtube-music-api-proxy:latest -f docker/Dockerfile .

# Push to Docker Hub
docker push bluscream/youtube-music-api-proxy:latest

# Push to GitHub Container Registry
docker push ghcr.io/bluscream/youtube-music-api-proxy:latest
```

## Step 4: Verify Publication

### Check Docker Hub
Visit: https://hub.docker.com/r/bluscream/youtube-music-api-proxy

### Check GitHub Container Registry
Visit: https://github.com/bluscream?tab=packages&repo_name=youtube-music-api-proxy-1

## Step 5: Test on Linux Device

Once published, you can run the app on any Linux device with Docker:

```bash
# From Docker Hub
docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest

# From GitHub Container Registry
docker run -d -p 8080:8080 --name ytm-api ghcr.io/bluscream/youtube-music-api-proxy:latest
```

## Troubleshooting

### Authentication Issues
- Make sure you're logged in: `docker info | grep Username`
- For GitHub: Use Personal Access Token, not your GitHub password
- Token needs `write:packages` permission

### Push Permission Denied
- Check if the repository exists on Docker Hub
- For GitHub: Make sure the package name matches your repository

### Build Issues
- Make sure you're in the project root directory
- Check that Docker is running
- Verify the Dockerfile path is correct

## Next Steps

After publishing, you can:

1. **Set up GitHub Actions** for automated publishing
2. **Add version tags** for releases
3. **Create a Docker Hub repository description**
4. **Add usage examples** to the repository

## Useful Commands

```bash
# Check login status
docker info | grep Username

# List local images
docker images | grep youtube-music-api-proxy

# Test the image locally
docker run -d -p 8080:8080 --name test-ytm bluscream/youtube-music-api-proxy:latest

# Check if it's working
curl http://localhost:8080/

# Clean up test container
docker stop test-ytm && docker rm test-ytm
``` 