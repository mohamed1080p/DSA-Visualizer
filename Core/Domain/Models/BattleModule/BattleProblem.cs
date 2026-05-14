using Domain.Models.ProblemsModule;

namespace Domain.Models.BattleModule;

public class BattleProblem
{
    public int Id { get; set; }
    public Guid BattleSessionId { get; set; }
    public int ProblemId { get; set; }
    public int Order { get; set; }

    public BattleSession BattleSession { get; set; } = default!;
    public Problem Problem { get; set; } = default!;
}
