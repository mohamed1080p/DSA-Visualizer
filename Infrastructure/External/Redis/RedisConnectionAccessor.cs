using StackExchange.Redis;

namespace Infrastructure.External.Redis;

/// <summary>
/// Holds an optional Redis connection so DI never registers a null IConnectionMultiplexer.
/// </summary>
public sealed class RedisConnectionAccessor
{
    public RedisConnectionAccessor(IConnectionMultiplexer? connection) => Connection = connection;
    public IConnectionMultiplexer? Connection { get; }
}
