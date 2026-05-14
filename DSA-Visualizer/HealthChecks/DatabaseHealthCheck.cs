using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Infrastructure.Persistence.Data;

namespace DSA_Visualizer.HealthChecks;

public sealed class DatabaseHealthCheck(ApplicationDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);
        return canConnect
            ? HealthCheckResult.Healthy("Database connection is available.")
            : HealthCheckResult.Unhealthy("Database connection is unavailable.");
    }
}


