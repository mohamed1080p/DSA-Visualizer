namespace Domain.Contracts;
/// <summary>
/// Read-optimized leaderboard queries (database-side paging, joins, projections).
/// </summary>
public sealed record PlayerStatsLeaderboardRow(
    string UserId,
    string DisplayName,
    int RankPoints,
    int Level,
    int WinCount,
    int LossCount,
    int CurrentStreak,
    double WinRate);
public interface ILeaderboardReadRepository
{
    Task<IReadOnlyList<PlayerStatsLeaderboardRow>> GetGlobalLeaderboardPageAsync(
        int skip,
        int take,
        CancellationToken cancellationToken = default);
    /// <summary>
    /// Accepted friends plus <paramref name="userId"/>, ordered by rank points (SQL).
    /// </summary>
    Task<IReadOnlyList<PlayerStatsLeaderboardRow>> GetFriendsLeaderboardRowsAsync(
        string userId,
        CancellationToken cancellationToken = default);
    /// <summary>
    /// Batch load stats + display names for a set of users (order not preserved).
    /// </summary>
    Task<IReadOnlyList<PlayerStatsLeaderboardRow>> GetRowsForUserIdsAsync(
        IReadOnlyCollection<string> userIds,
        CancellationToken cancellationToken = default);
}


