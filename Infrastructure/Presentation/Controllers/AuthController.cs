
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.IdentityDTOs;
using System.Security.Claims;

namespace Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IServiceManager _serviceManager) : ControllerBase
    {
        // register
        [HttpPost("register")]
        [EnableRateLimiting("auth-policy")]
        public async Task<ActionResult<UserDTO>> Register([FromBody] RegisterDTO registerDTO)
        {
            var result = await _serviceManager.AuthService.RegisterAsync(registerDTO);
            return Ok(result);
        }

        // login
        [HttpPost("login")]
        [EnableRateLimiting("auth-policy")]
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
            await _serviceManager.AuthService.LogoutAsync(userId);
            return Ok();
        }

        // refresh token
        [HttpPost("refresh-token")]
        [EnableRateLimiting("auth-policy")]
        public async Task<ActionResult<UserDTO>> RefreshToken([FromBody] TokenRequestDTO tokenRequestDTO)
        {
            var result = await _serviceManager.AuthService.RefreshTokenAsync(tokenRequestDTO);
            return Ok(result);
        }

        [HttpGet("external-login")]
        public IActionResult ExternalLogin(string provider, string? redirectUrl = null)
        {
            // If no redirectUrl is provided, we send them to our callback endpoint
            var callbackUrl = redirectUrl ?? Url.Action("ExternalLoginCallback", "Auth", null, Request.Scheme);

            var properties = _serviceManager.AuthService.GetExternalAuthenticationProperties(provider, callbackUrl!);
            return Challenge(properties, provider);
        }

        [HttpGet("external-login-callback")]
        public async Task<ActionResult<UserDTO>> ExternalLoginCallback()
        {
            var authenticateResult = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);

            if (!authenticateResult.Succeeded)
                return BadRequest("External authentication failed.");

            var email = authenticateResult.Principal.FindFirstValue(ClaimTypes.Email);
            var name = authenticateResult.Principal.FindFirstValue(ClaimTypes.Name) ?? email;
            var provider = authenticateResult.Properties?.Items["LoginProvider"];
            var providerKey = authenticateResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);

            if (email == null || provider == null || providerKey == null)
                return BadRequest("External authentication failed: Missing information.");

            var externalLoginDTO = new ExternalLoginDTO
            {
                Email = email,
                Name = name!,
                Provider = provider,
                ProviderKey = providerKey
            };

            var result = await _serviceManager.AuthService.ExternalLoginAsync(externalLoginDTO);

            // Clean up the external cookie
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            return Ok(result);
        }
    }
}
