
namespace Shared.DTOs.SubmissionDTOs
{
    public class SubmissionTestCaseResultDTO
    {
        public string Verdict { get; set; } = string.Empty;
        public string? ActualOutput { get; set; }
        public string ExpectedOutput { get; set; } = string.Empty;
        public string Input { get; set; } = string.Empty;
        public int? RuntimeMs { get; set; }
    }
}
