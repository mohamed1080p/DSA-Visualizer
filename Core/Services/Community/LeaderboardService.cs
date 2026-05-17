using Domain.Contracts;
using ServicesAbstraction;
using System.Diagnostics;

namespace Services.Community;

public class LeaderboardService(
    ILeaderboardCache cache,
    ILeaderboardReadRepository leaderboardRead) : ILeaderboardService
{
    private const int MaxPageSize = 100;
    private const string GLOBAL_KEY = "battle:leaderboard:global";
    private const string WEEKLY_KEY = "battle:leaderboard:weekly";
    private const string MONTHLY_KEY = "battle:leaderboard:monthly";

    private static (int page, int pageSize) NormalizePaging(int page, int pageSize)
    {
        var p = page < 1 ? 1 : page;
        var s = pageSize < 1 ? 50 : Math.Min(pageSize, MaxPageSize);
        return (p, s);
    }
    public async Task<List<LeaderboardEntry>> GetGlobalLeaderboardAsync(int page = 1, int pageSize = 50) =>
            await GetLeaderboardWithFallbackAsync(GLOBAL_KEY, page, pageSize);
    public async Task<List<LeaderboardEntry>> GetWeeklyLeaderboardAsync(int page = 1, int pageSize = 50) =>
            await GetLeaderboardWithFallbackAsync(WEEKLY_KEY, page, pageSize);
    public async Task<List<LeaderboardEntry>> GetMonthlyLeaderboardAsync(int page = 1, int pageSize = 50) =>
            await GetLeaderboardWithFallbackAsync(MONTHLY_KEY, page, pageSize);

    private async Task<List<LeaderboardEntry>> GetLeaderboardWithFallbackAsync(string key, int page, int pageSize)
    {
        var (p, s) = NormalizePaging(page, pageSize);
        if (cache.IsAvailable)
        {
            int start = (p - 1) * s;
            int stop = start + s - 1;
            var entries = await cache.GetRangeAsync(key, start, stop);
            if (entries.Count > 0)
            {
                var userIds = entries.Select(e => e.UserId).ToList();
                var rows = await leaderboardRead.GetRowsForUserIdsAsync(userIds);
                var rowByUser = rows.ToDictionary(r => r.UserId, StringComparer.Ordinal);

                var result = new List<LeaderboardEntry>();
                var rank = start + 1;
                foreach (var entry in entries)
                {
                    rowByUser.TryGetValue(entry.UserId, out var row);
                    // Prefer authoritative DB value for RankPoints when available.
                    var rankPoints = row?.RankPoints ?? (int)entry.Score;
                    result.Add(new LeaderboardEntry(
                        rank++, entry.UserId, row?.DisplayName ?? "Player",
                        rankPoints, row?.Level ?? 1, row?.WinCount ?? 0,
                        row?.LossCount ?? 0, row?.CurrentStreak ?? 0, row?.WinRate ?? 0));

                    // If cache has a stale score, correct it asynchronously so the
                    // cached global leaderboard stays in sync with the DB.
                    if (row != null && (double)row.RankPoints != entry.Score)
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                await cache.UpdateScoreAsync(key, entry.UserId, row.RankPoints);
                            }
                            catch
                            {
                                // best-effort; ignore cache update failures
                            }
                        });
                    }
                }
                return result;
            }
        }
        return await GetLeaderboardFromDatabaseAsync(p, s);
    }
    public async Task<List<LeaderboardEntry>> GetFriendsLeaderboardAsync(string userId)
    {
        var rows = await leaderboardRead.GetFriendsLeaderboardRowsAsync(userId);
        var result = new List<LeaderboardEntry>(rows.Count);
        var rank = 1;
        foreach (var row in rows)
        {
            result.Add(new LeaderboardEntry(
                rank++, row.UserId, row.DisplayName,
                row.RankPoints, row.Level, row.WinCount, row.LossCount,
                row.CurrentStreak, row.WinRate));
        }
        return result;
    }
    public async Task UpdateLeaderboardAsync(string userId, int newRankPoints)
    {
        await cache.UpdateScoreAsync(GLOBAL_KEY, userId, newRankPoints);
        await cache.UpdateScoreAsync(WEEKLY_KEY, userId, newRankPoints);
        await cache.UpdateScoreAsync(MONTHLY_KEY, userId, newRankPoints);
    }
    public async Task ResetWeeklyLeaderboardAsync() => await cache.RemoveKeyAsync(WEEKLY_KEY);
    public async Task ResetMonthlyLeaderboardAsync() => await cache.RemoveKeyAsync(MONTHLY_KEY);

    private async Task<List<LeaderboardEntry>> GetLeaderboardFromDatabaseAsync(int page, int pageSize)
    {
        var skip = (page - 1) * pageSize;
        var rows = await leaderboardRead.GetGlobalLeaderboardPageAsync(skip, pageSize);
        var result = new List<LeaderboardEntry>(rows.Count);
        var rank = skip + 1;
        foreach (var row in rows)
        {
            result.Add(new LeaderboardEntry(
                rank++, row.UserId, row.DisplayName,
                row.RankPoints, row.Level, row.WinCount, row.LossCount,
                row.CurrentStreak, row.WinRate));
        }
        return result;
    }
}


