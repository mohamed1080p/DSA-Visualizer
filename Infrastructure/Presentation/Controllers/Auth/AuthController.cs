




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using ServicesAbstraction;
using Shared.DTOs.IdentityDTOs;
using System.Security.Claims;


namespace Infrastructure.Presentation.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IAuthService authService) : ControllerBase
    {
        [HttpPost("register")]
        [EnableRateLimiting("auth-policy")]
        public async Task<ActionResult<UserDTO>> Register([FromBody] RegisterDTO registerDTO)
        {
            var result = await authService.RegisterAsync(registerDTO);
            return Ok(result);
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth-policy")]
        public async Task<ActionResult<UserDTO>> Login([FromBody] LoginDTO loginDTO)
        {
            var result = await authService.LoginAsync(loginDTO);
            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is null)
                return Unauthorized();
            await authService.LogoutAsync(userId);
            return Ok();
        }

        [HttpPost("refresh-token")]
        [EnableRateLimiting("auth-policy")]
        public async Task<ActionResult<UserDTO>> RefreshToken([FromBody] TokenRequestDTO tokenRequestDTO)
        {
            var result = await authService.RefreshTokenAsync(tokenRequestDTO);
            return Ok(result);
        }

        [HttpGet("external-login")]
        public IActionResult ExternalLogin(string provider, string? redirectUrl = null)
        {
            if (!string.Equals(provider, "Google", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(provider, "GitHub", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Invalid authentication provider.");
            }

            string callbackUrl;
            if (string.IsNullOrWhiteSpace(redirectUrl))
            {
                callbackUrl = Url.Action("ExternalLoginCallback", "Auth", values: null, protocol: Request.Scheme)!;
            }
            else if (Url.IsLocalUrl(redirectUrl))
            {
                callbackUrl = redirectUrl;
            }
            else
            {
                return BadRequest("Invalid redirect URL.");
            }

            var properties = authService.GetExternalAuthenticationProperties(provider, callbackUrl);
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

            var result = await authService.ExternalLoginAsync(externalLoginDTO);

            // Clean up the external cookie
            await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

            return Ok(result);
        }
    }
}



