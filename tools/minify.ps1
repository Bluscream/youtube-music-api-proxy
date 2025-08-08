param(
    [switch]$Git,
    [switch]$Docker,
    [string]$Repo = "youtube-music-api-proxy"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Starting build process..." -ForegroundColor Green

# Function to minify JavaScript
function Minify-JavaScript {
    param([string]$Content)
    
    # Remove single-line comments (but preserve URLs and strings)
    $Content = $Content -replace '(?<!["''])(?<!:)\/\/.*$', '' -replace '(?<!["''])(?<!:)\/\/.*', ''
    
    # Remove multi-line comments
    $Content = $Content -replace '/\*.*?\*/', '' -replace '/\*.*', ''
    
    # Remove extra whitespace and newlines
    $Content = $Content -replace '\s+', ' '
    $Content = $Content -replace ';\s*', ';'
    $Content = $Content -replace '{\s*', '{'
    $Content = $Content -replace '\s*}', '}'
    $Content = $Content -replace ',\s*', ','
    $Content = $Content -replace ':\s*', ':'
    $Content = $Content -replace '=\s*', '='
    $Content = $Content -replace '\+\s*', '+'
    $Content = $Content -replace '-\s*', '-'
    $Content = $Content -replace '\*\s*', '*'
    $Content = $Content -replace '/\s*', '/'
    $Content = $Content -replace '\(\s*', '('
    $Content = $Content -replace '\s*\)', ')'
    $Content = $Content -replace '\[\s*', '['
    $Content = $Content -replace '\s*\]', ']'
    
    # Trim the result
    return $Content.Trim()
}

# Function to minify CSS
function Minify-CSS {
    param([string]$Content)
    
    # Remove comments
    $Content = $Content -replace '/\*.*?\*/', ''
    
    # Remove extra whitespace and newlines
    $Content = $Content -replace '\s+', ' '
    $Content = $Content -replace '{\s*', '{'
    $Content = $Content -replace '\s*}', '}'
    $Content = $Content -replace ':\s*', ':'
    $Content = $Content -replace ';\s*', ';'
    $Content = $Content -replace ',\s*', ','
    $Content = $Content -replace '\(\s*', '('
    $Content = $Content -replace '\s*\)', ')'
    
    # Trim the result
    return $Content.Trim()
}

# Ensure wwwroot directory exists
$wwwrootPath = Join-Path $PSScriptRoot "..\wwwroot"
if (-not (Test-Path $wwwrootPath)) {
    New-Item -ItemType Directory -Path $wwwrootPath -Force | Out-Null
    Write-Host "Created wwwroot directory" -ForegroundColor Yellow
}

# Process JavaScript files
Write-Host "Processing JavaScript files..." -ForegroundColor Cyan
$jsFiles = @(
    "src\js\constants.js",
    "src\js\utils.js",
    "src\js\api-ready.js",
    "src\js\event-delegation.js",
    "src\js\notification-manager.js",
    "src\js\url-manager.js",
    "src\js\sidebar-manager.js",
    "src\js\right-sidebar-manager.js",
    "src\js\player-manager.js",
    "src\js\content-manager.js",
    "src\js\app.js"
)

$combinedJs = ""
foreach ($jsFile in $jsFiles) {
    $fullPath = Join-Path $PSScriptRoot "..\$jsFile"
    if (Test-Path $fullPath) {
        Write-Host "  Processing: $jsFile" -ForegroundColor Gray
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $minified = Minify-JavaScript -Content $content
        $combinedJs += $minified + "`n"
    }
    else {
        Write-Host "  Warning: File not found: $jsFile" -ForegroundColor Yellow
    }
}

# Save combined and minified JavaScript
$appJsPath = Join-Path $wwwrootPath "app.js"
$combinedJs | Out-File -FilePath $appJsPath -Encoding UTF8 -NoNewline
Write-Host "Created: app.js ($((Get-Item $appJsPath).Length) bytes)" -ForegroundColor Green

# Process CSS files
Write-Host "Processing CSS files..." -ForegroundColor Cyan
$cssFiles = @(
    "src\css\base.css",
    "src\css\layout.css",
    "src\css\leftsidebar.css",
    "src\css\rightsidebar.css",
    "src\css\player.css",
    "src\css\search.css",
    "src\css\library.css",
    "src\css\notifications.css",
    "src\css\responsive.css"
)

$combinedCss = ""
foreach ($cssFile in $cssFiles) {
    $fullPath = Join-Path $PSScriptRoot "..\$cssFile"
    if (Test-Path $fullPath) {
        Write-Host "  Processing: $cssFile" -ForegroundColor Gray
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $minified = Minify-CSS -Content $content
        $combinedCss += $minified + "`n"
    }
    else {
        Write-Host "  Warning: File not found: $cssFile" -ForegroundColor Yellow
    }
}

# Save combined and minified CSS
$appCssPath = Join-Path $wwwrootPath "app.css"
$combinedCss | Out-File -FilePath $appCssPath -Encoding UTF8 -NoNewline
Write-Host "Created: app.css ($((Get-Item $appCssPath).Length) bytes)" -ForegroundColor Green

# Git operations if requested
if ($Git) {
    Write-Host "Performing Git operations..." -ForegroundColor Cyan
    
    # Check if we're in a git repository
    $gitRoot = git rev-parse --show-toplevel 2>$null
    if ($gitRoot) {
        # Add the generated files
        git add $appJsPath $appCssPath 2>$null
        Write-Host "  Added generated files to git" -ForegroundColor Gray
        
        # Commit if there are changes
        $status = git status --porcelain 2>$null
        if ($status) {
            $commitMessage = @"
Build: Minified JS and CSS files

- Combined all JavaScript files into app.js
- Combined all CSS files into app.css
- Removed comments and whitespace for optimization
- Generated files: wwwroot/app.js, wwwroot/app.css
"@
            git commit -m $commitMessage 2>$null
            Write-Host "  Committed changes" -ForegroundColor Gray
        }
        else {
            Write-Host "  No changes to commit" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  Not in a git repository, skipping git operations" -ForegroundColor Yellow
    }
}

# Docker operations if requested
if ($Docker) {
    Write-Host "Performing Docker operations..." -ForegroundColor Cyan
    
    $dockerfilePath = Join-Path $PSScriptRoot "..\docker\Dockerfile"
    if (Test-Path $dockerfilePath) {
        $dockerImageName = $Repo.ToLower()
        Write-Host "  Building Docker image: $dockerImageName" -ForegroundColor Gray
        
        $dockerBuildCmd = "docker build -t $dockerImageName -f $dockerfilePath .."
        Invoke-Expression $dockerBuildCmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Docker image built successfully" -ForegroundColor Green
        }
        else {
            Write-Host "  Docker build failed" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  Dockerfile not found at: $dockerfilePath" -ForegroundColor Yellow
    }
}

Write-Host "Build process completed successfully!" -ForegroundColor Green
