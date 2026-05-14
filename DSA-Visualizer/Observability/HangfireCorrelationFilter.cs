using System.Diagnostics;
using Hangfire.Client;
using Hangfire.Common;
using Hangfire.Server;
using Microsoft.Extensions.Logging;
using Services.Observability;

namespace DSA_Visualizer.Observability;

public sealed class HangfireCorrelationFilter(ILogger<HangfireCorrelationFilter> logger) :
    JobFilterAttribute,
    IClientFilter,
    IServerFilter
{
    private const string CorrelationIdParameter = "CorrelationId";
    private const string EnqueuedAtParameter = "EnqueuedAtUnixMs";
    private const string ActivityItem = "otel.activity";
    private const string ScopeItem = "logger.scope";
    public void OnCreating(CreatingContext filterContext)
    {
        var correlationId = Activity.Current?.TraceId.ToString()
            ?? Activity.Current?.RootId
            ?? Guid.NewGuid().ToString("N");

        filterContext.SetJobParameter(CorrelationIdParameter, correlationId);
        filterContext.SetJobParameter(EnqueuedAtParameter, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
    }
    public void OnCreated(CreatedContext filterContext)
    {
    }
    public void OnPerforming(PerformingContext filterContext)
    {
        var job = filterContext.BackgroundJob.Job;
        var correlationId = filterContext.GetJobParameter<string>(CorrelationIdParameter)
            ?? filterContext.BackgroundJob.Id;
        var enqueuedAtUnixMs = filterContext.GetJobParameter<long?>(EnqueuedAtParameter);

        if (enqueuedAtUnixMs.HasValue)
        {
            var elapsedMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - enqueuedAtUnixMs.Value;
            // Record metric using static meter as attributes don't support DI easily
            // We'll use the same meter name as TelemetryService
        }

        var activity = TelemetryService.StaticActivitySource.StartActivity(
            $"hangfire {job.Type.Name}.{job.Method.Name}",
            ActivityKind.Consumer);
        activity?.SetTag("job.system", "hangfire");
        activity?.SetTag("job.id", filterContext.BackgroundJob.Id);
        activity?.SetTag("job.type", job.Type.FullName);
        activity?.SetTag("job.method", job.Method.Name);
        activity?.SetTag("correlation.id", correlationId);
        activity?.SetBaggage("correlation.id", correlationId);

        var scope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["CorrelationId"] = correlationId,
            ["HangfireJobId"] = filterContext.BackgroundJob.Id,
            ["HangfireJobType"] = job.Type.FullName,
            ["HangfireJobMethod"] = job.Method.Name
        });

        logger.LogInformation(
            "Hangfire job started. JobId={HangfireJobId} JobType={HangfireJobType} JobMethod={HangfireJobMethod}",
            filterContext.BackgroundJob.Id,
            job.Type.FullName,
            job.Method.Name);

        filterContext.Items[ActivityItem] = activity;
        filterContext.Items[ScopeItem] = scope;
    }
    public void OnPerformed(PerformedContext filterContext)
    {
        if (filterContext.Items.TryGetValue(ActivityItem, out var activityObj)
            && activityObj is Activity activity)
        {
            if (filterContext.Exception is not null)
            {
                activity.SetStatus(ActivityStatusCode.Error);
                activity.SetTag("exception.type", filterContext.Exception.GetType().FullName);
                activity.SetTag("exception.message", filterContext.Exception.Message);
            }
            else
            {
                activity.SetStatus(ActivityStatusCode.Ok);
            }

            activity.Stop();
            activity.Dispose();
        }

        if (filterContext.Exception is not null)
        {
            logger.LogError(
                filterContext.Exception,
                "Hangfire job failed. JobId={HangfireJobId}",
                filterContext.BackgroundJob.Id);
        }
        else
        {
            logger.LogInformation(
                "Hangfire job completed. JobId={HangfireJobId}",
                filterContext.BackgroundJob.Id);
        }

        if (filterContext.Items.TryGetValue(ScopeItem, out var scopeObj)
            && scopeObj is IDisposable scope)
        {
            scope.Dispose();
        }
    }
}


