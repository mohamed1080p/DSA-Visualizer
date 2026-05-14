using System.Collections.Concurrent;
using System.Diagnostics;
using Domain.Contracts;
using Domain.Models.BattleModule;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;

namespace Infrastructure.External.Common
{
    /// <summary>
    /// In-memory matchmaking service that works without Redis.
    /// Use this for local development and testing.
    /// </summary>
    public class InMemoryMatchmakingService : IBattleMatchmakingService
    {
        private readonly IBattleSessionService _battleService;
        private readonly ITelemetryService _telemetry;
        private readonly ILogger<InMemoryMatchmakingService> _logger;

        private static readonly ConcurrentDictionary<string, QueueEntry> _queue = new();
        private static readonly ConcurrentDictionary<Guid, string> _challenges = new();
        private static readonly ConcurrentDictionary<string, string> _playerState = new();
        private static readonly SemaphoreSlim _matchLock = new(1, 1);

        private sealed record QueueEntry(string UserId, int RankPoints, BattleMode Mode, DateTime QueuedAt);

        public InMemoryMatchmakingService(
            IBattleSessionService battleService,
            ITelemetryService telemetry,
            ILogger<InMemoryMatchmakingService> logger)
        {
            _battleService = battleService;
            _telemetry = telemetry;
            _logger = logger;
        }

        public async Task<Guid> JoinQueueAsync(string userId, BattleMode mode)
        {
            using var activity = _telemetry.ActivitySource.StartActivity("battle.matchmaking.join", ActivityKind.Internal);
            activity?.SetTag("battle.mode", mode.ToString());
            activity?.SetTag("enduser.id", userId);

            var existingState = await GetQueueStateAsync(userId);
            if (existingState.ActiveBattleId.HasValue)
            {
                return existingState.ActiveBattleId.Value;
            }

            if (!_playerState.TryAdd(userId, "queuing"))
                throw new InvalidOperationException("Already in queue");

            try
            {
                var stats = await _battleService.GetOrCreatePlayerStatsAsync(userId);
                _queue[userId] = new QueueEntry(userId, stats.RankPoints, mode, DateTime.UtcNow);

                _logger.LogInformation(
                    "Player joined in-memory battle queue. UserId={UserId} BattleMode={BattleMode} RankPoints={RankPoints}",
                    userId,
                    mode,
                    stats.RankPoints);

                return Guid.NewGuid();
            }
            catch
            {
                _playerState.TryRemove(userId, out _);
                _queue.TryRemove(userId, out _);
                throw;
            }
        }

        public Task LeaveQueueAsync(string userId)
        {
            _queue.TryRemove(userId, out _);
            _playerState.TryRemove(userId, out _);
            _logger.LogInformation("Player left in-memory battle queue. UserId={UserId}", userId);
            return Task.CompletedTask;
        }

