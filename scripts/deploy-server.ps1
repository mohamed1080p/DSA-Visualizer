<#
Simple deployment helper for running the server stack locally/on a host using Docker Compose.
Usage:
  1. Copy `.env.template` to `.env` and fill in secrets.
  2. Run this script in PowerShell: `./scripts/deploy-server.ps1`.
#>

Set-StrictMode -Version Latest
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\.."  # repo root

if (-not (Test-Path -Path '.env')) {
  Write-Host '`.env` not found — copying from `.env.template` to `.env`. Please edit `.env` then re-run.' -ForegroundColor Yellow
  Copy-Item -Path .env.template -Destination .env -Force
  exit 1
}

Write-Host 'Using .env (ensure it is populated with production values).' -ForegroundColor Green

Write-Host 'Stopping any existing compose stack...' -ForegroundColor Cyan
docker compose -f docker-compose.server.yml down --remove-orphans

Write-Host 'Building and starting services (detached)...' -ForegroundColor Cyan
docker compose -f docker-compose.server.yml up -d --build

Write-Host 'Waiting briefly for services to initialize...' -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host 'Containers status:' -ForegroundColor Green
docker compose -f docker-compose.server.yml ps

Write-Host 'If database migrations are required, run:' -ForegroundColor Yellow
Write-Host '  docker compose -f docker-compose.server.yml exec app dotnet ef database update --no-build --project Infrastructure/Persistence/Infrastructure.Persistence.csproj' -ForegroundColor Gray

Write-Host 'To view logs:' -ForegroundColor Yellow
Write-Host '  docker compose -f docker-compose.server.yml logs -f --tail=200' -ForegroundColor Gray

Write-Host 'Deployment script completed. Verify health endpoints and run smoke tests.' -ForegroundColor Green
