namespace Domain.Models.LearningPathModule
{
    public class UserLearningPathProgress
    {
        public int Id
        {
            get;
            set;
        }
        public string UserId
        {
            get;
            set;
        } = string.Empty;
        public int LearningPathId
        {
            get;
            set;
        }
        public LearningPath LearningPath
        {
            get;
            set;
        } = default!;
        public int CurrentLevelOrder
        {
            get;
            set;
        }
        public bool IsCompleted
        {
            get;
            set;
        }
        public DateTime StartedAt
        {
            get;
            set;
        } = DateTime.UtcNow;
        public DateTime? CompletedAt
        {
            get;
            set;
        }
    }
}


