using System;
using System.Runtime.InteropServices;
using Docker.DotNet;
using Microsoft.Extensions.Logging;

namespace Infrastructure.External.Docker;

internal static class DockerClientFactory
{
    public static DockerClient CreateDockerClient(ILogger logger)
    {
        var dockerHost = Environment.GetEnvironmentVariable("DOCKER_HOST");
        string endpoint;

        if (!string.IsNullOrWhiteSpace(dockerHost))
        {
            endpoint = dockerHost;
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            endpoint = "npipe://./pipe/docker_engine";
        }
        else
        {
            endpoint = "unix:///var/run/docker.sock";
        }

        logger.LogInformation("Using Docker endpoint: {DockerEndpoint}", endpoint);
        return new DockerClientConfiguration(new Uri(endpoint)).CreateClient();
    }
}



