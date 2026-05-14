using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using System.Net;

namespace Infrastructure.External.Docker;

public class DockerService : IDockerService, IDisposable
{
    private readonly DockerClient _dockerClient;
    private readonly ILogger<DockerService> _logger;
    public DockerService(ILogger<DockerService> logger)
    {
        _logger = logger;
        _dockerClient = DockerClientFactory.CreateDockerClient(_logger);
    }
    public async Task<string> CreateContainerAsync(string image, IEnumerable<string> env, ContainerResources resources, CancellationToken ct = default)
    {
        var hostConfig = new HostConfig
        {
            Memory = (long)resources.MemoryLimitMb * 1024 * 1024,
            MemorySwap = (long)resources.MemoryLimitMb * 1024 * 1024,
            NanoCPUs = resources.CpuLimitNano,
            PidsLimit = resources.PidLimit,
            NetworkMode = "none",
            ReadonlyRootfs = true,
            CapDrop = new[]
{
"ALL" },
            SecurityOpt = new[]
{
"no-new-privileges:true" },
            Tmpfs = new Dictionary<string, string>
            {
                ["/workspace"] = "rw,exec,nosuid,nodev,size=256m,uid=1000,gid=1000,mode=1777",
                ["/tmp"] = "rw,exec,nosuid,nodev,size=128m,uid=1000,gid=1000,mode=1777"
            }
        };

        try
        {
            var response = await _dockerClient.Containers.CreateContainerAsync(new CreateContainerParameters
            {
                Image = image,
                Env = env.ToList(),
                HostConfig = hostConfig,
                WorkingDir = "/workspace",
                AttachStdout = true,
                AttachStderr = true
            }, ct);
            return response.ID;
        }
        catch (DockerApiException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            throw new InvalidOperationException(
                $"Docker runner image '{image}' was not found. Build the sandbox images with `powershell -ExecutionPolicy Bypass -File scripts/build-docker-sandboxes.ps1`.",
                ex);
        }
        catch (Exception ex) when (LooksLikeDockerConnectionFailure(ex))
        {
            throw new InvalidOperationException(
                "Docker executor is unavailable. Start Docker Desktop, make sure the Linux engine is running, then build the sandbox images.",
                ex);
        }
    }
    public async Task StartContainerAsync(string containerId, CancellationToken ct = default)
    {
        try
        {
            await _dockerClient.Containers.StartContainerAsync(containerId, new ContainerStartParameters(), ct);
        }
        catch (Exception ex) when (LooksLikeDockerConnectionFailure(ex))
        {
            throw new InvalidOperationException(
                "Docker executor is unavailable while starting the sandbox container.",
                ex);
        }
    }
    public async Task<(long statusCode, string stdout, string stderr, bool oomKilled)> WaitAndGetResultsAsync(string containerId, int timeoutMs, CancellationToken ct = default)
    {
        using var timeoutCts = new CancellationTokenSource(timeoutMs);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        try
        {
            var waitResponse = await _dockerClient.Containers.WaitContainerAsync(containerId, linkedCts.Token);

            var (stdout, stderr) = await ReadContainerLogsAsync(containerId, ct);
            var inspect = await _dockerClient.Containers.InspectContainerAsync(containerId, ct);

            return (waitResponse.StatusCode, stdout, stderr, inspect.State?.OOMKilled == true);
        }
        catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested && !ct.IsCancellationRequested)
        {
            await TryKillContainerAsync(containerId);
            return (-1, string.Empty, "Execution timed out.", false);
        }
    }
    public async Task RemoveContainerAsync(string containerId, CancellationToken ct = default)
    {
        try
        {
            await _dockerClient.Containers.RemoveContainerAsync(containerId, new ContainerRemoveParameters
            {
                Force = true
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to remove container {ContainerId}.", containerId);
        }
    }

    private async Task TryKillContainerAsync(string containerId)
    {
        try
        {
            await _dockerClient.Containers.KillContainerAsync(containerId, new ContainerKillParameters(), CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to kill container {ContainerId}.", containerId);
        }
    }

    private async Task<(string stdout, string stderr)> ReadContainerLogsAsync(string containerId, CancellationToken ct)
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
            ct);

        var logs = await logsStream.ReadOutputToEndAsync(ct);
        return (logs.stdout ?? string.Empty, logs.stderr ?? string.Empty);
    }

    private static bool LooksLikeDockerConnectionFailure(Exception ex)
    {
        var message = ex.ToString();
        return ex is TimeoutException
               || message.Contains("docker_engine", StringComparison.OrdinalIgnoreCase)
               || message.Contains("dockerDesktopLinuxEngine", StringComparison.OrdinalIgnoreCase)
               || message.Contains("No such file or directory", StringComparison.OrdinalIgnoreCase)
               || message.Contains("The system cannot find the file specified", StringComparison.OrdinalIgnoreCase)
               || message.Contains("Cannot connect to the Docker daemon", StringComparison.OrdinalIgnoreCase);
    }

    public void Dispose()
    {
        _dockerClient?.Dispose();
        GC.SuppressFinalize(this);
    }
}


