
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using Shared.DTOs.IdentityDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[Controller]")]
    public class AuthenticationController(IServiceManager _serviceManager):ControllerBase
    {
        // register
        [HttpPost("register")]
        public async Task<ActionResult<UserDTO>> Register([FromBody] RegisterDTO registerDTO)
        {
            var result = await _serviceManager.AuthService.RegisterAsync(registerDTO);
            return Ok(result);
        }

        // login
        [HttpPost("login")]
        public async Task<ActionResult<UserDTO>> Login([FromBody] LoginDTO loginDTO)
        {
            var result = await _serviceManager.AuthService.LoginAsync(loginDTO);
            return Ok(result);
        }

        // logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null)
            {
                return Unauthorized();
            }
            await _serviceManager.AuthService.LogoutAsync(userId);
            return Ok();
        }
    }
}
