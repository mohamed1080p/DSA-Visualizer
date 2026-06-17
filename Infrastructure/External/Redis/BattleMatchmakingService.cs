using System.Diagnostics;
using Domain.Contracts;
using Domain.Models.BattleModule;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using StackExchange.Redis;










namespace Infrastructure.External.Redis
{
    public class BattleMatchmakingService : IBattleMatchmakingService
    {
        private const int InitialRange = 100;
        private const int MaxRange = 1000;
        private const string PlayerKeyPrefix = "battle:player:";
        private const string ChallengeKeyPrefix = "battle:challenge:";

        private const string AtomicMatchScript = """
            local queueKey = KEYS[1]
            local userId = ARGV[1]
            local minScore = tonumber(ARGV[2])
            local maxScore = tonumber(ARGV[3])
            local candidates = redis.call('ZRANGEBYSCORE', queueKey, minScore, maxScore)

            for _, candidate in ipairs(candidates) do
                if candidate ~= userId then
                    redis.call('ZREM', queueKey, userId)
                    redis.call('ZREM', queueKey, candidate)
                    redis.call('DEL', 'battle:player:' .. userId)
                    redis.call('DEL', 'battle:player:' .. candidate)
                    return candidate
                end
            end

            return nil
            """;

        private readonly IConnectionMultiplexer _redis;
        private readonly IBattleSessionService _battleService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITelemetryService _telemetry;
        private readonly ILogger<BattleMatchmakingService> _logger;
        public BattleMatchmakingService(
                    IConnectionMultiplexer redis,
                    IBattleSessionService battleService,
                    IUnitOfWork unitOfWork,
                    ITelemetryService telemetry,
                    ILogger<BattleMatchmakingService> logger)
        {
            _redis = redis;
            _battleService = battleService;
            _unitOfWork = unitOfWork;
            _telemetry = telemetry;
            _logger = logger;
        }
        public async Task<Guid> JoinQueueAsync(string userId, BattleMode mode)
        {
            using var activity = _telemetry.ActivitySource.StartActivity("battle.matchmaking.join", ActivityKind.Internal);
            activity?.SetTag("battle.mode", mode.ToString());
            activity?.SetTag("enduser.id", userId);

            var db = _redis.GetDatabase();
            var stats = await _battleService.GetOrCreatePlayerStatsAsync(userId);
            var queueKey = GetQueueKey(mode);
            var playerKey = GetPlayerKey(userId);
            var queuedAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            var existingState = await GetQueueStateAsync(userId);
            if (existingState.ActiveBattleId.HasValue)
            {
                return existingState.ActiveBattleId.Value;
            }

            var claimed = await _telemetry.MeasureRedisAsync(
                "StringSet player queue claim",
                () => db.StringSetAsync(playerKey, $"queuing|{queuedAtUnixMs}", TimeSpan.FromMinutes(5), When.NotExists));

            if (!claimed)
                throw new InvalidOperationException("Already in queue");

            try
            {
                await _telemetry.MeasureRedisAsync(
                    "SortedSetAdd queue",
                    () => db.SortedSetAddAsync(queueKey, userId, stats.RankPoints));

                var entry = new MatchmakingEntry
                {
                    UserId = userId,
                    RankPoints = stats.RankPoints,
                    Mode = mode,
                };

                var repo = _unitOfWork.GetRepository<MatchmakingEntry, Guid>();
                await repo.AddAsync(entry);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Player joined Redis battle queue. UserId={UserId} BattleMode={BattleMode} RankPoints={RankPoints} MatchmakingEntryId={MatchmakingEntryId}",
                    userId,
                    mode,
                    stats.RankPoints,
                    entry.Id);

                return entry.Id;
            }
            catch
            {
                await _telemetry.MeasureRedisAsync("KeyDelete player queue claim", () => db.KeyDeleteAsync(playerKey));
                await _telemetry.MeasureRedisAsync("SortedSetRemove queue rollback", () => db.SortedSetRemoveAsync(queueKey, userId));
                throw;
            }
        }
        public async Task LeaveQueueAsync(string userId)
        {
            var db = _redis.GetDatabase();

            foreach (var mode in Enum.GetValues<BattleMode>())
            {
                await _telemetry.MeasureRedisAsync(
                    "SortedSetRemove queue",
                    () => db.SortedSetRemoveAsync(GetQueueKey(mode), userId));
            }

            await _telemetry.MeasureRedisAsync("KeyDelete player", () => db.KeyDeleteAsync(GetPlayerKey(userId)));
            _logger.LogInformation("Player left Redis battle queue. UserId={UserId}", userId);
        }
        public async Task<Guid?> TryMatchAsync(string userId)
        {
            var started = Stopwatch.GetTimestamp();
            using var activity = _telemetry.ActivitySource.StartActivity("battle.matchmaking.try_match", ActivityKind.Internal);
            activity?.SetTag("enduser.id", userId);

            try
            {
                var db = _redis.GetDatabase();
                foreach (var mode in Enum.GetValues<BattleMode>())
                {
                    var score = await _telemetry.MeasureRedisAsync(
                        "SortedSetScore queue",
                        () => db.SortedSetScoreAsync(GetQueueKey(mode), userId));

                    if (!score.HasValue)
                        continue;

                    var queuedState = await _telemetry.MeasureRedisAsync(
                        "StringGet player",
                        () => db.StringGetAsync(GetPlayerKey(userId)));

                    var rating = (int)score.Value;

                    var match = await TryMatchInModeAsync(db, userId, mode, rating, queuedState, activity);
                    if (match.HasValue)
                        return match.Value;
                }

                return null;
            }
            finally
            {
                _telemetry.RecordMatchmakingLatency(
                    Stopwatch.GetElapsedTime(started).TotalMilliseconds,
                    "redis");
            }
        }
        public async Task<Guid> CreateFriendChallengeAsync(string requesterId, string targetUserId, BattleMode mode)
        {
            using var activity = _telemetry.ActivitySource.StartActivity("battle.matchmaking.friend_challenge", ActivityKind.Internal);
            activity?.SetTag("enduser.id", requesterId);
            activity?.SetTag("battle.target_user_id", targetUserId);
            activity?.SetTag("battle.mode", mode.ToString());

            var db = _redis.GetDatabase();

            var entry = new MatchmakingEntry
            {
                UserId = requesterId,
                TargetUserId = targetUserId,
                Mode = mode,
                RankPoints = 0,
            };

            await _telemetry.MeasureRedisAsync(
                "StringSet challenge",
                () => db.StringSetAsync(
                    GetChallengeKey(entry.Id),
                    $"{requesterId}|{targetUserId}|{mode}",
                    TimeSpan.FromMinutes(2)));

            var repo = _unitOfWork.GetRepository<MatchmakingEntry, Guid>();
            await repo.AddAsync(entry);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Friend battle challenge created. RequesterId={RequesterId} TargetUserId={TargetUserId} ChallengeId={ChallengeId} BattleMode={BattleMode}",
                requesterId,
                targetUserId,
                entry.Id,
                mode);

