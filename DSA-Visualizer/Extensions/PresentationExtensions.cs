using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.RateLimiting;
using Hangfire;
using Services;
using Services.Auth;
using Services.Battle;
using Services.CodeExecution;
using Services.Learning;
using Services.Problems;
using Services.Community;
using Services.AI;
using Services.Infrastructure;
using Services.Observability;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace DSA_Visualizer.Extensions;

/// <summary>
/// Extension methods for presentation layer services (CORS, rate limiting, Swagger).
/// </summary>
public static class PresentationExtensions
{
    /// <summary>
    /// Configures CORS from configuration (<c>Cors:Origins</c>). Required for production.
    /// </summary>
    public static void AddCorsPolicies(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
        if (origins.Length == 0
            || origins.Any(o => string.IsNullOrWhiteSpace(o) || o.StartsWith("__", StringComparison.Ordinal)))
        {
            throw new InvalidOperationException(
                "Cors:Origins must list real browser origins (e.g. https://app.example.com). " +
                "Replace template placeholders or set Cors__Origins__0 in environment variables.");
        }

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", builder =>
            {
                builder.WithOrigins(origins)
                       .AllowAnyHeader()
                       .AllowAnyMethod()
                       .AllowCredentials();
            });
        });
    }

    /// <summary>
    /// Configures rate limiting policies for submissions, authentication, and general API access.
    /// </summary>
    public static void AddRateLimitingServices(this IServiceCollection services, IConfiguration configuration)
    {
        var rl = configuration.GetSection("RateLimiting");

        // Submissions rate limit
        var subTokenLimit = rl.GetValue<int>("Submissions:TokenLimit", 5);
        var subReplenishment = rl.GetValue<int>("Submissions:TokensPerPeriodReplenishment", 1);
        var subReplenishPeriodSeconds = rl.GetValue<int>("Submissions:ReplenishmentPeriodSeconds", 15);
        var subQueueLimit = rl.GetValue<int>("Submissions:QueueLimit", 0);

        // Auth rate limit
        var authPermitLimit = rl.GetValue<int>("Auth:PermitLimit", 10);
        var authWindowSeconds = rl.GetValue<int>("Auth:WindowSeconds", 60);
        var authQueueLimit = rl.GetValue<int>("Auth:QueueLimit", 0);

        // General rate limit
        var genPermitLimit = rl.GetValue<int>("General:PermitLimit", 100);
        var genWindowSeconds = rl.GetValue<int>("General:WindowSeconds", 60);
        var genQueueLimit = rl.GetValue<int>("General:QueueLimit", 0);

        services.AddRateLimiter(options =>
        {
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/json";

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)retryAfter.TotalSeconds).ToString();

                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    StatusCode = StatusCodes.Status429TooManyRequests,
                    Message = "Too many requests. Please slow down and try again later."
                }, cancellationToken);
            };

            options.AddPolicy("submissions-policy", ConfigureSubmissionsPolicy(subTokenLimit, subReplenishment, subReplenishPeriodSeconds, subQueueLimit));
            options.AddPolicy("auth-policy", ConfigureAuthPolicy(authPermitLimit, authWindowSeconds, authQueueLimit));
            options.AddPolicy("general-policy", ConfigureGeneralPolicy(genPermitLimit, genWindowSeconds, genQueueLimit));
        });
    }

    /// <summary>
    /// Configures Swagger/OpenAPI for API documentation.
    /// </summary>
    public static void AddSwaggerServices(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
    }

    // Private helpers

    /// <summary>
    /// Configures token bucket rate limiting for code submissions (per user).
    /// </summary>
    private static Func<HttpContext, RateLimitPartition<string>> ConfigureSubmissionsPolicy(
        int tokenLimit, int tokensPerPeriod, int replenishPeriodSeconds, int queueLimit)
    {
        return httpContext =>
        {
            var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? httpContext.Connection.RemoteIpAddress?.ToString()
                         ?? "anonymous";

            return RateLimitPartition.GetTokenBucketLimiter(userId, _ =>
                new TokenBucketRateLimiterOptions
                {
                    TokenLimit = tokenLimit,
                    TokensPerPeriod = tokensPerPeriod,
                    ReplenishmentPeriod = TimeSpan.FromSeconds(replenishPeriodSeconds),
                    AutoReplenishment = true,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = queueLimit
                });
        };
    }

    /// <summary>
    /// Configures fixed window rate limiting for authentication endpoints (per IP).
    /// </summary>
    private static Func<HttpContext, RateLimitPartition<string>> ConfigureAuthPolicy(
        int permitLimit, int windowSeconds, int queueLimit)
    {
        return httpContext =>
        {
            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromSeconds(windowSeconds),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = queueLimit
                });
        };
    }

    /// <summary>
    /// Configures fixed window rate limiting for general API endpoints (per IP).
    /// </summary>
    private static Func<HttpContext, RateLimitPartition<string>> ConfigureGeneralPolicy(
        int permitLimit, int windowSeconds, int queueLimit)
    {
        return httpContext =>
        {
            var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = permitLimit,
                    Window = TimeSpan.FromSeconds(windowSeconds),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = queueLimit
                });
        };
    }

    /// <summary>
    /// Configures Hangfire for background job processing with SQL Server storage.
    /// </summary>
    public static void AddHangfireServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHangfire(config =>
        {
            config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                  .UseSimpleAssemblyNameTypeSerializer()
                  .UseRecommendedSerializerSettings();

            config.UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection"));
        });

        services.AddHangfireServer(options =>
        {
            options.WorkerCount = 3;
        });

        services.AddScoped<SubmissionProcessor>();
    }
}


