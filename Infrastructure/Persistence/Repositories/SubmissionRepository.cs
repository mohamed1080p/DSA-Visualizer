
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class SubmissionRepository(ApplicationDbContext _dbContext) : GenericRepository<Submission, long>(_dbContext), ISubmissionRepository
    {
        public async Task<IEnumerable<Submission>> GetUserSubmissionsBySlugAsync(string userId, string slug)
        {
            return await _dbContext.Submissions.Where(a => a.UserId == userId && a.Problem.Slug == slug)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }
       
    }
}
