using Domain.Exceptions;
using DSA_Visualizer.Extensions;
using DSA_Visualizer.Middleware;
using Infrastructure.Persistence.Data.Seeds;
using Infrastructure.Persistence;
using Services.Infrastructure;
using Infrastructure.External;
using Hangfire;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using Infrastructure.Presentation.Hubs.Battle;
using DSA_Visualizer.Observability;

namespace DSA_Visualizer
{
    public static class Program
    {
        public static async Task Main(string[] args)
        {
            LoadLocalEnvironmentVariables();

            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration.ValidateSecurityConfiguration(builder.Environment);

            builder.Services.AddControllers();
            builder.Services.AddSwaggerServices();
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddProblemDetails();
            builder.Services.AddObservabilityServices(builder.Configuration, builder.Environment);
            builder.Services.AddDatabaseServices(builder.Configuration);
            builder.Services.AddRepositoryServices();
            builder.Services.AddDataSeeding();
            builder.Services.AddAspNetIdentity();
            builder.Services.AddJwtAuthentication(builder.Configuration);
            builder.Services.AddExternalInfrastructure(builder.Configuration);
            builder.Services.AddApplicationServices(builder.Configuration);
            builder.Services.AddRateLimitingServices(builder.Configuration);
            builder.Services.AddHangfireServices(builder.Configuration);
            builder.Services.AddBattleServices(builder.Configuration);
            builder.Services.AddApplicationHealthChecks(builder.Environment);
            builder.Services.Configure<HubOptions>(options =>
            {
                options.AddFilter<SignalRTracingFilter>();
            });
            builder.Services.AddCorsPolicies(builder.Configuration);

            var app = builder.Build();

            GlobalJobFilters.Filters.Add(app.Services.GetRequiredService<HangfireCorrelationFilter>());

            using (var scope = app.Services.CreateScope())
            {
                var startupLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Startup");
                try
                {
                    var seeder = scope.ServiceProvider.GetRequiredService<DataSeeding>();
                    await seeder.SeedAsync();
                }
                catch (Exception ex)
                {
                    startupLogger.LogCritical(ex, "Database seeding failed.");
                    if (!app.Environment.IsDevelopment())
                        throw;
                }
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseMiddleware<CorrelationIdMiddleware>();
            app.UseExceptionHandler();

            if (int.TryParse(app.Configuration["ASPNETCORE_HTTPS_PORT"], out var httpsPort) && httpsPort > 0)
                app.UseHttpsRedirection();

            app.UseStaticFiles();
            app.UseCors("AllowFrontend");
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseRateLimiter();

            var enableHangfireDashboard = app.Environment.IsDevelopment()
                || app.Configuration.GetValue("Hangfire:Dashboard:EnableInNonDevelopment", false);

            if (enableHangfireDashboard)
            {
                var hangfireUser = app.Configuration.GetSection("Hangfire:Dashboard:Users:0");
                var login = hangfireUser["Login"];
                var password = hangfireUser["PasswordClear"];
                if (!string.IsNullOrWhiteSpace(login) && !string.IsNullOrWhiteSpace(password))
                {
                    app.UseHangfireDashboard("/hangfire", new DashboardOptions
                    {
                        Authorization = new[]
{
new BasicAuthAuthorizationFilter(login, password) }
                    });
                }
            }

            app.MapControllers();
            app.MapHub<BattleHub>("/hubs/battle");
            app.MapHub<Infrastructure.Presentation.Hubs.Community.CommunityHub>("/hubs/community");
            app.MapApplicationHealthChecks();
            app.MapFallbackToFile("index.html");
            await app.RunAsync();
        }

        private static void LoadLocalEnvironmentVariables()
        {
            var currentDirectory = Directory.GetCurrentDirectory();
            var searchDirectories = new List<string> { currentDirectory };

            var parent = Directory.GetParent(currentDirectory);
            while (parent != null)
            {
                searchDirectories.Add(parent.FullName);
                parent = parent.Parent;
            }

            foreach (var directory in searchDirectories.Distinct())
            {
                if (TryLoadEnvironmentVariablesFromFile(directory))
                {
                    break;
                }
            }

            MapLegacyOAuthEnvironmentVariables();
        }

        private static bool TryLoadEnvironmentVariablesFromFile(string directory)
        {
            var envPath = Path.Combine(directory, ".env");
            if (!File.Exists(envPath))
            {
                return false;
            }

            foreach (var line in File.ReadAllLines(envPath))
            {
                TrySetEnvironmentVariableFromLine(line);
            }

            return true;
        }

        private static void TrySetEnvironmentVariableFromLine(string line)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#'))
            {
                return;
            }

            var separatorIndex = trimmed.IndexOf('=');
            if (separatorIndex <= 0)
            {
                return;
            }

            var key = trimmed[..separatorIndex].Trim();
            var value = trimmed[(separatorIndex + 1)..].Trim().Trim('"');
            if (string.IsNullOrWhiteSpace(key) || Environment.GetEnvironmentVariable(key) is not null)
            {
                return;
            }

            Environment.SetEnvironmentVariable(key, value);
        }

        private static void MapLegacyOAuthEnvironmentVariables()
        {
            CopyEnvironmentVariable("GOOGLE_CLIENT_ID", "ExternalAuth__Google__ClientId");
            CopyEnvironmentVariable("GOOGLE_CLIENT_SECRET", "ExternalAuth__Google__ClientSecret");
            CopyEnvironmentVariable("GITHUB_CLIENT_ID", "ExternalAuth__GitHub__ClientId");
            CopyEnvironmentVariable("GITHUB_CLIENT_SECRET", "ExternalAuth__GitHub__ClientSecret");
        }

        private static void CopyEnvironmentVariable(string sourceKey, string destinationKey)
        {
            var sourceValue = Environment.GetEnvironmentVariable(sourceKey);
            if (string.IsNullOrWhiteSpace(sourceValue) || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(destinationKey)))
            {
                return;
            }

            Environment.SetEnvironmentVariable(destinationKey, sourceValue);
        }
    }
}


