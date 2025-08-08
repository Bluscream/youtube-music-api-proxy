# TypeScript Build Script for YouTube Music API Proxy Frontend
# This script builds the TypeScript project and outputs to wwwroot

param(
    [switch]$Watch,
    [switch]$Production,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "YouTube Music API Proxy Frontend Build Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the src/ directory."
    exit 1
}

# Clean previous builds if requested
if ($Clean) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    }
    Write-Host "Clean complete." -ForegroundColor Green
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Host "Dependencies installed successfully." -ForegroundColor Green
}

# Determine build mode
$buildMode = if ($Production) { "production" } else { "development" }
Write-Host "Building in $buildMode mode..." -ForegroundColor Yellow

# Run the build
if ($Watch) {
    Write-Host "Starting watch mode..." -ForegroundColor Cyan
    npm run watch
}
else {
    $buildCommand = if ($Production) { "build" } else { "build:dev" }
    Write-Host "Running: npm run $buildCommand" -ForegroundColor Cyan
    npm run $buildCommand
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Output files:" -ForegroundColor Cyan
    if (Test-Path "../wwwroot/app.js") {
        $jsSize = (Get-Item "../wwwroot/app.js").Length
        Write-Host "  - app.js ($([math]::Round($jsSize/1KB, 2)) KB)" -ForegroundColor White
    }
    if (Test-Path "../wwwroot/styles.css") {
        $cssSize = (Get-Item "../wwwroot/styles.css").Length
        Write-Host "  - styles.css ($([math]::Round($cssSize/1KB, 2)) KB)" -ForegroundColor White
    }
}
else {
    Write-Error "Build failed!"
    exit 1
}
