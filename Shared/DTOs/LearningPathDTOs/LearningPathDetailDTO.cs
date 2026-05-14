namespace Shared.DTOs.LearningPathDTOs
{
    public class LearningPathDetailDTO
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
        public List<LearningPathLevelDTO> Levels
        {
            get;
            set;
        } = new();
    }
}


