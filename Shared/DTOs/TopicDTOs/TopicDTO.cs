namespace Shared.DTOs.TopicDTOs
{
    public class TopicDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int ProblemsCount { get; set; }
        public IReadOnlyList<string> KeyPoints { get; set; } = [];
        public IReadOnlyList<string> UseCases { get; set; } = [];
    }
}
