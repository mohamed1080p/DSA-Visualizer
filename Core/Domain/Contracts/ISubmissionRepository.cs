
using Domain.Models.ProblemsModule;

namespace Domain.Contracts
{
    public interface ISubmissionRepository:IGenericRepository<Submission, long>
    {
        Task<IEnumerable<Submission>> GetUserSubmissionsAsync(string userId, int problemId);
    }
}
