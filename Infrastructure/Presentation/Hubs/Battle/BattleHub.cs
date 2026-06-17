using Domain.Models.BattleModule;
using Domain.Models.TopicModule;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using System.Security.Claims;

namespace Infrastructure.Presentation.Hubs.Battle
{
    [Authorize]
    public class BattleHub : Hub
    {
        private readonly IBattleMatchmakingService _matchmaking;
        private readonly IBattleSessionService _battleService;
        private readonly IBattleSubmissionService _submissionService;
        private readonly ILogger<BattleHub> _logger;

        public BattleHub(
            IBattleMatchmakingService matchmaking,
            IBattleSessionService battleService,
            IBattleSubmissionService submissionService,
            ILogger<BattleHub> logger)
        {
            _matchmaking = matchmaking;
            _battleService = battleService;
            _submissionService = submissionService;
            _logger = logger;
        }

        private string UserId => Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new HubException("Not authenticated");
        public override async Task OnConnectedAsync()
        {
            // Add user to their personal group for direct messaging
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{UserId}");
            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Do not leave queue or clear active battle on transient disconnects (page refresh/reconnect).
            // Explicit LeaveQueue / battle cleanup handles those cases.
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{UserId}");
            await base.OnDisconnectedAsync(exception);
        }
        // ── MATCHMAKING ──

        public async Task JoinQueue(BattleMode mode)
        {
            await _matchmaking.JoinQueueAsync(UserId, mode);
            await Clients.Caller.SendAsync("QueueJoined", new
            {
                mode
            });
            // Immediately try to find a match
            var battleId = await _matchmaking.TryMatchAsync(UserId);
            if (battleId.HasValue)
            {
                await NotifyMatchFound(battleId.Value);
            }
        }
        public async Task LeaveQueue()
        {
            await _matchmaking.LeaveQueueAsync(UserId);
            await Clients.Caller.SendAsync("QueueLeft");
        }
        // ── FRIEND CHALLENGE ──

        public async Task ChallengeFriend(string friendUserId, BattleMode mode)
        {
            var challengeId = await _matchmaking.CreateFriendChallengeAsync(UserId, friendUserId, mode);
            await Clients.Group($"user:{friendUserId}").SendAsync("FriendChallenge", new
            {
                challengeId,
                fromUserId = UserId,
                mode,
            });
            await Clients.Caller.SendAsync("ChallengeSent", new
            {
                challengeId,
                toUserId = friendUserId
            });
        }
        public async Task AcceptChallenge(Guid challengeId)
        {
            var battleId = await _matchmaking.AcceptChallengeAsync(challengeId, UserId);
            await NotifyMatchFound(battleId);
        }
        // ── BATTLE LIFECYCLE ──

        public async Task JoinBattle(Guid battleId)
        {
            var battle = await _battleService.GetBattleDetailAsync(battleId, UserId)
                ?? throw new HubException("Battle not found or access denied.");

            string groupName = $"battle:{battleId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("PlayerJoined", new
            {
                userId = UserId
            });

            if (battle.Status == BattleStatus.WaitingForPlayers)
            {
                try
                {
                    var started = await _battleService.StartBattleAsync(battleId, UserId);
                    await Clients.Group(groupName).SendAsync("BattleStarted", new
                    {
                        startTime = started.StartedAt,
                        timerSeconds = started.TimeLimitSeconds,
                    });
                }
                catch (InvalidOperationException)
                {
                    // Concurrent start or invalid transition; clients will still receive BattleState.
                }
            }

            battle = await _battleService.GetBattleDetailAsync(battleId, UserId);
            await Clients.Caller.SendAsync("BattleState", battle);
        }
        public async Task StartBattle(Guid battleId)
        {
            var battle = await _battleService.StartBattleAsync(battleId, UserId);
            await Clients.Group($"battle:{battleId}").SendAsync("BattleStarted", new
            {
                startTime = battle.StartedAt,
                timerSeconds = battle.TimeLimitSeconds,
            });
        }
        // ── CODE SUBMISSION ──

