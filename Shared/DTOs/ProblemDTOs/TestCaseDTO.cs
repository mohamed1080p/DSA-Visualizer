
namespace Shared.DTOs.ProblemDTOs
{
    public class TestCaseDTO
    {
        public int Id { get; set; }
        public string Input { get; set; } = string.Empty;
        public string ExpectedOutput { get; set; } = string.Empty;
    }
}
