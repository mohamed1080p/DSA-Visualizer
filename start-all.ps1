Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "               DSA Visualizer - Full Stack Launcher" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend API Server (Port 5258) in a new console window..." -ForegroundColor Yellow
$env:ASPNETCORE_ENVIRONMENT = "Development"
Start-Process cmd.exe -ArgumentList "/k dotnet run --project DSA-Visualizer --urls http://127.0.0.1:5258" -WorkingDirectory $PSScriptRoot

Write-Host "Starting Frontend client (Port 5173) in a new console window..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k npm run dev" -WorkingDirectory (Join-Path $PSScriptRoot "client")

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "Servers are launching!" -ForegroundColor Green
Write-Host "  - Backend API: http://127.0.0.1:5258" -ForegroundColor Green
Write-Host "  - Frontend UI: http://localhost:5173/" -ForegroundColor Green
Write-Host ""
Write-Host "You can open http://localhost:5173/ in your browser now." -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host ""
