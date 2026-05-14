namespace Shared.DTOs.UserProgressDTOs
{
    public class RecentSolveDTO
    {
        public string ProblemTitle
        {
            get;
            set;
        } = string.Empty;
        public string ProblemSlug
        {
            get;
            set;
        } = string.Empty;
        public string Difficulty
        {
            get;
            set;
        } = string.Empty;
        public DateTime SolvedAt
        {
            get;
            set;
        }
    }
}


