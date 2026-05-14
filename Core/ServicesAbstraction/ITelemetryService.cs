using System.Diagnostics;

namespace ServicesAbstraction;

/// <summary>
/// Provides standardized observability and telemetry tracking for the application.
/// Replaces static telemetry access with a clean service abstraction.
/// </summary>
public interface ITelemetryService
{
    ActivitySource ActivitySource { get; }
    void RecordApiRequestDuration(double elapsedMs, string method, string route, int statusCode);
    void RecordDatabaseQueryDuration(double durationMs, string operation);
    void RecordRedisLatency(double durationMs, string operation);
    void RecordQueueWaitDuration(double elapsedMs, string queueName, string? subQueue = null);
    void RecordMatchmakingLatency(double elapsedMs, string backend);
    void RecordCodeExecutionDuration(double durationMs, string language, bool isBatch);
    void RecordBattleSubmissionDuration(double durationMs, string language);
    void TrackAuditEvent(string eventName, string userId, params KeyValuePair<string, object?>[] extraTags);
    
    /// <summary>
    /// Measures the execution of a task and records its latency to Redis metrics.
    /// </summary>
    Task<T> MeasureRedisAsync<T>(string operation, Func<Task<T>> action);
}
