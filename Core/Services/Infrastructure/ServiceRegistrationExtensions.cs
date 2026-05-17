using Services.Auth;
using Services.Battle;
using Services.CodeExecution;
using Services.Learning;
using Services.Problems;
using Services.Community;
using Services.AI;
using Services.Infrastructure;
using Services.Observability;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using ServicesAbstraction;
using Services;
using Polly;
using Polly.Extensions.Http;

namespace Services.Infrastructure;

public static class ServiceRegistrationExtensions
{
    public static void AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient();
        services.AddHttpClient("Gemini", (_, client) =>
        {
            var baseUrl = (configuration["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com").TrimEnd('/');
            client.BaseAddress = new Uri(baseUrl + "/");
            var timeoutSeconds = configuration.GetValue("Gemini:RequestTimeoutSeconds", 120);
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
        })
        .AddTransientHttpErrorPolicy(policy => policy.WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
        .AddTransientHttpErrorPolicy(policy => policy.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

        services.AddSingleton<ITelemetryService, TelemetryService>();
        services.AddScoped<ITokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ICodeExecutionService, CodeExecutionService>();
        services.AddScoped<IBattleExecutionService, BattleExecutionService>();

        services.AddScoped<ILearningPathService, LearningPathService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITopicService, TopicService>();
        services.AddScoped<IProblemService, ProblemService>();
        services.AddScoped<ISubmissionService, SubmissionService>();
        services.AddScoped<IUserProgressService, UserProgressService>();
        services.AddScoped<IChatbotService, ChatbotService>();
        services.AddScoped<IServiceManager, ServiceManager>();
    }

    public static void AddBattleServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSignalR();
        services.AddScoped<IBattleSessionService, BattleSessionService>();
        services.AddScoped<IBattleSubmissionService, BattleSubmissionService>();
        services.AddScoped<IEloRatingService, EloRatingService>();
        services.AddScoped<IFriendshipService, FriendshipService>();
        services.AddScoped<IAntiCheatService, AntiCheatService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
    }
}
