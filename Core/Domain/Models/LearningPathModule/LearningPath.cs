namespace Domain.Models.LearningPathModule
{
    public class LearningPath
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
        // e.g. "code", "database", "cpu"
        public int Order
        {
            get;
            set;
        }
        public ICollection<LearningPathLevel> Levels
        {
            get;
            set;
        } = new List<LearningPathLevel>();
    }
}


