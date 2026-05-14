namespace Shared.DTOs.LearningPathDTOs
{
    public class LearningPathDTO
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
        public string Slug
        {
            get;
            set;
        } = string.Empty;
        public string Description
        {
            get;
            set;
        } = string.Empty;
        public string Icon
        {
            get;
            set;
        } = string.Empty;
        public int TotalLevels
        {
            get;
            set;
        }
        public int CompletedLevels
        {
            get;
            set;
        }
        public bool IsStarted
        {
            get;
            set;
        }
    }
}


