using Domain.Models.BattleModule;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;

namespace ServicesAbstraction
{
    public record BattleSubmissionResult(
        bool IsCorrect, Verdict? Verdict, long? RuntimeMs, long? MemoryKb,
        int PassedTestCases, int TotalTestCases, int PlayerSolvedCount);
    public interface IBattleSubmissionService
    {
        Task<BattleSubmissionResult> SubmitCodeAsync(
            Guid battleId, string userId, int problemOrder,
            string code, ProgrammingLanguage language);
    }
}


