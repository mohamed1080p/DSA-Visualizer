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
    public class Program
    {
        public static async Task Main(string[] args)
        {
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
            builder.Services.AddApplicationHealthChecks();
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
            app.Run();
        }
    }
}


