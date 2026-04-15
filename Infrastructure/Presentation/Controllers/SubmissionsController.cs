using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTOs.ProblemDTOs;
using Shared.DTOs.SubmissionDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubmissionsController(IServiceManager _serviceManager) : ControllerBase
    {
        // POST api/submissions
        [HttpPost]
        public async Task<ActionResult<SubmissionResultDTO>> Submit([FromBody] SubmitProblemDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null)
                return Unauthorized();

            var result = await _serviceManager.SubmissionService.SubmitAsync(dto, userId);
            return Ok(result);
        }

        // GET api/submissions/{problemId}/history
        [HttpGet("{problemId:int}/history")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetHistory(int problemId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null)
                return Unauthorized();

            var history = await _serviceManager.SubmissionService.GetSubmissionHistoryAsync(problemId, userId);
            return Ok(history);
        }

        // GET api/submissions/{id}
        [HttpGet("{id:long}")]
        public async Task<ActionResult<SubmissionResultDTO>> GetById(long id)
        {
            var result = await _serviceManager.SubmissionService.GetSubmissionByIdAsync(id);
            return Ok(result);
        }
    }
}