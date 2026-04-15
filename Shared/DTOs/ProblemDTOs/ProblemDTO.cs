
namespace Shared.DTOs.ProblemDTOs
{
    public class ProblemDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string TopicName { get; set; } = string.Empty;
    }
}
