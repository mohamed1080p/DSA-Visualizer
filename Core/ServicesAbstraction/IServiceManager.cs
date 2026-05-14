namespace ServicesAbstraction
{
    /// <summary>
    /// Centralized manager wrapper providing lazy-loaded access to all core application business services.
    /// Ensures cohesive structure and standardized interface abstractions.
    /// </summary>
    public interface IServiceManager
    {
        IAuthService AuthService
        {
            get;
        }
        ITopicService TopicService
        {
            get;
        }
        IProblemService ProblemService
        {
            get;
        }
        ISubmissionService SubmissionService
        {
            get;
        }
        IUserProgressService UserProgressService
        {
            get;
        }
        ILearningPathService LearningPathService
        {
            get;
        }
        IChatbotService ChatbotService
        {
            get;
        }
        ILeaderboardService LeaderboardService
        {
            get;
        }
        IBattleSessionService BattleSessionService
        {
            get;
        }
        IBattleSubmissionService BattleSubmissionService
        {
            get;
        }
        IEloRatingService EloRatingService
        {
            get;
        }
        IFriendshipService FriendshipService
        {
            get;
        }
        IAntiCheatService AntiCheatService
        {
            get;
        }
        ICodeExecutionService CodeExecutionService
        {
            get;
        }
        IBattleExecutionService BattleExecutionService
        {
            get;
        }
        IBattleMatchmakingService BattleMatchmakingService
        {
            get;
        }
        ITelemetryService TelemetryService
        {
            get;
        }
    }
}

