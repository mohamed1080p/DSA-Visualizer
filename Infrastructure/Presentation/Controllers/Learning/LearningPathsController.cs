




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.LearningPathDTOs;
using System.Security.Claims;

namespace Infrastructure.Presentation.Controllers.Learning
{
    [ApiController]
    [Route("api/[controller]")]
    public class LearningPathsController(ILearningPathService learningPathService) : ControllerBase
    {
        private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpGet]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<LearningPathDTO>>> GetAll()
        {
            var paths = await learningPathService.GetAllAsync(GetUserId());
            return Ok(paths);
        }

        [HttpGet("{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<LearningPathDetailDTO>> GetBySlug(string slug)
        {
            try
            {
                var path = await learningPathService.GetBySlugAsync(slug, GetUserId());
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
            await learningPathService.StartPathAsync(slug, userId);
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
                await learningPathService.CompleteLevelAsync(slug, levelOrder, userId);
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



