using Services.Problems;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;

namespace Services.Battle
{
    public class BattleExecutionService(ICodeExecutionService codeExecutionService) : IBattleExecutionService
    {
        public async Task<BattleExecutionResult> ExecuteAsync(Problem problem, string code, ProgrammingLanguage language)
        {
            if (problem.TestCases.Count == 0)
                throw new InvalidOperationException("Battle problem has no test cases.");

            var testCases = problem.TestCases.ToList();
            var memoryLimitMb = SubmissionHelpers.ConvertKilobytesToMegabytes(problem.MemoryLimitKb);

            var batchResults = await codeExecutionService.ExecuteBatchAsync(new BatchCodeExecutionRequest
            {
                SourceCode = code,
                Language = language.ToString().ToLowerInvariant(),
                Inputs = testCases.Select(t => t.Input).ToList(),
                TimeLimitMs = problem.TimeLimitMs,
                MemoryLimitMB = memoryLimitMb
            });

            var passedTests = 0;
            Verdict? finalVerdict = Verdict.Accepted;

            for (var i = 0;
i < testCases.Count;
i++)
            {
                var testCase = testCases[i];
                var executionResult = i < batchResults.Count
                    ? batchResults[i]
                    : new CodeExecutionResult
                    {
                        Output = string.Empty,
                        Error = "Missing execution result.",
                        ExitCode = -1,
                        ExecutionTimeMs = 0,
                        MemoryUsedKB = 0,
                        Verdict = Verdict.RuntimeError
                    };

                var verdict = SubmissionHelpers.MapVerdict(executionResult, testCase.ExpectedOutput);
                if (verdict == Verdict.Accepted)
                    passedTests++;
                else if (finalVerdict == Verdict.Accepted)
                    finalVerdict = verdict;
            }

            var isCorrect = passedTests == testCases.Count;
            if (!isCorrect && finalVerdict == Verdict.Accepted)
                finalVerdict = Verdict.WrongAnswer;

            return new BattleExecutionResult(
                isCorrect,
                isCorrect ? Verdict.Accepted : finalVerdict,
                batchResults.Count == 0 ? 0 : batchResults.Max(r => r.ExecutionTimeMs),
                0,
                passedTests,
                testCases.Count);
        }
    }
}


