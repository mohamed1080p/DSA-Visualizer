using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

namespace DSA_Visualizer.Extensions;

/// <summary>
/// Extension methods for authentication and authorization services configuration.
/// </summary>
public static class AuthenticationExtensions
{
    /// <summary>
    /// Validates that all required security configuration values are set.
    /// </summary>
    public static void ValidateSecurityConfiguration(this IConfiguration configuration, IHostEnvironment environment)
    {
        var missingSecrets = new List<string>();

        if (IsPlaceholder(configuration["JwtSettings:SecretKey"]))
            missingSecrets.Add("JwtSettings:SecretKey");

        // Only validate external auth secrets in non-development environments
        if (!environment.IsDevelopment())
        {
            if (IsPlaceholder(configuration["ExternalAuth:Google:ClientId"]))
                missingSecrets.Add("ExternalAuth:Google:ClientId");

            if (IsPlaceholder(configuration["ExternalAuth:Google:ClientSecret"]))
                missingSecrets.Add("ExternalAuth:Google:ClientSecret");

            if (IsPlaceholder(configuration["ExternalAuth:GitHub:ClientId"]))
                missingSecrets.Add("ExternalAuth:GitHub:ClientId");

            if (IsPlaceholder(configuration["ExternalAuth:GitHub:ClientSecret"]))
                missingSecrets.Add("ExternalAuth:GitHub:ClientSecret");
        }

        if (IsPlaceholder(configuration["Hangfire:Dashboard:Users:0:Login"]))
            missingSecrets.Add("Hangfire:Dashboard:Users:0:Login");

        if (IsPlaceholder(configuration["Hangfire:Dashboard:Users:0:PasswordClear"]))
            missingSecrets.Add("Hangfire:Dashboard:Users:0:PasswordClear");

        if (IsPlaceholder(configuration.GetConnectionString("DefaultConnection")))
            missingSecrets.Add("ConnectionStrings:DefaultConnection");

        var jwtSecret = configuration["JwtSettings:SecretKey"];
        if (!IsPlaceholder(jwtSecret) && jwtSecret is
            {
                Length: < 32
            })
            missingSecrets.Add("JwtSettings:SecretKey (must be at least 32 characters)");

        if (!environment.IsDevelopment())
        {
            var allowedHosts = configuration["AllowedHosts"];
            if (string.IsNullOrWhiteSpace(allowedHosts)
                || allowedHosts.Contains("REPLACE", StringComparison.OrdinalIgnoreCase)
                || allowedHosts.Contains("__", StringComparison.Ordinal))
                missingSecrets.Add("AllowedHosts (set explicit API hostnames for production)");
        }

        if (missingSecrets.Count > 0)
        {
            throw new InvalidOperationException(
                $"Missing required security configuration values: {string.Join(", ", missingSecrets)}");
        }
    }

    /// <summary>
    /// Configures JWT Bearer authentication with token validation and SignalR support.
    /// </summary>
    public static void AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");

        var authBuilder = services.AddAuthentication(options =>
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
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"].FirstOrDefault();
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                },
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
        });

        // Only add external auth providers when credentials are configured
        var googleClientId = configuration["ExternalAuth:Google:ClientId"];
        var googleClientSecret = configuration["ExternalAuth:Google:ClientSecret"];
        if (!IsPlaceholder(googleClientId) && !IsPlaceholder(googleClientSecret))
        {
            authBuilder.AddGoogle(googleOptions =>
            {
                googleOptions.ClientId = googleClientId!;
                googleOptions.ClientSecret = googleClientSecret!;
            });
        }

        var githubClientId = configuration["ExternalAuth:GitHub:ClientId"];
        var githubClientSecret = configuration["ExternalAuth:GitHub:ClientSecret"];
        if (!IsPlaceholder(githubClientId) && !IsPlaceholder(githubClientSecret))
        {
            authBuilder.AddGitHub(githubOptions =>
            {
                githubOptions.ClientId = githubClientId!;
                githubOptions.ClientSecret = githubClientSecret!;
                githubOptions.Scope.Add("user:email");
            });
        }
    }

    // Private helpers

    private static bool IsPlaceholder(string? value)
        => string.IsNullOrWhiteSpace(value)
           || value.StartsWith("__SET_VIA_ENV__", StringComparison.OrdinalIgnoreCase)
           || value.StartsWith("dummy-", StringComparison.OrdinalIgnoreCase);
}

