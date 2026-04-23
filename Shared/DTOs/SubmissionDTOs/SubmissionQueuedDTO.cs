namespace Shared.DTOs.SubmissionDTOs
{
    public class SubmissionQueuedDTO
    {
        public long SubmissionId { get; set; }
        public string Status { get; set; } = "Queued";
        public string PollUrl { get; set; } = string.Empty;
    }
}
