using System.Diagnostics;
using DSA_Visualizer.Middleware;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Services.Observability;
using ServicesAbstraction;

namespace DSA_Visualizer.Observability;

public sealed class SignalRTracingFilter(ILogger<SignalRTracingFilter> logger, ITelemetryService telemetry) : IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        var correlationId = GetCorrelationId(invocationContext.Context);
        using var activity = telemetry.ActivitySource.StartActivity(
            $"signalr {invocationContext.HubMethodName}",
            ActivityKind.Server);
        activity?.SetTag("signalr.hub", invocationContext.Hub.GetType().Name);
        activity?.SetTag("signalr.method", invocationContext.HubMethodName);
        activity?.SetTag("signalr.connection_id", invocationContext.Context.ConnectionId);
        activity?.SetTag("enduser.id", invocationContext.Context.UserIdentifier);
        activity?.SetTag("correlation.id", correlationId);

        using var scope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["CorrelationId"] = correlationId,
            ["SignalRConnectionId"] = invocationContext.Context.ConnectionId,
            ["SignalRHub"] = invocationContext.Hub.GetType().Name,
            ["SignalRMethod"] = invocationContext.HubMethodName,
            ["UserId"] = invocationContext.Context.UserIdentifier
        });

        try
        {
            return await next(invocationContext);
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error);
            activity?.SetTag("exception.type", ex.GetType().FullName);
            activity?.SetTag("exception.message", ex.Message);
            logger.LogError(
                ex,
                "SignalR invocation failed. Hub={SignalRHub} Method={SignalRMethod} ConnectionId={SignalRConnectionId}",
                invocationContext.Hub.GetType().Name,
                invocationContext.HubMethodName,
                invocationContext.Context.ConnectionId);
            throw;
        }
    }
    public async Task OnConnectedAsync(HubLifetimeContext context, Func<HubLifetimeContext, Task> next)
    {
        using var activity = telemetry.ActivitySource.StartActivity("signalr connected", ActivityKind.Server);
        activity?.SetTag("signalr.connection_id", context.Context.ConnectionId);
        activity?.SetTag("enduser.id", context.Context.UserIdentifier);
        activity?.SetTag("correlation.id", GetCorrelationId(context.Context));

        await next(context);
    }
    public async Task OnDisconnectedAsync(
            HubLifetimeContext context,
            Exception? exception,
            Func<HubLifetimeContext, Exception?, Task> next)
    {
        using var activity = telemetry.ActivitySource.StartActivity("signalr disconnected", ActivityKind.Server);
        activity?.SetTag("signalr.connection_id", context.Context.ConnectionId);
        activity?.SetTag("enduser.id", context.Context.UserIdentifier);
        activity?.SetTag("correlation.id", GetCorrelationId(context.Context));

        if (exception is not null)
        {
            activity?.SetStatus(ActivityStatusCode.Error);
            activity?.SetTag("exception.type", exception.GetType().FullName);
            activity?.SetTag("exception.message", exception.Message);
        }

        await next(context, exception);
    }

    private static string GetCorrelationId(HubCallerContext context)
    {
        var httpContext = context.GetHttpContext();
        if (httpContext?.Request.Headers.TryGetValue(CorrelationIdMiddleware.HeaderName, out var header) == true
            && !string.IsNullOrWhiteSpace(header))
        {
            return header.ToString();
        }

        return Activity.Current?.TraceId.ToString() ?? context.ConnectionId;
    }
}


