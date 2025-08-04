#!/usr/bin/env pwsh
# Publish script for YouTube Music API Proxy Docker image

param(
    [string]$DockerHubImage = "bluscream/youtube-music-api-proxy",
    [string]$GitHubImage = "ghcr.io/bluscream/youtube-music-api-proxy",
    [string]$Tag = "latest",
    [switch]$DockerHub,
    [switch]$GitHub,
    [switch]$Both,
    [switch]$NoCache
)

# Default to both if no specific registry is specified
if (-not $DockerHub -and -not $GitHub) {
    $Both = $true
}

Write-Host "Publishing YouTube Music API Proxy Docker image..." -ForegroundColor Green

# Build the image first
Write-Host "Building image..." -ForegroundColor Yellow
$buildArgs = @(
    "build",
    "-t", "${DockerHubImage}:${Tag}",
    "-t", "${GitHubImage}:${Tag}",
    "-f", "docker/Dockerfile",
    ".."
)

if ($NoCache) {
    $buildArgs += "--no-cache"
}

docker $buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image built successfully!" -ForegroundColor Green

# Publish to Docker Hub
if ($DockerHub -or $Both) {
    Write-Host "`nPublishing to Docker Hub..." -ForegroundColor Yellow
    
    # Check if logged in to Docker Hub
    $dockerHubAuth = docker info 2>&1 | Select-String "Username"
    if (-not $dockerHubAuth) {
        Write-Host "❌ Not logged in to Docker Hub. Please run 'docker login' first." -ForegroundColor Red
        exit 1
    }
    
    docker push "${DockerHubImage}:${Tag}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully published to Docker Hub!" -ForegroundColor Green
        Write-Host "Image: ${DockerHubImage}:${Tag}" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to publish to Docker Hub!" -ForegroundColor Red
        exit 1
    }
}

# Publish to GitHub Container Registry
if ($GitHub -or $Both) {
    Write-Host "`nPublishing to GitHub Container Registry..." -ForegroundColor Yellow
    
    # Check if logged in to GitHub Container Registry
    $githubAuth = docker info 2>&1 | Select-String "Username"
    if (-not $githubAuth) {
        Write-Host "❌ Not logged in to GitHub Container Registry. Please run 'docker login ghcr.io' first." -ForegroundColor Red
        exit 1
    }
    
    docker push "${GitHubImage}:${Tag}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully published to GitHub Container Registry!" -ForegroundColor Green
        Write-Host "Image: ${GitHubImage}:${Tag}" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to publish to GitHub Container Registry!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Publishing completed successfully!" -ForegroundColor Green

# Show published images
Write-Host "`nPublished images:" -ForegroundColor Cyan
if ($DockerHub -or $Both) {
    Write-Host "  Docker Hub: ${DockerHubImage}:${Tag}" -ForegroundColor White
}
if ($GitHub -or $Both) {
    Write-Host "  GitHub CR: ${GitHubImage}:${Tag}" -ForegroundColor White
} 