using Domain.Models.ProblemsModule;

namespace Shared.DTOs.SubmissionDTOs;
public class CodeExecutionResult
{
    public string Output { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public int ExitCode { get; set; }
    public long ExecutionTimeMs { get; set; }
    public long MemoryUsedKB { get; set; }
    public Verdict Verdict { get; set; }
}
