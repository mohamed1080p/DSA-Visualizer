using Domain.Models.IdentityModule;
using Domain.Models.TopicModule;

namespace Domain.Models.ProblemsModule
{
    public class Submission
    {
        public long Id
        {
            get;
            private set;
        }
        public string Code
        {
            get;
            private set;
        } = string.Empty;
        public ProgrammingLanguage Language
        {
            get;
            private set;
        }
        public Verdict? Verdict
        {
            get;
            private set;
        }
        public SubmissionStatus Status
        {
            get;
            private set;
        } = SubmissionStatus.Queued;
        public string? FailureReason
        {
            get;
            private set;
        }
        public long? RuntimeMs
        {
            get;
            private set;
        }
        public long? MemoryKb
        {
            get;
            private set;
        }
        public DateTime SubmittedAt
        {
            get;
            private set;
        } = DateTime.UtcNow;
        public byte[] RowVersion
        {
            get;
            private set;
        } = System.Array.Empty<byte>();
        public string UserId
        {
            get;
            private set;
        } = string.Empty;
        public int ProblemId
        {
            get;
            private set;
        }
        public ApplicationUser User
        {
            get;
            private set;
        } = default!;
        public Problem Problem
        {
            get;
            private set;
        } = default!;
        public ICollection<SubmissionTestResult> SubmissionTestResults
        {
            get;
            private set;
        } = new List<SubmissionTestResult>();

        protected Submission()
        {
        }
        // EF Core

        public Submission(string userId, int problemId, string code, ProgrammingLanguage language)
        {
            if (string.IsNullOrWhiteSpace(userId)) throw new ArgumentException("UserId is required", nameof(userId));
            if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Code cannot be empty", nameof(code));
            if (problemId <= 0) throw new ArgumentException("Invalid problem ID", nameof(problemId));

            UserId = userId;
            ProblemId = problemId;
            Code = code;
            Language = language;
            Status = SubmissionStatus.Queued;
            SubmittedAt = DateTime.UtcNow;
        }
        public void MarkAsRunning()
        {
            if (Status != SubmissionStatus.Queued)
                throw new InvalidOperationException($"Cannot transition from {Status} to Processing.");
            Status = SubmissionStatus.Processing;
        }
        public void Complete(Verdict verdict, long runtimeMs, long memoryKb, string? failureReason = null)
        {
            if (Status != SubmissionStatus.Processing)
                throw new InvalidOperationException($"Cannot transition from {Status} to Completed.");

            Verdict = verdict;
            RuntimeMs = runtimeMs;
            MemoryKb = memoryKb;
            FailureReason = failureReason;
            Status = SubmissionStatus.Completed;
        }
        public void MarkAsFailed(string reason)
        {
            Status = SubmissionStatus.Failed;
            FailureReason = reason;
        }
        public void AddTestResult(SubmissionTestResult result)
        {
            ArgumentNullException.ThrowIfNull(result);
            SubmissionTestResults.Add(result);
        }
    }
}


