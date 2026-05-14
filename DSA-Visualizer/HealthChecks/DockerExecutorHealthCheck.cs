using System.Runtime.InteropServices;
using Docker.DotNet;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DSA_Visualizer.HealthChecks;

public sealed class DockerExecutorHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var dockerRequired = configuration.GetValue("DockerExecutor:Required", true);

        try
        {
            using var client = new DockerClientConfiguration(new Uri(GetDockerEndpoint())).CreateClient();
            await client.System.PingAsync(cancellationToken);
            return HealthCheckResult.Healthy("Docker executor is available.");
        }
        catch (Exception ex)
        {
            return dockerRequired
                ? HealthCheckResult.Unhealthy("Docker executor is unavailable.", ex)
                : HealthCheckResult.Degraded("Docker executor is unavailable.", ex);
        }
    }

    private static string GetDockerEndpoint()
    {
        var dockerHost = Environment.GetEnvironmentVariable("DOCKER_HOST");
        if (!string.IsNullOrWhiteSpace(dockerHost))
            return dockerHost;

        return RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? "npipe://./pipe/docker_engine"
            : "unix:///var/run/docker.sock";
    }
}


