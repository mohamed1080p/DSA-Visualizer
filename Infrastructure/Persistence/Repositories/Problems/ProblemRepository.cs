using Infrastructure.Persistence.Repositories.Auth;
using Infrastructure.Persistence.Repositories.Leaderboard;
using Infrastructure.Persistence.Repositories.Common;
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence.Data;

namespace Infrastructure.Persistence.Repositories.Problems;

public class ProblemRepository(ApplicationDbContext _dbContext) : IProblemRepository
{
    public async Task<Problem?> GetBySlugAsync(string Slug)
    {
        var problem = await _dbContext.Problems
            .AsNoTracking()
            .Include(a => a.TestCases)
            .Include(a => a.Topic)
            .AsSplitQuery()
            .FirstOrDefaultAsync(a => a.Slug == Slug);
        return problem;
    }
}




