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
    }
}
