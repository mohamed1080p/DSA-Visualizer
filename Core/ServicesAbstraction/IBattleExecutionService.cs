using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;

namespace ServicesAbstraction
{
    public record BattleExecutionResult(
        bool IsCorrect,
        Verdict? Verdict,
        long? RuntimeMs,
        long? MemoryKb,
        int PassedTestCases,
        int TotalTestCases);
    public interface IBattleExecutionService
    {
        Task<BattleExecutionResult> ExecuteAsync(Problem problem, string code, ProgrammingLanguage language);
    }
}


