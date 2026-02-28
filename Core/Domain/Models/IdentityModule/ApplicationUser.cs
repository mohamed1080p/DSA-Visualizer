
using Microsoft.AspNetCore.Identity;

namespace Domain.Models.IdentityModule
{
    public class ApplicationUser:IdentityUser
    {
        public DateTime CreatedAt { get; set; }
        public DateTime LastLoginAt { get; set; }
        public bool IsActive { get; set; }
    }
}
