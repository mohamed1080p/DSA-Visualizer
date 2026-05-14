using System.Diagnostics;
using Services.Observability;
using ServicesAbstraction;

namespace DSA_Visualizer.Middleware;
/// <summary>
/// Ensures every request has a correlation id for logs and client error reporting.
/// </summary>
public sealed class CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger, ITelemetryService telemetry)
{
    public const string HeaderName = "X-Correlation-ID";
    private const int MaxIncomingIdLength = 128;
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(HeaderName, out var incoming)
            && !string.IsNullOrWhiteSpace(incoming))
        {
            var raw = incoming.ToString();
            if (raw.Length <= MaxIncomingIdLength)
                context.TraceIdentifier = raw;
        }

        var correlationId = context.TraceIdentifier;
        Activity.Current?.SetTag("correlation.id", correlationId);
        Activity.Current?.SetBaggage("correlation.id", correlationId);

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        using var scope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["CorrelationId"] = correlationId,
            ["TraceId"] = Activity.Current?.TraceId.ToString()
        });

        var started = Stopwatch.GetTimestamp();
        try
        {
            await next(context);
        }
        finally
        {
            var elapsedMs = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            telemetry.RecordApiRequestDuration(
                elapsedMs,
                context.Request.Method,
                context.GetEndpoint()?.DisplayName ?? context.Request.Path.Value ?? "unknown",
                context.Response.StatusCode);

            logger.LogInformation(
                "HTTP request completed. Method={HttpMethod} Path={Path} StatusCode={StatusCode} DurationMs={DurationMs}",
                context.Request.Method,
                context.Request.Path.Value,
                context.Response.StatusCode,
                elapsedMs);
        }
    }
}


