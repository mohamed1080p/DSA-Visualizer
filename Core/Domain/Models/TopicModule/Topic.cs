namespace Domain.Models.TopicModule
{
    public class Topic
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int ProblemsCount { get; set; }
        public string KeyPointsJson { get; set; } = "[]";
        public string UseCasesJson { get; set; } = "[]";
    }
}
