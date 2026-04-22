using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;
using Shared.DTOs.UserProgressDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserProgressController(IServiceManager _serviceManager, ILogger<UserProgressController> _logger) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<UserProgressDTO>> GetUserProgress()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
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
    }
}
