using Shared.DTOs.SubmissionDTOs;

namespace ServicesAbstraction;
public interface ICodeExecutionService
{
    Task<CodeExecutionResult> ExecuteAsync(CodeExecutionRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CodeExecutionResult>> ExecuteBatchAsync(BatchCodeExecutionRequest request, CancellationToken cancellationToken = default);
}
