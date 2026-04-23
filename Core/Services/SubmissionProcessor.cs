using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;

namespace Services
{
    public class SubmissionProcessor
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICodeExecutionService _codeExecutionService;
        private readonly ILogger<SubmissionProcessor> _logger;

        public SubmissionProcessor(IUnitOfWork unitOfWork, ICodeExecutionService codeExecutionService, ILogger<SubmissionProcessor> logger)
        {
            _unitOfWork = unitOfWork;
            _codeExecutionService = codeExecutionService;
            _logger = logger;
        }

        public async Task ProcessSubmissionAsync(long submissionId)
        {
            var submission = await _unitOfWork.GetRepository<Submission, long>()
                .GetByIdAsync(submissionId);

            if (submission is null)
            {
                _logger.LogWarning("Submission {SubmissionId} not found.", submissionId);
                return;
            }

            if (submission.Status != SubmissionStatus.Queued)
            {
                _logger.LogInformation("Submission {SubmissionId} is already {Status}.", submissionId, submission.Status);
                return;
            }

            submission.Status = SubmissionStatus.Processing;
            await _unitOfWork.SaveChangesAsync();

            try
            {
                var problem = await _unitOfWork.GetRepository<Problem, int>()
                    .GetByIdAsync(submission.ProblemId, p => p.TestCases);

                if (problem is null || problem.TestCases.Count == 0)
                {
                    throw new InvalidOperationException("Problem not found or has no test cases.");
                }

                var testCases = problem.TestCases.ToList();
                var memoryLimitMb = ConvertKilobytesToMegabytes(problem.MemoryLimitKb);

                var batchResults = await _codeExecutionService.ExecuteBatchAsync(new BatchCodeExecutionRequest
                {
                    SourceCode = submission.Code,
                    Language = submission.Language.ToString().ToLowerInvariant(),
                    Inputs = testCases.Select(t => t.Input).ToList(),
                    TimeLimitMs = problem.TimeLimitMs,
                    MemoryLimitMB = memoryLimitMb
                });

                var testResults = new List<SubmissionTestResult>(testCases.Count);
                for (var i = 0; i < testCases.Count; i++)
                {
                    var testCase = testCases[i];
                    var execResult = i < batchResults.Count
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

                    var verdict = MapVerdict(execResult, testCase.ExpectedOutput);

                    testResults.Add(new SubmissionTestResult
                    {
                        TestCaseId = testCase.Id,
                        Verdict = verdict,
                        ActualOutput = execResult.Output,
                        RuntimeMs = execResult.ExecutionTimeMs,
                        MemoryKb = execResult.MemoryUsedKB
                    });
                }

                var maxRuntimeMs = testResults.Count == 0 ? 0 : testResults.Max(r => r.RuntimeMs);
                var maxMemoryKb = testResults.Count == 0 ? 0 : testResults.Max(r => r.MemoryKb);
                var overallVerdict = testResults
                    .Select(r => r.Verdict)
                    .FirstOrDefault(v => v != Verdict.Accepted, Verdict.Accepted);

                submission.Verdict = overallVerdict;
                submission.RuntimeMs = maxRuntimeMs;
                submission.MemoryKb = maxMemoryKb;
                submission.SubmissionTestResults = testResults;
                submission.Status = SubmissionStatus.Completed;

                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process submission {SubmissionId}.", submissionId);
                submission.Status = SubmissionStatus.Failed;
                submission.FailureReason = ex.Message;
                await _unitOfWork.SaveChangesAsync();
            }
        }

        private static Verdict MapVerdict(CodeExecutionResult result, string expectedOutput)
        {
            if (result.Verdict is Verdict.TimeLimitExceeded
                                or Verdict.MemoryLimitExceeded
                                or Verdict.compilationError)
                return result.Verdict;

            if (result.ExitCode != 0 || result.Verdict == Verdict.RuntimeError)
                return Verdict.RuntimeError;

            return Normalize(result.Output) == Normalize(expectedOutput)
                ? Verdict.Accepted
                : Verdict.WrongAnswer;
        }

        private static string Normalize(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            var normalizedLineBreaks = input.Replace("\r\n", "\n").Replace('\r', '\n');
            var lines = normalizedLineBreaks.Split('\n')
                .Select(line => line.TrimEnd());

            return string.Join('\n', lines).Trim();
        }

        private static int ConvertKilobytesToMegabytes(int memoryLimitKb)
        {
            if (memoryLimitKb <= 0)
                return 1;

            return (int)Math.Max(1, Math.Ceiling(memoryLimitKb / 1024d));
        }
    }
}
