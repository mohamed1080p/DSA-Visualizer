using Infrastructure.Persistence.Data.Configurations.Auth;
using Infrastructure.Persistence.Data.Configurations.Problems;
using Infrastructure.Persistence.Data.Configurations.Topics;
using Domain.Models.BattleModule;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Data.Configurations.Battle;

internal static class BattleModuleConfigurations
{
    public static void ConfigureBattleModule(ModelBuilder builder)
    {
        builder.Entity<PlayerStats>(e =>
        {
            e.HasKey(p => p.UserId);
            e.HasOne(p => p.User).WithOne().HasForeignKey<PlayerStats>(p => p.UserId);
            e.Property(p => p.RankPoints).HasDefaultValue(1000);
            e.Ignore(p => p.TotalBattles);
            e.Ignore(p => p.WinRate);
            e.HasIndex(p => p.RankPoints)
                .IsDescending()
                .HasDatabaseName("IX_PlayerStats_RankPoints");
            e.Property(p => p.RowVersion).IsRowVersion();
        });

        builder.Entity<BattleSession>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasOne(b => b.Winner).WithMany().HasForeignKey(b => b.WinnerUserId).IsRequired(false);
            e.HasMany(b => b.Participants).WithOne(p => p.BattleSession).HasForeignKey(p => p.BattleSessionId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(b => b.Problems).WithOne(p => p.BattleSession).HasForeignKey(p => p.BattleSessionId).OnDelete(DeleteBehavior.Cascade);

            e.Navigation(b => b.Participants).AutoInclude();
            e.Navigation(b => b.Problems).AutoInclude();
            e.Property(b => b.RowVersion).IsRowVersion();
        });

        builder.Entity<BattleParticipant>(e =>
        {
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.NoAction);
            e.Navigation(p => p.User).AutoInclude();
            e.Property(p => p.RowVersion).IsRowVersion();
        });

        builder.Entity<BattleProblem>(e =>
        {
            e.HasOne(p => p.Problem).WithMany().HasForeignKey(p => p.ProblemId).OnDelete(DeleteBehavior.NoAction);
            e.Navigation(p => p.Problem).AutoInclude();
        });

        builder.Entity<BattleSubmission>(e =>
        {
            e.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(s => s.BattleSession).WithMany().HasForeignKey(s => s.BattleSessionId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(s => s.BattleProblem).WithMany().HasForeignKey(s => s.BattleProblemId).OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<MatchmakingEntry>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<Friendship>(e =>
        {
            e.HasOne(f => f.Requester).WithMany().HasForeignKey(f => f.RequesterId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(f => f.Addressee).WithMany().HasForeignKey(f => f.AddresseeId).OnDelete(DeleteBehavior.NoAction);
            e.HasIndex(f => new
            {
                f.RequesterId,
                f.AddresseeId
            }).IsUnique();
        });
    }
}



