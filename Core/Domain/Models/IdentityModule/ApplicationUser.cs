
using Microsoft.AspNetCore.Identity;

namespace Domain.Models.IdentityModule
{
    public class ApplicationUser:IdentityUser
    {
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
