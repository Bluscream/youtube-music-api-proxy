# Test script for YouTube Music API Proxy
# Runs the app in debug mode with a 10-second timeout

# Define the test URL
$testUrl = "http://localhost/index.html?playlist=PLZcTzTcUhr8VCHVm_M_rq6ppG_SDzthMU&song=ipzIYkVthno"

Write-Host "Starting YouTube Music API Proxy in debug mode..." -ForegroundColor Green

# Change to the project directory
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

# Start the dotnet app in debug mode
$process = Start-Process -FilePath "dotnet" -ArgumentList "run", "--configuration", "Debug" -PassThru -NoNewWindow

Write-Host "Waiting for app to start..." -ForegroundColor Yellow

# Wait a moment for the app to start up
Start-Sleep -Seconds 3

# Check if the process is still running
if ($process.HasExited) {
    Write-Host "Error: App failed to start!" -ForegroundColor Red
    exit 1
}

Write-Host "App started successfully. Performing test request..." -ForegroundColor Green

try {
    # Perform the web request
    $response = Invoke-WebRequest -Uri $testUrl -OutFile "test_output.html" -TimeoutSec 10
    
    Write-Host "Request completed successfully!" -ForegroundColor Green
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Cyan
    
    # Display the output
    Write-Host "`nOutput content:" -ForegroundColor Yellow
    Get-Content "test_output.html" | Out-Host
    
}
catch {
    Write-Host "Error during web request: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    # Clean up - stop the dotnet process
    Write-Host "`c the app..." -ForegroundColor Yellow
    
    if (-not $process.HasExited) {
        $process.Kill()
        $process.WaitForExit(5000) | Out-Null
    }
    
    Write-Host "Test completed." -ForegroundColor Green
}

# Clean up output file
if (Test-Path "test_output.html") {
    Remove-Item "test_output.html" -Force
}