using Docker.DotNet;
using Docker.DotNet.Models;
using Domain.Models.ProblemsModule;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

namespace Services;

public class CodeExecutionService : ICodeExecutionService
{
    private const int BaseExecutionGraceMs = 2000;
    private const int CompiledLanguageExtraGraceMs = 10000;
    private const int CompiledLanguageMinimumTimeoutMs = 15000;
    private const long DefaultNanoCpus = 2_000_000_000;
    private const int ContainerMemoryLimitMb = 512;

    private readonly DockerClient _dockerClient;
    private readonly ILogger<CodeExecutionService> _logger;

    private readonly Dictionary<string, string> _imageMap;

    private sealed class RunnerBatchItem
    {
        public string OutputBase64 { get; set; } = string.Empty;
        public string ErrorBase64 { get; set; } = string.Empty;
        public int ExitCode { get; set; }
        public long ExecutionTimeMs { get; set; }
    }

    public CodeExecutionService(ILogger<CodeExecutionService> logger)
    {
        _logger = logger;

        _dockerClient = CreateDockerClient();

        _imageMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "python", "code-runner-python:latest" },
            { "cpp", "code-runner-cpp:latest" },
            { "csharp", "code-runner-csharp:latest" },
            { "java", "code-runner-java:latest" }
        };
    }

    private DockerClient CreateDockerClient()
    {
        var dockerHost = Environment.GetEnvironmentVariable("DOCKER_HOST");
        var endpoint = !string.IsNullOrWhiteSpace(dockerHost)
            ? dockerHost
            : RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                ? "npipe://./pipe/docker_engine"
                : "unix:///var/run/docker.sock";

        _logger.LogInformation("Using Docker endpoint: {DockerEndpoint}", endpoint);

        return new DockerClientConfiguration(new Uri(endpoint)).CreateClient();
    }

    public async Task<CodeExecutionResult> ExecuteAsync(
        CodeExecutionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_imageMap.TryGetValue(request.Language, out var image))
            throw new NotSupportedException($"Language '{request.Language}' not supported.");

        if (request.TimeLimitMs <= 0)
            throw new ArgumentOutOfRangeException(nameof(request.TimeLimitMs), "Time limit must be greater than 0.");

        var stopwatch = Stopwatch.StartNew();
        var memoryLimitMb = ContainerMemoryLimitMb;

        var encodedCode = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.SourceCode ?? ""));
        var encodedInput = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.Input ?? ""));

        var container = await _dockerClient.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = image,

            Env = new List<string>
            {
                $"CODE={encodedCode}",
                $"INPUT={encodedInput}"
            },

            HostConfig = new HostConfig
            {
                Memory = (long)memoryLimitMb * 1024 * 1024,
                MemorySwap = (long)memoryLimitMb * 1024 * 1024,
                NanoCPUs = DefaultNanoCpus,
                NetworkMode = "none",
                ReadonlyRootfs = false,
                SecurityOpt = new List<string> { "no-new-privileges:true" }
            }
        }, cancellationToken);

        try
        {
            // Start container
            await _dockerClient.Containers.StartContainerAsync(
                container.ID,
                new ContainerStartParameters(),
                cancellationToken);

            var timeoutMs = CalculateTimeoutMs(request);
            using var timeoutCts = new CancellationTokenSource(timeoutMs);
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            var waitTask = _dockerClient.Containers.WaitContainerAsync(container.ID, linkedCts.Token);

            ContainerWaitResponse waitResponse;
            try
            {
                waitResponse = await waitTask;
            }
            catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
            {
                await TryKillContainerAsync(container.ID);
                stopwatch.Stop();

                return CreateTimeLimitExceededResult(stopwatch.ElapsedMilliseconds);
            }

            cancellationToken.ThrowIfCancellationRequested();
            stopwatch.Stop();

            var (stdout, stderr) = await ReadContainerLogsAsync(container.ID, cancellationToken);
            var inspect = await _dockerClient.Containers.InspectContainerAsync(container.ID, cancellationToken);

            var verdict = DetermineVerdict(
                waitResponse.StatusCode,
                stdout,
                stderr,
                inspect.State?.OOMKilled == true);

            return new CodeExecutionResult
            {
                Output = stdout.Trim(),
                Error = stderr.Trim(),
                ExitCode = (int)waitResponse.StatusCode,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                MemoryUsedKB = 0,
                Verdict = verdict
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Code execution was cancelled by request.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected Docker execution error.");
            stopwatch.Stop();

            return new CodeExecutionResult
            {
                Output = string.Empty,
                Error = "Execution engine failure.",
                ExitCode = -1,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                MemoryUsedKB = 0,
                Verdict = Verdict.RuntimeError
            };
        }
        finally
        {
            try
            {
                await _dockerClient.Containers.RemoveContainerAsync(
                    container.ID,
                    new ContainerRemoveParameters { Force = true },
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to remove container {ContainerId}.", container.ID);
            }
        }
    }

    public async Task<IReadOnlyList<CodeExecutionResult>> ExecuteBatchAsync(
        BatchCodeExecutionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Inputs.Count == 0)
            return Array.Empty<CodeExecutionResult>();

        if (!_imageMap.TryGetValue(request.Language, out var image))
            throw new NotSupportedException($"Language '{request.Language}' not supported.");

        if (request.TimeLimitMs <= 0)
            throw new ArgumentOutOfRangeException(nameof(request.TimeLimitMs), "Time limit must be greater than 0.");

        var stopwatch = Stopwatch.StartNew();
        var memoryLimitMb = ContainerMemoryLimitMb;

        var encodedCode = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.SourceCode ?? string.Empty));
        var rawBatchInputPayload = string.Join('\n', request.Inputs.Select(i =>
            Convert.ToBase64String(Encoding.UTF8.GetBytes(i ?? string.Empty))));
        var encodedInputs = Convert.ToBase64String(Encoding.UTF8.GetBytes(rawBatchInputPayload));

        var container = await _dockerClient.Containers.CreateContainerAsync(new CreateContainerParameters
        {
            Image = image,
            Env = new List<string>
            {
                $"CODE={encodedCode}",
                $"BATCH_INPUTS={encodedInputs}",
                $"TIME_LIMIT_MS={request.TimeLimitMs}"
            },
            HostConfig = new HostConfig
            {
                Memory = (long)memoryLimitMb * 1024 * 1024,
                MemorySwap = (long)memoryLimitMb * 1024 * 1024,
                NanoCPUs = DefaultNanoCpus,
                NetworkMode = "none",
                ReadonlyRootfs = false,
                SecurityOpt = new List<string> { "no-new-privileges:true" }
            }
        }, cancellationToken);

        try
        {
            await _dockerClient.Containers.StartContainerAsync(
                container.ID,
                new ContainerStartParameters(),
                cancellationToken);

            var timeoutMs = CalculateBatchTimeoutMs(request);
            using var timeoutCts = new CancellationTokenSource(timeoutMs);
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            ContainerWaitResponse waitResponse;
            try
            {
                waitResponse = await _dockerClient.Containers.WaitContainerAsync(container.ID, linkedCts.Token);
            }
            catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
            {
                await TryKillContainerAsync(container.ID);
                stopwatch.Stop();
                return request.Inputs.Select(_ => CreateTimeLimitExceededResult(stopwatch.ElapsedMilliseconds)).ToList();
            }

            cancellationToken.ThrowIfCancellationRequested();
            stopwatch.Stop();

            var (stdout, stderr) = await ReadContainerLogsAsync(container.ID, cancellationToken);
            var inspect = await _dockerClient.Containers.InspectContainerAsync(container.ID, cancellationToken);

            if (waitResponse.StatusCode != 0)
            {
                var sharedVerdict = DetermineVerdict(waitResponse.StatusCode, stdout, stderr, inspect.State?.OOMKilled == true);
                return request.Inputs.Select(_ => new CodeExecutionResult
                {
                    Output = string.Empty,
                    Error = stderr.Trim(),
                    ExitCode = (int)waitResponse.StatusCode,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    MemoryUsedKB = 0,
                    Verdict = sharedVerdict
                }).ToList();
            }

            List<RunnerBatchItem>? items;
            try
            {
                items = JsonSerializer.Deserialize<List<RunnerBatchItem>>(
                    stdout,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse python batch runner output.");
                return request.Inputs.Select(_ => new CodeExecutionResult
                {
                    Output = string.Empty,
                    Error = "Execution engine returned invalid batch format.",
                    ExitCode = -1,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    MemoryUsedKB = 0,
                    Verdict = Verdict.RuntimeError
                }).ToList();
            }

            if (items is null || items.Count != request.Inputs.Count)
            {
                return request.Inputs.Select(_ => new CodeExecutionResult
                {
                    Output = string.Empty,
                    Error = "Execution engine returned incomplete batch results.",
                    ExitCode = -1,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    MemoryUsedKB = 0,
                    Verdict = Verdict.RuntimeError
                }).ToList();
            }

            return items.Select(i =>
            {
                var decodedOutput = DecodeBase64OrEmpty(i.OutputBase64);
                var decodedError = DecodeBase64OrEmpty(i.ErrorBase64);

                return new CodeExecutionResult
                {
                    Output = decodedOutput.Trim(),
                    Error = decodedError.Trim(),
                    ExitCode = i.ExitCode,
                    ExecutionTimeMs = i.ExecutionTimeMs,
                    MemoryUsedKB = 0,
                    Verdict = DetermineVerdict(i.ExitCode, decodedOutput, decodedError, oomKilled: false)
                };
            }).ToList();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Batch code execution was cancelled by request.");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected Docker batch execution error.");
            stopwatch.Stop();

            return request.Inputs.Select(_ => new CodeExecutionResult
            {
                Output = string.Empty,
                Error = "Execution engine failure.",
                ExitCode = -1,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                MemoryUsedKB = 0,
                Verdict = Verdict.RuntimeError
            }).ToList();
        }
        finally
        {
            try
            {
                await _dockerClient.Containers.RemoveContainerAsync(
                    container.ID,
                    new ContainerRemoveParameters { Force = true },
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to remove batch container {ContainerId}.", container.ID);
            }
        }
    }

    private static CodeExecutionResult CreateTimeLimitExceededResult(long elapsedMs)
    {
        return new CodeExecutionResult
        {
            Output = string.Empty,
            Error = "Time Limit Exceeded",
            ExitCode = 124,
            ExecutionTimeMs = elapsedMs,
            MemoryUsedKB = 0,
            Verdict = Verdict.TimeLimitExceeded
        };
    }

    private static int CalculateTimeoutMs(CodeExecutionRequest request)
    {
        var timeoutMs = request.TimeLimitMs + BaseExecutionGraceMs;

        if (request.Language.Equals("csharp", StringComparison.OrdinalIgnoreCase) ||
            request.Language.Equals("java", StringComparison.OrdinalIgnoreCase) ||
            request.Language.Equals("cpp", StringComparison.OrdinalIgnoreCase))
        {
            timeoutMs += CompiledLanguageExtraGraceMs;
            timeoutMs = Math.Max(timeoutMs, CompiledLanguageMinimumTimeoutMs);
        }

        return timeoutMs;
    }

    private static int CalculateBatchTimeoutMs(BatchCodeExecutionRequest request)
    {
        var perCaseTimeoutMs = request.TimeLimitMs + BaseExecutionGraceMs;
        var total = Math.Max(5000, perCaseTimeoutMs * request.Inputs.Count);
        return total + 3000;
    }

    private static string DecodeBase64OrEmpty(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        try
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(value));
        }
        catch (FormatException)
        {
            return string.Empty;
        }
    }

    private async Task TryKillContainerAsync(string containerId)
    {
        try
        {
            await _dockerClient.Containers.KillContainerAsync(
                containerId,
                new ContainerKillParameters(),
                CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to kill timed-out container {ContainerId}.", containerId);
        }
    }

    private async Task<(string stdout, string stderr)> ReadContainerLogsAsync(string containerId, CancellationToken cancellationToken)
    {
        using var logsStream = await _dockerClient.Containers.GetContainerLogsAsync(
            containerId,
            tty: false,
            new ContainerLogsParameters
            {
                ShowStdout = true,
                ShowStderr = true,
                Follow = false
            },
            cancellationToken);

        var logs = await logsStream.ReadOutputToEndAsync(cancellationToken);
        return (logs.stdout ?? string.Empty, logs.stderr ?? string.Empty);
    }

    private static Verdict DetermineVerdict(
        long exitCode,
        string stdout,
        string stderr,
        bool oomKilled)
    {
        // TLE should come from the timeout path (forced kill/timeout exit),
        // not from raw wall-clock time that includes compile/container startup.
        if (exitCode == 124)
            return Verdict.TimeLimitExceeded;

        if (oomKilled || exitCode == 137)
            return Verdict.MemoryLimitExceeded;

        if (exitCode == 0)
            return Verdict.Accepted;

        var combinedOutput = $"{stdout}\n{stderr}";
        if (LooksLikeCompilationError(combinedOutput))
            return Verdict.compilationError;

        return Verdict.RuntimeError;
    }

    private static bool LooksLikeCompilationError(string output)
    {
        if (string.IsNullOrWhiteSpace(output))
            return false;

        return output.Contains("error:", StringComparison.OrdinalIgnoreCase)
               || output.Contains("fatal error", StringComparison.OrdinalIgnoreCase)
               || output.Contains("compilation failed", StringComparison.OrdinalIgnoreCase)
               || output.Contains("Build FAILED", StringComparison.OrdinalIgnoreCase);
    }
}