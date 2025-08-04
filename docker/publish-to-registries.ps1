#!/usr/bin/env pwsh
# Comprehensive script to publish YouTube Music API Proxy to Docker Hub and GitHub Container Registry

param(
    [string]$DockerHubUsername = "bluscream",
    [string]$GitHubUsername = "bluscream",
    [string]$Tag = "latest",
    [switch]$SkipLogin,
    [switch]$SkipBuild,
    [switch]$DockerHubOnly,
    [switch]$GitHubOnly
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 YouTube Music API Proxy - Docker Image Publisher" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Image names
$DockerHubImage = "${DockerHubUsername}/youtube-music-api-proxy"
$GitHubImage = "ghcr.io/${GitHubUsername}/youtube-music-api-proxy"

# Check if we should publish to both registries
$PublishToDockerHub = -not $GitHubOnly
$PublishToGitHub = -not $DockerHubOnly

if (-not $PublishToDockerHub -and -not $PublishToGitHub) {
    $PublishToDockerHub = $true
    $PublishToGitHub = $true
}

Write-Host "Target registries:" -ForegroundColor Cyan
if ($PublishToDockerHub) { Write-Host "  ✅ Docker Hub: ${DockerHubImage}:${Tag}" -ForegroundColor White }
if ($PublishToGitHub) { Write-Host "  ✅ GitHub CR: ${GitHubImage}:${Tag}" -ForegroundColor White }

# Step 1: Authentication
if (-not $SkipLogin) {
    Write-Host "`n🔐 Step 1: Authentication" -ForegroundColor Yellow
    
    # Check Docker Hub login
    if ($PublishToDockerHub) {
        Write-Host "Checking Docker Hub authentication..." -ForegroundColor Cyan
        $dockerHubAuth = docker info 2>&1 | Select-String "Username"
        if (-not $dockerHubAuth) {
            Write-Host "❌ Not logged in to Docker Hub" -ForegroundColor Red
            Write-Host "Please run: docker login" -ForegroundColor Yellow
            Write-Host "Or use: docker login -u ${DockerHubUsername}" -ForegroundColor Yellow
            exit 1
        }
        else {
            Write-Host "✅ Docker Hub authentication OK" -ForegroundColor Green
        }
    }
    
    # Check GitHub Container Registry login
    if ($PublishToGitHub) {
        Write-Host "Checking GitHub Container Registry authentication..." -ForegroundColor Cyan
        $githubAuth = docker info 2>&1 | Select-String "Username"
        if (-not $githubAuth) {
            Write-Host "❌ Not logged in to GitHub Container Registry" -ForegroundColor Red
            Write-Host "Please run: docker login ghcr.io" -ForegroundColor Yellow
            Write-Host "Use your GitHub username and a Personal Access Token" -ForegroundColor Yellow
            exit 1
        }
        else {
            Write-Host "✅ GitHub Container Registry authentication OK" -ForegroundColor Green
        }
    }
}
else {
    Write-Host "`n⏭️  Skipping authentication check" -ForegroundColor Yellow
}

# Step 2: Build images
if (-not $SkipBuild) {
    Write-Host "`n🔨 Step 2: Building Docker images" -ForegroundColor Yellow
    
    $buildArgs = @("build")
    
    if ($PublishToDockerHub) {
        $buildArgs += "-t", "${DockerHubImage}:${Tag}"
    }
    
    if ($PublishToGitHub) {
        $buildArgs += "-t", "${GitHubImage}:${Tag}"
    }
    
    $buildArgs += "-f", "docker/Dockerfile", "."
    
    Write-Host "Building with: docker $($buildArgs -join ' ')" -ForegroundColor Cyan
    docker $buildArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Images built successfully!" -ForegroundColor Green
}
else {
    Write-Host "`n⏭️  Skipping build" -ForegroundColor Yellow
}

# Step 3: Push to Docker Hub
if ($PublishToDockerHub) {
    Write-Host "`n📤 Step 3: Publishing to Docker Hub" -ForegroundColor Yellow
    Write-Host "Pushing ${DockerHubImage}:${Tag}..." -ForegroundColor Cyan
    
    docker push "${DockerHubImage}:${Tag}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully published to Docker Hub!" -ForegroundColor Green
        Write-Host "Image: ${DockerHubImage}:${Tag}" -ForegroundColor White
    }
    else {
        Write-Host "❌ Failed to publish to Docker Hub!" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Push to GitHub Container Registry
if ($PublishToGitHub) {
    Write-Host "`n📤 Step 4: Publishing to GitHub Container Registry" -ForegroundColor Yellow
    Write-Host "Pushing ${GitHubImage}:${Tag}..." -ForegroundColor Cyan
    
    docker push "${GitHubImage}:${Tag}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully published to GitHub Container Registry!" -ForegroundColor Green
        Write-Host "Image: ${GitHubImage}:${Tag}" -ForegroundColor White
    }
    else {
        Write-Host "❌ Failed to publish to GitHub Container Registry!" -ForegroundColor Red
        exit 1
    }
}

# Step 5: Summary
Write-Host "`n🎉 Publishing completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📋 Published images:" -ForegroundColor Cyan
if ($PublishToDockerHub) {
    Write-Host "  🐳 Docker Hub: ${DockerHubImage}:${Tag}" -ForegroundColor White
}
if ($PublishToGitHub) {
    Write-Host "  📦 GitHub CR: ${GitHubImage}:${Tag}" -ForegroundColor White
}

Write-Host "`n🚀 Usage on Linux devices:" -ForegroundColor Cyan
if ($PublishToDockerHub) {
    Write-Host "  # From Docker Hub:" -ForegroundColor White
    Write-Host "  docker run -d -p 8080:8080 --name ytm-api ${DockerHubImage}:${Tag}" -ForegroundColor Gray
}
if ($PublishToGitHub) {
    Write-Host "  # From GitHub Container Registry:" -ForegroundColor White
    Write-Host "  docker run -d -p 8080:8080 --name ytm-api ${GitHubImage}:${Tag}" -ForegroundColor Gray
}

Write-Host "`n📖 API will be available at: http://localhost:8080" -ForegroundColor Green
Write-Host "📚 Swagger UI: http://localhost:8080/" -ForegroundColor Green 