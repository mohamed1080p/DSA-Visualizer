




using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.ProblemDTOs;


namespace Infrastructure.Presentation.Controllers.Problems
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProblemsController(IProblemService problemService) : ControllerBase
    {
        // GET api/problems
        [HttpGet]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<ProblemDTO>>> GetAll([FromQuery] ProblemQueryParametersDTO parameters)
        {
            var problems = await problemService.GetAllAsync(parameters);
            return Ok(problems);
        }

        // GET api/problems/{slug}
        [HttpGet("{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<ProblemDetailDTO>> GetBySlug(string slug)
        {
            var problem = await problemService.GetBySlugAsync(slug);
            return Ok(problem);
        }
    }
}



