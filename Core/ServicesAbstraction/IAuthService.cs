using Shared.DTOs.IdentityDTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace ServicesAbstraction
{
    public interface IAuthService
    {
        Task<UserDTO> RegisterAsync(RegisterDTO registerDTO);
        Task<UserDTO> LoginAsync(LoginDTO loginDTO);
    }
}
