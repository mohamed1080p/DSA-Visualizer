namespace Shared.DTOs.UserProgressDTOs
{
    public class UserProgressDTO
    {
        public int TotalProblemsSolved { get; set; }
        public int TotalTopicsCompleted { get; set; }
        public int DataStructuresTopicsCompleted { get; set; }
        public int AlgorithmsTopicsCompleted { get; set; }
        public int EasyProblemsSolved { get; set; }
        public int MediumProblemsSolved { get; set; }
        public int HardProblemsSolved { get; set; }
        public int CurrentStreak { get; set; }
        public int LongestStreak { get; set; }

        // Total counts for percentage calculations
        public int TotalProblemsCount { get; set; }
        public int TotalTopicsCount { get; set; }
        public int TotalEasyProblems { get; set; }
        public int TotalMediumProblems { get; set; }
        public int TotalHardProblems { get; set; }
        public int TotalDataStructuresTopics { get; set; }
        public int TotalAlgorithmsTopics { get; set; }

        // Recent solved problems for activity feed
        public List<RecentSolveDTO> RecentSolves { get; set; } = new();
    }

    public class RecentSolveDTO
    {
        public string ProblemTitle { get; set; } = string.Empty;
        public string ProblemSlug { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public DateTime SolvedAt { get; set; }
    }
}
