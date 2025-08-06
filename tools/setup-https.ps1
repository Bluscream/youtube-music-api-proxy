#!/usr/bin/env pwsh

# Setup HTTPS certificates for YouTube Music API Proxy
# This script generates and trusts development certificates

Write-Host "Setting up HTTPS certificates for YouTube Music API Proxy..." -ForegroundColor Green

# Check if dotnet is available
try {
    $dotnetVersion = dotnet --version
    Write-Host "Using .NET version: $dotnetVersion" -ForegroundColor Yellow
} catch {
    Write-Host "Error: .NET SDK not found. Please install .NET 9.0 SDK or later." -ForegroundColor Red
    exit 1
}

# Clean existing certificates
Write-Host "Cleaning existing development certificates..." -ForegroundColor Yellow
dotnet dev-certs https --clean

# Generate new development certificate
Write-Host "Generating new development certificate..." -ForegroundColor Yellow
dotnet dev-certs https

# Trust the certificate (Windows and macOS only)
Write-Host "Trusting development certificate..." -ForegroundColor Yellow
dotnet dev-certs https --trust

# Verify certificate
Write-Host "Verifying certificate..." -ForegroundColor Yellow
$certCheck = dotnet dev-certs https --check
if ($LASTEXITCODE -eq 0) {
    Write-Host "Certificate is valid and trusted!" -ForegroundColor Green
} else {
    Write-Host "Warning: Certificate verification failed. You may need to run this script as administrator." -ForegroundColor Yellow
}

Write-Host "HTTPS setup complete!" -ForegroundColor Green
Write-Host "You can now run the application with HTTPS support." -ForegroundColor Cyan
