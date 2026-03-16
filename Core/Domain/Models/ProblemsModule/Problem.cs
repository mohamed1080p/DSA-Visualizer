using Domain.Models.TopicModule;

namespace Domain.Models.ProblemsModule
{
    public class Problem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public DifficultyLevel Difficulty { get; set; }
        public int TimeLimitMs { get; set; }
        public int MemoryLimitKb { get; set; }

        ////////////////////////////////////////////////////////////////////////

        public int TopicId { get; set; }
        public Topic Topic { get; set; } = default!;
        public ICollection<TestCase> TestCases { get; set; } = new List<TestCase>();
        public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }
}
