using Services.Problems;
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Diagnostics;

namespace Services.Problems
{
    public class SubmissionProcessor
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICodeExecutionService _codeExecutionService;
        private readonly ILearningPathService _learningPathService;
        private readonly ITelemetryService _telemetry;
        private readonly ILogger<SubmissionProcessor> _logger;
        public SubmissionProcessor(IUnitOfWork unitOfWork, ICodeExecutionService codeExecutionService, ILearningPathService learningPathService, ITelemetryService telemetry, ILogger<SubmissionProcessor> logger)
        {
            _unitOfWork = unitOfWork;
            _codeExecutionService = codeExecutionService;
            _learningPathService = learningPathService;
            _telemetry = telemetry;
            _logger = logger;
        }
        public Task ProcessSubmissionAsync(long submissionId) =>
                    ProcessSubmissionAsync(submissionId, CancellationToken.None);
        public async Task ProcessSubmissionAsync(long submissionId, CancellationToken cancellationToken)
        {
            var started = Stopwatch.GetTimestamp();
            using var activity = _telemetry.ActivitySource.StartActivity("submission.process", ActivityKind.Consumer);
            activity?.SetTag("submission.id", submissionId);

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

            submission.MarkAsRunning();
            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogInformation(
                    ex,
                    "Submission processing skipped because another worker claimed it. SubmissionId={SubmissionId}",
                    submissionId);
                return;
            }

            _telemetry.RecordQueueWaitDuration(
                Math.Max(0, (DateTime.UtcNow - submission.SubmittedAt).TotalMilliseconds),
                "submissions");

            try
            {
                cancellationToken.ThrowIfCancellationRequested();
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
                }, cancellationToken);

                var testResults = new List<SubmissionTestResult>(testCases.Count);
                for (var i = 0;
i < testCases.Count;
i++)
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
                        ActualOutput = BuildActualOutput(execResult),
                        RuntimeMs = execResult.ExecutionTimeMs,
                        MemoryKb = execResult.MemoryUsedKB
                    });
                }

                var maxRuntimeMs = testResults.Count == 0 ? 0 : testResults.Max(r => r.RuntimeMs);
                var maxMemoryKb = testResults.Count == 0 ? 0 : testResults.Max(r => r.MemoryKb);
                var overallVerdict = testResults
                    .Select(r => r.Verdict)
                    .FirstOrDefault(v => v != Verdict.Accepted, Verdict.Accepted);

                submission.Complete(overallVerdict, maxRuntimeMs, maxMemoryKb);
                foreach (var tr in testResults) submission.AddTestResult(tr);

                await _unitOfWork.SaveChangesAsync();

                if (overallVerdict == Verdict.Accepted)
                {
                    await _learningPathService.AdvanceIfCurrentLevelMatchesAsync(submission.UserId, problemId: submission.ProblemId);
                }

                activity?.SetTag("submission.verdict", overallVerdict.ToString());
            }
            catch (Exception ex)
            {
                activity?.SetStatus(ActivityStatusCode.Error);
                activity?.SetTag("exception.type", ex.GetType().FullName);
                activity?.SetTag("exception.message", ex.Message);
                _logger.LogError(ex, "Failed to process submission {SubmissionId}.", submissionId);
                submission.MarkAsFailed(ex.Message);
                await _unitOfWork.SaveChangesAsync();
            }
            finally
            {
                _telemetry.RecordCodeExecutionDuration(
                    Stopwatch.GetElapsedTime(started).TotalMilliseconds,
                    submission.Language.ToString().ToLowerInvariant(),
                    true);
            }
        }

        private static string BuildActualOutput(CodeExecutionResult result)
        {
            if (!string.IsNullOrWhiteSpace(result.Output))
                return result.Output;

            return result.Error ?? string.Empty;
        }
    }
}




