using Domain.Contracts;
using Domain.Models.BattleModule;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using System.Diagnostics;

namespace Services.Battle;

public class BattleSubmissionService : IBattleSubmissionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBattleExecutionService _battleExecution;
    private readonly IAntiCheatService _antiCheat;
    private readonly ITelemetryService _telemetry;
    private readonly ILogger<BattleSubmissionService> _logger;

    public BattleSubmissionService(
        IUnitOfWork unitOfWork,
        IBattleExecutionService battleExecution,
        IAntiCheatService antiCheat,
        ITelemetryService telemetry,
        ILogger<BattleSubmissionService> logger)
    {
        _unitOfWork = unitOfWork;
        _battleExecution = battleExecution;
        _antiCheat = antiCheat;
        _telemetry = telemetry;
        _logger = logger;
    }

    public async Task<BattleSubmissionResult> SubmitCodeAsync(
        Guid battleId, string userId, int problemOrder,
        string code, ProgrammingLanguage language)
    {
        var started = Stopwatch.GetTimestamp();
        using var activity = _telemetry.ActivitySource.StartActivity("battle.submit_code", ActivityKind.Internal);
        activity?.SetTag("battle.id", battleId.ToString());
        activity?.SetTag("battle.problem_order", problemOrder);
        activity?.SetTag("enduser.id", userId);
        activity?.SetTag("code.language", language.ToString());

        var battleRepo = _unitOfWork.GetRepository<BattleSession, Guid>();
        var battle = await battleRepo.GetByIdAsync(battleId)
            ?? throw new InvalidOperationException("Battle not found");

        if (battle.Status != BattleStatus.InProgress)
            throw new InvalidOperationException("Battle is not in progress");

        if (!battle.Participants.Any(p => p.UserId == userId))
            throw new UnauthorizedAccessException("You are not a participant in this battle.");

        var battleProblem = battle.Problems.FirstOrDefault(p => p.Order == problemOrder)
            ?? throw new InvalidOperationException("Problem not found in battle");

        if (battle.StartedAt.HasValue && _antiCheat.IsSuspiciouslyFast(battle.StartedAt.Value, DateTime.UtcNow))
        {
            _logger.LogWarning("Anti-cheat: suspiciously fast submission from {UserId} in battle {BattleId}", userId, battleId);
        }

        var problemRepo = _unitOfWork.GetRepository<Problem, int>();
        var problem = await problemRepo.GetByIdAsync(battleProblem.ProblemId, p => p.TestCases)
            ?? throw new InvalidOperationException("Problem not found");

        var executionResult = await _battleExecution.ExecuteAsync(problem, code, language);
        activity?.SetTag("code.verdict", executionResult.Verdict?.ToString());

        var battleSubRepo = _unitOfWork.GetRepository<BattleSubmission, long>();
        var alreadySolved = (await battleSubRepo.GetAllAsync(
                predicate: s => s.BattleSessionId == battleId && s.UserId == userId && s.BattleProblemId == battleProblem.Id && s.IsCorrect,
                orderBy: null))
            .Any();

        var battleSubmission = new BattleSubmission
        {
            BattleSessionId = battleId,
            UserId = userId,
            BattleProblemId = battleProblem.Id,
            Code = code,
            Language = language,
            Verdict = executionResult.Verdict,
            RuntimeMs = executionResult.RuntimeMs,
            MemoryKb = executionResult.MemoryKb,
            IsCorrect = executionResult.IsCorrect,
            PassedTestCases = executionResult.PassedTestCases,
            TotalTestCases = executionResult.TotalTestCases,
        };

        await battleSubRepo.AddAsync(battleSubmission);

        var participant = battle.Participants.FirstOrDefault(p => p.UserId == userId);
        var playerSolvedCount = participant?.SolvedCount ?? 0;

        if (executionResult.IsCorrect && !alreadySolved && participant != null)
        {
            participant.SolvedCount++;
            playerSolvedCount = participant.SolvedCount;
        }

        await _unitOfWork.SaveChangesAsync();

        _telemetry.RecordBattleSubmissionDuration(Stopwatch.GetElapsedTime(started).TotalMilliseconds, language.ToString());

        if (alreadySolved && executionResult.IsCorrect)
        {
            _logger.LogInformation("Battle problem was already solved; duplicate correct submission did not increment score. BattleId={BattleId} UserId={UserId} BattleProblemId={BattleProblemId}",
                battleId, userId, battleProblem.Id);
        }

        return new BattleSubmissionResult(
            executionResult.IsCorrect,
            executionResult.Verdict,
            executionResult.RuntimeMs,
            executionResult.MemoryKb,
            executionResult.PassedTestCases,
            executionResult.TotalTestCases,
            playerSolvedCount);
    }
}
