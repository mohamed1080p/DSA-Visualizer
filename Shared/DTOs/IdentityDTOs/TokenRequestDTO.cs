
namespace Shared.DTOs.IdentityDTOs
{
    public class TokenRequestDTO
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
