using System.Collections.Concurrent;
using System.Data.Common;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence.Observability;

public sealed class DatabaseCommandTelemetryInterceptor(
    ILogger<DatabaseCommandTelemetryInterceptor> logger) : DbCommandInterceptor
{
    private const double SlowQueryThresholdMs = 500;
    private readonly ConcurrentDictionary<Guid, Activity?> _activities = new();
    public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
    {
        StartActivity(command, eventData);
        return base.ReaderExecuting(command, eventData, result);
    }
    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
    {
        StartActivity(command, eventData);
        return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }
    public override DbDataReader ReaderExecuted(
            DbCommand command,
            CommandExecutedEventData eventData,
            DbDataReader result)
    {
        Record(command, eventData);
        return base.ReaderExecuted(command, eventData, result);
    }
    public override ValueTask<DbDataReader> ReaderExecutedAsync(
            DbCommand command,
            CommandExecutedEventData eventData,
            DbDataReader result,
            CancellationToken cancellationToken = default)
    {
        Record(command, eventData);
        return base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
    }
    public override InterceptionResult<int> NonQueryExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result)
    {
        StartActivity(command, eventData);
        return base.NonQueryExecuting(command, eventData, result);
    }
    public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
    {
        StartActivity(command, eventData);
        return base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
    }
    public override int NonQueryExecuted(
            DbCommand command,
            CommandExecutedEventData eventData,
            int result)
    {
        Record(command, eventData);
        return base.NonQueryExecuted(command, eventData, result);
    }
    public override ValueTask<int> NonQueryExecutedAsync(
            DbCommand command,
            CommandExecutedEventData eventData,
            int result,
            CancellationToken cancellationToken = default)
    {
        Record(command, eventData);
        return base.NonQueryExecutedAsync(command, eventData, result, cancellationToken);
    }
    public override InterceptionResult<object> ScalarExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<object> result)
    {
        StartActivity(command, eventData);
        return base.ScalarExecuting(command, eventData, result);
    }
    public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<object> result,
            CancellationToken cancellationToken = default)
    {
        StartActivity(command, eventData);
        return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }
    public override object? ScalarExecuted(
            DbCommand command,
            CommandExecutedEventData eventData,
            object? result)
    {
        Record(command, eventData);
        return base.ScalarExecuted(command, eventData, result);
    }
    public override ValueTask<object?> ScalarExecutedAsync(
            DbCommand command,
            CommandExecutedEventData eventData,
            object? result,
            CancellationToken cancellationToken = default)
    {
        Record(command, eventData);
        return base.ScalarExecutedAsync(command, eventData, result, cancellationToken);
    }
    public override void CommandFailed(DbCommand command, CommandErrorEventData eventData)
    {
        MarkFailed(eventData);
        base.CommandFailed(command, eventData);
    }
    public override Task CommandFailedAsync(
            DbCommand command,
            CommandErrorEventData eventData,
            CancellationToken cancellationToken = default)
    {
        MarkFailed(eventData);
        return base.CommandFailedAsync(command, eventData, cancellationToken);
    }

    private void StartActivity(DbCommand command, CommandEventData eventData)
    {
        var activity = PersistenceTelemetry.ActivitySource.StartActivity("db.query", ActivityKind.Client);
        activity?.SetTag("db.system", "mssql");
        activity?.SetTag("db.operation", DatabaseCommandOperations.GetOperation(command.CommandText));
        activity?.SetTag("db.command.timeout", command.CommandTimeout);
        _activities[eventData.CommandId] = activity;
    }

    private void Record(DbCommand command, CommandExecutedEventData eventData)
    {
        var elapsedMs = eventData.Duration.TotalMilliseconds;
        var operation = DatabaseCommandOperations.GetOperation(command.CommandText);

        PersistenceTelemetry.DatabaseQueryDurationMs.Record(
            elapsedMs,
            new KeyValuePair<string, object?>("db.system", "mssql"),
            new KeyValuePair<string, object?>("db.operation", operation));

        if (_activities.TryRemove(eventData.CommandId, out var activity))
        {
            activity?.SetTag("db.duration_ms", elapsedMs);
            activity?.SetStatus(ActivityStatusCode.Ok);
            activity?.Stop();
        }

        if (elapsedMs >= SlowQueryThresholdMs)
        {
            logger.LogWarning(
                "Slow database query detected. Operation={DbOperation} DurationMs={DurationMs} TimeoutSeconds={TimeoutSeconds}",
                operation,
                elapsedMs,
                command.CommandTimeout);
        }
    }

    private void MarkFailed(CommandEndEventData eventData)
    {
        if (_activities.TryRemove(eventData.CommandId, out var activity))
        {
            activity?.SetStatus(ActivityStatusCode.Error);
            activity?.Stop();
        }
    }
}


