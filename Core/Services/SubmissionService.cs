using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;

namespace Services
{
    public class SubmissionService : ISubmissionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICodeExecutionService _codeExecutionService;
        

        public SubmissionService(IUnitOfWork unitOfWork, ICodeExecutionService codeExecutionService)
        {
            _unitOfWork = unitOfWork;
            _codeExecutionService = codeExecutionService;
        }

        public async Task<SubmissionResultDTO> SubmitAsync(SubmitProblemDTO dto, string userId)
        {
            ArgumentNullException.ThrowIfNull(dto);

            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User id is required.", nameof(userId));

            if (string.IsNullOrWhiteSpace(dto.Language))
                throw new ArgumentException("Language is required.", nameof(dto.Language));

            var supportedLanguages = new[] { "python", "cpp", "csharp", "java" };
            var normalizedLanguage = dto.Language.Trim().ToLowerInvariant();

            if (!supportedLanguages.Contains(normalizedLanguage))
                throw new InvalidOperationException($"Unsupported language: {dto.Language}");

            var problem = await _unitOfWork
                .ProblemRepository
                .GetBySlugAsync(dto.Slug);

            if (problem is null)
                throw new KeyNotFoundException($"Problem {dto.Slug} was not found.");

            if (problem.TestCases.Count == 0)
                throw new InvalidOperationException($"Problem {dto.Slug} has no test cases.");

            
            var testCaseMap = problem.TestCases.ToDictionary(t => t.Id);

            var testCases = problem.TestCases.ToList();
            var memoryLimitMb = ConvertKilobytesToMegabytes(problem.MemoryLimitKb);
            var batchResults = await _codeExecutionService.ExecuteBatchAsync(new BatchCodeExecutionRequest
            {
                SourceCode = dto.Code,
                Language = normalizedLanguage,
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

            var submission = new Submission
            {
                UserId = userId,
                ProblemId = problem.Id,
                Code = dto.Code,
                Language = Enum.Parse<ProgrammingLanguage>(normalizedLanguage, ignoreCase: true),
                Verdict = overallVerdict,
                RuntimeMs = maxRuntimeMs,
                MemoryKb = maxMemoryKb,
                SubmittedAt = DateTime.UtcNow,
                SubmissionTestResults = testResults
            };

            await _unitOfWork.GetRepository<Submission, long>().AddAsync(submission);
            await _unitOfWork.SaveChangesAsync();

            return MapToResultDTO(submission, testResults, problem, testCaseMap);
        }

        public async Task<IEnumerable<SubmissionHistoryDTO>> GetSubmissionHistoryAsync(string slug, string userId)
        {
            var submissions = await _unitOfWork.SubmissionRepository
                .GetUserSubmissionsBySlugAsync(userId, slug);

            return submissions.Select(s => new SubmissionHistoryDTO
            {
                Id = s.Id,
                Verdict = s.Verdict.ToString(),
                Language = s.Language.ToString(),
                RuntimeMs = s.RuntimeMs,
                MemoryKb = s.MemoryKb,
                SubmittedAt = s.SubmittedAt,
                ProblemSlug = s.Problem?.Slug ?? string.Empty,
                ProblemTitle = s.Problem?.Title ?? string.Empty
            });
        }

        public async Task<IEnumerable<SubmissionHistoryDTO>> GetAllSubmissionHistoryAsync(string userId)
        {
            var submissions = await _unitOfWork.SubmissionRepository
                .GetAllUserSubmissionsAsync(userId);

            return submissions.Select(s => new SubmissionHistoryDTO
            {
                Id = s.Id,
                Verdict = s.Verdict.ToString(),
                Language = s.Language.ToString(),
                RuntimeMs = s.RuntimeMs,
                MemoryKb = s.MemoryKb,
                SubmittedAt = s.SubmittedAt,
                ProblemSlug = s.Problem?.Slug ?? string.Empty,
                ProblemTitle = s.Problem?.Title ?? string.Empty
            });
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

            var testCaseMap = problem?.TestCases.ToDictionary(t => t.Id) ?? new Dictionary<int, TestCase>();

            return new SubmissionResultDTO
            {
                Id = submission.Id,
                Verdict = submission.Verdict.ToString(),
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

        private static Verdict MapVerdict(CodeExecutionResult result, string expectedOutput)
        {
            if (result.Verdict == Verdict.TimeLimitExceeded)
                return Verdict.TimeLimitExceeded;

            if (result.Verdict == Verdict.MemoryLimitExceeded)
                return Verdict.MemoryLimitExceeded;

            if (result.Verdict == Verdict.compilationError)
                return Verdict.compilationError;

            if (result.ExitCode != 0 || result.Verdict == Verdict.RuntimeError)
                return Verdict.RuntimeError;

            var actual = Normalize(result.Output);
            var expected = Normalize(expectedOutput);

            return actual == expected ? Verdict.Accepted : Verdict.WrongAnswer;
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

        private async Task<CodeExecutionResult> ExecuteWithTransientRetryAsync(CodeExecutionRequest request)
        {
            var result = await _codeExecutionService.ExecuteAsync(request);

            // Compiled runtimes can occasionally hit cold-start spikes in Docker/WSL.
            // Retry once before finalizing a TimeLimitExceeded verdict.
            if (result.Verdict == Verdict.TimeLimitExceeded && IsCompiledLanguage(request.Language))
            {
                result = await _codeExecutionService.ExecuteAsync(request);
            }

            return result;
        }

        private static bool IsCompiledLanguage(string language)
        {
            return language.Equals("csharp", StringComparison.OrdinalIgnoreCase)
                   || language.Equals("java", StringComparison.OrdinalIgnoreCase)
                   || language.Equals("cpp", StringComparison.OrdinalIgnoreCase);
        }

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

        private static SubmissionResultDTO MapToResultDTO(
            Submission submission,
            List<SubmissionTestResult> testResults,
            Problem problem,
            Dictionary<int, TestCase> testCaseMap)
        {
            return new SubmissionResultDTO
            {
                Id = submission.Id,
                Verdict = submission.Verdict.ToString(),
                Language = submission.Language.ToString(),
                RuntimeMs = submission.RuntimeMs,
                MemoryKb = submission.MemoryKb,
                SubmittedAt = submission.SubmittedAt,

                TestResults = testResults.Select(r =>
                {
                    var tc = testCaseMap[r.TestCaseId];

                    return new SubmissionTestCaseResultDTO
                    {
                        Verdict = r.Verdict.ToString(),
                        ActualOutput = r.ActualOutput,
                        ExpectedOutput = tc.ExpectedOutput,
                        Input = tc.IsHidden ? "Hidden" : tc.Input,
                        RuntimeMs = (int?)r.RuntimeMs
                    };
                })
            };
        }
    }
}