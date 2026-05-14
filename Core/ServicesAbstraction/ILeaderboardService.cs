namespace ServicesAbstraction
{
    public record LeaderboardEntry(
        int Rank, string UserId, string DisplayName,
        int RankPoints, int Level, int WinCount, int LossCount,
        int CurrentStreak, double WinRate);
    public interface ILeaderboardService
    {
        Task<List<LeaderboardEntry>> GetGlobalLeaderboardAsync(int page = 1, int pageSize = 50);
        Task<List<LeaderboardEntry>> GetWeeklyLeaderboardAsync(int page = 1, int pageSize = 50);
        Task<List<LeaderboardEntry>> GetMonthlyLeaderboardAsync(int page = 1, int pageSize = 50);
        Task<List<LeaderboardEntry>> GetFriendsLeaderboardAsync(string userId);
        Task UpdateLeaderboardAsync(string userId, int newRankPoints);
        Task ResetWeeklyLeaderboardAsync();
        Task ResetMonthlyLeaderboardAsync();
    }
}


