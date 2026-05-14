using Domain.Models.BattleModule;
using Domain.Models.IdentityModule;
using Domain.Models.LearningPathModule;
using Domain.Models.ProblemsModule;
using Domain.Models.TopicModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence.Data.Configurations.Auth;
using Infrastructure.Persistence.Data.Configurations.Battle;
using Infrastructure.Persistence.Data.Configurations.Problems;
using Infrastructure.Persistence.Data.Configurations.Topics;

namespace Infrastructure.Persistence.Data
{
    public class ApplicationDbContext : IdentityDbContext<
        ApplicationUser,
        IdentityRole,
        string,
        IdentityUserClaim<string>,
        IdentityUserRole<string>,
        IdentityUserLogin<string>,
        IdentityRoleClaim<string>,
        IdentityUserToken<string>>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        }
        public DbSet<Topic> Topics
        {
            get;
            set;
        }
        public DbSet<Category> Categories
        {
            get;
            set;
        }
        public DbSet<TopicCodeImplementation> TopicCodeImplementations
        {
            get;
            set;
        }
        public DbSet<TopicComplexity> TopicComplexities
        {
            get;
            set;
        }
        public DbSet<RefreshToken> RefreshTokens
        {
            get;
            set;
        }
        public DbSet<UserTopicProgress> UserTopicProgresses
        {
            get;
            set;
        }
        public DbSet<Problem> Problems
        {
            get;
            set;
        }
        public DbSet<TestCase> TestCases
        {
            get;
            set;
        }
        public DbSet<Submission> Submissions
        {
            get;
            set;
        }
        public DbSet<SubmissionTestResult> SubmissionTestResults
        {
            get;
            set;
        }
        public DbSet<LearningPath> LearningPaths
        {
            get;
            set;
        }
        public DbSet<LearningPathLevel> LearningPathLevels
        {
            get;
            set;
        }
        public DbSet<UserLearningPathProgress> UserLearningPathProgresses
        {
            get;
            set;
        }
        // DSA Battle
        public DbSet<PlayerStats> PlayerStats
        {
            get;
            set;
        }
        public DbSet<BattleSession> BattleSessions
        {
            get;
            set;
        }
        public DbSet<BattleParticipant> BattleParticipants
        {
            get;
            set;
        }
        public DbSet<BattleProblem> BattleProblems
        {
            get;
            set;
        }
        public DbSet<BattleSubmission> BattleSubmissions
        {
            get;
            set;
        }
        public DbSet<MatchmakingEntry> MatchmakingEntries
        {
            get;
            set;
        }
        public DbSet<Friendship> Friendships
        {
            get;
            set;
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<ApplicationUser>().ToTable("Users");
            builder.Entity<IdentityRole>().ToTable("Roles");

            builder.ApplyConfigurationsFromAssembly(typeof(AssemblyReference).Assembly);
            BattleModuleConfigurations.ConfigureBattleModule(builder);
        }
    }
}



