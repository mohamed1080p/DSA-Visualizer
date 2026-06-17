using Domain.Contracts;
using Domain.Models.BattleModule;
using Domain.Models.IdentityModule;
using Domain.Models.TopicModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServicesAbstraction;

namespace Services.Battle
{
    public class BattleSessionService : IBattleSessionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEloRatingService _eloService;
        private readonly ILeaderboardService _leaderboardService;
        private readonly UserManager<ApplicationUser> _userManager;
        public BattleSessionService(
                    IUnitOfWork unitOfWork,
                    IEloRatingService eloService,
                    UserManager<ApplicationUser> userManager,
                    ILeaderboardService leaderboardService)
        {
            _unitOfWork = unitOfWork;
            _eloService = eloService;
            _leaderboardService = leaderboardService;
            _userManager = userManager;
        }
        public async Task<BattleSession> CreateBattleAsync(string player1Id, string player2Id, BattleMode mode)
        {
            var stats1 = await GetOrCreatePlayerStatsAsync(player1Id);
            var stats2 = await GetOrCreatePlayerStatsAsync(player2Id);

            int avgRating = (stats1.RankPoints + stats2.RankPoints) / 2;
            var difficulty = GetBattleDifficulty(avgRating);

            var battle = new BattleSession
            {
                Mode = mode,
                Status = BattleStatus.WaitingForPlayers,
                TimeLimitSeconds = mode == BattleMode.Timed ? 600 : 0,
                ProblemsToWin = mode == BattleMode.Survival ? 1 : 3,
            };
            var user1 = await _userManager.FindByIdAsync(player1Id);
            var user2 = await _userManager.FindByIdAsync(player2Id);

            // Add participants
            battle.Participants.Add(new BattleParticipant
            {
                UserId = player1Id,
                User = user1,
                RatingBefore = stats1.RankPoints,
            });
            battle.Participants.Add(new BattleParticipant
            {
                UserId = player2Id,
                User = user2,
                RatingBefore = stats2.RankPoints,
            });
            // Select problems — get random problems at calculated difficulty
            var problems = await SelectBattleProblemsAsync(difficulty, battle.ProblemsToWin + 2, player1Id, player2Id);
            int order = 1;
            foreach (var problem in problems)
            {
                battle.Problems.Add(new BattleProblem
                {
                    ProblemId = problem.Id,
                    Problem = problem,
                    Order = order++,
                });
            }

            var repo = _unitOfWork.GetRepository<BattleSession, Guid>();
            await repo.AddAsync(battle);
            await _unitOfWork.SaveChangesAsync();

            return battle;
        }
        public async Task<BattleSession> StartBattleAsync(Guid battleId, string actorUserId)
        {
            var repo = _unitOfWork.GetRepository<BattleSession, Guid>();
            var battle = await repo.GetByIdAsync(battleId, b => b.Participants, b => b.Problems)
                ?? throw new InvalidOperationException("Battle not found");

            if (!battle.Participants.Any(p => p.UserId == actorUserId))
                throw new UnauthorizedAccessException("You are not a participant in this battle.");

            if (battle.Status == BattleStatus.InProgress)
                return battle;

            if (battle.Status != BattleStatus.WaitingForPlayers)
                throw new InvalidOperationException("Battle cannot be started in its current state.");

            battle.Status = BattleStatus.InProgress;
            battle.StartedAt = DateTime.UtcNow;
            repo.Update(battle);
            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                var reloaded = await repo.GetByIdAsync(battleId, b => b.Participants, b => b.Problems);
                if (reloaded?.Status == BattleStatus.InProgress)
                    return reloaded;
                throw;
            }

