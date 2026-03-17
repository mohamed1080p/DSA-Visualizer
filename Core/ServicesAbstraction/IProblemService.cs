
using Shared.DTOs.ProblemDTOs;

namespace ServicesAbstraction
{
    public interface IProblemService
    {
        Task<IEnumerable<ProblemDTO>> GetAllAsync(ProblemQueryParametersDTO parameters);
        Task<ProblemDetailDTO> GetByIdAsync(int id);
    }
}
