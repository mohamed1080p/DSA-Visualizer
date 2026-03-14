namespace Domain.Models.TopicModule
{
    public class TopicComplexity
    {
        public int Id { get; set; }
        public string OperationName { get; set; } = string.Empty;  // "Push", "Pop", "Search", ....etc
        public string TimeComplexity { get; set; } = string.Empty; // "O(1)", "O(log n)", "O(n)", ...etc
        public string SpaceComplexity { get; set; } = string.Empty; // "O(1)", "O(n)", ...etc
        public int TopicId { get; set; }
        public Topic Topic { get; set; } = default!;
    }
}
