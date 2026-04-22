
using Microsoft.AspNetCore.Authentication;
using Shared.DTOs.IdentityDTOs;

namespace ServicesAbstraction
{
    public interface IAuthService
    {
        // login
        Task<UserDTO> LoginAsync(LoginDTO loginDTO);

        // register
        Task<UserDTO> RegisterAsync(RegisterDTO registerDTO);

        // logout
        Task LogoutAsync(string id);

        // refresh token
        Task<UserDTO> RefreshTokenAsync(TokenRequestDTO tokenRequestDTO);
        
        // external login
        Task<UserDTO> ExternalLoginAsync(ExternalLoginDTO externalLoginDTO);

        AuthenticationProperties GetExternalAuthenticationProperties(string provider, string redirectUrl);

    }
}
