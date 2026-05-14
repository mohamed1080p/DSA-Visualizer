using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Infrastructure.Persistence.Observability;
using Infrastructure.Persistence.Data;
using Infrastructure.Persistence.Data.Seeds;
using Infrastructure.Persistence.Repositories.Auth;
using Infrastructure.Persistence.Repositories.Problems;
using Infrastructure.Persistence.Repositories.Leaderboard;
using Infrastructure.Persistence.Repositories.Common;

namespace Infrastructure.Persistence;

/// <summary>
/// Extension methods for data persistence and database services configuration.
/// </summary>
public static class PersistenceExtensions
{
    /// <summary>
    /// Configures Entity Framework Core with SQL Server as the database provider.
    /// </summary>
    public static void AddDatabaseServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

        services.AddSingleton<DatabaseCommandTelemetryInterceptor>();

        services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
        {
            options.UseSqlServer(connectionString, sql =>
            {
                sql.CommandTimeout(configuration.GetValue("Database:CommandTimeoutSeconds", 30));
                sql.EnableRetryOnFailure(
                    maxRetryCount: configuration.GetValue("Database:MaxRetryCount", 5),
                    maxRetryDelay: TimeSpan.FromSeconds(configuration.GetValue("Database:MaxRetryDelaySeconds", 10)),
                    errorNumbersToAdd: null);
            });

            options.AddInterceptors(serviceProvider.GetRequiredService<DatabaseCommandTelemetryInterceptor>());
        });
    }

    /// <summary>
    /// Registers ASP.NET Core Identity with EF Core stores (persistence layer only — no JWT/OAuth here).
    /// </summary>
    public static void AddAspNetIdentity(this IServiceCollection services)
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

    /// <summary>
    /// Registers the Unit of Work pattern for repository abstraction.
    /// </summary>
    public static void AddRepositoryServices(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ILeaderboardReadRepository, LeaderboardReadRepository>();
    }

    /// <summary>
    /// Registers data seeding service for initial database population.
    /// </summary>
    public static void AddDataSeeding(this IServiceCollection services)
    {
        services.AddScoped<DataSeeding>();
    }
}


