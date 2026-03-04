
using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.IdentityDTOs
{
    public class RegisterDTO
    {
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }
}
