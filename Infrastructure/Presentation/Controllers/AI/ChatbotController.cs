




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Shared.DTOs.ChatbotDTOs;
using ServicesAbstraction;

namespace Infrastructure.Presentation.Controllers.AI;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatbotController(IChatbotService chatbotService) : ControllerBase
{
    [HttpPost("message")]
    [EnableRateLimiting("general-policy")]
    public async Task<ActionResult<ChatResponseDTO>> SendMessage([FromBody] ChatRequestDTO request)
    {
        if (request.Messages is null || request.Messages.Count == 0)
        {
            return BadRequest("At least one message is required.");
        }

        try
        {
            var response = await chatbotService.SendMessageAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
    }
}


