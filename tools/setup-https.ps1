#!/usr/bin/env pwsh

Write-Host "Setting up HTTPS development certificate for YouTube Music API Proxy..." -ForegroundColor Green

# Check if dotnet is available
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host "Error: .NET SDK is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Trust the HTTPS development certificate
Write-Host "Trusting HTTPS development certificate..." -ForegroundColor Yellow
dotnet dev-certs https --trust

if ($LASTEXITCODE -eq 0) {
    Write-Host "HTTPS development certificate has been trusted successfully!" -ForegroundColor Green
    Write-Host "You can now run the application with HTTPS support." -ForegroundColor Green
    Write-Host "Default ports: HTTP=80, HTTPS=443" -ForegroundColor Cyan
    Write-Host "You can customize these in appsettings.json" -ForegroundColor Cyan
} else {
    Write-Host "Failed to trust HTTPS development certificate. You may need to run as administrator." -ForegroundColor Red
    Write-Host "Try running: dotnet dev-certs https --trust" -ForegroundColor Yellow
}

Write-Host "Setup complete!" -ForegroundColor Green
