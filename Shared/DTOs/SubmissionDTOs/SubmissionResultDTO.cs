
namespace Shared.DTOs.SubmissionDTOs
{
    public class SubmissionResultDTO
    {
        public long Id { get; set; }
        public string Verdict { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int? RuntimeMs { get; set; }
        public int? MemoryKb { get; set; }
        public DateTime SubmittedAt { get; set; }
        public IEnumerable<SubmissionTestCaseResultDTO> TestResults { get; set; } = new List<SubmissionTestCaseResultDTO>();
    }
}