        public async Task<BattleSubmissionResult> SubmitCode(Guid battleId, int problemOrder, string code, string language)
        {
            string groupName = $"battle:{battleId}";

            if (!Enum.TryParse<ProgrammingLanguage>(language, ignoreCase: true, out var parsedLanguage))
                throw new HubException($"Unsupported language: {language}");

            try
            {
                await Clients.OthersInGroup(groupName).SendAsync("OpponentSubmitted", new
                {
                    problemOrder,
                    status = "testing",
                });

                var result = await _submissionService.SubmitCodeAsync(battleId, UserId, problemOrder, code, parsedLanguage);
                await NotifySubmissionResult(battleId, result, problemOrder);

                var battleDetail = await _battleService.GetBattleDetailAsync(battleId, UserId);
                if (battleDetail != null && result.PlayerSolvedCount >= battleDetail.ProblemsToWin)
                {
                    await _battleService.FinishBattleAsync(battleId);
                    var finalState = await _battleService.GetBattleDetailAsync(battleId, UserId);
                    await Clients.Group(groupName).SendAsync("BattleFinished", finalState);

                    if (finalState != null)
                    {
                        await CleanupBattleStateAsync(finalState);
                    }
                }

                return result;
            }
            catch (HubException)
            {
                throw;
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Battle SubmitCode failed (invalid operation). BattleId={BattleId} UserId={UserId}", battleId, UserId);
                throw new HubException(ex.Message);
            }
            catch (NotSupportedException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Battle SubmitCode failed. BattleId={BattleId} UserId={UserId}", battleId, UserId);
                throw new HubException("Submission failed. Check server logs; common causes are Docker not running or missing runner images.");
            }
        }

        public async Task SurrenderBattle(Guid battleId)
        {
            string groupName = $"battle:{battleId}";

            await _battleService.AbandonBattleAsync(battleId, UserId);

            var finalState = await _battleService.GetBattleDetailAsync(battleId, UserId);
            await Clients.Group(groupName).SendAsync("BattleFinished", finalState);

            if (finalState != null)
            {
                await CleanupBattleStateAsync(finalState);
            }
        }
        // ── LIVE STATUS ──

        public async Task SendTypingStatus(Guid battleId, bool isTyping)
        {
            await Clients.OthersInGroup($"battle:{battleId}").SendAsync("OpponentTyping", new
            {
                userId = UserId,
                isTyping,
            });
        }
        // ── HELPERS ──

        private async Task NotifyMatchFound(Guid battleId)
        {
            var battle = await _battleService.GetBattleDetailAsync(battleId, UserId);
            if (battle == null) return;

            foreach (var participantUserId in battle.Participants.Select(participant => participant.UserId))
            {
                // Send the exact same object shape that the REST API returns
                await Clients.Group($"user:{participantUserId}").SendAsync("MatchFound", battle);
            }
        }

        private async Task NotifySubmissionResult(
            Guid battleId,
            BattleSubmissionResult result,
            int problemOrder)
        {
            string groupName = $"battle:{battleId}";
            // Notify submitter of result
            await Clients.Caller.SendAsync("SubmissionResult", new
            {
                problemOrder,
                result.IsCorrect,
                result.Verdict,
                result.RuntimeMs,
                result.MemoryKb,
                result.PassedTestCases,
                result.TotalTestCases,
                result.PlayerSolvedCount,
            });
            // Notify opponent of outcome
            await Clients.OthersInGroup(groupName).SendAsync("OpponentResult", new
            {
                problemOrder,
                result.IsCorrect,
                solvedCount = result.PlayerSolvedCount,
            });
            // Update scores for all in group
            await Clients.Group(groupName).SendAsync("ScoreUpdated", new
            {
                userId = UserId,
                solvedCount = result.PlayerSolvedCount,
            });
        }

        private async Task CleanupBattleStateAsync(BattleDetailDto battle)
        {
            foreach (var participant in battle.Participants)
            {
                await _matchmaking.LeaveQueueAsync(participant.UserId);
            }
        }
    }
}




