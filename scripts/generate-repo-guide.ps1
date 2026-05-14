Set-Location "d:\Dev\Projects\dsa_final"

$exclude = @('node_modules','bin','obj','.git','.vs','wwwroot')
$files = Get-ChildItem -Recurse -File |
  Where-Object {
    $p = $_.FullName
    -not ($exclude | ForEach-Object { $p -like "*\$_\*" } | Where-Object { $_ })
  } |
  ForEach-Object { ($_.FullName.Replace((Get-Location).Path + '\','') -replace '\\','/') } |
  Sort-Object

function Words([string]$name) {
  (($name -creplace '(?<!^)([A-Z])',' $1' -replace '[_\\-]+',' ') -replace '\\s+',' ').Trim()
}

function Describe([string]$p) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension($p)

  if ($p -eq 'DSA-Visualizer/Program.cs') { return 'Application startup composition root wiring DI, middleware pipeline, auth, CORS, rate limiting, Hangfire, SignalR, health checks, and endpoint mapping.' }
  if ($p -eq 'Core/Services/Infrastructure/ServiceRegistrationExtensions.cs') { return 'Registers application and battle service implementations for DI, including resilient HTTP client setup for AI provider calls.' }
  if ($p -eq 'Infrastructure/Persistence/PersistenceExtensions.cs') { return 'Configures SQL Server EF Core context, Identity, repository registrations, retries, and data seeding service wiring.' }
  if ($p -eq 'Infrastructure/External/ExternalServiceRegistration.cs') { return 'Registers Docker execution infrastructure and Redis-backed services with in-memory fallback when Redis is unavailable.' }
  if ($p -eq 'Infrastructure/Persistence/Data/ApplicationDbContext.cs') { return 'Main EF Core DbContext defining all module DbSets and applying entity configurations for identity, learning, problems, and battle.' }
  if ($p -eq 'client/src/App.tsx') { return 'Top-level router defining public/protected routes for home, learning, problems, progress, community, and battle experiences.' }
  if ($p -eq 'client/src/lib/api-client.ts') { return 'Centralized API request layer handling base URL resolution, auth headers, token refresh, retries, and normalized API errors.' }
  if ($p -eq 'client/src/context/SignalRContext.tsx') { return 'Realtime provider managing community/battle hub connections, incoming events, and client invoke helpers.' }

  if ($p -like 'Infrastructure/Presentation/Controllers/*/*.cs') { return 'HTTP API controller for ' + (Words ($name -replace 'Controller$','')) + ' feature endpoints and request/response orchestration.' }
  if ($p -like 'Infrastructure/Presentation/Hubs/*/*.cs') { return 'SignalR hub handling realtime ' + (Words ($name -replace 'Hub$','')) + ' events, connection groups, and client method invokes.' }
  if ($p -like 'Core/Services/*/*.cs') { return 'Application service module for ' + (Words ($name -replace 'Service$','' -replace 'Helpers$',' Helper' -replace 'Processor$',' Processor')) + ' business workflow orchestration.' }
  if ($p -like 'Core/ServicesAbstraction/I*.cs') { return 'Service interface contract for ' + (Words ($name -replace '^I','')) + ' consumed by controllers/hubs and implemented in services/infrastructure.' }
  if ($p -like 'Core/Domain/Models/*/*.cs') { return 'Domain model or enum defining ' + (Words $name) + ' business data/state and relationships.' }
  if ($p -like 'Core/Domain/Contracts/*.cs') { return 'Repository/unit-of-work abstraction for ' + (Words ($name -replace '^I','')) + ' to decouple domain from persistence implementation.' }
  if ($p -like 'Core/Domain/Exceptions/*.cs') { return 'Custom exception or global error handler for ' + (Words ($name -replace 'Exception$','')) + ' error semantics.' }

  if ($p -like 'Infrastructure/Persistence/Data/Configurations/*/*.cs') { return 'EF Core fluent mapping configuration for ' + (Words ($name -replace 'Configurations$','')) + ' table schema and relationships.' }
  if ($p -like 'Infrastructure/Persistence/Data/Migrations/*.Designer.cs') { return 'Auto-generated EF migration metadata snapshot for this schema revision.' }
  if ($p -like 'Infrastructure/Persistence/Data/Migrations/*.cs') { return 'EF migration script introducing schema changes for ' + (Words $name) + '.' }
  if ($p -like 'Infrastructure/Persistence/Data/Seeds/DataSeedFiles/Problems/*/*.json') { return 'Seed problem definition JSON used to bootstrap coding challenges during database seeding.' }
  if ($p -like 'Infrastructure/Persistence/Data/Seeds/DataSeedFiles/Topics/*.json') { return 'Seed topic/category definition JSON used for initial learning content bootstrap.' }
  if ($p -like 'Infrastructure/Persistence/Data/Seeds/*.cs') { return 'Data seeding orchestrator that imports topic/problem JSON files and inserts missing records.' }
  if ($p -like 'Infrastructure/Persistence/Repositories/*/*.cs') { return 'Concrete repository implementation for ' + (Words ($name -replace 'Repository$','')) + ' queries and persistence commands.' }
  if ($p -like 'Infrastructure/Persistence/Observability/*.cs') { return 'Persistence telemetry component instrumenting database commands with trace/metric data.' }

  if ($p -like 'Infrastructure/External/Docker/*.cs') { return 'Docker integration component for secure execution sandbox provisioning and command execution.' }
  if ($p -like 'Infrastructure/External/Redis/*.cs') { return 'Redis infrastructure component for matchmaking, caching, and connection/access coordination.' }
  if ($p -like 'Infrastructure/External/Common/*.cs') { return 'In-memory fallback infrastructure implementation used when Redis is unavailable.' }

  if ($p -like 'DSA-Visualizer/Extensions/*.cs') { return 'Host startup extension configuring ' + (Words ($name -replace 'Extensions$','')) + ' concerns.' }
  if ($p -like 'DSA-Visualizer/HealthChecks/*.cs') { return 'Health check module validating ' + (Words ($name -replace 'HealthCheck$','')) + ' readiness/liveness state.' }
  if ($p -like 'DSA-Visualizer/Middleware/*.cs') { return 'Custom middleware implementing cross-cutting request behavior for ' + (Words $name) + '.' }
  if ($p -like 'DSA-Visualizer/Observability/*.cs') { return 'Observability/correlation filter for ' + (Words $name) + ' runtime events.' }

  if ($p -like 'Shared/DTOs/*/*.cs') { return 'DTO contract for ' + (Words ($name -replace 'DTO$','')) + ' payloads exchanged between API and clients.' }

  if ($p -like 'client/src/pages/*.tsx') { return 'Route page component implementing the ' + (Words $name) + ' screen UI and interactions.' }
  if ($p -like 'client/src/components/*.tsx') { return 'Reusable React component for ' + (Words $name) + ' presentation/interaction behavior.' }
  if ($p -like 'client/src/context/*') { return 'Frontend shared context/provider/hook module for ' + (Words $name) + ' state management.' }
  if ($p -like 'client/src/lib/*.ts') { return 'Frontend utility module for ' + (Words $name) + ' logic reused across pages/components.' }

  if ($p -like 'tests/DSA.Visualizer.Tests/*Tests.cs') { return 'Automated test suite validating ' + (Words ($name -replace 'Tests$','')) + ' behavior and regressions.' }

  if ($p -like 'DockerSandbox/*/Dockerfile') { return 'Language sandbox container definition used by code execution service.' }
  if ($p -like 'DockerSandbox/*/run.sh') { return 'Language sandbox runtime script invoked in container to compile/run user code.' }

  if ($p -like 'E2E*.cs') { return 'Standalone E2E runtime validator script exercising key auth and API flows against a running backend.' }
  if ($p -like 'Test*.cs' -or $p -like 'scratch/*.cs') { return 'Ad-hoc diagnostic utility used for local environment, endpoint, or data checks.' }
  if ($p -like 'VerifyDBTool/*.cs') { return 'Database verification utility that tests SQL Server connectivity, DB existence, and table readiness.' }
  if ($p -like 'LoadTests/*.cs') { return 'NBomber load-test scenario runner for API throughput/latency validation.' }

  if ($p -like '*.md') { return 'Project documentation/report covering architecture, operations, contribution, or progress details.' }
  if ($p -like '*.csproj') { return 'C# project file defining framework, dependencies, and project references.' }
  if ($p -like '*.json') { return 'Configuration/data artifact used by runtime startup, build tooling, or seeded content.' }
  if ($p -like '*.js') { return 'JavaScript utility script for extraction/fixes/load generation in development workflows.' }
  if ($p -like '*.yml') { return 'CI/CD workflow configuration for repository automation.' }
  if ($p -like '*.ps1') { return 'PowerShell automation script for local build/infrastructure tasks.' }
  if ($p -like '*.sh') { return 'Shell script executed in Linux/container environments.' }
  if ($p -like '*.db*') { return 'Local development database runtime artifact.' }
  if ($p -like '*.txt' -or $p -like '*.log') { return 'Text/log artifact captured from previous development runs.' }

  return 'Repository artifact supporting build/runtime/documentation workflows.'
}

$out = @()
$out += '# DSA-Visualizer: Full Repository File And Connection Guide'
$out += ''
$out += 'This document provides a detailed architecture explanation and a per-file purpose catalog for all tracked files in the repository (excluding generated directories).'
$out += ''
$out += '## 1. Architecture Overview'
$out += '- Host layer: DSA-Visualizer configures runtime composition, middleware, authentication, observability, and endpoint mapping.'
$out += '- Presentation layer: Infrastructure/Presentation exposes REST APIs and SignalR hubs.'
$out += '- Application layer: Core/Services implements use-case orchestration behind Core/ServicesAbstraction interfaces.'
$out += '- Domain layer: Core/Domain defines entities, enums, repository contracts, and exceptions.'
$out += '- Persistence layer: Infrastructure/Persistence provides EF mappings, migrations, repositories, and seeding.'
$out += '- External infrastructure: Infrastructure/External provides Docker execution and Redis-backed caching/matchmaking with fallback modes.'
$out += '- Shared contracts: Shared/DTOs define transport payloads for API interactions.'
$out += '- Frontend: client app consumes REST/SignalR and renders learning/problem/community/battle experiences.'
$out += ''
$out += '## 2. Core Runtime Flows'
$out += '1. Frontend page calls API helper in client/src/lib/api-client.ts.'
$out += '2. Controller receives request and delegates to service abstraction.'
$out += '3. Service coordinates business rules, repositories, and external adapters.'
$out += '4. Persistence and/or external integrations execute work (DB, Redis, Docker, external AI).'
$out += '5. DTO response returns to client, while realtime scenarios use SignalR hub broadcasts.'
$out += ''
$out += '## 3. File By File Catalog'
foreach ($f in $files) { $out += ('- ' + $f + ': ' + (Describe $f)) }

Set-Content -Path "REPOSITORY_FILE_GUIDE_FULL.md" -Value $out -Encoding UTF8
Write-Output ("Updated REPOSITORY_FILE_GUIDE_FULL.md with " + $files.Count + " detailed file descriptions.")