        public async Task<Guid?> TryMatchAsync(string userId)
        {
            var started = Stopwatch.GetTimestamp();
            using var activity = _telemetry.ActivitySource.StartActivity("battle.matchmaking.try_match", ActivityKind.Internal);
            activity?.SetTag("enduser.id", userId);

            await _matchLock.WaitAsync();
            try
            {
                if (!_queue.TryGetValue(userId, out var myEntry))
                    return null;

                // 1. Try to find a human match
                var match = _queue.Values
                    .Where(e => e.UserId != userId && e.Mode == myEntry.Mode)
                    .Where(e => Math.Abs(e.RankPoints - myEntry.RankPoints) <= 300)
                    .OrderBy(e => Math.Abs(e.RankPoints - myEntry.RankPoints))
                    .FirstOrDefault();

                if (match is null && (DateTime.UtcNow - myEntry.QueuedAt).TotalSeconds > 10)
                {
                    match = _queue.Values
                        .Where(e => e.UserId != userId && e.Mode == myEntry.Mode)
                        .OrderBy(e => Math.Abs(e.RankPoints - myEntry.RankPoints))
                        .FirstOrDefault();
                }

                // 2. Auto-match with bot after a short wait (gives a second browser time to queue for human-vs-human tests)
                if (match is null && (DateTime.UtcNow - myEntry.QueuedAt).TotalSeconds > 12)
                {
                    _queue.TryRemove(userId, out _);
                    _playerState.TryRemove(userId, out _);

                    var botUserId = "bot-opponent";
                    var botBattle = await _battleService.CreateBattleAsync(userId, botUserId, myEntry.Mode);
                    _playerState[userId] = botBattle.Id.ToString();

                    _logger.LogInformation("Auto-matched with AI Challenger for local testing. UserId={UserId} BattleId={BattleId}", userId, botBattle.Id);
                    activity?.SetTag("battle.id", botBattle.Id.ToString());
                    return botBattle.Id;
                }

                if (match is null)
                    return null;

                // 3. Human match found
                _queue.TryRemove(userId, out _);
                _queue.TryRemove(match.UserId, out _);
                _playerState.TryRemove(userId, out _);
                _playerState.TryRemove(match.UserId, out _);

                _telemetry.RecordQueueWaitDuration(
                    (DateTime.UtcNow - myEntry.QueuedAt).TotalMilliseconds,
                    "battle-matchmaking",
                    myEntry.Mode.ToString());

                _logger.LogInformation(
                    "In-memory battle match found. UserId={UserId} OpponentUserId={OpponentUserId} BattleMode={BattleMode}",
                    userId,
                    match.UserId,
                    myEntry.Mode);

                var battle = await _battleService.CreateBattleAsync(userId, match.UserId, myEntry.Mode);

                _playerState[userId] = battle.Id.ToString();
                _playerState[match.UserId] = battle.Id.ToString();

                activity?.SetTag("battle.id", battle.Id.ToString());
                return battle.Id;
            }
            finally
            {
                _matchLock.Release();
                _telemetry.RecordMatchmakingLatency(
                    Stopwatch.GetElapsedTime(started).TotalMilliseconds,
                    "in-memory");
            }
        }

        public Task<Guid> CreateFriendChallengeAsync(string requesterId, string targetUserId, BattleMode mode)
        {
            var challengeId = Guid.NewGuid();
            _challenges[challengeId] = $"{requesterId}|{targetUserId}|{mode}";

            _logger.LogInformation(
                "Friend battle challenge created. RequesterId={RequesterId} TargetUserId={TargetUserId} ChallengeId={ChallengeId} BattleMode={BattleMode}",
                requesterId,
                targetUserId,
                challengeId,
                mode);

            _ = Task.Delay(TimeSpan.FromMinutes(2)).ContinueWith(_ =>
            {
                _challenges.TryRemove(challengeId, out var _);
            });

            return Task.FromResult(challengeId);
        }

        public async Task<Guid> AcceptChallengeAsync(Guid challengeId, string userId)
        {
            if (!_challenges.TryRemove(challengeId, out var data))
                throw new InvalidOperationException("Challenge expired or not found");

            var parts = data.Split('|');
            var requesterId = parts[0];
            var targetUserId = parts[1];
            var mode = Enum.Parse<BattleMode>(parts[2]);

            if (userId != targetUserId)
                throw new InvalidOperationException("This challenge is not for you");

            var battle = await _battleService.CreateBattleAsync(requesterId, targetUserId, mode);

            _playerState[requesterId] = battle.Id.ToString();
            _playerState[targetUserId] = battle.Id.ToString();

            _logger.LogInformation(
                "Friend battle challenge accepted. RequesterId={RequesterId} TargetUserId={TargetUserId} ChallengeId={ChallengeId} BattleId={BattleId}",
                requesterId,
                targetUserId,
                challengeId,
                battle.Id);

            return battle.Id;
        }

        public Task<bool> IsPlayerInQueueAsync(string userId)
        {
            return Task.FromResult(_playerState.TryGetValue(userId, out var state) && state == "queuing");
        }

        public Task<BattleQueueState> GetQueueStateAsync(string userId)
        {
            if (!_playerState.TryGetValue(userId, out var state))
            {
                return Task.FromResult(new BattleQueueState(false, null));
            }

            if (state == "queuing")
            {
                return Task.FromResult(new BattleQueueState(true, null));
            }

            return Task.FromResult(Guid.TryParse(state, out var battleId)
                ? new BattleQueueState(false, battleId)
                : new BattleQueueState(false, null));
        }

        public static int GetQueueSize() => _queue.Count;
        public static IEnumerable<string> GetQueuedPlayers() => _queue.Keys;
    }
}
