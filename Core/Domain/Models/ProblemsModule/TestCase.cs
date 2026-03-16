
namespace Domain.Models.ProblemsModule
{
    public class TestCase
    {
        public int Id { get; set; }
        public string Input { get; set; } = string.Empty;
        public string ExpectedOutput { get; set; } = string.Empty;

        // Hidden test cases are used server-side only during code execution.
        // They are never sent to the frontend.
        public bool IsHidden { get; set; } = false;

        /////////////////////////////////////////////////////////////
        public int ProblemId { get; set; }
        public Problem Problem { get; set; } = default!;
    }
}
