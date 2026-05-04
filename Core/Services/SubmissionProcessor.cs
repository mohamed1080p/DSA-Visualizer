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
        private readonly IServiceManager _serviceManager;

        public SubmissionProcessor(IUnitOfWork unitOfWork, ICodeExecutionService codeExecutionService, ILogger<SubmissionProcessor> logger, IServiceManager serviceManager)
        {
            _unitOfWork = unitOfWork;
            _codeExecutionService = codeExecutionService;
            _logger = logger;
            _serviceManager = serviceManager;
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
                var memoryLimitMb = SubmissionHelpers.ConvertKilobytesToMegabytes(problem.MemoryLimitKb);

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

                    var verdict = SubmissionHelpers.MapVerdict(execResult, testCase.ExpectedOutput);

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

                if (overallVerdict == Verdict.Accepted)
                {
                    await _serviceManager.LearningPathService.AdvanceIfCurrentLevelMatchesAsync(submission.UserId, problemId: submission.ProblemId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process submission {SubmissionId}.", submissionId);
                submission.Status = SubmissionStatus.Failed;
                submission.FailureReason = ex.Message;
                await _unitOfWork.SaveChangesAsync();
            }
        }

    }
}
