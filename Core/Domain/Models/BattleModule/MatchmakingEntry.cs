using Domain.Models.IdentityModule;

namespace Domain.Models.BattleModule;

public class MatchmakingEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string? TargetUserId { get; set; }
    public int RankPoints { get; set; }
    public BattleMode Mode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser User { get; set; } = default!;
}
