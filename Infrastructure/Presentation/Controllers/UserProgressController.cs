using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.SubmissionDTOs;
using Shared.DTOs.UserProgressDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserProgressController(IServiceManager _serviceManager, ILogger<UserProgressController> _logger) : ControllerBase
    {
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        
        [HttpGet]
        public async Task<ActionResult<UserProgressDTO>> GetUserProgress()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var progress = await _serviceManager.UserProgressService.GetUserProgressAsync(userId);
                return Ok(progress);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user progress for user {UserId}", userId);
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpGet("submissions")]
        public async Task<ActionResult<IEnumerable<SubmissionHistoryDTO>>> GetSubmissionHistory()
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
                _logger.LogError(ex, "Error retrieving submission history for user {UserId}", userId);
                return StatusCode(500, "An internal error occurred.");
            }
        }
    }
}
