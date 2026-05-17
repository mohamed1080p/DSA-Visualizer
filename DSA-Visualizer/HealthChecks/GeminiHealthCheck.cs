using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DSA_Visualizer.HealthChecks;

public sealed class GeminiHealthCheck(IHttpClientFactory httpClientFactory, IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var aiRequired = configuration.GetValue("Gemini:Required", false);
        var apiKey = configuration["Gemini:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "__SET_VIA_ENV__")
        {
            return aiRequired
                ? HealthCheckResult.Unhealthy("Gemini API key is not configured.")
                : HealthCheckResult.Degraded("Gemini API key is not configured.");
        }

        var client = httpClientFactory.CreateClient("Gemini");

        try
        {
            using var response = await client.GetAsync($"v1beta/models?key={apiKey}", cancellationToken);
            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("Gemini service is available.")
                : ResultForFailure(aiRequired, $"Gemini returned {(int)response.StatusCode}.");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return aiRequired
                ? HealthCheckResult.Unhealthy("Gemini service is unavailable.", ex)
                : HealthCheckResult.Degraded("Gemini service is unavailable.", ex);
        }
    }

    private static HealthCheckResult ResultForFailure(bool required, string description) => required ? HealthCheckResult.Unhealthy(description) : HealthCheckResult.Degraded(description);
}