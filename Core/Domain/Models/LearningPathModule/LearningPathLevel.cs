namespace Domain.Models.LearningPathModule
{
    public class LearningPathLevel
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
        // Links to existing problems/topics
        public int? ProblemId
        {
            get;
            set;
        }
        public ProblemsModule.Problem? Problem
        {
            get;
            set;
        }
        public int? TopicId
        {
            get;
            set;
        }
        public TopicModule.Topic? Topic
        {
            get;
            set;
        }
    }
}


