using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTOs.TopicsDTOs;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController(IServiceManager _serviceManager) : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TopicDTO>>> GetAll()
        {
            var topics = await _serviceManager.TopicService.GetAllAsync();
            return Ok(topics);
        }

        // GET api/topics/filter?searchTerm=stack&difficulty=easy&categoryId=1
        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<TopicDTO>>> Filter([FromQuery] TopicQueryParametersDTO parameters)
        {
            var topics = await _serviceManager.TopicService.GetAllAsync(parameters);
            return Ok(topics);
        }

        // GET api/topics/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<TopicDetailDTO>> GetById(int id)
        {
            var topic = await _serviceManager.TopicService.GetByIdAsync(id);
            return Ok(topic);
        }

        // POST api/topics/5/complete
        [HttpPost("{id:int}/complete")]
        [Authorize]
        public async Task<ActionResult> MarkAsCompleted(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null)
                return Unauthorized();

            await _serviceManager.TopicService.MarkTopicAsCompletedAsync(id, userId);
            return Ok();
        }
    }
}
