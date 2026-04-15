
namespace Shared.DTOs.SubmissionDTOs
{
    public class SubmissionHistoryDTO
    {
        public long Id { get; set; }
        public string Verdict { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public long? RuntimeMs { get; set; }
        public long? MemoryKb { get; set; }
        public DateTime SubmittedAt { get; set; }
    }
}
