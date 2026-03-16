
using Domain.Models.IdentityModule;
using Domain.Models.TopicModule;

namespace Domain.Models.ProblemsModule
{
    public class Submission
    {
        public long Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public ProgrammingLanguage Language { get; set; }
        public Verdict Verdict { get; set; }

        //Runtime in milliseconds returned by the execution engine
        public int? RuntimeMs { get; set; }

        //Memory used in kilobytes returned by the execution engine
        public int? MemoryKb { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        /////////////////////////////////////////////////////////////////////
        public string UserId { get; set; } = string.Empty;
        public int ProblemId { get; set; }
        public ApplicationUser User { get; set; } = default!;
        public Problem Problem { get; set; } = default!;
        public ICollection<SubmissionTestResult> SubmissionTestResults { get; set; } = new List<SubmissionTestResult>();
    }
}
