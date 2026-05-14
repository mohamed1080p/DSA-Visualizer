




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Security.Claims;

namespace Infrastructure.Presentation.Controllers.Problems
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubmissionsController(ISubmissionService submissionService) : ControllerBase
    {

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;


        // POST api/submissions/{slug}
        [HttpPost("{slug}")]
        [EnableRateLimiting("submissions-policy")]
        public async Task<ActionResult<SubmissionQueuedDTO>> Submit(string slug, [FromBody] SubmitProblemDTO submitProblemDTO)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();
            submitProblemDTO.Slug = slug;
            var result = await submissionService.SubmitAsync(submitProblemDTO, userId);

            // Return 202 Accepted with the queued result
            return Accepted(result.PollUrl, result);
        }

        // GET api/submissions/history
        [HttpGet("history")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetAllHistory()
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();
            var history = await submissionService.GetAllSubmissionHistoryAsync(userId);
            return Ok(history);
        }

        // GET api/submissions/problem/{slug}
        [HttpGet("problem/{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetProblemHistory(string slug)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();
            var history = await submissionService.GetSubmissionHistoryAsync(slug, userId);
            return Ok(history);
        }

        // GET api/submissions/{id:long}
        [HttpGet("{id:long}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<SubmissionResultDTO>> GetById(long id)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();
            var result = await submissionService.GetSubmissionByIdAsync(id, userId);
            return Ok(result);
        }
    }
}


