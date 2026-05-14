using System.Diagnostics;
using System.Diagnostics.Metrics;
using ServicesAbstraction;

namespace Services.Observability
{
    public class TelemetryService : ITelemetryService
    {
        public const string ServiceName = "AlgoScope.API";
        public static readonly ActivitySource StaticActivitySource = new(ServiceName);
        public static readonly Meter StaticMeter = new(ServiceName);
        public ActivitySource ActivitySource => StaticActivitySource;
        // Metrics
        private static readonly Counter<long> AuditEvents = StaticMeter.CreateCounter<long>("auth.audit_events");
        private static readonly Histogram<double> ApiRequestDurationMs = StaticMeter.CreateHistogram<double>("api.request_duration_ms");
        private static readonly Histogram<double> DatabaseQueryDurationMs = StaticMeter.CreateHistogram<double>("db.query_duration_ms");
        private static readonly Histogram<double> RedisLatencyMs = StaticMeter.CreateHistogram<double>("redis.latency_ms");
        private static readonly Histogram<double> MatchmakingLatencyMs = StaticMeter.CreateHistogram<double>("matchmaking.latency_ms");
        private static readonly Histogram<double> QueueWaitDurationMs = StaticMeter.CreateHistogram<double>("queue.wait_duration_ms");
        private static readonly Histogram<double> CodeExecutionDurationMs = StaticMeter.CreateHistogram<double>("code.execution_duration_ms");
        private static readonly Histogram<double> BattleSubmissionDurationMs = StaticMeter.CreateHistogram<double>("battle.submission_duration_ms");
        public void TrackAuditEvent(string eventName, string userId, params KeyValuePair<string, object?>[] extraTags)
        {
            var tags = new TagList
            {

{
"audit.event", eventName },

{
"enduser.id", userId }
            };
            foreach (var tag in extraTags) tags.Add(tag);
            AuditEvents.Add(1, tags);
        }
        public async Task<T> MeasureRedisAsync<T>(string operation, Func<Task<T>> action)
        {
            var started = Stopwatch.GetTimestamp();
            try
            {
                return await action();
            }
            finally
            {
                var elapsedMs = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
                RecordRedisLatency(elapsedMs, operation);
            }
        }
        public void RecordDatabaseQueryDuration(double durationMs, string operation) =>
                    DatabaseQueryDurationMs.Record(durationMs, new KeyValuePair<string, object?>[]
        {
new("db.operation", operation) });
        public void RecordRedisLatency(double durationMs, string operation) =>
                    RedisLatencyMs.Record(durationMs, new KeyValuePair<string, object?>[]
        {
new("redis.operation", operation) });
        public void RecordQueueWaitDuration(double elapsedMs, string queueName, string? subQueue = null)
        {
            var tags = new TagList
            {

{
"queue.system", "redis" },

{
"queue.name", queueName }
            };
            if (subQueue != null) tags.Add("queue.sub_name", subQueue);
            QueueWaitDurationMs.Record(elapsedMs, tags);
        }
        public void RecordMatchmakingLatency(double elapsedMs, string backend) =>
                    MatchmakingLatencyMs.Record(elapsedMs, new KeyValuePair<string, object?>[]
        {
new("matchmaking.backend", backend) });
        public void RecordCodeExecutionDuration(double durationMs, string language, bool isBatch) =>
                    CodeExecutionDurationMs.Record(durationMs,
                        new KeyValuePair<string, object?>("code.language", language),
                        new KeyValuePair<string, object?>("code.execution.batch", isBatch));
        public void RecordBattleSubmissionDuration(double durationMs, string language) =>
                    BattleSubmissionDurationMs.Record(durationMs, new KeyValuePair<string, object?>[]
        {
new("code.language", language) });
        public void RecordApiRequestDuration(double elapsedMs, string method, string route, int statusCode) =>
                    ApiRequestDurationMs.Record(elapsedMs,
                        new KeyValuePair<string, object?>("http.request.method", method),
                        (KeyValuePair<string, object?>)new("http.route", route),
                        (KeyValuePair<string, object?>)new("http.response.status_code", statusCode));
    }
}



