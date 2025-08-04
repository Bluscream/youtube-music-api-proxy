#!/usr/bin/env pwsh
# Run script for YouTube Music API Proxy Docker container

param(
    [string]$ImageName = "bluscream/youtube-music-api-proxy",
    [string]$Tag = "latest",
    [int]$Port = 8080,
    [string]$ContainerName = "ytm-api-proxy",
    [switch]$Detached,
    [switch]$Remove
)

Write-Host "Running YouTube Music API Proxy Docker container..." -ForegroundColor Green

# Check if image exists
$imageExists = docker images "${ImageName}:${Tag}" --format "table {{.Repository}}:{{.Tag}}" | Select-String "${ImageName}:${Tag}"
if (-not $imageExists) {
    Write-Host "❌ Image ${ImageName}:${Tag} not found. Please build it first using build.ps1" -ForegroundColor Red
    exit 1
}

# Stop and remove existing container if it exists
$existingContainer = docker ps -a --filter "name=${ContainerName}" --format "{{.Names}}"
if ($existingContainer) {
    Write-Host "Stopping and removing existing container: ${ContainerName}" -ForegroundColor Yellow
    docker stop $ContainerName 2>$null
    docker rm $ContainerName 2>$null
}

# Run arguments
$runArgs = @(
    "run",
    "--name", $ContainerName,
    "-p", "${Port}:8080",
    "-e", "ASPNETCORE_ENVIRONMENT=Development",
    "-e", "YTM_GEOGRAPHICAL_LOCATION=US"
)

if ($Detached) {
    $runArgs += "-d"
}

if ($Remove) {
    $runArgs += "--rm"
}

$runArgs += "${ImageName}:${Tag}"

# Run the container
Write-Host "Running: docker $($runArgs -join ' ')" -ForegroundColor Yellow
docker $runArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container started successfully!" -ForegroundColor Green

    if (-not $Detached) {
        Write-Host "`nContainer is running. Press Ctrl+C to stop." -ForegroundColor Cyan
    }
    else {
        Write-Host "`nContainer is running in detached mode." -ForegroundColor Cyan
        Write-Host "API will be available at: http://localhost:${Port}" -ForegroundColor Cyan
        Write-Host "Swagger UI will be available at: http://localhost:${Port}/" -ForegroundColor Cyan

        Write-Host "`nContainer logs:" -ForegroundColor Yellow
        docker logs $ContainerName

        Write-Host "`nTo stop the container: docker stop ${ContainerName}" -ForegroundColor Yellow
        Write-Host "To view logs: docker logs -f ${ContainerName}" -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}