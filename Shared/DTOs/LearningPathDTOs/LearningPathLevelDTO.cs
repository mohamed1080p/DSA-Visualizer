namespace Shared.DTOs.LearningPathDTOs
{
    public class LearningPathLevelDTO
    {
        public int Id
        {
            get;
            set;
        }
        public string Title
        {
            get;
            set;
        } = string.Empty;
        public int Order
        {
            get;
            set;
        }
        public string Type
        {
            get;
            set;
        } = string.Empty;
        // "problem" or "topic"
        public string? Slug
        {
            get;
            set;
        }
        public string? Difficulty
        {
            get;
            set;
        }
        public bool IsCompleted
        {
            get;
            set;
        }
        public bool IsLocked
        {
            get;
            set;
        }
    }
}


