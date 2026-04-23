
using Domain.Models.IdentityModule;
using Domain.Models.TopicModule;

namespace Domain.Models.ProblemsModule
{
    public class Submission
    {
        public long Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public ProgrammingLanguage Language { get; set; }
        public Verdict? Verdict { get; set; }
        public SubmissionStatus Status { get; set; } = SubmissionStatus.Queued;
        public string? FailureReason { get; set; }

        //Runtime in milliseconds returned by the execution engine
        public long? RuntimeMs { get; set; }

        //Memory used in kilobytes returned by the execution engine
        public long? MemoryKb { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        /////////////////////////////////////////////////////////////////////
        public string UserId { get; set; } = string.Empty;
        public int ProblemId { get; set; }
        public ApplicationUser User { get; set; } = default!;
        public Problem Problem { get; set; } = default!;
        public ICollection<SubmissionTestResult> SubmissionTestResults { get; set; } = new List<SubmissionTestResult>();
    }
}
