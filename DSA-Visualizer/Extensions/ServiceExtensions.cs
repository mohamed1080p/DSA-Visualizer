using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Persistence.Data;
using Persistence.Data.Seeds;
using Persistence.Repositories;
using Services;
using ServicesAbstraction;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

namespace DSA_Visualizer.Extensions;

public static class ServiceExtensions
{
    public static void AddSwaggerServices(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
    }

    public static void AddDatabaseServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
    }

    public static void AddIdentityServices(this IServiceCollection services)
    {
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;

            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();
    }

    public static void AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
                ClockSkew = TimeSpan.Zero
            };

            options.Events = new JwtBearerEvents
            {
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";

                    await context.Response.WriteAsJsonAsync(new
                    {
                        StatusCode = StatusCodes.Status401Unauthorized,
                        Message = "You are not authorized. Please login first."
                    });
                }
            };
        })
        .AddGoogle(googleOptions =>
        {
            googleOptions.ClientId = configuration["ExternalAuth:Google:ClientId"]!;
            googleOptions.ClientSecret = configuration["ExternalAuth:Google:ClientSecret"]!;
        })
        .AddGitHub(githubOptions =>
        {
            githubOptions.ClientId = configuration["ExternalAuth:GitHub:ClientId"]!;
            githubOptions.ClientSecret = configuration["ExternalAuth:GitHub:ClientSecret"]!;
            githubOptions.Scope.Add("user:email");
        });
    }

    public static void AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IServiceManager, ServiceManager>();
        services.AddScoped<DataSeeding>();
        services.AddScoped<ICodeExecutionService, CodeExecutionService>();
    }

    public static void AddRateLimitingServices(this IServiceCollection services, IConfiguration configuration)
    {
        var rl = configuration.GetSection("RateLimiting");

        // ── submissions-policy: Token Bucket keyed by authenticated userId ──
        var subTokenLimit = rl.GetValue<int>("Submissions:TokenLimit", 5);
        var subReplenishment = rl.GetValue<int>("Submissions:TokensPerPeriodReplenishment", 1);
        var subReplenishPeriodSeconds = rl.GetValue<int>("Submissions:ReplenishmentPeriodSeconds", 15);
        var subQueueLimit = rl.GetValue<int>("Submissions:QueueLimit", 0);

        // ── auth-policy: Fixed Window keyed by IP ──
        var authPermitLimit = rl.GetValue<int>("Auth:PermitLimit", 10);
        var authWindowSeconds = rl.GetValue<int>("Auth:WindowSeconds", 60);
        var authQueueLimit = rl.GetValue<int>("Auth:QueueLimit", 0);

        // ── general-policy: Fixed Window keyed by IP ──
        var genPermitLimit = rl.GetValue<int>("General:PermitLimit", 100);
        var genWindowSeconds = rl.GetValue<int>("General:WindowSeconds", 60);
        var genQueueLimit = rl.GetValue<int>("General:QueueLimit", 0);

        services.AddRateLimiter(options =>
        {
            // Return a consistent JSON 429 body that matches the project's error format
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

            // ── 1. submissions-policy — Token Bucket, per authenticated user ──
            options.AddPolicy("submissions-policy", httpContext =>
            {
                // Use userId from JWT when authenticated; fall back to IP for safety
                var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                             ?? httpContext.Connection.RemoteIpAddress?.ToString()
                             ?? "anonymous";

                return RateLimitPartition.GetTokenBucketLimiter(userId, _ =>
                    new TokenBucketRateLimiterOptions
                    {
                        TokenLimit = subTokenLimit,
                        TokensPerPeriod = subReplenishment,
                        ReplenishmentPeriod = TimeSpan.FromSeconds(subReplenishPeriodSeconds),
                        AutoReplenishment = true,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = subQueueLimit
                    });
            });

            // ── 2. auth-policy — Fixed Window, per IP ──
            options.AddPolicy("auth-policy", httpContext =>
            {
                var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
                    new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authPermitLimit,
                        Window = TimeSpan.FromSeconds(authWindowSeconds),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = authQueueLimit
                    });
            });

            // ── 3. general-policy — Fixed Window, per IP ──
            options.AddPolicy("general-policy", httpContext =>
            {
                var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
                    new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = genPermitLimit,
                        Window = TimeSpan.FromSeconds(genWindowSeconds),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = genQueueLimit
                    });
            });
        });
    }
}
