#!/usr/bin/env pwsh
# Build script for YouTube Music API Proxy Docker image

param(
    [string]$ImageName = "bluscream/youtube-music-api-proxy",
    [string]$Tag = "latest",
    [switch]$Push,
    [switch]$NoCache
)

Write-Host "Building YouTube Music API Proxy Docker image..." -ForegroundColor Green

# Build arguments
$buildArgs = @(
    "build",
    "-t", "${ImageName}:${Tag}",
    "-f", "docker/Dockerfile",
    ".."
)

if ($NoCache) {
    $buildArgs += "--no-cache"
}

# Build the image
Write-Host "Running: docker $($buildArgs -join ' ')" -ForegroundColor Yellow
docker $buildArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
    
    # Show image info
    Write-Host "`nImage details:" -ForegroundColor Cyan
    docker images "${ImageName}:${Tag}"
    
    if ($Push) {
        Write-Host "`nPushing image to registry..." -ForegroundColor Yellow
        docker push "${ImageName}:${Tag}"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Failed to push image" -ForegroundColor Red
            exit 1
        }
    }
}
else {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
} 