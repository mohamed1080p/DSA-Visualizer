using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.UserProgressDTOs;

namespace Services.Learning
{
    public class UserProgressService(IUnitOfWork _unitOfWork) : IUserProgressService
    {
        private static int CalculateLevel(UserProgressDTO progress)
        {
            var rawLevel = progress.TotalProblemsSolved + progress.TotalTopicsCompleted;
            return Math.Max(1, rawLevel);
        }
        public async Task<UserProgressDTO> GetUserProgressAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("User ID is required.", nameof(userId));

            var progress = new UserProgressDTO();

            var acceptedSubmissions = await _unitOfWork.SubmissionRepository
                .GetAllUserSubmissionsAsync(userId);

            var solvedProblems = acceptedSubmissions
                .Where(s => s.Verdict == Verdict.Accepted)
                .GroupBy(s => s.ProblemId)
                .Select(g => g.First())
                .ToList();

            progress.TotalProblemsSolved = solvedProblems.Count;

            progress.EasyProblemsSolved = solvedProblems
                .Count(s => s.Problem.Difficulty == DifficultyLevel.Easy);

            progress.MediumProblemsSolved = solvedProblems
                .Count(s => s.Problem.Difficulty == DifficultyLevel.Medium);

            progress.HardProblemsSolved = solvedProblems
                .Count(s => s.Problem.Difficulty == DifficultyLevel.Hard);

            var completedTopicProgresses = await _unitOfWork.GetRepository<UserTopicProgress, int>()
                .GetAllReadOnlyAsync(
                    predicate: utp => utp.UserId == userId && utp.IsCompleted,
                    orderBy: null,
                    includes: utp => utp.Topic
                );

            var completedTopicIds = completedTopicProgresses.Select(utp => utp.TopicId).ToList();

            var topicsWithCategories = await _unitOfWork.GetRepository<Topic, int>()
                .GetAllReadOnlyAsync(
                    predicate: t => completedTopicIds.Contains(t.Id),
                    orderBy: null,
                    includes: t => t.Category
                );

            progress.TotalTopicsCompleted = topicsWithCategories.Count();

            progress.DataStructuresTopicsCompleted = topicsWithCategories
                .Count(t => t.Category?.Name?.Equals("Data Structures", StringComparison.OrdinalIgnoreCase) == true);

            progress.AlgorithmsTopicsCompleted = topicsWithCategories
                .Count(t => t.Category?.Name?.Equals("Algorithms", StringComparison.OrdinalIgnoreCase) == true);
            // Populate total counts for percentage calculations
            var allProblems = await _unitOfWork.GetRepository<Problem, int>()
                .GetAllReadOnlyAsync();
            var allProblemsList = allProblems.ToList();
            progress.TotalProblemsCount = allProblemsList.Count;
            progress.TotalEasyProblems = allProblemsList.Count(p => p.Difficulty == DifficultyLevel.Easy);
            progress.TotalMediumProblems = allProblemsList.Count(p => p.Difficulty == DifficultyLevel.Medium);
            progress.TotalHardProblems = allProblemsList.Count(p => p.Difficulty == DifficultyLevel.Hard);

            var allTopics = await _unitOfWork.GetRepository<Topic, int>()
                .GetAllReadOnlyAsync(predicate: null, orderBy: null, includes: t => t.Category);
            var allTopicsList = allTopics.ToList();
            progress.TotalTopicsCount = allTopicsList.Count;
            progress.TotalDataStructuresTopics = allTopicsList
                .Count(t => t.Category?.Name?.Equals("Data Structures", StringComparison.OrdinalIgnoreCase) == true);
            progress.TotalAlgorithmsTopics = allTopicsList
                .Count(t => t.Category?.Name?.Equals("Algorithms", StringComparison.OrdinalIgnoreCase) == true);
            // Recent solves (last 5)
            progress.RecentSolves = solvedProblems
                .OrderByDescending(s => s.SubmittedAt)
                .Take(5)
                .Select(s => new RecentSolveDTO
                {
                    ProblemTitle = s.Problem?.Title ?? "Unknown",
                    ProblemSlug = s.Problem?.Slug ?? "",
                    Difficulty = s.Problem?.Difficulty.ToString() ?? "Easy",
                    SolvedAt = s.SubmittedAt
                })
                .ToList();

            CalculateStreak(acceptedSubmissions, progress);

            return progress;
        }

        private static void CalculateStreak(IEnumerable<Submission> submissions, UserProgressDTO progress)
        {
            var submissionDates = submissions
                .Select(s => s.SubmittedAt.Date)
                .Distinct()
                .OrderBy(d => d)
                .ToList();

            if (!submissionDates.Any())
            {
                progress.CurrentStreak = 0;
                progress.LongestStreak = 0;
                return;
            }

            progress.LongestStreak = CalculateLongestStreak(submissionDates);
            progress.CurrentStreak = CalculateCurrentStreak(submissionDates);
        }

        private static int CalculateLongestStreak(IReadOnlyList<DateTime> submissionDates)
        {
            int longestStreak = 1;
            int currentStreakLength = 1;

            for (int i = 1;
i < submissionDates.Count;
i++)
            {
                if ((submissionDates[i] - submissionDates[i - 1]).Days == 1)
                {
                    currentStreakLength++;
                    longestStreak = Math.Max(longestStreak, currentStreakLength);
                }
                else
                {
                    currentStreakLength = 1;
                }
            }

            return longestStreak;
        }

        private static int CalculateCurrentStreak(IReadOnlyList<DateTime> submissionDates)
        {
            var submissionDateSet = submissionDates.ToHashSet();
            var today = DateTime.UtcNow.Date;
            var earliestSubmission = submissionDates[0];
            int currentStreak = 0;
            int daysBack = 0;

            for (var date = today;
date >= earliestSubmission || daysBack == 0;
date = date.AddDays(-1))
            {
                if (submissionDateSet.Contains(date))
                {
                    currentStreak++;
                    daysBack++;
                }
                else if (daysBack == 0)
                {
                    daysBack++;
                }
                else if (currentStreak > 0)
                {
                    break;
                }
                else
                {
                    daysBack++;
                    if (daysBack > 365)
                        break;
                }
            }

            return currentStreak;
        }
    }
}




