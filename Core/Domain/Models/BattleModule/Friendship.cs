using Domain.Models.IdentityModule;

namespace Domain.Models.BattleModule;

public class Friendship
{
    public int Id { get; set; }
    public string RequesterId { get; set; } = string.Empty;
    public string AddresseeId { get; set; } = string.Empty;
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    public ApplicationUser Requester { get; set; } = default!;
    public ApplicationUser Addressee { get; set; } = default!;
}
