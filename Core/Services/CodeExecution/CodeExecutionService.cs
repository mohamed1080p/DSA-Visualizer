using Services.CodeExecution;
using Domain.Models.ProblemsModule;
using Microsoft.Extensions.Logging;

using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Text;
using System.Text.Json;

namespace Services.CodeExecution;

public class CodeExecutionService : ICodeExecutionService
{
    private const long DefaultNanoCpus = 2_000_000_000;
    private const int ContainerMemoryLimitMb = 512;
    private const int ContainerPidLimit = 64;

    private readonly IDockerService _dockerService;
    private readonly ITelemetryService _telemetry;
    private readonly ILogger<CodeExecutionService> _logger;

    private readonly Dictionary<string, string> _imageMap;
    public CodeExecutionService(IDockerService dockerService, ITelemetryService telemetry, ILogger<CodeExecutionService> logger)
    {
        _dockerService = dockerService;
        _telemetry = telemetry;
        _logger = logger;

        _imageMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {

{
"python", "code-runner-python:latest" },

{
"cpp", "code-runner-cpp:latest" },

{
"csharp", "code-runner-csharp:latest" },

{
"java", "code-runner-java:latest" }
        };
    }
    public async Task<CodeExecutionResult> ExecuteAsync(CodeExecutionRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (!_imageMap.TryGetValue(request.Language, out var image))
            throw new NotSupportedException($"Language '{request.Language}' not supported.");

        using var activity = _telemetry.ActivitySource.StartActivity("code.execute", ActivityKind.Internal);
        activity?.SetTag("code.language", request.Language);

        try
        {
            return await ExecuteWithDockerAsync(request, image, cancellationToken, activity);
        }
        catch (InvalidOperationException ex) when (CanUseLocalCSharpFallback(request.Language, ex))
        {
            _logger.LogWarning(ex, "Docker executor unavailable for C#; falling back to a local dotnet runner.");
            activity?.SetTag("code.executor", "local-dotnet");
            return await ExecuteCSharpLocallyAsync(request, cancellationToken, activity);
        }
    }
    public async Task<IReadOnlyList<CodeExecutionResult>> ExecuteBatchAsync(BatchCodeExecutionRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.Inputs.Count == 0) return Array.Empty<CodeExecutionResult>();
        if (!_imageMap.TryGetValue(request.Language, out var image))
            throw new NotSupportedException($"Language '{request.Language}' not supported.");

        using var activity = _telemetry.ActivitySource.StartActivity("code.execute_batch", ActivityKind.Internal);
        activity?.SetTag("code.language", request.Language);

