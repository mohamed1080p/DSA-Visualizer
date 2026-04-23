using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubmissionsController(IServiceManager _serviceManager) : ControllerBase
    {

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;


        // POST api/submissions/{slug}
        [HttpPost("{slug}")]
        [EnableRateLimiting("submissions-policy")]
        public async Task<ActionResult<SubmissionQueuedDTO>> Submit(string slug, [FromBody] SubmitProblemDTO submitProblemDTO)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            submitProblemDTO.Slug = slug;
            var result = await _serviceManager.SubmissionService.SubmitAsync(submitProblemDTO, userId);

            // Return 202 Accepted with the queued result
            return Accepted(result.PollUrl, result);
        }

        // GET api/submissions/history
        [HttpGet("history")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetAllHistory()
        {
            var userId = GetUserId();
            var history = await _serviceManager.SubmissionService.GetAllSubmissionHistoryAsync(userId);
            return Ok(history);
        }

        // GET api/submissions/{id:long}
        [HttpGet("{id:long}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<SubmissionResultDTO>> GetById(long id)
        {
            var userId = GetUserId();
            var result = await _serviceManager.SubmissionService.GetSubmissionByIdAsync(id, userId);
            return Ok(result);
        }
    }
}