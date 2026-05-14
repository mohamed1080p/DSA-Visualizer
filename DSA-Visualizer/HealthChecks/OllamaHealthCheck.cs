using Microsoft.Extensions.Diagnostics.HealthChecks;
namespace DSA_Visualizer.HealthChecks;

public sealed class OllamaHealthCheck(IHttpClientFactory httpClientFactory, IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var aiRequired = configuration.GetValue("Ollama:Required", false);
        var client = httpClientFactory.CreateClient("ollama");
        try
        {
            using var response = await client.GetAsync("api/tags", cancellationToken);
            return response.IsSuccessStatusCode ? HealthCheckResult.Healthy("Ollama service is available.") : ResultForFailure(aiRequired, $"Ollama returned {(int)response.StatusCode}.");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return aiRequired ? HealthCheckResult.Unhealthy("Ollama service is unavailable.", ex) : HealthCheckResult.Degraded("Ollama service is unavailable.", ex);
        }
    }
    private static HealthCheckResult ResultForFailure(bool required, string description) => required ? HealthCheckResult.Unhealthy(description) : HealthCheckResult.Degraded(description);
}


