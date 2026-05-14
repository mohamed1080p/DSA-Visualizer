using Domain.Models.BattleModule;
namespace ServicesAbstraction
{
    public record BattleDetailDto(Guid Id, BattleMode Mode, BattleStatus Status, DateTime CreatedAt, DateTime? StartedAt, DateTime? FinishedAt, int TimeLimitSeconds, int ProblemsToWin, string? WinnerUserId, List<BattleParticipantDto> Participants, List<BattleProblemDto> Problems);
    public record BattleParticipantDto(string UserId, string DisplayName, int SolvedCount, int RatingDelta);
    public record BattleProblemDto(int Order, int ProblemId, string Title, string Slug, string Difficulty, string? Description);
    public interface IBattleSessionService
    {
        Task<BattleSession> CreateBattleAsync(string player1Id, string player2Id, BattleMode mode);
        Task<BattleSession> StartBattleAsync(Guid battleId, string actorUserId);
        Task FinishBattleAsync(Guid battleId);
        Task AbandonBattleAsync(Guid battleId, string userId);
        Task<BattleDetailDto?> GetBattleDetailAsync(Guid battleId, string userId);
        Task<List<BattleDetailDto>> GetUserBattleHistoryAsync(string userId, int page = 1, int pageSize = 20);
        Task<PlayerStats> GetOrCreatePlayerStatsAsync(string userId);
    }
}


