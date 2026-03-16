
namespace Domain.Models.ProblemsModule
{
    public class SubmissionTestResult
    {
        public int Id { get; set; }
        public Verdict Verdict { get; set; }
        public string? ActualOutput { get; set; }

        //Runtime for this specific test case in milliseconds
        public int? RuntimeMs { get; set; }

        ///////////////////////////////////////////////////////////////////////
        public long SubmissionId { get; set; }
        public int TestCaseId { get; set; }
        public Submission Submission { get; set; } = default!;
        public TestCase TestCase { get; set; } = default!;
    }
}
