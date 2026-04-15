
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class ProblemConfigurations:IEntityTypeConfiguration<Problem>
    {
        public void Configure(EntityTypeBuilder<Problem> builder)
        {
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Title)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(p => p.Description)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            builder.Property(p => p.Difficulty)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(p => p.TimeLimitMs)
                .IsRequired();

            builder.Property(p => p.MemoryLimitKb)
                .IsRequired();

            builder.HasMany(p => p.TestCases)
                .WithOne(t => t.Problem)
                .HasForeignKey(t => t.ProblemId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(p => p.Submissions)
                .WithOne(s => s.Problem)
                .HasForeignKey(s => s.ProblemId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
