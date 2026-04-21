
using Shared.DTOs.SubmissionDTOs;

namespace ServicesAbstraction
{
    public interface ISubmissionService
    {
        Task<SubmissionResultDTO> SubmitAsync(SubmitProblemDTO dto, string userId);
        Task<IEnumerable<SubmissionHistoryDTO>> GetSubmissionHistoryAsync(string slug, string userId);
        Task<IEnumerable<SubmissionHistoryDTO>> GetAllSubmissionHistoryAsync(string userId);
        Task<SubmissionResultDTO> GetSubmissionByIdAsync(long submissionId, string userId);

    }
}
