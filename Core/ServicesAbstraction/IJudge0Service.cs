
using Shared.DTOs.Judge0DTOs;

namespace ServicesAbstraction
{
    public interface IJudge0Service
    {
        /// <summary>
        /// Submits code to Judge0 and waits for the result synchronously.
        /// Returns the execution result for a single test case.
        /// </summary>
        Task<Judge0ResultDTO> ExecuteAsync(Judge0RequestDTO request);
    }
}
