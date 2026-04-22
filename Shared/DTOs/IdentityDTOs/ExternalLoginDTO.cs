
namespace Shared.DTOs.IdentityDTOs
{
    public class ExternalLoginDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string ProviderKey { get; set; } = string.Empty;
    }
}
