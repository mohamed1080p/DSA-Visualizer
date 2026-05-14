namespace Domain.Models.IdentityModule;

public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = default!;

    public bool IsActive => !IsRevoked && ExpiresAt > DateTime.UtcNow;
}
