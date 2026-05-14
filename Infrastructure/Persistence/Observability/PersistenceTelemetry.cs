using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace Infrastructure.Persistence.Observability;

public static class PersistenceTelemetry
{
    public const string SourceName = "DSA.Visualizer.Persistence";
    public static readonly ActivitySource ActivitySource = new(SourceName);
    public static readonly Meter Meter = new(SourceName);
    public static readonly Histogram<double> DatabaseQueryDurationMs =
            Meter.CreateHistogram<double>(
                "dsa.database.query.duration",
                unit: "ms",
                description: "Entity Framework database command duration.");
}


