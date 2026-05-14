namespace ServicesAbstraction;

public interface ILeaderboardCache
{
    bool IsAvailable
    {
        get;
    }
    Task<List<(string UserId, double Score)>> GetRangeAsync(string key, int start, int stop);
    Task UpdateScoreAsync(string key, string userId, double score);
    Task RemoveKeyAsync(string key);
}