            return battle;
        }
        public async Task FinishBattleAsync(Guid battleId)
        {
            var repo = _unitOfWork.GetRepository<BattleSession, Guid>();
            var battle = await repo.GetByIdAsync(battleId, b => b.Participants, b => b.Problems)
                ?? throw new InvalidOperationException("Battle not found");

            if (battle.Status != BattleStatus.InProgress) return;

            battle.Status = BattleStatus.Finished;
            battle.FinishedAt = DateTime.UtcNow;
            // Determine winner by solved count
            var participants = battle.Participants.OrderByDescending(p => p.SolvedCount).ToList();
            var winner = participants[0];
            var loser = participants[1];

            if (winner.SolvedCount > loser.SolvedCount)
            {
                await ApplyBattleOutcomeAsync(
                    battle,
                    winner,
                    loser,
                    battle.FinishedAt.Value - battle.StartedAt!.Value,
                    perfectAccuracy: true);
            }
            else
            {
                // Draw
                foreach (var p in participants)
                {
                    p.RatingAfter = p.RatingBefore;
                    p.RatingDelta = 0;
                    var stats = await GetOrCreatePlayerStatsAsync(p.UserId);
                    stats.DrawCount++;
                }
            }

            repo.Update(battle);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task AbandonBattleAsync(Guid battleId, string userId)
        {
            var repo = _unitOfWork.GetRepository<BattleSession, Guid>();
            var battle = await repo.GetByIdAsync(battleId, b => b.Participants, b => b.Problems)
                ?? throw new InvalidOperationException("Battle not found");

            if (battle.Status is BattleStatus.Finished or BattleStatus.Cancelled or BattleStatus.Abandoned) return;

            var abandoner = battle.Participants.FirstOrDefault(p => p.UserId == userId)
                ?? throw new UnauthorizedAccessException("You are not a participant in this battle.");

            battle.Status = BattleStatus.Abandoned;
            battle.FinishedAt = DateTime.UtcNow;
            // The player who abandoned loses
            var opponent = battle.Participants.FirstOrDefault(p => p.UserId != userId);
            if (opponent != null)
            {
                battle.WinnerUserId = opponent.UserId;
                var startedAt = battle.StartedAt ?? battle.CreatedAt;
                await ApplyBattleOutcomeAsync(
                    battle,
                    opponent,
                    abandoner,
                    battle.FinishedAt.Value - startedAt,
                    perfectAccuracy: false);
            }

            repo.Update(battle);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<BattleDetailDto?> GetBattleDetailAsync(Guid battleId, string userId)
        {
            var repo = _unitOfWork.GetRepository<BattleSession, Guid>();
            var battle = await repo.GetByIdAsync(battleId, b => b.Participants, b => b.Problems);
            if (battle == null) return null;

            if (!battle.Participants.Any(p => p.UserId == userId))
                throw new UnauthorizedAccessException("You do not have access to this battle.");

            return MapToDto(battle);
        }

        public async Task<Guid?> GetActiveBattleIdForUserAsync(string userId)
        {
            var repo = _unitOfWork.GetRepository<BattleParticipant, int>();
            var rows = await repo.GetAllAsync(
                predicate: p =>
                    p.UserId == userId &&
                    (p.BattleSession.Status == BattleStatus.WaitingForPlayers || p.BattleSession.Status == BattleStatus.InProgress),
                orderBy: q => q.OrderByDescending(p => p.BattleSession.CreatedAt),
                includes: p => p.BattleSession);

            var match = rows.FirstOrDefault();
            if (match == null) return null;

            // Auto-abandon stale battles (sitting idle for > 30 min)
            var age = DateTime.UtcNow - match.BattleSession.CreatedAt;
            if (age.TotalMinutes > 30)
            {
                var battleRepo = _unitOfWork.GetRepository<BattleSession, Guid>();
                match.BattleSession.Status = BattleStatus.Abandoned;
                match.BattleSession.FinishedAt = DateTime.UtcNow;
                battleRepo.Update(match.BattleSession);
                await _unitOfWork.SaveChangesAsync();
                return null;
            }

            return match.BattleSessionId;
        }
        public async Task<List<BattleDetailDto>> GetUserBattleHistoryAsync(string userId, int page = 1, int pageSize = 20)
        {
            var repo = _unitOfWork.GetRepository<BattleParticipant, int>();
            var participations = await repo.GetAllAsync(
                predicate: p => p.UserId == userId,
                orderBy: q => q.OrderByDescending(p => p.BattleSession.CreatedAt),
                includes: p => p.BattleSession)
                ;

            var pageOfBattles = participations
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => p.BattleSession)
                .ToList();

            return pageOfBattles.Select(MapToDto).ToList();
        }
        public async Task<PlayerStats> GetOrCreatePlayerStatsAsync(string userId)
        {
            var repo = _unitOfWork.GetRepository<PlayerStats, string>();
            var stats = await repo.GetByIdAsync(userId);
            if (stats == null)
            {
                stats = new PlayerStats
                {
                    UserId = userId
                };
                await repo.AddAsync(stats);
                await _unitOfWork.SaveChangesAsync();
            }
            return stats;
        }

        private DifficultyLevel GetBattleDifficulty(int avgRating) => avgRating switch
        {
            < 1000 => DifficultyLevel.Easy,
            < 2000 => DifficultyLevel.Medium,
            _ => DifficultyLevel.Hard,
        };

        private async Task<List<Domain.Models.ProblemsModule.Problem>> SelectBattleProblemsAsync(
            DifficultyLevel difficulty, int count, string player1Id, string player2Id)
        {
            var problemRepo = _unitOfWork.GetRepository<Domain.Models.ProblemsModule.Problem, int>();
            var allProblems = (await problemRepo.GetAllAsync()).ToList();

            var atDifficulty = allProblems
                .Where(p => p.Difficulty == difficulty)
                .OrderBy(_ => Guid.NewGuid())
                .Take(count)
                .ToList();

            if (atDifficulty.Count >= count)
                return atDifficulty;

            var needed = count - atDifficulty.Count;
            var filler = allProblems
                .Except(atDifficulty)
                .OrderBy(_ => Guid.NewGuid())
                .Take(needed)
                .ToList();

            atDifficulty.AddRange(filler);
            return atDifficulty;
        }

        private BattleDetailDto MapToDto(BattleSession b) => new(
            b.Id, b.Mode, b.Status,
            b.CreatedAt, b.StartedAt, b.FinishedAt,
            b.TimeLimitSeconds, b.ProblemsToWin, b.WinnerUserId,
            b.Participants.Select(p => new BattleParticipantDto(
                p.UserId, p.User?.DisplayName ?? "Player", p.SolvedCount, p.RatingDelta)).ToList(),
            b.Problems.Select(p => new BattleProblemDto(
                p.Order, p.ProblemId, p.Problem?.Title ?? "", p.Problem?.Slug ?? "",
                p.Problem?.Difficulty.ToString() ?? "Easy",
                p.Problem?.Description)).ToList()
        );

        private async Task ApplyBattleOutcomeAsync(
            BattleSession battle,
            BattleParticipant winner,
            BattleParticipant loser,
            TimeSpan solveTime,
            bool perfectAccuracy)
        {
            var winnerStats = await GetOrCreatePlayerStatsAsync(winner.UserId);
            var loserStats = await GetOrCreatePlayerStatsAsync(loser.UserId);

            var (newWinner, newLoser) = _eloService.Calculate(
                winnerStats.RankPoints,
                loserStats.RankPoints,
                solveTime,
                perfectAccuracy,
                winnerStats.CurrentStreak);

            winner.RatingAfter = newWinner;
            winner.RatingDelta = newWinner - winner.RatingBefore;
            winnerStats.RankPoints = newWinner;
            winnerStats.Level = _eloService.CalculateLevel(newWinner);
            winnerStats.WinCount++;
            winnerStats.CurrentStreak++;
            winnerStats.BestStreak = Math.Max(winnerStats.BestStreak, winnerStats.CurrentStreak);

            loser.RatingAfter = newLoser;
            loser.RatingDelta = newLoser - loser.RatingBefore;
            loserStats.RankPoints = newLoser;
            loserStats.Level = _eloService.CalculateLevel(newLoser);
            loserStats.LossCount++;
            loserStats.CurrentStreak = 0;

            battle.WinnerUserId = winner.UserId;

            // Update leaderboard cache so cached global leaderboard stays in sync
            try
            {
                await _leaderboardService.UpdateLeaderboardAsync(winnerStats.UserId, winnerStats.RankPoints);
                await _leaderboardService.UpdateLeaderboardAsync(loserStats.UserId, loserStats.RankPoints);
            }
            catch
            {
                // Ignore cache failures to avoid blocking the battle workflow
            }
        }
    }
}




