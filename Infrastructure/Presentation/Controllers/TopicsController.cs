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

        // GET api/topics/5
        [HttpGet("{id:int}")]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult<TopicDetailDTO>> GetById(int id)
        {
            var topic = await _serviceManager.TopicService.GetByIdAsync(id);
            return Ok(topic);
        }

        // POST api/topics/5/complete
        [HttpPost("{id:int}/complete")]
        [Authorize]
        [EnableRateLimiting("general-policy")]
        public async Task<ActionResult> MarkAsCompleted(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            await _serviceManager.TopicService.MarkTopicAsCompletedAsync(id, userId);
            return NoContent();
        }
    }
}
