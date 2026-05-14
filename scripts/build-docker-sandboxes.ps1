$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

$images = @(
    @{ Name = "python"; Tag = "code-runner-python:latest" },
    @{ Name = "cpp"; Tag = "code-runner-cpp:latest" },
    @{ Name = "java"; Tag = "code-runner-java:latest" },
    @{ Name = "csharp"; Tag = "code-runner-csharp:latest" }
)

foreach ($image in $images) {
    $context = Join-Path $repoRoot "DockerSandbox\$($image.Name)"
    Write-Host "Building $($image.Tag) from $context"
    docker build -t $image.Tag $context
}

Write-Host ""
Write-Host "Docker sandbox images are ready:"
docker image ls code-runner-*
