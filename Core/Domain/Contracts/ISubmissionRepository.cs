
using Domain.Models.ProblemsModule;

namespace Domain.Contracts
{
    public interface ISubmissionRepository:IGenericRepository<Submission, long>
    {
        Task<IEnumerable<Submission>> GetUserSubmissionsBySlugAsync(string userId, string slug);
        Task<IEnumerable<Submission>> GetAllUserSubmissionsAsync(string userId);
    }
}
