using Domain.Models.IdentityModule;

namespace Domain.Models.BattleModule;

public class BattleSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public BattleMode Mode { get; set; }
    public BattleStatus Status { get; set; } = BattleStatus.WaitingForPlayers;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int TimeLimitSeconds { get; set; } = 600;
    public int ProblemsToWin { get; set; } = 3;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public string? WinnerUserId { get; set; }
    public ApplicationUser? Winner { get; set; }

    public ICollection<BattleParticipant> Participants { get; set; } = new List<BattleParticipant>();
    public ICollection<BattleProblem> Problems { get; set; } = new List<BattleProblem>();
}
