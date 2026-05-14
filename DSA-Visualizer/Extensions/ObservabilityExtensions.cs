using DSA_Visualizer.HealthChecks;
using DSA_Visualizer.Observability;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Infrastructure.Persistence.Observability;
using Services.Observability;

namespace DSA_Visualizer.Extensions;

public static class ObservabilityExtensions
{
    public static IServiceCollection AddObservabilityServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddSingleton<HangfireCorrelationFilter>();
        services.AddSingleton<SignalRTracingFilter>();

        var serviceVersion = typeof(Program).Assembly.GetName().Version?.ToString() ?? "unknown";

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(
                    serviceName: TelemetryService.ServiceName,
                    serviceVersion: serviceVersion,
                    serviceInstanceId: Environment.MachineName)
                .AddAttributes(new Dictionary<string, object>
                {
                    ["deployment.environment"] = environment.EnvironmentName
                }))
            .WithTracing(tracing =>
            {
                tracing
                    .AddSource(TelemetryService.ServiceName)
                    .AddSource(PersistenceTelemetry.SourceName)
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.Filter = context =>
                            !context.Request.Path.StartsWithSegments("/health/live");
                    })
                    .AddHttpClientInstrumentation(options => options.RecordException = true);

                var otlpEndpoint = configuration["OpenTelemetry:OtlpEndpoint"];
                if (!string.IsNullOrWhiteSpace(otlpEndpoint))
                    tracing.AddOtlpExporter();
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .AddMeter(TelemetryService.StaticMeter.Name)
                    .AddMeter(PersistenceTelemetry.Meter.Name)
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation();

                var otlpEndpoint = configuration["OpenTelemetry:OtlpEndpoint"];
                if (!string.IsNullOrWhiteSpace(otlpEndpoint))
                    metrics.AddOtlpExporter();
            });

        return services;
    }
    public static IServiceCollection AddApplicationHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), tags: ["live"])
            .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"])
            .AddCheck<RedisHealthCheck>("redis", tags: ["ready"])
            .AddCheck<OllamaHealthCheck>("ollama", tags: ["ready"])
            .AddCheck<DockerExecutorHealthCheck>("docker-executor", tags: ["ready"]);

        return services;
    }
    public static IEndpointRouteBuilder MapApplicationHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = registration => registration.Tags.Contains("live"),
            ResponseWriter = HealthCheckResponseWriter.WriteJsonAsync
        });

        endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = registration => registration.Tags.Contains("ready"),
            ResponseWriter = HealthCheckResponseWriter.WriteJsonAsync
        });

        return endpoints;
    }
}