            return entry.Id;
        }
        public async Task<Guid> AcceptChallengeAsync(Guid challengeId, string userId)
        {
            var db = _redis.GetDatabase();
            var challengeData = await _telemetry.MeasureRedisAsync(
                "StringGet challenge",
                () => db.StringGetAsync(GetChallengeKey(challengeId)));

            if (!challengeData.HasValue)
                throw new InvalidOperationException("Challenge expired or not found");

            var parts = challengeData.ToString().Split('|');
            var requesterId = parts[0];
            var targetUserId = parts[1];
            var mode = Enum.Parse<BattleMode>(parts[2]);

            if (userId != targetUserId)
                throw new InvalidOperationException("This challenge is not for you");

            await _telemetry.MeasureRedisAsync("KeyDelete challenge", () => db.KeyDeleteAsync(GetChallengeKey(challengeId)));

            var battle = await _battleService.CreateBattleAsync(requesterId, targetUserId, mode);

            await _telemetry.MeasureRedisAsync(
                "StringSet active battle requester",
                () => db.StringSetAsync(GetPlayerKey(requesterId), battle.Id.ToString(), TimeSpan.FromHours(1)));
            await _telemetry.MeasureRedisAsync(
                "StringSet active battle target",
                () => db.StringSetAsync(GetPlayerKey(targetUserId), battle.Id.ToString(), TimeSpan.FromHours(1)));

            _logger.LogInformation(
                "Friend battle challenge accepted. RequesterId={RequesterId} TargetUserId={TargetUserId} ChallengeId={ChallengeId} BattleId={BattleId}",
                requesterId,
                targetUserId,
                challengeId,
                battle.Id);

            return battle.Id;
        }
        public async Task<bool> IsPlayerInQueueAsync(string userId)
        {
            var state = await GetQueueStateAsync(userId);
            return state.IsQueued;
        }

        public async Task<BattleQueueState> GetQueueStateAsync(string userId)
        {
            var db = _redis.GetDatabase();
            var status = await _telemetry.MeasureRedisAsync(
                "StringGet player queue status",
                () => db.StringGetAsync(GetPlayerKey(userId)));

            if (!status.HasValue)
            {
                return new BattleQueueState(false, null);
            }

            var value = status.ToString();
            if (value.StartsWith("queuing", StringComparison.Ordinal))
            {
                return new BattleQueueState(true, null);
            }

            if (!Guid.TryParse(value, out var battleId))
            {
                await _telemetry.MeasureRedisAsync("KeyDelete player", () => db.KeyDeleteAsync(GetPlayerKey(userId)));
                return new BattleQueueState(false, null);
            }

            if (await IsBattleActiveForUserAsync(battleId, userId))
            {
                return new BattleQueueState(false, battleId);
            }

            await LeaveQueueAsync(userId);
            return new BattleQueueState(false, null);
        }

        private async Task<bool> IsBattleActiveForUserAsync(Guid battleId, string userId)
        {
            try
            {
                var detail = await _battleService.GetBattleDetailAsync(battleId, userId);
                return detail is { Status: BattleStatus.WaitingForPlayers or BattleStatus.InProgress };
            }
            catch (UnauthorizedAccessException)
            {
                return false;
            }
        }

        private static string GetQueueKey(BattleMode mode) => $"battle:queue:{mode}";

        private static string GetPlayerKey(string userId) => $"{PlayerKeyPrefix}{userId}";

        private static string GetChallengeKey(Guid challengeId) => $"{ChallengeKeyPrefix}{challengeId}";

        private void RecordQueueWait(RedisValue queuedState, BattleMode mode)
        {
            if (!queuedState.HasValue)
                return;

            var parts = queuedState.ToString().Split('|', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2 || !long.TryParse(parts[1], out var queuedAtUnixMs))
                return;

            var elapsedMs = Math.Max(0, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - queuedAtUnixMs);
            _telemetry.RecordQueueWaitDuration(elapsedMs, "battle-matchmaking", mode.ToString());
        }

        private async Task<Guid?> TryMatchInModeAsync(
            IDatabase db,
            string userId,
            BattleMode mode,
            int rating,
            RedisValue queuedState,
            Activity? activity)
        {
            var range = InitialRange;

            while (range <= MaxRange)
            {
                var opponent = await _telemetry.MeasureRedisAsync(
                    "ScriptEvaluate atomic match",
                    async () =>
                    {
                        var result = await db.ScriptEvaluateAsync(
                            AtomicMatchScript,
                            new RedisKey[]
{
GetQueueKey(mode) },
                            new RedisValue[]
{
userId, rating - range, rating + range });

                        return (RedisValue)result;
                    });

                if (!opponent.IsNullOrEmpty)
                {
                    var opponentId = opponent.ToString();
                    RecordQueueWait(queuedState, mode);

                    var battle = await _battleService.CreateBattleAsync(userId, opponentId, mode);

                    await _telemetry.MeasureRedisAsync(
                        "StringSet active battle user",
                        () => db.StringSetAsync(GetPlayerKey(userId), battle.Id.ToString(), TimeSpan.FromHours(1)));
                    await _telemetry.MeasureRedisAsync(
                        "StringSet active battle opponent",
                        () => db.StringSetAsync(GetPlayerKey(opponentId), battle.Id.ToString(), TimeSpan.FromHours(1)));

                    activity?.SetTag("battle.id", battle.Id.ToString());
                    activity?.SetTag("battle.mode", mode.ToString());

                    _logger.LogInformation(
                        "Redis battle match found. UserId={UserId} OpponentUserId={OpponentUserId} BattleMode={BattleMode} BattleId={BattleId}",
                        userId,
                        opponentId,
                        mode,
                        battle.Id);

                    return battle.Id;
                }

                range += 50;
            }

            return null;
        }
    }
}





