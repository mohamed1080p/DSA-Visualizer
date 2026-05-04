using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Shared.DTOs.ChatbotDTOs;
using ServicesAbstraction;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatbotController(IServiceManager serviceManager) : ControllerBase
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
            var response = await serviceManager.ChatbotService.SendMessageAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
    }
}