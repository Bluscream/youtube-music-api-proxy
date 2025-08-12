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
    
    Write-Host "Downloading from $Url to $OutFile..." -ForegroundColor Blue
    
    try {
        $response = Invoke-WebRequest -Uri $Url -OutFile $OutFile -TimeoutSec 10

        Write-Host "Request to $Url completed successfully!" -ForegroundColor Green
        Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Cyan
        
        # If it's a JSON file, beautify it after download
        if ($OutFile -match '\.json$' -and (Test-Path $OutFile)) {
            try {
                $jsonContent = Get-Content $OutFile -Raw | ConvertFrom-Json
                $beautifiedJson = $jsonContent | ConvertTo-Json -Depth 10
                Set-Content -Path $OutFile -Value $beautifiedJson -Encoding UTF8
                Write-Host "JSON file beautified and saved" -ForegroundColor Green
            }
            catch {
                Write-Host "Warning: Could not beautify JSON file, keeping original format" -ForegroundColor Yellow
            }
        }
        
        # Verify the file was actually created and has content
        if (Test-Path $OutFile) {
            $fileSize = (Get-Item $OutFile).Length
            Write-Host "File downloaded: $OutFile (Size: $fileSize bytes)" -ForegroundColor Green
            
            if ($fileSize -gt 0) {
                Write-Host "`nOutput content ($Label):" -ForegroundColor Yellow
                
                # Check if it's a JSON file and beautify it
                if ($OutFile -match '\.json$') {
                    try {
                        $jsonContent = Get-Content $OutFile -Raw | ConvertFrom-Json
                        $beautifiedJson = $jsonContent | ConvertTo-Json -Depth 10
                        Write-Host $beautifiedJson -ForegroundColor White
                    }
                    catch {
                        Write-Host "Warning: Could not parse as JSON, showing raw content:" -ForegroundColor Yellow
                        Get-Content $OutFile | Out-Host
                    }
                }
                else {
                    Get-Content $OutFile | Out-Host
                }
            }
            else {
                Write-Host "Warning: Downloaded file is empty!" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "Error: File was not created at $OutFile" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Error downloading from $Url : $($_.Exception.Message)" -ForegroundColor Red
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
    # Ensure test directory exists
    if (-not (Test-Path ".test")) {
        New-Item -ItemType Directory -Path ".test" -Force | Out-Null
        Write-Host "Created test directory: .test" -ForegroundColor Green
    }

    # Clean up output files
    Write-Host "`nCleaning up test files..." -ForegroundColor Yellow
    foreach ($test in $testCases) {
        if (Remove-IfExists -Path $test.OutFile) {
            Write-Host "  Removed: $($test.OutFile)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`nStarting test downloads..." -ForegroundColor Green
    foreach ($test in $testCases) {
        Write-Host "`n--- Testing $($test.Label) ---" -ForegroundColor Magenta
        Invoke-TestRequest -Url $test.Url -OutFile $test.OutFile -Label $test.Label
    }
    
    Write-Host "`nAll test downloads completed successfully!" -ForegroundColor Green
    
    # Show summary of downloaded files
    Write-Host "`nDownloaded files summary:" -ForegroundColor Cyan
    foreach ($test in $testCases) {
        if (Test-Path $test.OutFile) {
            $fileSize = (Get-Item $test.OutFile).Length
            Write-Host "  ✓ $($test.OutFile) ($fileSize bytes)" -ForegroundColor Green
        }
        else {
            Write-Host "  ✗ $($test.OutFile) (not found)" -ForegroundColor Red
        }
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