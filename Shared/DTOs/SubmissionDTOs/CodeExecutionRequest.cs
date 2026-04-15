namespace Shared.DTOs.SubmissionDTOs;
public class CodeExecutionRequest
{
    public string SourceCode { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty; // "python", "cpp", "csharp", "java"
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public int TimeLimitMs { get; set; }
    public int MemoryLimitMB { get; set; }
}
