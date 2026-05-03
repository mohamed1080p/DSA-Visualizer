
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class SubmissionRepository : GenericRepository<Submission, long>, ISubmissionRepository
    {
        private readonly ApplicationDbContext _context;

        public SubmissionRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
            _context = dbContext;
        }

        public async Task<IEnumerable<Submission>> GetUserSubmissionsBySlugAsync(string userId, string slug)
        {
            return await _context.Submissions
                .Include(a => a.Problem)
                .Where(a => a.UserId == userId && a.Problem.Slug == slug)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Submission>> GetAllUserSubmissionsAsync(string userId)
        {
            return await _context.Submissions
                .Include(a => a.Problem)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }
       
    }
}
