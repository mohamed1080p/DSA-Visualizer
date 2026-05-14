using Domain.Models.IdentityModule;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;

namespace Domain.Models.BattleModule
{
    public class BattleSubmission
    {
        public long Id
        {
            get;
            set;
        }
        public Guid BattleSessionId
        {
            get;
            set;
        }
        public string UserId
        {
            get;
            set;
        } = string.Empty;
        public int BattleProblemId
        {
            get;
            set;
        }
        public string Code
        {
            get;
            set;
        } = string.Empty;
        public ProgrammingLanguage Language
        {
            get;
            set;
        }
        public Verdict? Verdict
        {
            get;
            set;
        }
        public long? RuntimeMs
        {
            get;
            set;
        }
        public long? MemoryKb
        {
            get;
            set;
        }
        public DateTime SubmittedAt
        {
            get;
            set;
        } = DateTime.UtcNow;
        public bool IsCorrect
        {
            get;
            set;
        }
        public int PassedTestCases
        {
            get;
            set;
        }
        public int TotalTestCases
        {
            get;
            set;
        }
        // Navigation
        public BattleSession BattleSession
        {
            get;
            set;
        } = default!;
        public ApplicationUser User
        {
            get;
            set;
        } = default!;
        public BattleProblem BattleProblem
        {
            get;
            set;
        } = default!;
    }
}


