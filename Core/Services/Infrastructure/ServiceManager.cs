using Microsoft.Extensions.DependencyInjection;
using ServicesAbstraction;

namespace Services.Infrastructure
{
    /// <summary>
    /// Standard implementation of IServiceManager utilizing Lazy initialization to encapsulate sub-service instantiation.
    /// Promotes structured, testable, and highly standardized codebase architecture.
    /// </summary>
    public sealed class ServiceManager : IServiceManager
    {
        private readonly Lazy<IAuthService> _authService;
        private readonly Lazy<ITopicService> _topicService;
        private readonly Lazy<IProblemService> _problemService;
        private readonly Lazy<ISubmissionService> _submissionService;
        private readonly Lazy<IUserProgressService> _userProgressService;
        private readonly Lazy<ILearningPathService> _learningPathService;
        private readonly Lazy<IChatbotService> _chatbotService;
        private readonly Lazy<ILeaderboardService> _leaderboardService;
        private readonly Lazy<IBattleSessionService> _battleSessionService;
        private readonly Lazy<IBattleSubmissionService> _battleSubmissionService;
        private readonly Lazy<IEloRatingService> _eloRatingService;
        private readonly Lazy<IFriendshipService> _friendshipService;
        private readonly Lazy<IAntiCheatService> _antiCheatService;
        private readonly Lazy<ICodeExecutionService> _codeExecutionService;
        private readonly Lazy<IBattleExecutionService> _battleExecutionService;
        private readonly Lazy<IBattleMatchmakingService> _battleMatchmakingService;
        private readonly Lazy<ITelemetryService> _telemetryService;
        public ServiceManager(IServiceProvider serviceProvider)
        {
            _authService = new Lazy<IAuthService>(() => serviceProvider.GetRequiredService<IAuthService>());
            _topicService = new Lazy<ITopicService>(() => serviceProvider.GetRequiredService<ITopicService>());
            _problemService = new Lazy<IProblemService>(() => serviceProvider.GetRequiredService<IProblemService>());
            _submissionService = new Lazy<ISubmissionService>(() => serviceProvider.GetRequiredService<ISubmissionService>());
            _userProgressService = new Lazy<IUserProgressService>(() => serviceProvider.GetRequiredService<IUserProgressService>());
            _learningPathService = new Lazy<ILearningPathService>(() => serviceProvider.GetRequiredService<ILearningPathService>());
            _chatbotService = new Lazy<IChatbotService>(() => serviceProvider.GetRequiredService<IChatbotService>());
            _leaderboardService = new Lazy<ILeaderboardService>(() => serviceProvider.GetRequiredService<ILeaderboardService>());
            _battleSessionService = new Lazy<IBattleSessionService>(() => serviceProvider.GetRequiredService<IBattleSessionService>());
            _battleSubmissionService = new Lazy<IBattleSubmissionService>(() => serviceProvider.GetRequiredService<IBattleSubmissionService>());
            _eloRatingService = new Lazy<IEloRatingService>(() => serviceProvider.GetRequiredService<IEloRatingService>());
            _friendshipService = new Lazy<IFriendshipService>(() => serviceProvider.GetRequiredService<IFriendshipService>());
            _antiCheatService = new Lazy<IAntiCheatService>(() => serviceProvider.GetRequiredService<IAntiCheatService>());
            _codeExecutionService = new Lazy<ICodeExecutionService>(() => serviceProvider.GetRequiredService<ICodeExecutionService>());
            _battleExecutionService = new Lazy<IBattleExecutionService>(() => serviceProvider.GetRequiredService<IBattleExecutionService>());
            _battleMatchmakingService = new Lazy<IBattleMatchmakingService>(() => serviceProvider.GetRequiredService<IBattleMatchmakingService>());
            _telemetryService = new Lazy<ITelemetryService>(() => serviceProvider.GetRequiredService<ITelemetryService>());
        }
        public IAuthService AuthService => _authService.Value;
        public ITopicService TopicService => _topicService.Value;
        public IProblemService ProblemService => _problemService.Value;
        public ISubmissionService SubmissionService => _submissionService.Value;
        public IUserProgressService UserProgressService => _userProgressService.Value;
        public ILearningPathService LearningPathService => _learningPathService.Value;
        public IChatbotService ChatbotService => _chatbotService.Value;
        public ILeaderboardService LeaderboardService => _leaderboardService.Value;
        public IBattleSessionService BattleSessionService => _battleSessionService.Value;
        public IBattleSubmissionService BattleSubmissionService => _battleSubmissionService.Value;
        public IEloRatingService EloRatingService => _eloRatingService.Value;
        public IFriendshipService FriendshipService => _friendshipService.Value;
        public IAntiCheatService AntiCheatService => _antiCheatService.Value;
        public ICodeExecutionService CodeExecutionService => _codeExecutionService.Value;
        public IBattleExecutionService BattleExecutionService => _battleExecutionService.Value;
        public IBattleMatchmakingService BattleMatchmakingService => _battleMatchmakingService.Value;
        public ITelemetryService TelemetryService => _telemetryService.Value;
    }
}




