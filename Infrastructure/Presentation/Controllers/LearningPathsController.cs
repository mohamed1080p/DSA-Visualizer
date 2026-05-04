using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.LearningPathDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LearningPathsController(IServiceManager _serviceManager) : ControllerBase
    {
        private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpGet]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<LearningPathDTO>>> GetAll()
        {
            var paths = await _serviceManager.LearningPathService.GetAllAsync(GetUserId());
            return Ok(paths);
        }

        [HttpGet("{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<LearningPathDetailDTO>> GetBySlug(string slug)
        {
            try
            {
                var path = await _serviceManager.LearningPathService.GetBySlugAsync(slug, GetUserId());
                return Ok(path);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{slug}/start")]
        [Authorize]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult> StartPath(string slug)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            await _serviceManager.LearningPathService.StartPathAsync(slug, userId);
            return NoContent();
        }

        [HttpPost("{slug}/complete/{levelOrder:int}")]
        [Authorize]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult> CompleteLevel(string slug, int levelOrder)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            try
            {
                await _serviceManager.LearningPathService.CompleteLevelAsync(slug, levelOrder, userId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
