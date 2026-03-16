
namespace Domain.Models.ProblemsModule
{
    public enum Verdict
    {
        Accepted = 1,
        WrongAnswer = 2,
        TimeLimitExceeded = 3,
        MemoryLimitExceeded = 4,
        RuntimeError = 5,
        compilationError = 6
    }
}
