using Domain.Models.IdentityModule;
using Domain.Models.TopicModule;

namespace Domain.Models.BattleModule
{
    public class PlayerStats
    {
        public string UserId
        {
            get;
            set;
        } = string.Empty;
        public int RankPoints
        {
            get;
            set;
        } = 1000;
        public int Level
        {
            get;
            set;
        } = 1;
        public int WinCount
        {
            get;
            set;
        }
        public int LossCount
        {
            get;
            set;
        }
        public int DrawCount
        {
            get;
            set;
        }
        public int CurrentStreak
        {
            get;
            set;
        }
        public int BestStreak
        {
            get;
            set;
        }
        public ProgrammingLanguage PreferredLanguage
        {
            get;
            set;
        } = ProgrammingLanguage.Python;
        public byte[] RowVersion
        {
            get;
            set;
        } = System.Array.Empty<byte>();
        public int TotalBattles => WinCount + LossCount + DrawCount;
        public double WinRate => TotalBattles > 0 ? (double)WinCount / TotalBattles * 100 : 0;
        // Navigation
        public ApplicationUser User
        {
            get;
            set;
        } = default!;
    }
}


