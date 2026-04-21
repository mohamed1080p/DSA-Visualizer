using Domain.Models.ProblemsModule;

namespace Domain.Contracts;
public interface IProblemRepository
{
    Task<Problem?> GetBySlugAsync(string Slug);
}
