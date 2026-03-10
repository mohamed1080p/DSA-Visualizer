using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTOs.TopicDTOs;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController(ITopicService _topicService) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TopicDTO>>> GetAll()
        {
            var result = await _topicService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TopicDTO>> GetById(string id)
        {
            var result = await _topicService.GetByIdAsync(id);
            if (result is null)
            {
                return NotFound();
            }

            return Ok(result);
        }
    }
}
