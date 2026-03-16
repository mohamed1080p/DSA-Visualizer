
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTOs.ProblemDTOs;

namespace Presentation.Controllers
{
    public class ProblemsController(IServiceManager _serviceManager):ControllerBase
    {
        // GET api/problems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProblemDTO>>> GetAll()
        {
            var problems = await _serviceManager.ProblemService.GetAllAsync();
            return Ok(problems);
        }

        // GET api/problems/filter?searchTerm=two+sum&categoryId=1
        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<ProblemDTO>>> Filter([FromQuery] ProblemQueryParametersDTO parameters)
        {
            var problems = await _serviceManager.ProblemService.GetAllAsync(parameters);
            return Ok(problems);
        }

        // GET api/problems/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProblemDetailDTO>> GetById(int id)
        {
            var problem = await _serviceManager.ProblemService.GetByIdAsync(id);
            return Ok(problem);
        }
    }
}
