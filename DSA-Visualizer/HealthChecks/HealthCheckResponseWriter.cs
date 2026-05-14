using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DSA_Visualizer.HealthChecks;

public static class HealthCheckResponseWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public static Task WriteJsonAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var payload = new
        {
            status = report.Status.ToString(),
            totalDurationMs = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                durationMs = entry.Value.Duration.TotalMilliseconds,
                description = entry.Value.Description,
                error = entry.Value.Exception?.Message,
                data = entry.Value.Data
            })
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}


