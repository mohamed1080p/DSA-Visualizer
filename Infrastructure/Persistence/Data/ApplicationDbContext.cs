using Domain.Models.IdentityModule;
using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;

namespace Persistence.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Topic> Topics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Topic>(builder =>
            {
                builder.ToTable("Topics");
                builder.HasKey(t => t.Id);
                builder.Property(t => t.Id).HasMaxLength(100);
                builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
                builder.Property(t => t.Category).HasMaxLength(100).IsRequired();
                builder.Property(t => t.Icon).HasMaxLength(100).IsRequired();
                builder.Property(t => t.Description).HasMaxLength(1000).IsRequired();
                builder.Property(t => t.Difficulty).HasMaxLength(50).IsRequired();
                builder.Property(t => t.KeyPointsJson).HasColumnType("nvarchar(max)").IsRequired();
                builder.Property(t => t.UseCasesJson).HasColumnType("nvarchar(max)").IsRequired();
            });
        }
    }
}
