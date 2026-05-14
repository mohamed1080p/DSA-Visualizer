using StackExchange.Redis;
using ServicesAbstraction;

namespace Infrastructure.External.Redis;

public class RedisLeaderboardCache : ILeaderboardCache
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ITelemetryService _telemetry;
    public RedisLeaderboardCache(RedisConnectionAccessor accessor, ITelemetryService telemetry)
    {
        _redis = accessor.Connection;
        _telemetry = telemetry;
    }
    public bool IsAvailable => _redis != null && _redis.IsConnected;
    public async Task<List<(string UserId, double Score)>> GetRangeAsync(string key, int start, int stop)
    {
        if (!IsAvailable) return new();

        var db = _redis!.GetDatabase();
        var entries = await _telemetry.MeasureRedisAsync(
            $"SortedSetRangeByRankWithScores {key}",
            () => db.SortedSetRangeByRankWithScoresAsync(key, start, stop, Order.Descending));

        return entries.Select(e => (e.Element.ToString(), e.Score)).ToList();
    }
    public async Task UpdateScoreAsync(string key, string userId, double score)
    {
        if (!IsAvailable) return;
        var db = _redis!.GetDatabase();
        await _telemetry.MeasureRedisAsync($"SortedSetAdd {key}", () => db.SortedSetAddAsync(key, userId, score));
    }
    public async Task RemoveKeyAsync(string key)
    {
        if (!IsAvailable) return;
        var db = _redis!.GetDatabase();
        await _telemetry.MeasureRedisAsync($"KeyDelete {key}", () => db.KeyDeleteAsync(key));
    }
}


