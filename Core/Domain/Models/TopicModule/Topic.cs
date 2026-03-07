
namespace Domain.Models.TopicModule
{
    public class Topic
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public DifficultyLevel Difficulty { get; set; }


        ///////////////////////////////////////////////////////////////////////////
        public int CategoryId { get; set; }
        public Category Category { get; set; } = default!;
        public ICollection<TopicCodeImplementation> CodeImplementations { get; set; } = new List<TopicCodeImplementation>();
        public ICollection<TopicComplexity> Complexities { get; set; } = new List<TopicComplexity>();
    }
}
