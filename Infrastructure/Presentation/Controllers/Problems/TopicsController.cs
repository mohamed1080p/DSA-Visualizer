




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.TopicsDTOs;
using System.Security.Claims;

namespace Infrastructure.Presentation.Controllers.Problems
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController(ITopicService topicService, ILearningPathService learningPathService) : ControllerBase
    {
        [HttpGet]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<TopicDTO>>> GetAll([FromQuery] TopicQueryParametersDTO parameters)
        {
            var topics = await topicService.GetAllAsync(parameters);
            return Ok(topics);
        }

        // GET api/topics/{slug}
        [HttpGet("{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<TopicDetailDTO>> GetBySlug(string slug)
        {
            var topic = await topicService.GetBySlugAsync(slug);
            return Ok(topic);
        }

        [HttpPost("{slug}/complete")]
        [Authorize]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult> MarkAsCompleted(string slug)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var topicId = await topicService.MarkTopicAsCompletedAsync(slug, userId);

            // Auto-advance learning path if applicable
            await learningPathService.AdvanceIfCurrentLevelMatchesAsync(userId, topicId: topicId);

            return NoContent();
        }

        [HttpGet("debug-advance")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DebugAdvance([FromQuery] string userId, [FromQuery] int topicId, [FromServices] IWebHostEnvironment environment)
        {
            if (!string.Equals(environment.EnvironmentName, Microsoft.Extensions.Hosting.Environments.Development, StringComparison.OrdinalIgnoreCase))
                return NotFound();

            await learningPathService.AdvanceIfCurrentLevelMatchesAsync(userId, topicId: topicId);
            return Ok(new
            {
                success = true
            });
        }
    }
}



