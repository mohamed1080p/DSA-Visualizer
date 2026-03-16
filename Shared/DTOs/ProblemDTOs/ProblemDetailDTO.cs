
namespace Shared.DTOs.ProblemDTOs
{
    public class ProblemDetailDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string TopicName { get; set; } = string.Empty;
        public int TimeLimitMs { get; set; }
        public int MemoryLimitKb { get; set; }

        // *Note yasta: Only sample (non-hidden) test cases — never expose hidden ones
        public IEnumerable<TestCaseDTO> SampleTestCases { get; set; } = new List<TestCaseDTO>();
    }
}
