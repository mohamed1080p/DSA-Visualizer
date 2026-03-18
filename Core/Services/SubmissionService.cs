
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.Judge0DTOs;
using Shared.DTOs.SubmissionDTOs;

namespace Services
{
    public class SubmissionService(IUnitOfWork _unitOfWork, IJudge0Service _judge0Service) : ISubmissionService
    {
        public async Task<SubmissionResultDTO> SubmitAsync(SubmitProblemDTO dto, string userId)
        {
            // 1. validate language
            if (!Judge0Service.LanguageIds.TryGetValue(dto.Language, out int languageId))
                throw new Exception($"Unsupported language: {dto.Language}");

            // 2. fetch problem with test cases
            var problem = await _unitOfWork.GetRepository<Problem, int>().GetByIdAsync(dto.ProblemId);
            if (problem is null)
                throw new Exception($"Problem with Id {dto.ProblemId} was not found.");

            // 3. run code against each test case via Judge0
            var testResults = new List<SubmissionTestResult>();
            int? totalRuntimeMs = 0;
            int? totalMemoryKb = 0;
            Verdict overallVerdict = Verdict.Accepted;

            foreach (var testCase in problem.TestCases)
            {
                var judge0Result = await _judge0Service.ExecuteAsync(new Judge0RequestDTO
                {
                    SourceCode = dto.Code,
                    LanguageId = languageId,
                    Stdin = testCase.Input,
                    CpuTimeLimit = problem.TimeLimitMs / 1000.0,
                    MemoryLimit = problem.MemoryLimitKb
                });

                var verdict = MapVerdict(judge0Result, testCase.ExpectedOutput);

                // first non-accepted verdict becomes the overall verdict
                if (overallVerdict == Verdict.Accepted && verdict != Verdict.Accepted)
                    overallVerdict = verdict;

                // accumulate runtime and memory
                if (judge0Result.Time.HasValue)
                    totalRuntimeMs += (int)(judge0Result.Time.Value * 1000);
                if (judge0Result.Memory.HasValue)
                    totalMemoryKb = Math.Max(totalMemoryKb ?? 0, judge0Result.Memory.Value);

                testResults.Add(new SubmissionTestResult
                {
                    TestCaseId = testCase.Id,
                    Verdict = verdict,
                    ActualOutput = judge0Result.Stdout,
                    RuntimeMs = judge0Result.Time.HasValue
                        ? (int)(judge0Result.Time.Value * 1000)
                        : null
                });
            }

            // 4. save submission + test results
            var submission = new Submission
            {
                UserId = userId,
                ProblemId = dto.ProblemId,
                Code = dto.Code,
                Language = Enum.Parse<ProgrammingLanguage>(dto.Language, ignoreCase: true),
                Verdict = overallVerdict,
                RuntimeMs = totalRuntimeMs,
                MemoryKb = totalMemoryKb,
                SubmittedAt = DateTime.UtcNow,
                SubmissionTestResults = testResults
            };

            await _unitOfWork.GetRepository<Submission, long>().AddAsync(submission);
            await _unitOfWork.SaveChangesAsync();

            // 5. return result
            return MapToResultDTO(submission, testResults, problem);
        }

        public async Task<IEnumerable<SubmissionHistoryDTO>> GetSubmissionHistoryAsync(int problemId, string userId)
        {
            var submissions = await _unitOfWork.SubmissionRepository
                .GetUserSubmissionsAsync(userId, problemId);

            return submissions.Select(s => new SubmissionHistoryDTO
            {
                Id = s.Id,
                Verdict = s.Verdict.ToString(),
                Language = s.Language.ToString(),
                RuntimeMs = s.RuntimeMs,
                MemoryKb = s.MemoryKb,
                SubmittedAt = s.SubmittedAt
            });
        }

        public async Task<SubmissionResultDTO> GetSubmissionByIdAsync(long submissionId)
        {
            var submission = await _unitOfWork.SubmissionRepository
                .GetByIdAsync(submissionId);

            if (submission is null)
                throw new Exception($"Submission with Id {submissionId} was not found.");

            return new SubmissionResultDTO
            {
                Id = submission.Id,
                Verdict = submission.Verdict.ToString(),
                Language = submission.Language.ToString(),
                RuntimeMs = submission.RuntimeMs,
                MemoryKb = submission.MemoryKb,
                SubmittedAt = submission.SubmittedAt,
                TestResults = submission.SubmissionTestResults.Select(r => new SubmissionTestCaseResultDTO
                {
                    Verdict = r.Verdict.ToString(),
                    ActualOutput = r.ActualOutput,
                    ExpectedOutput = r.TestCase.ExpectedOutput,
                    Input = r.TestCase.IsHidden ? "Hidden" : r.TestCase.Input,
                    RuntimeMs = r.RuntimeMs
                })
            };
        }

        // ── Helpers ────────────────────────────────────────────────────────

        private static Verdict MapVerdict(Judge0ResultDTO result, string expectedOutput)
        {
            return result.StatusId switch
            {
                3 => result.Stdout?.Trim() == expectedOutput.Trim()
                        ? Verdict.Accepted
                        : Verdict.WrongAnswer,
                5 => Verdict.TimeLimitExceeded,
                6 => Verdict.compilationError,
                >= 7 and <= 12 => Verdict.RuntimeError,
                13 or 14 => Verdict.MemoryLimitExceeded,
                _ => Verdict.RuntimeError
            };
        }

        private static SubmissionResultDTO MapToResultDTO(
            Submission submission,
            List<SubmissionTestResult> testResults,
            Domain.Models.ProblemsModule.Problem problem)
        {
            return new SubmissionResultDTO
            {
                Id = submission.Id,
                Verdict = submission.Verdict.ToString(),
                Language = submission.Language.ToString(),
                RuntimeMs = submission.RuntimeMs,
                MemoryKb = submission.MemoryKb,
                SubmittedAt = submission.SubmittedAt,
                TestResults = testResults.Select(r => new SubmissionTestCaseResultDTO
                {
                    Verdict = r.Verdict.ToString(),
                    ActualOutput = r.ActualOutput,
                    ExpectedOutput = problem.TestCases.First(t => t.Id == r.TestCaseId).ExpectedOutput,
                    Input = problem.TestCases.First(t => t.Id == r.TestCaseId).IsHidden
                                        ? "Hidden"
                                        : problem.TestCases.First(t => t.Id == r.TestCaseId).Input,
                    RuntimeMs = r.RuntimeMs
                })
            };
        }
    }
}
