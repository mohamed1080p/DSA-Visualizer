




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using ServicesAbstraction;
using Shared.DTOs.IdentityDTOs;
using System.Security.Claims;
using System.Text.Json;


namespace Infrastructure.Presentation.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IAuthService authService, IConfiguration configuration) : ControllerBase
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
        public async Task<IActionResult> ExternalLoginCallback()
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

                        var payload = JsonSerializer.Serialize(result, new JsonSerializerOptions
                        {
                                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                        });

            var frontendOrigin = configuration["Cors:Origins:0"]?.TrimEnd('/')
                ?? $"{Request.Scheme}://{Request.Host}";

                        var html = $$"""
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Signing in...</title>
    </head>
    <body>
        <script>
            const auth = {{payload}};
            window.location.replace('{{frontendOrigin}}/auth/external-callback#auth=' + encodeURIComponent(JSON.stringify(auth)));
        </script>
    </body>
</html>
""";

                        return Content(html, "text/html");
        }

        
    }
}



