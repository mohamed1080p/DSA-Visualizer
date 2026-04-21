using Domain.Contracts;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories;
public class ProblemRepository(ApplicationDbContext _dbContext):IProblemRepository
{
    public async Task<Problem?> GetBySlugAsync(string Slug)
    {
        var problem = await _dbContext.Problems.Include(a => a.TestCases).Include(a => a.Topic).FirstOrDefaultAsync(a => a.Slug == Slug);
        return problem;
    }
}
