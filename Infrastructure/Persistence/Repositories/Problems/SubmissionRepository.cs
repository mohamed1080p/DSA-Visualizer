using Infrastructure.Persistence.Repositories.Auth;
using Infrastructure.Persistence.Repositories.Leaderboard;
using Infrastructure.Persistence.Repositories.Common;
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence.Data;


namespace Infrastructure.Persistence.Repositories.Problems
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
                .AsNoTracking()
                .Include(a => a.Problem)
                .Where(a => a.UserId == userId && a.Problem.Slug == slug)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }
        public async Task<IEnumerable<Submission>> GetAllUserSubmissionsAsync(string userId)
        {
            return await _context.Submissions
                .AsNoTracking()
                .Include(a => a.Problem)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
        }

    }
}




