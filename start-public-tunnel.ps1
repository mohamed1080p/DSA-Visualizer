$binDir = Join-Path $PSScriptRoot "scripts"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

$exePath = Join-Path $binDir "cloudflared.exe"

if (-not (Test-Path $exePath)) {
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host "Downloading cloudflared.exe (Cloudflare Tunnel client)..." -ForegroundColor Cyan
    Write-Host "This is a 100% free, secure, and card-free tunnel service." -ForegroundColor Cyan
    Write-Host "===================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    Invoke-WebRequest -Uri $url -OutFile $exePath
    
    if (-not (Test-Path $exePath)) {
        Write-Error "Failed to download cloudflared.exe. Please download it manually."
        Exit 1
    }
    Write-Host "Download completed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "Starting Cloudflare Quick Tunnel on port 5173..." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Make sure your Backend and Frontend servers are running!" -ForegroundColor Yellow
Write-Host "  - Backend should be running (port 5258)" -ForegroundColor Yellow
Write-Host "  - Frontend should be running (port 5173)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Look for the line in the logs below starting with:" -ForegroundColor Cyan
Write-Host "  'Your quick tunnel has been created! Visit: https://...'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy that link and share it with anyone to let them test your app!" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host ""

& $exePath tunnel --url http://127.0.0.1:5173
