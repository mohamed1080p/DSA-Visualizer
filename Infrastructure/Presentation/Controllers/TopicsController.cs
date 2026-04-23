using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.TopicsDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController(IServiceManager _serviceManager) : ControllerBase
    {
        [HttpGet]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<IEnumerable<TopicDTO>>> GetAll([FromQuery] TopicQueryParametersDTO parameters)
        {
            var topics = await _serviceManager.TopicService.GetAllAsync(parameters);
            return Ok(topics);
        }

        // GET api/topics/{slug}
        [HttpGet("{slug}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<TopicDetailDTO>> GetBySlug(string slug)
        {
            var topic = await _serviceManager.TopicService.GetBySlugAsync(slug);
            return Ok(topic);
        }

        // POST api/topics/{slug}/complete
        [HttpPost("{slug}/complete")]
        [Authorize]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult> MarkAsCompleted(string slug)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            await _serviceManager.TopicService.MarkTopicAsCompletedAsync(slug, userId);
            return NoContent();
        }
    }
}
