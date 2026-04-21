using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubmissionsController(IServiceManager _serviceManager, ILogger<SubmissionsController> _logger) : ControllerBase
    {

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;


        // POST api/submissions/{slug}
        [HttpPost("{slug}")]
        public async Task<ActionResult<SubmissionResultDTO>> Submit(string slug, [FromBody] SubmitProblemDTO dto)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            dto.Slug = slug;

            try
            {
                var result = await _serviceManager.SubmissionService.SubmitAsync(dto, userId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during submission");
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // GET api/submissions/{slug}/history
        [HttpGet("{slug}/history")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetHistory(string slug)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var history = await _serviceManager.SubmissionService.GetSubmissionHistoryAsync(slug, userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving submission history for problem {Slug}", slug);
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // GET api/submissions/history
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetAllHistory()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var history = await _serviceManager.SubmissionService.GetAllSubmissionHistoryAsync(userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving overall submission history");
                return StatusCode(500, "An internal error occurred.");
            }
        }

        // GET api/submissions/{id:long}
        [HttpGet("{id:long}")]
        public async Task<ActionResult<SubmissionResultDTO>> GetById(long id)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                // Ownership check now happens in the service layer
                var result = await _serviceManager.SubmissionService.GetSubmissionByIdAsync(id, userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException) // Thrown by service if user doesn't own the submission
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving submission {SubmissionId}", id);
                return StatusCode(500, "An internal error occurred.");
            }
        }
    }
}