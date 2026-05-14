using Domain.Models.BattleModule;
namespace ServicesAbstraction
{
    public sealed record BattleQueueState(bool IsQueued, Guid? ActiveBattleId);

    public interface IBattleMatchmakingService
    {
        Task<Guid> JoinQueueAsync(string userId, BattleMode mode);
        Task LeaveQueueAsync(string userId);
        Task<Guid?> TryMatchAsync(string userId);
        Task<Guid> CreateFriendChallengeAsync(string requesterId, string targetUserId, BattleMode mode);
        Task<Guid> AcceptChallengeAsync(Guid challengeId, string userId);
        Task<bool> IsPlayerInQueueAsync(string userId);
        Task<BattleQueueState> GetQueueStateAsync(string userId);
    }
}

