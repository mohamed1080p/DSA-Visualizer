
using Domain.Contracts;
using Domain.Models.ProblemsModule;
using ServicesAbstraction;
using Shared.DTOs.ProblemDTOs;

namespace Services
{
    public class ProblemService(IUnitOfWork _unitOfWork) : IProblemService
    {
        public async Task<IEnumerable<ProblemDTO>> GetAllAsync(ProblemQueryParametersDTO parameters)
        {
            var problems = await _unitOfWork.GetRepository<Problem, int>().GetAllAsync(
                predicate: p =>
                    (string.IsNullOrEmpty(parameters.SearchTerm) || p.Title.Contains(parameters.SearchTerm)) &&
                    (parameters.CategoryId == null || p.Topic.Category.Id == parameters.CategoryId),
                orderBy: null,
                includes: p => p.Topic);

            return problems.Select(p => new ProblemDTO
            {
                Id = p.Id,
                Title = p.Title,
                Difficulty = p.Difficulty.ToString(),
                TopicName = p.Topic.Title
            });
        }

        public async Task<ProblemDetailDTO> GetBySlugAsync(string slug)
        {
            var problem = await _unitOfWork.ProblemRepository.GetBySlugAsync(slug);

            if (problem is null)
                throw new Exception($"Problem with Slug: {slug} was not found.");

            return new ProblemDetailDTO
            {
                Id = problem.Id,
                Title = problem.Title,
                Description = problem.Description,
                Difficulty = problem.Difficulty.ToString(),
                TopicName = problem.Topic.Title,
                TimeLimitMs = problem.TimeLimitMs,
                MemoryLimitKb = problem.MemoryLimitKb,
                // filter hidden test cases
                SampleTestCases = problem.TestCases
                    .Where(t => !t.IsHidden)
                    .Select(t => new TestCaseDTO
                    {
                        Id = t.Id,
                        Input = t.Input,
                        ExpectedOutput = t.ExpectedOutput
                    })
            };
        }
    }
}
