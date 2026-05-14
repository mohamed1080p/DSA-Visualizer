using Infrastructure.Persistence.Repositories.Auth;
using Infrastructure.Persistence.Repositories.Problems;
using Infrastructure.Persistence.Repositories.Common;
using Domain.Contracts;
using Domain.Models.BattleModule;
using Domain.Models.IdentityModule;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence.Data;

namespace Infrastructure.Persistence.Repositories.Leaderboard;

public sealed class LeaderboardReadRepository(ApplicationDbContext db) : ILeaderboardReadRepository
{
    public async Task<IReadOnlyList<PlayerStatsLeaderboardRow>> GetGlobalLeaderboardPageAsync(
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        return await db.Set<PlayerStats>()
            .AsNoTracking()
            .OrderByDescending(s => s.RankPoints)
            .Skip(skip)
            .Take(take)
            .Join(
                db.Set<ApplicationUser>().AsNoTracking(),
                s => s.UserId,
                u => u.Id,
                (s, u) => MapToLeaderboardRow(s, u))
            .ToListAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<PlayerStatsLeaderboardRow>> GetFriendsLeaderboardRowsAsync(
            string userId,
            CancellationToken cancellationToken = default)
    {
        var friendIds = await db.Set<Friendship>()
            .AsNoTracking()
            .Where(f =>
                f.Status == FriendshipStatus.Accepted &&
                (f.RequesterId == userId || f.AddresseeId == userId))
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToListAsync(cancellationToken);

        var allIds = new List<string>(friendIds.Count + 1);
        allIds.AddRange(friendIds);
        allIds.Add(userId);

        return await db.Set<PlayerStats>()
            .AsNoTracking()
            .Where(s => allIds.Contains(s.UserId))
            .OrderByDescending(s => s.RankPoints)
            .Join(
                db.Set<ApplicationUser>().AsNoTracking(),
                s => s.UserId,
                u => u.Id,
                (s, u) => MapToLeaderboardRow(s, u))
            .ToListAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<PlayerStatsLeaderboardRow>> GetRowsForUserIdsAsync(
            IReadOnlyCollection<string> userIds,
            CancellationToken cancellationToken = default)
    {
        if (userIds.Count == 0)
            return Array.Empty<PlayerStatsLeaderboardRow>();

        return await db.Set<PlayerStats>()
            .AsNoTracking()
            .Where(s => userIds.Contains(s.UserId))
            .Join(
                db.Set<ApplicationUser>().AsNoTracking(),
                s => s.UserId,
                u => u.Id,
                (s, u) => MapToLeaderboardRow(s, u))
            .ToListAsync(cancellationToken);
    }

    private static PlayerStatsLeaderboardRow MapToLeaderboardRow(PlayerStats stats, ApplicationUser user)
    {
        var totalGames = stats.WinCount + stats.LossCount + stats.DrawCount;
        var winRate = totalGames > 0 ? (double)stats.WinCount / totalGames * 100.0 : 0.0;

        return new PlayerStatsLeaderboardRow(
            stats.UserId,
            user.DisplayName ?? "Player",
            stats.RankPoints,
            stats.Level,
            stats.WinCount,
            stats.LossCount,
            stats.CurrentStreak,
            winRate);
    }

}




