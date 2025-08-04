#!/usr/bin/env pwsh
# Simple script to login and publish Docker images

Write-Host "🐳 Docker Image Publisher for YouTube Music API Proxy" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

Write-Host "`n📋 Current images:" -ForegroundColor Cyan
docker images | Select-String "youtube-music-api-proxy"

Write-Host "`n🔐 Step 1: Login to Docker Hub" -ForegroundColor Yellow
Write-Host "Please run: docker login" -ForegroundColor White
Write-Host "Enter your Docker Hub username and password" -ForegroundColor Gray

Write-Host "`n🔐 Step 2: Login to GitHub Container Registry" -ForegroundColor Yellow
Write-Host "Please run: docker login ghcr.io" -ForegroundColor White
Write-Host "Username: your GitHub username" -ForegroundColor Gray
Write-Host "Password: your GitHub Personal Access Token" -ForegroundColor Gray

Write-Host "`n📤 Step 3: Push to Docker Hub" -ForegroundColor Yellow
Write-Host "Run: docker push bluscream/youtube-music-api-proxy:latest" -ForegroundColor White

Write-Host "`n📤 Step 4: Push to GitHub Container Registry" -ForegroundColor Yellow
Write-Host "Run: docker push ghcr.io/bluscream/youtube-music-api-proxy:latest" -ForegroundColor White

Write-Host "`n✅ After publishing, you can use on Linux:" -ForegroundColor Green
Write-Host "# From Docker Hub:" -ForegroundColor White
Write-Host "docker run -d -p 8080:8080 --name ytm-api bluscream/youtube-music-api-proxy:latest" -ForegroundColor Gray

Write-Host "`n# From GitHub Container Registry:" -ForegroundColor White
Write-Host "docker run -d -p 8080:8080 --name ytm-api ghcr.io/bluscream/youtube-music-api-proxy:latest" -ForegroundColor Gray

Write-Host "`n📖 API will be available at: http://localhost:8080" -ForegroundColor Green 