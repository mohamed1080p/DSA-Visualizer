
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

    }
}
