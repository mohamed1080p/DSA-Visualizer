using Microsoft.Extensions.Diagnostics.HealthChecks;
using ServicesAbstraction;
using Services.Auth;
using Services.Battle;
using Services.CodeExecution;
using Services.Learning;
using Services.Problems;
using Services.Community;
using Services.AI;
using Infrastructure.External.Redis;
using Services.Observability;

namespace DSA_Visualizer.HealthChecks;

public sealed class RedisHealthCheck(RedisConnectionAccessor redisAccessor, IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var redisRequired = configuration.GetValue("Redis:Required", false);
        var connection = redisAccessor.Connection;

        if (connection is null || !connection.IsConnected)
        {
            return redisRequired
                ? HealthCheckResult.Unhealthy("Redis is required but unavailable.")
                : HealthCheckResult.Degraded("Redis is unavailable; in-memory fallback is active.");
        }

        try
        {
            await connection.GetDatabase().PingAsync();
            return HealthCheckResult.Healthy("Redis connection is available.");
        }
        catch (Exception ex)
        {
            return redisRequired
                ? HealthCheckResult.Unhealthy("Redis ping failed.", ex)
                : HealthCheckResult.Degraded("Redis ping failed; in-memory fallback is active.", ex);
        }
    }
}



