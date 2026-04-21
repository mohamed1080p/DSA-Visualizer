using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.UserProgressDTOs;

namespace Services
{
    public class UserProgressService(IUnitOfWork _unitOfWork) : IUserProgressService
    {
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
                .Where(s => s.Problem.Difficulty == DifficultyLevel.Easy)
                .Count();

            progress.MediumProblemsSolved = solvedProblems
                .Where(s => s.Problem.Difficulty == DifficultyLevel.Medium)
                .Count();

            progress.HardProblemsSolved = solvedProblems
                .Where(s => s.Problem.Difficulty == DifficultyLevel.Hard)
                .Count();

            var completedTopicProgresses = await _unitOfWork.GetRepository<UserTopicProgress, int>()
                .GetAllAsync(
                    predicate: utp => utp.UserId == userId && utp.IsCompleted,
                    orderBy: null,
                    includes: utp => utp.Topic
                );

            var completedTopicIds = completedTopicProgresses.Select(utp => utp.TopicId).ToList();

            var topicsWithCategories = await _unitOfWork.GetRepository<Topic, int>()
                .GetAllAsync(
                    predicate: t => completedTopicIds.Contains(t.Id),
                    orderBy: null,
                    includes: t => t.Category
                );

            progress.TotalTopicsCompleted = topicsWithCategories.Count();

            progress.DataStructuresTopicsCompleted = topicsWithCategories
                .Where(t => t.Category?.Name?.Equals("Data Structures", StringComparison.OrdinalIgnoreCase) == true)
                .Count();

            progress.AlgorithmsTopicsCompleted = topicsWithCategories
                .Where(t => t.Category?.Name?.Equals("Algorithms", StringComparison.OrdinalIgnoreCase) == true)
                .Count();

            CalculateStreak(acceptedSubmissions, progress);

            return progress;
        }

        private void CalculateStreak(IEnumerable<Submission> submissions, UserProgressDTO progress)
        {
            if (!submissions.Any())
            {
                progress.CurrentStreak = 0;
                progress.LongestStreak = 0;
                return;
            }

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

            int longestStreak = 1;
            int currentStreakLength = 1;

            for (int i = 1; i < submissionDates.Count; i++)
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

            progress.LongestStreak = longestStreak;

            var today = DateTime.UtcNow.Date;
            int currentStreak = 0;
            int daysBack = 0;

            for (var date = today; ; date = date.AddDays(-1))
            {
                if (submissionDates.Contains(date))
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

            progress.CurrentStreak = currentStreak;
        }
    }
}
