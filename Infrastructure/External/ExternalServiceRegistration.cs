using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using ServicesAbstraction;
using Infrastructure.External.Docker;
using Infrastructure.External.Redis;
using Infrastructure.External.Common;

namespace Infrastructure.External;

public static class ExternalServiceRegistration
{
    public static IServiceCollection AddExternalInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Docker
        services.AddSingleton<IDockerService, DockerService>();
        // Redis & Matchmaking
        var redisConnection = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        var redisEnabled = configuration.GetValue<bool>("Redis:Enabled", true);

        if (redisEnabled)
        {
            try
            {
                var multiplexer = ConnectionMultiplexer.Connect(new ConfigurationOptions
                {
                    EndPoints =
{
redisConnection },
                    ConnectTimeout = 2000,
                    AbortOnConnectFail = false,
                });

                if (multiplexer.IsConnected)
                {
                    services.AddSingleton<IConnectionMultiplexer>(multiplexer);
                    services.AddSingleton(new RedisConnectionAccessor(multiplexer));
                    services.AddScoped<ILeaderboardCache, RedisLeaderboardCache>();
                    services.AddScoped<IBattleMatchmakingService, BattleMatchmakingService>();
                }
                else
                {
                    RegisterInMemoryFallback(services);
                }
            }
            catch
            {
                RegisterInMemoryFallback(services);
            }
        }
        else
        {
            RegisterInMemoryFallback(services);
        }

        return services;
    }

    private static void RegisterInMemoryFallback(IServiceCollection services)
    {
        services.AddSingleton(new RedisConnectionAccessor(null));
        services.AddScoped<ILeaderboardCache, RedisLeaderboardCache>();
        services.AddScoped<IBattleMatchmakingService, InMemoryMatchmakingService>();
    }
}


