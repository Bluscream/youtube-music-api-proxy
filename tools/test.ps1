# Test script for YouTube Music API Proxy
# Runs the app in debug mode with a 10-second timeout

# Define the test URLs and output files
$testCases = @(
    @{ Url = "http://localhost/index.html?playlist=PLZcTzTcUhr8VCHVm_M_rq6ppG_SDzthMU&song=ipzIYkVthno"; OutFile = ".test/index.html"; Label = "index" },
    @{ Url = "http://localhost/api"; OutFile = ".test/test_health.json"; Label = "health" }
)

function Invoke-TestRequest {
    param([string]$Url, [string]$OutFile, [string]$Label)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -OutFile $OutFile -TimeoutSec 10
        $fileSize = (Get-Item $OutFile).Length
        
        Write-Host "✓ $Label - $($response.StatusCode) ($fileSize bytes)" -ForegroundColor Green
        
        # Beautify JSON files
        if ($OutFile -match '\.json$' -and $fileSize -gt 0) {
            try {
                $jsonContent = Get-Content $OutFile -Raw | ConvertFrom-Json
                $beautifiedJson = $jsonContent | ConvertTo-Json -Depth 10
                Set-Content -Path $OutFile -Value $beautifiedJson -Encoding UTF8
                Write-Host "  JSON beautified" -ForegroundColor Cyan
            }
            catch { Write-Host "  JSON parse failed" -ForegroundColor Yellow }
        }
    }
    catch {
        Write-Host "✗ $Label - $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Remove-IfExists {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Force
        return $true
    }
    return $false
}

# Change to project directory and start app
Set-Location (Split-Path -Parent $PSScriptRoot)
$process = Start-Process -FilePath "dotnet" -ArgumentList "run", "--configuration", "Debug" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

if ($process.HasExited) {
    Write-Host "Error: App failed to start!" -ForegroundColor Red
    exit 1
}

try {
    # Setup and cleanup
    if (-not (Test-Path ".test")) { New-Item -ItemType Directory -Path ".test" -Force | Out-Null }
    foreach ($test in $testCases) { Remove-IfExists -Path $test.OutFile | Out-Null }
    
    # Run tests
    foreach ($test in $testCases) {
        Invoke-TestRequest -Url $test.Url -OutFile $test.OutFile -Label $test.Label
    }
}
catch {
    Write-Host "Error during web request: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    # Clean up - stop the dotnet process
    Write-Host "Stopping the app..." -ForegroundColor Yellow

    if (-not $process.HasExited) {
        $process.Kill()
        $process.WaitForExit(5000) | Out-Null
    }

    Write-Host "Test completed." -ForegroundColor Green
}