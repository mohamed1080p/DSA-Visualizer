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
        public async Task<ActionResult<SubmissionResultDTO>> Submit(string slug, [FromBody] SubmitProblemDTO dto)
        {
            var userId = GetUserId();
            dto.Slug = slug;
            var result = await _serviceManager.SubmissionService.SubmitAsync(dto, userId);
            return Ok(result);
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