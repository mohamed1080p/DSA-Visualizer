namespace Shared.DTOs.SubmissionDTOs;

public class BatchCodeExecutionRequest
{
    public string SourceCode { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public List<string> Inputs { get; set; } = new();
    public int TimeLimitMs { get; set; }
    public int MemoryLimitMB { get; set; }
}
