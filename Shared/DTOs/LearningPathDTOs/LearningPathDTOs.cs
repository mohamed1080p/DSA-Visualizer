namespace Shared.DTOs.LearningPathDTOs
{
    public class LearningPathDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int TotalLevels { get; set; }
        public int CompletedLevels { get; set; }
        public bool IsStarted { get; set; }
    }

    public class LearningPathDetailDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TotalLevels { get; set; }
        public int CompletedLevels { get; set; }
        public bool IsStarted { get; set; }
        public List<LearningPathLevelDTO> Levels { get; set; } = new();
    }

    public class LearningPathLevelDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int Order { get; set; }
        public string Type { get; set; } = string.Empty; // "problem" or "topic"
        public string? Slug { get; set; }
        public string? Difficulty { get; set; }
        public bool IsCompleted { get; set; }
        public bool IsLocked { get; set; }
    }
}
