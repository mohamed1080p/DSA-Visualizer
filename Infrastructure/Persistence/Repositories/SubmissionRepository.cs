
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class SubmissionRepository(ApplicationDbContext _dbContext) : GenericRepository<Submission, long>(_dbContext), ISubmissionRepository
    {
        public async Task<IEnumerable<Submission>> GetUserSubmissionsAsync(string userId, int problemId)
        {
            return await _dbContext.Submissions.Where(a => a.UserId == userId && a.ProblemId == problemId)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }
    }
}
