#!/usr/bin/env pwsh
# Build and publish both release and debug versions of YouTube Music API Proxy

param(
    [string]$DockerHubUsername = "bluscream1",
    [string]$GitHubUsername = "bluscream",
    [string]$Version = "latest",
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$DockerHubOnly,
    [switch]$GitHubOnly
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Building and Publishing Release & Debug Versions" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Image names
$DockerHubRelease = "${DockerHubUsername}/youtube-music-api-proxy:${Version}"
$DockerHubDebug = "${DockerHubUsername}/youtube-music-api-proxy:${Version}-debug"
$GitHubRelease = "ghcr.io/${GitHubUsername}/youtube-music-api-proxy:${Version}"
$GitHubDebug = "ghcr.io/${GitHubUsername}/youtube-music-api-proxy:${Version}-debug"

# Check if we should publish to both registries
if (-not $DockerHubOnly -and -not $GitHubOnly) {
    $PublishToDockerHub = $true
    $PublishToGitHub = $true
}
else {
    $PublishToDockerHub = $DockerHubOnly
    $PublishToGitHub = $GitHubOnly
}

# Build Release Version
if (-not $SkipBuild) {
    Write-Host "`n🔨 Building RELEASE version..." -ForegroundColor Yellow
    
    # Build with Release configuration using main Dockerfile
    docker build -t $DockerHubRelease -t $GitHubRelease -f docker/Dockerfile --build-arg BUILD_CONFIGURATION=Release ..
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build release version" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Release version built successfully!" -ForegroundColor Green
}

# Build Debug Version
if (-not $SkipBuild) {
    Write-Host "`n🔨 Building DEBUG version..." -ForegroundColor Yellow
    
    # Build with Debug configuration using debug Dockerfile
    docker build -t $DockerHubDebug -t $GitHubDebug -f docker/Dockerfile.debug ..
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build debug version" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Debug version built successfully!" -ForegroundColor Green
}

# Push to Docker Hub
if ($PublishToDockerHub -and -not $SkipPush) {
    Write-Host "`n📤 Pushing to Docker Hub..." -ForegroundColor Yellow
    
    # Push release version
    Write-Host "Pushing release version: $DockerHubRelease" -ForegroundColor Cyan
    docker push $DockerHubRelease
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Release version pushed to Docker Hub!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to push release version to Docker Hub" -ForegroundColor Red
    }
    
    # Push debug version
    Write-Host "Pushing debug version: $DockerHubDebug" -ForegroundColor Cyan
    docker push $DockerHubDebug
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Debug version pushed to Docker Hub!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to push debug version to Docker Hub" -ForegroundColor Red
    }
}

# Push to GitHub Container Registry
if ($PublishToGitHub -and -not $SkipPush) {
    Write-Host "`n📤 Pushing to GitHub Container Registry..." -ForegroundColor Yellow
    
    # Push release version
    Write-Host "Pushing release version: $GitHubRelease" -ForegroundColor Cyan
    docker push $GitHubRelease
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Release version pushed to GitHub!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to push release version to GitHub" -ForegroundColor Red
    }
    
    # Push debug version
    Write-Host "Pushing debug version: $GitHubDebug" -ForegroundColor Cyan
    docker push $GitHubDebug
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Debug version pushed to GitHub!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to push debug version to GitHub" -ForegroundColor Red
    }
}

# Show final summary
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if ($PublishToDockerHub) {
    Write-Host "Docker Hub:" -ForegroundColor Yellow
    Write-Host "  Release: $DockerHubRelease" -ForegroundColor White
    Write-Host "  Debug:   $DockerHubDebug" -ForegroundColor White
}

if ($PublishToGitHub) {
    Write-Host "GitHub Container Registry:" -ForegroundColor Yellow
    Write-Host "  Release: $GitHubRelease" -ForegroundColor White
    Write-Host "  Debug:   $GitHubDebug" -ForegroundColor White
}

Write-Host "`n🎉 Build and publish completed!" -ForegroundColor Green 