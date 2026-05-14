using Domain.Models.IdentityModule;

namespace Domain.Models.BattleModule;

public class BattleParticipant
{
    public int Id { get; set; }
    public Guid BattleSessionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int SolvedCount { get; set; }
    public int RatingBefore { get; set; }
    public int RatingAfter { get; set; }
    public int RatingDelta { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public BattleSession BattleSession { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;
    public ICollection<BattleSubmission> Submissions { get; set; } = new List<BattleSubmission>();
}
