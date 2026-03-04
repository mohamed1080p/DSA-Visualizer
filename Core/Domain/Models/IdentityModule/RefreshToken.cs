
namespace Domain.Models.IdentityModule
{
    public class RefreshToken
    {
        public int Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; } = false;

        public string UserId { get; set; } = string.Empty;    // FK → AspNetUsers
        // Navigation property
        public ApplicationUser User { get; set; } = null!;

        // Computed (not mapped to Database)
        public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;
    }
}
