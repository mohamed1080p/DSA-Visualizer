using Services.CodeExecution;
using Domain.Models.ProblemsModule;
using Microsoft.Extensions.Logging;

using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Diagnostics;
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

        var stopwatch = Stopwatch.StartNew();
        var encodedCode = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.SourceCode ?? ""));
        var encodedInput = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.Input ?? ""));

        var resources = CreateResources(request.MemoryLimitMB);
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
    public async Task<IReadOnlyList<CodeExecutionResult>> ExecuteBatchAsync(BatchCodeExecutionRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.Inputs.Count == 0) return Array.Empty<CodeExecutionResult>();
        if (!_imageMap.TryGetValue(request.Language, out var image))
            throw new NotSupportedException($"Language '{request.Language}' not supported.");

        using var activity = _telemetry.ActivitySource.StartActivity("code.execute_batch", ActivityKind.Internal);
        activity?.SetTag("code.language", request.Language);

        var stopwatch = Stopwatch.StartNew();
        var encodedCode = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.SourceCode ?? string.Empty));
        var rawBatchInputPayload = string.Join('\n', request.Inputs.Select(i => Convert.ToBase64String(Encoding.UTF8.GetBytes(i ?? string.Empty))));
        var encodedInputs = Convert.ToBase64String(Encoding.UTF8.GetBytes(rawBatchInputPayload));

        var resources = CreateResources(request.MemoryLimitMB);
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

    private static ContainerResources CreateResources(int memoryLimitMb)
    {
        return new ContainerResources
        {
            MemoryLimitMb = Math.Clamp(memoryLimitMb <= 0 ? ContainerMemoryLimitMb : memoryLimitMb, 64, ContainerMemoryLimitMb),
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
}


