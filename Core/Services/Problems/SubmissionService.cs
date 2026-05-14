using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using Hangfire;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;

namespace Services.Problems
{
    public class SubmissionService : ISubmissionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICodeExecutionService _codeExecutionService;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly ITelemetryService _telemetry;
        private readonly ILogger<SubmissionService> _logger;

        private static readonly string[] SupportedLanguages = ["python", "cpp", "csharp", "java", "cs"];
        public SubmissionService(
                    IUnitOfWork unitOfWork,
                    ICodeExecutionService codeExecutionService,
                    IBackgroundJobClient backgroundJobClient,
                    ITelemetryService telemetry,
                    ILogger<SubmissionService> logger)
        {
            _unitOfWork = unitOfWork;
            _codeExecutionService = codeExecutionService;
            _backgroundJobClient = backgroundJobClient;
            _telemetry = telemetry;
            _logger = logger;
        }
        public async Task<SubmissionQueuedDTO> SubmitAsync(SubmitProblemDTO dto, string userId)
        {
            ArgumentNullException.ThrowIfNull(dto);
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("Authenticated user id is required.", nameof(userId));

            if (string.IsNullOrWhiteSpace(dto.Language))
                throw new ArgumentException("Language is required.", nameof(dto.Language));

            var normalizedLanguage = dto.Language.Trim().ToLowerInvariant();

            if (!SupportedLanguages.Contains(normalizedLanguage))
                throw new InvalidOperationException($"Unsupported language: {dto.Language}");

            if (normalizedLanguage == "cs")
                normalizedLanguage = "csharp";

            var problem = await _unitOfWork
                .ProblemRepository
                .GetBySlugAsync(dto.Slug);


            if (problem is null)
                throw new KeyNotFoundException($"Problem '{dto.Slug}' was not found.");

            if (problem.TestCases.Count == 0)
                throw new InvalidOperationException($"Problem '{dto.Slug}' has no test cases.");

            var languageEnum = Enum.Parse<ProgrammingLanguage>(normalizedLanguage, ignoreCase: true);
            var submission = new Submission(userId, problem.Id, dto.Code, languageEnum);

            await _unitOfWork.GetRepository<Submission, long>().AddAsync(submission);
            await _unitOfWork.SaveChangesAsync();

            _backgroundJobClient.Enqueue<SubmissionProcessor>(p => p.ProcessSubmissionAsync(submission.Id));

            _telemetry.TrackAuditEvent("submission.queued", userId,
                new KeyValuePair<string, object?>("problem.id", problem.Id));

            _logger.LogInformation(
                "Submission queued. SubmissionId={SubmissionId} UserId={UserId} ProblemId={ProblemId} Language={Language}",
                submission.Id,
                userId,
                problem.Id,
                normalizedLanguage);

            return new SubmissionQueuedDTO
            {
                SubmissionId = submission.Id,
                Status = "Queued",
                PollUrl = $"/api/submissions/{submission.Id}"
            };
        }
        public async Task<IEnumerable<SubmissionHistoryDTO>> GetSubmissionHistoryAsync(string slug, string userId)
        {
            var submissions = await _unitOfWork.SubmissionRepository
                .GetUserSubmissionsBySlugAsync(userId, slug);

            return submissions.Select(MapToHistoryDTO);
        }
        public async Task<IEnumerable<SubmissionHistoryDTO>> GetAllSubmissionHistoryAsync(string userId)
        {
            var submissions = await _unitOfWork.SubmissionRepository
                .GetAllUserSubmissionsAsync(userId);

            return submissions.Select(MapToHistoryDTO);
        }
        public async Task<SubmissionResultDTO> GetSubmissionByIdAsync(long submissionId, string userId)
        {
            var submission = await _unitOfWork
                .GetRepository<Submission, long>()
                .GetByIdAsync(submissionId, s => s.SubmissionTestResults);

            if (submission is null)
                throw new KeyNotFoundException($"Submission with Id {submissionId} was not found.");

            if (submission.UserId != userId)
                throw new UnauthorizedAccessException("You do not have permission to view this submission.");

            var problem = await _unitOfWork
                .GetRepository<Problem, int>()
                .GetByIdAsync(submission.ProblemId, p => p.TestCases);

            var testCaseMap = problem?.TestCases.ToDictionary(t => t.Id) ?? [];

            return new SubmissionResultDTO
            {
                Id = submission.Id,
                Status = submission.Status.ToString(),
                Verdict = submission.Verdict?.ToString() ?? string.Empty,
                FailureReason = submission.FailureReason ?? string.Empty,
                Language = submission.Language.ToString(),
                RuntimeMs = submission.RuntimeMs,
                MemoryKb = submission.MemoryKb,
                SubmittedAt = submission.SubmittedAt,
                TestResults = submission.SubmissionTestResults.Select(r => MapTestResult(r, testCaseMap))
            };
        }
        // ───────────────────────────────────────────────
        // Helpers
        // ───────────────────────────────────────────────

        private static SubmissionHistoryDTO MapToHistoryDTO(Submission s) => new()
        {
            Id = s.Id,
            Status = s.Status.ToString(),
            Verdict = s.Verdict?.ToString() ?? string.Empty,
            FailureReason = s.FailureReason ?? string.Empty,
            Language = s.Language.ToString(),
            RuntimeMs = s.RuntimeMs,
            MemoryKb = s.MemoryKb,
            SubmittedAt = s.SubmittedAt,
            ProblemSlug = s.Problem?.Slug ?? string.Empty,
            ProblemTitle = s.Problem?.Title ?? string.Empty
        };

        private static SubmissionTestCaseResultDTO MapTestResult(
            SubmissionTestResult result,
            IReadOnlyDictionary<int, TestCase> testCaseMap)
        {
            if (!testCaseMap.TryGetValue(result.TestCaseId, out var testCase))
            {
                return new SubmissionTestCaseResultDTO
                {
                    Verdict = result.Verdict.ToString(),
                    ActualOutput = result.ActualOutput,
                    ExpectedOutput = string.Empty,
                    Input = string.Empty,
                    RuntimeMs = (int?)result.RuntimeMs
                };
            }

            return new SubmissionTestCaseResultDTO
            {
                Verdict = result.Verdict.ToString(),
                ActualOutput = result.ActualOutput,
                ExpectedOutput = testCase.ExpectedOutput,
                Input = testCase.IsHidden ? "Hidden" : testCase.Input,
                RuntimeMs = (int?)result.RuntimeMs
            };
        }
    }
}




