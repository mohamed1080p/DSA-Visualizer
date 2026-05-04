namespace Domain.Models.LearningPathModule
{
    public class LearningPath
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty; // e.g. "code", "database", "cpu"
        public int Order { get; set; }

        public ICollection<LearningPathLevel> Levels { get; set; } = new List<LearningPathLevel>();
    }

    public class LearningPathLevel
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Order { get; set; }
        public int LearningPathId { get; set; }
        public LearningPath LearningPath { get; set; } = default!;

        // Links to existing problems/topics
        public int? ProblemId { get; set; }
        public ProblemsModule.Problem? Problem { get; set; }
        public int? TopicId { get; set; }
        public TopicModule.Topic? Topic { get; set; }
    }

    public class UserLearningPathProgress
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int LearningPathId { get; set; }
        public LearningPath LearningPath { get; set; } = default!;
        public int CurrentLevelOrder { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}
