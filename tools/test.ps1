# Test script for YouTube Music API Proxy
# Runs the app in debug mode with a 10-second timeout

# Define the test URLs and output files
$testCases = @(
    @{ Url = "http://localhost/index.html?playlist=PLZcTzTcUhr8VCHVm_M_rq6ppG_SDzthMU&song=ipzIYkVthno"; OutFile = ".test/index.html"; Label = "index" },
    @{ Url = "http://localhost/api"; OutFile = ".test/test_health.json"; Label = "health" }
)

function Invoke-TestRequest {
    param(
        [string]$Url,
        [string]$OutFile,
        [string]$Label
    )
    $response = Invoke-WebRequest -Uri $Url -OutFile $OutFile -TimeoutSec 10

    Write-Host "Request to $Url completed successfully!" -ForegroundColor Green
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Cyan

    # Display the output
    Write-Host "`nOutput content ($Label):" -ForegroundColor Yellow
    Get-Content $OutFile | Out-Host
}

function Remove-IfExists {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Force
    }
}

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

Write-Host "App started successfully. Performing test requests..." -ForegroundColor Green

try {
    foreach ($test in $testCases) {
        Invoke-TestRequest -Url $test.Url -OutFile $test.OutFile -Label $test.Label
    }
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

# Clean up output files
foreach ($test in $testCases) {
    Remove-IfExists -Path $test.OutFile
}