using System.Collections.Concurrent;
using System.Reflection;
using Domain.Models.BattleModule;
using Infrastructure.External.Common;
using Microsoft.Extensions.Logging.Abstractions;
using ServicesAbstraction;
using Xunit;

namespace DSA.Visualizer.Tests;

[CollectionDefinition(nameof(MatchmakingServiceCollection), DisableParallelization = true)]
public sealed class MatchmakingServiceCollection;

[Collection(nameof(MatchmakingServiceCollection))]
public sealed class MatchmakingServiceTests : IDisposable
{
    public MatchmakingServiceTests()
    {
        ResetStaticState();
    }

    [Theory]
    [InlineData(BattleMode.FirstToSolve)]
    [InlineData(BattleMode.Timed)]
    [InlineData(BattleMode.Survival)]
    public async Task Human_match_works_for_all_modes(BattleMode mode)
    {
        var battleService = new FakeBattleSessionService();
        var telemetry = new FakeTelemetryService();
        var sut = new InMemoryMatchmakingService(battleService, telemetry, NullLogger<InMemoryMatchmakingService>.Instance);

        var player1 = $"player-a-{mode}";
        var player2 = $"player-b-{mode}";

        await sut.JoinQueueAsync(player1, mode);
        await sut.JoinQueueAsync(player2, mode);

        var battleId = await sut.TryMatchAsync(player1);

        Assert.True(battleId.HasValue);
        Assert.Single(battleService.CreatedBattles);
        Assert.Equal(mode, battleService.CreatedBattles[0].Mode);
        var participants = battleService.CreatedBattles[0].Participants.ToList();
        Assert.Equal(player1, participants[0].UserId);
        Assert.Equal(player2, participants[1].UserId);

        var state1 = await sut.GetQueueStateAsync(player1);
        var state2 = await sut.GetQueueStateAsync(player2);

        Assert.Equal(battleId, state1.ActiveBattleId);
        Assert.Equal(battleId, state2.ActiveBattleId);
        Assert.False(state1.IsQueued);
        Assert.False(state2.IsQueued);
    }

    [Fact]
    public async Task LeaveQueue_clears_queue_state()
    {
        var battleService = new FakeBattleSessionService();
        var telemetry = new FakeTelemetryService();
        var sut = new InMemoryMatchmakingService(battleService, telemetry, NullLogger<InMemoryMatchmakingService>.Instance);

        await sut.JoinQueueAsync("solo-player", BattleMode.Timed);
        await sut.LeaveQueueAsync("solo-player");

        var state = await sut.GetQueueStateAsync("solo-player");

        Assert.False(state.IsQueued);
        Assert.Null(state.ActiveBattleId);
    }

    public void Dispose()
    {
        ResetStaticState();
    }

    private static void ResetStaticState()
    {
        ClearConcurrentDictionary(typeof(InMemoryMatchmakingService), "_queue");
        ClearConcurrentDictionary(typeof(InMemoryMatchmakingService), "_challenges");
        ClearConcurrentDictionary(typeof(InMemoryMatchmakingService), "_playerState");
    }

    private static void ClearConcurrentDictionary(Type type, string fieldName)
    {
        var field = type.GetField(fieldName, BindingFlags.NonPublic | BindingFlags.Static);
        if (field?.GetValue(null) is System.Collections.IDictionary dictionary)
        {
            dictionary.Clear();
            return;
        }

        if (field?.GetValue(null) is ConcurrentDictionary<string, string> stringDictionary)
        {
            stringDictionary.Clear();
            return;
        }

        if (field?.GetValue(null) is ConcurrentDictionary<string, object> objectDictionary)
        {
            objectDictionary.Clear();
        }
    }

    private sealed class FakeBattleSessionService : IBattleSessionService
    {
        public List<BattleSession> CreatedBattles { get; } = [];

        public Task<BattleSession> CreateBattleAsync(string player1Id, string player2Id, BattleMode mode)
        {
            var battle = new BattleSession
            {
                Id = Guid.NewGuid(),
                Mode = mode,
                Participants =
                [
                    new BattleParticipant { UserId = player1Id },
                    new BattleParticipant { UserId = player2Id }
                ],
                Problems =
                [
                    new BattleProblem { Order = 1, ProblemId = 101 },
                    new BattleProblem { Order = 2, ProblemId = 102 }
                ]
            };

            CreatedBattles.Add(battle);
            return Task.FromResult(battle);
        }

        public Task<BattleSession> StartBattleAsync(Guid battleId, string actorUserId) => throw new NotImplementedException();
        public Task FinishBattleAsync(Guid battleId) => Task.CompletedTask;
        public Task AbandonBattleAsync(Guid battleId, string userId) => Task.CompletedTask;
        public Task<BattleDetailDto?> GetBattleDetailAsync(Guid battleId, string userId)
        {
            var battle = CreatedBattles.FirstOrDefault(b => b.Id == battleId);
            if (battle == null || battle.Participants.All(p => p.UserId != userId))
            {
                return Task.FromResult<BattleDetailDto?>(null);
            }

            var dto = new BattleDetailDto(
                battle.Id,
                battle.Mode,
                battle.Status,
                DateTime.UtcNow,
                null,
                null,
                600,
                3,
                null,
                battle.Participants
                    .Select(p => new BattleParticipantDto(p.UserId, "Player", 0, 0))
                    .ToList(),
                battle.Problems
                    .Select(p => new BattleProblemDto(p.Order, p.ProblemId, "", "", "Easy", null))
                    .ToList());

            return Task.FromResult<BattleDetailDto?>(dto);
        }
        public Task<Guid?> GetActiveBattleIdForUserAsync(string userId) => Task.FromResult<Guid?>(null);
        public Task<List<BattleDetailDto>> GetUserBattleHistoryAsync(string userId, int page = 1, int pageSize = 20) => Task.FromResult(new List<BattleDetailDto>());
        public Task<PlayerStats> GetOrCreatePlayerStatsAsync(string userId) => Task.FromResult(new PlayerStats { UserId = userId, RankPoints = 1000 });
    }

    private sealed class FakeTelemetryService : ITelemetryService
    {
        public System.Diagnostics.ActivitySource ActivitySource { get; } = new(nameof(FakeTelemetryService));
        public void RecordApiRequestDuration(double elapsedMs, string method, string route, int statusCode) { }
        public void RecordDatabaseQueryDuration(double durationMs, string operation) { }
        public void RecordRedisLatency(double durationMs, string operation) { }
        public void RecordQueueWaitDuration(double elapsedMs, string queueName, string? subQueue = null) { }
        public void RecordMatchmakingLatency(double elapsedMs, string backend) { }
        public void RecordCodeExecutionDuration(double durationMs, string language, bool isBatch) { }
        public void RecordBattleSubmissionDuration(double durationMs, string language) { }
        public void TrackAuditEvent(string eventName, string userId, params KeyValuePair<string, object?>[] extraTags) { }
        public Task<T> MeasureRedisAsync<T>(string operation, Func<Task<T>> action) => action();
    }
}