        try
        {
            return await ExecuteBatchWithDockerAsync(request, image, cancellationToken, activity);
        }
        catch (InvalidOperationException ex) when (CanUseLocalCSharpFallback(request.Language, ex))
        {
            _logger.LogWarning(ex, "Docker executor unavailable for C# batch execution; falling back to a local dotnet runner.");
            activity?.SetTag("code.executor", "local-dotnet");
            return await ExecuteCSharpBatchLocallyAsync(request, cancellationToken, activity);
        }
    }

    private async Task<CodeExecutionResult> ExecuteWithDockerAsync(
        CodeExecutionRequest request,
        string image,
        CancellationToken cancellationToken,
        System.Diagnostics.Activity? activity)
    {
        var stopwatch = Stopwatch.StartNew();
        var encodedCode = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.SourceCode ?? ""));
        var encodedInput = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.Input ?? ""));

        var resources = CreateResources(request.MemoryLimitMB, GetMemoryLimitForLanguage(request.Language));
        var env = CreateRunnerEnv(
            $"CODE={encodedCode}",
            $"INPUT={encodedInput}");

        var containerId = await _dockerService.CreateContainerAsync(image, env, resources, cancellationToken);

        try
        {
            await _dockerService.StartContainerAsync(containerId, cancellationToken);

            var timeoutMs = CodeExecutionHelpers.CalculateTimeoutMs(request);
            var (statusCode, stdout, stderr, oomKilled) = await _dockerService.WaitAndGetResultsAsync(containerId, timeoutMs, cancellationToken);

            stopwatch.Stop();
            var verdict = CodeExecutionHelpers.DetermineVerdict(statusCode, stdout, stderr, oomKilled);
            activity?.SetTag("code.verdict", verdict.ToString());

            return new CodeExecutionResult
            {
                Output = stdout.Trim(),
                Error = stderr.Trim(),
                ExitCode = (int)statusCode,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                Verdict = verdict
            };
        }
        finally
        {
            _telemetry.RecordCodeExecutionDuration(stopwatch.Elapsed.TotalMilliseconds, request.Language, false);
            await _dockerService.RemoveContainerAsync(containerId, CancellationToken.None);
        }
    }

    private async Task<IReadOnlyList<CodeExecutionResult>> ExecuteBatchWithDockerAsync(
        BatchCodeExecutionRequest request,
        string image,
        CancellationToken cancellationToken,
        System.Diagnostics.Activity? activity)
    {
        var stopwatch = Stopwatch.StartNew();
        var encodedCode = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.SourceCode ?? string.Empty));
        var rawBatchInputPayload = string.Join('\n', request.Inputs.Select(i => Convert.ToBase64String(Encoding.UTF8.GetBytes(i ?? string.Empty))));
        var encodedInputs = Convert.ToBase64String(Encoding.UTF8.GetBytes(rawBatchInputPayload));

        var resources = CreateResources(request.MemoryLimitMB, GetMemoryLimitForLanguage(request.Language));
        var env = CreateRunnerEnv(
            $"CODE={encodedCode}",
            $"BATCH_INPUTS={encodedInputs}",
            $"TIME_LIMIT_MS={request.TimeLimitMs}");

        var containerId = await _dockerService.CreateContainerAsync(image, env, resources, cancellationToken);

        try
        {
            await _dockerService.StartContainerAsync(containerId, cancellationToken);

            var timeoutMs = CodeExecutionHelpers.CalculateBatchTimeoutMs(request);
            var (statusCode, stdout, stderr, oomKilled) = await _dockerService.WaitAndGetResultsAsync(containerId, timeoutMs, cancellationToken);

            stopwatch.Stop();
            if (statusCode != 0)
            {
                var sharedVerdict = CodeExecutionHelpers.DetermineVerdict(statusCode, stdout, stderr, oomKilled);
                return request.Inputs.Select(_ => new CodeExecutionResult
                {
                    Verdict = sharedVerdict,
                    Error = BuildRunnerError(stdout, stderr),
                    ExitCode = (int)statusCode,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    MemoryUsedKB = 0
                }).ToList();
            }

            List<RunnerBatchItem>? items;
            try
            {
                items = JsonSerializer.Deserialize<List<RunnerBatchItem>>(stdout, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException(
                    $"Docker runner returned invalid JSON. stdout: {TrimForMessage(stdout)} stderr: {TrimForMessage(stderr)}",
                    ex);
            }

            if (items is null || items.Count != request.Inputs.Count)
                throw new InvalidOperationException(
                    $"Docker runner returned {items?.Count ?? 0} result(s) for {request.Inputs.Count} test case(s). stdout: {TrimForMessage(stdout)} stderr: {TrimForMessage(stderr)}");

            return items.Select(i =>
            {
                var outStr = CodeExecutionHelpers.DecodeBase64OrEmpty(i.OutputBase64);
                var errStr = CodeExecutionHelpers.DecodeBase64OrEmpty(i.ErrorBase64);
                return new CodeExecutionResult
                {
                    Output = outStr.Trim(),
                    Error = errStr.Trim(),
                    ExitCode = i.ExitCode,
                    ExecutionTimeMs = i.ExecutionTimeMs,
                    MemoryUsedKB = 0,
                    Verdict = CodeExecutionHelpers.DetermineVerdict(i.ExitCode, outStr, errStr, false)
                };
            }).ToList();
        }
        finally
        {
            _telemetry.RecordCodeExecutionDuration(stopwatch.Elapsed.TotalMilliseconds, request.Language, true);
            await _dockerService.RemoveContainerAsync(containerId, CancellationToken.None);
        }
    }

    private async Task<CodeExecutionResult> ExecuteCSharpLocallyAsync(CodeExecutionRequest request, CancellationToken cancellationToken, System.Diagnostics.Activity? activity)
    {
        var results = await ExecuteCSharpBatchLocallyAsync(new BatchCodeExecutionRequest
        {
            SourceCode = request.SourceCode,
            Language = request.Language,
            Inputs = [request.Input ?? string.Empty],
            TimeLimitMs = request.TimeLimitMs,
            MemoryLimitMB = request.MemoryLimitMB
        }, cancellationToken, activity);

        return results[0];
    }

    private async Task<IReadOnlyList<CodeExecutionResult>> ExecuteCSharpBatchLocallyAsync(
        BatchCodeExecutionRequest request,
        CancellationToken cancellationToken,
        System.Diagnostics.Activity? activity)
    {
        var stopwatch = Stopwatch.StartNew();
        var tempRoot = Path.Combine(Path.GetTempPath(), $"dsa-visualizer-csharp-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempRoot);

        try
        {
            await File.WriteAllTextAsync(Path.Combine(tempRoot, "Program.cs"), request.SourceCode ?? string.Empty, cancellationToken);
            await File.WriteAllTextAsync(Path.Combine(tempRoot, "app.csproj"), """
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>
""", cancellationToken);

            var build = await RunProcessAsync(
                "dotnet",
                "build -c Release --nologo",
                tempRoot,
                null,
                timeoutMs: 120000,
                cancellationToken);

            if (build.ExitCode != 0)
            {
                stopwatch.Stop();
                var buildError = BuildRunnerError(build.Stdout, build.Stderr);
                var buildVerdict = CodeExecutionHelpers.DetermineVerdict(build.ExitCode, build.Stdout, build.Stderr, false);
                return request.Inputs.Select(_ => new CodeExecutionResult
                {
                    Output = string.Empty,
                    Error = buildError,
                    ExitCode = build.ExitCode,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    MemoryUsedKB = 0,
                    Verdict = buildVerdict
                }).ToList();
            }

            var appDll = Path.Combine(tempRoot, "bin", "Release", "net10.0", "app.dll");
            var results = new List<CodeExecutionResult>(request.Inputs.Count);
            var timeoutMs = Math.Max(request.TimeLimitMs + 12000, 15000);

            foreach (var input in request.Inputs)
            {
                var run = await RunProcessAsync(
                    "dotnet",
                    $"\"{appDll}\"",
                    tempRoot,
                    input,
                    timeoutMs,
                    cancellationToken);

                results.Add(new CodeExecutionResult
                {
                    Output = run.Stdout.Trim(),
                    Error = run.Stderr.Trim(),
                    ExitCode = run.ExitCode,
                    ExecutionTimeMs = run.ElapsedMs,
                    MemoryUsedKB = 0,
                    Verdict = CodeExecutionHelpers.DetermineVerdict(run.ExitCode, run.Stdout, run.Stderr, false)
                });
            }

            stopwatch.Stop();
            activity?.SetTag("code.verdict", results.Count == 0 ? Verdict.Accepted.ToString() : results[0].Verdict.ToString());
            _telemetry.RecordCodeExecutionDuration(stopwatch.Elapsed.TotalMilliseconds, request.Language, true);
            return results;
        }
        finally
        {
            try
            {
                if (Directory.Exists(tempRoot))
                {
                    Directory.Delete(tempRoot, recursive: true);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to clean up local C# execution workspace {TempRoot}.", tempRoot);
            }
        }
    }

    private static async Task<ProcessResult> RunProcessAsync(
        string fileName,
        string arguments,
        string workingDirectory,
        string? standardInput,
        int timeoutMs,
        CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = startInfo };
        var started = process.Start();
        if (!started)
            throw new InvalidOperationException($"Failed to start process '{fileName}'.");

        var startedAt = Stopwatch.GetTimestamp();
        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        if (!string.IsNullOrEmpty(standardInput))
        {
            await process.StandardInput.WriteAsync(standardInput);
        }
        process.StandardInput.Close();

        using var timeoutCts = new CancellationTokenSource(timeoutMs);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        try
        {
            await process.WaitForExitAsync(linkedCts.Token);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch
            {
                // Ignore kill failures during timeout cleanup.
            }

            return new ProcessResult
            {
                ExitCode = 124,
                Stdout = string.Empty,
                Stderr = "Execution timed out.",
                ElapsedMs = (long)Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds
            };
        }

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        return new ProcessResult
        {
            ExitCode = process.ExitCode,
            Stdout = stdout,
            Stderr = stderr,
            ElapsedMs = (long)Stopwatch.GetElapsedTime(startedAt).TotalMilliseconds
        };
    }

    private static bool CanUseLocalCSharpFallback(string language, InvalidOperationException ex)
    {
        return language.Equals("csharp", StringComparison.OrdinalIgnoreCase)
               && (ex.Message.Contains("Docker executor is unavailable", StringComparison.OrdinalIgnoreCase)
                   || ex.Message.Contains("Docker runner image", StringComparison.OrdinalIgnoreCase)
                   || ex.Message.Contains("Docker executor is unavailable while starting", StringComparison.OrdinalIgnoreCase));
    }

    private static ContainerResources CreateResources(int requestMemoryLimitMb, int defaultLimit)
    {
        var limit = requestMemoryLimitMb <= 0 ? defaultLimit : requestMemoryLimitMb;
        return new ContainerResources
        {
            MemoryLimitMb = Math.Clamp(limit, 64, Math.Max(1024, defaultLimit)),
            CpuLimitNano = DefaultNanoCpus,
            PidLimit = ContainerPidLimit
        };
    }

    private static string[] CreateRunnerEnv(params string[] env)
    {
        return
        [
            .. env,
            "DOTNET_CLI_HOME=/tmp/dotnet",
            "DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1",
            "DOTNET_NOLOGO=1",
            "NUGET_PACKAGES=/tmp/nuget"
        ];
    }

    private static string BuildRunnerError(string stdout, string stderr)
    {
        var message = string.Join('\n', new[] { stdout.Trim(), stderr.Trim() }.Where(s => !string.IsNullOrWhiteSpace(s)));
        return string.IsNullOrWhiteSpace(message) ? "Docker runner exited without output." : message;
    }

    private static string TrimForMessage(string value)
    {
        var trimmed = value.Trim();
        return trimmed.Length <= 800 ? trimmed : $"{trimmed[..800]}...";
    }

    private int GetMemoryLimitForLanguage(string language)
    {
        return language.ToLower() switch
        {
            "csharp" => 1024,
            "java" => 768,
            _ => ContainerMemoryLimitMb
        };
    }

    private sealed class ProcessResult
    {
        public int ExitCode { get; init; }
        public string Stdout { get; init; } = string.Empty;
        public string Stderr { get; init; } = string.Empty;
        public long ElapsedMs { get; init; }
    }
}


