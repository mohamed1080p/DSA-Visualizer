using Domain.Models.BattleModule;
using Domain.Models.TopicModule;
using Infrastructure.Presentation.Hubs.Battle;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using System.Security.Claims;

namespace Infrastructure.Presentation.Controllers.Battle
{
    public sealed record JoinBattleQueueRequest(BattleMode Mode);
    public sealed record SubmitBattleCodeRequest(int ProblemOrder, string Code, string Language);

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BattleController : ControllerBase
    {
        private readonly IBattleSessionService _battleSessionService;
        private readonly IBattleMatchmakingService _matchmakingService;
        private readonly IBattleSubmissionService _battleSubmissionService;
        private readonly IHubContext<BattleHub> _battleHubContext;
        private readonly ILogger<BattleController> _logger;
        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        public BattleController(
            IBattleSessionService battleSessionService,
            IBattleMatchmakingService matchmakingService,
            IBattleSubmissionService battleSubmissionService,
            IHubContext<BattleHub> battleHubContext,
            ILogger<BattleController> logger)
        {
            _battleSessionService = battleSessionService;
            _matchmakingService = matchmakingService;
            _battleSubmissionService = battleSubmissionService;
            _battleHubContext = battleHubContext;
            _logger = logger;
        }

        [HttpGet("queue/status")]
        public async Task<IActionResult> GetQueueStatus()
        {
            var state = await _matchmakingService.GetQueueStateAsync(UserId);
            return Ok(new
            {
                queued = state.IsQueued,
                battleId = state.ActiveBattleId
            });
        }

        [HttpPost("queue")]
        public async Task<IActionResult> JoinQueue([FromBody] JoinBattleQueueRequest request)
        {
            try
            {
                var state = await _matchmakingService.GetQueueStateAsync(UserId);
                
                if (state.ActiveBattleId.HasValue)
                {
                    _logger.LogInformation("Active battle found. Returning existing battle. BattleId={BattleId} UserId={UserId}", state.ActiveBattleId, UserId);
                    return Ok(new
                    {
                        queued = false,
                        battleId = state.ActiveBattleId,
                        mode = request.Mode.ToString()
                    });
                }

                if (!state.IsQueued)
                {
                    await _matchmakingService.JoinQueueAsync(UserId, request.Mode);
                }

                var battleId = await _matchmakingService.TryMatchAsync(UserId);
                return Ok(new
                {
                    queued = !battleId.HasValue,
                    battleId,
                    mode = request.Mode.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in JoinQueue. UserId={UserId}", UserId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("queue")]
        public async Task<IActionResult> LeaveQueue()
        {
            await _matchmakingService.LeaveQueueAsync(UserId);
            return NoContent();
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetMyStats()
        {
            var stats = await _battleSessionService.GetOrCreatePlayerStatsAsync(UserId);
            return Ok(new
            {
                stats.RankPoints,
                stats.Level,
                stats.WinCount,
                stats.LossCount,
                stats.DrawCount,
                stats.CurrentStreak,
                stats.BestStreak,
                stats.WinRate,
                stats.TotalBattles,
                stats.PreferredLanguage,
            });
        }

        [HttpGet("stats/{userId}")]
        public async Task<IActionResult> GetPlayerStats(string userId)
        {
            var stats = await _battleSessionService.GetOrCreatePlayerStatsAsync(userId);
            return Ok(new
            {
                stats.RankPoints,
                stats.Level,
                stats.WinCount,
                stats.LossCount,
                stats.DrawCount,
                stats.CurrentStreak,
                stats.BestStreak,
                stats.WinRate,
                stats.TotalBattles,
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetMyBattleHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var history = await _battleSessionService.GetUserBattleHistoryAsync(UserId, page, pageSize);
            return Ok(history);
        }

        [HttpPost("challenge/bot")]
        public async Task<IActionResult> StartBotPractice([FromBody] JoinBattleQueueRequest request)
        {
            var botId = "bot-opponent";
            var battle = await _battleSessionService.CreateBattleAsync(UserId, botId, request.Mode);
            var battleDetails = await _battleSessionService.GetBattleDetailAsync(battle.Id, UserId);
            return Ok(battleDetails);
        }

        [HttpGet("{battleId:guid}")]
        public async Task<IActionResult> GetBattle(Guid battleId)
        {
            var battle = await _battleSessionService.GetBattleDetailAsync(battleId, UserId);
            if (battle == null) return NotFound();
            return Ok(battle);
        }

        [HttpPost("{battleId:guid}/submissions")]
        [EnableRateLimiting("submissions-policy")]
        public async Task<ActionResult<BattleSubmissionResult>> SubmitCode(
            Guid battleId,
            [FromBody] SubmitBattleCodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { Message = "Code is required." });

            var language = ParseLanguage(request.Language);
            var groupName = $"battle:{battleId}";
            var battleDetail = await _battleSessionService.GetBattleDetailAsync(battleId, UserId);

            await NotifyOpponentsAsync(battleDetail, "OpponentSubmitted", new
            {
                userId = UserId,
                problemOrder = request.ProblemOrder,
                status = "testing",
            });

            var result = await _battleSubmissionService.SubmitCodeAsync(
                battleId,
                UserId,
                request.ProblemOrder,
                request.Code,
                language);

            battleDetail = await _battleSessionService.GetBattleDetailAsync(battleId, UserId);
            await NotifySubmissionResultAsync(groupName, battleDetail, request.ProblemOrder, result);

            if (battleDetail != null && result.PlayerSolvedCount >= battleDetail.ProblemsToWin)
            {
                await _battleSessionService.FinishBattleAsync(battleId);
                var finalState = await _battleSessionService.GetBattleDetailAsync(battleId, UserId);
                await _battleHubContext.Clients.Group(groupName).SendAsync("BattleFinished", finalState);

                if (finalState != null)
                    await CleanupBattleStateAsync(finalState);
            }

            return Ok(result);
        }

        private static ProgrammingLanguage ParseLanguage(string language)
        {
            var normalized = string.Equals(language, "cs", StringComparison.OrdinalIgnoreCase)
                ? "csharp"
                : language;

            if (Enum.TryParse<ProgrammingLanguage>(normalized, ignoreCase: true, out var parsedLanguage))
                return parsedLanguage;

            throw new ArgumentException($"Unsupported language: {language}", nameof(language));
        }

        private async Task NotifySubmissionResultAsync(
            string groupName,
            BattleDetailDto? battleDetail,
            int problemOrder,
            BattleSubmissionResult result)
        {
            await _battleHubContext.Clients.Group($"user:{UserId}").SendAsync("SubmissionResult", new
            {
                userId = UserId,
                problemOrder,
                result.IsCorrect,
                result.Verdict,
                result.RuntimeMs,
                result.MemoryKb,
                result.PassedTestCases,
                result.TotalTestCases,
                result.PlayerSolvedCount,
            });

            await NotifyOpponentsAsync(battleDetail, "OpponentResult", new
            {
                userId = UserId,
                problemOrder,
                result.IsCorrect,
                solvedCount = result.PlayerSolvedCount,
            });

            await _battleHubContext.Clients.Group(groupName).SendAsync("ScoreUpdated", new
            {
                userId = UserId,
                solvedCount = result.PlayerSolvedCount,
            });
        }

        private async Task NotifyOpponentsAsync(BattleDetailDto? battleDetail, string method, object payload)
        {
            if (battleDetail == null) return;

            foreach (var participant in battleDetail.Participants.Where(p => p.UserId != UserId))
            {
                await _battleHubContext.Clients.Group($"user:{participant.UserId}").SendAsync(method, payload);
            }
        }

        private async Task CleanupBattleStateAsync(BattleDetailDto battle)
        {
            foreach (var participant in battle.Participants)
            {
                await _matchmakingService.LeaveQueueAsync(participant.UserId);
            }
        }
    }
}
