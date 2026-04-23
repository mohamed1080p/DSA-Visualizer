
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.ProblemDTOs;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProblemsController(IServiceManager _serviceManager) : ControllerBase
    {
        // GET api/problems
        [HttpGet]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<ProblemDTO>>> GetAll([FromQuery] ProblemQueryParametersDTO parameters)
        {
            var problems = await _serviceManager.ProblemService.GetAllAsync(parameters);
            return Ok(problems);
        }

        // GET api/problems/{slug}
        [HttpGet("{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<ProblemDetailDTO>> GetBySlug(string slug)
        {
            var problem = await _serviceManager.ProblemService.GetBySlugAsync(slug);
            return Ok(problem);
        }
    }
}
