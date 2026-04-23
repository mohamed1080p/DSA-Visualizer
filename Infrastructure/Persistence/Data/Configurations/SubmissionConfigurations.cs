
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class SubmissionConfigurations : IEntityTypeConfiguration<Submission>
    {
        public void Configure(EntityTypeBuilder<Submission> builder)
        {
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Code)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            builder.Property(s => s.Language)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(s => s.Verdict)
                .IsRequired(false)
                .HasConversion<string>();

            builder.Property(s => s.Status)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(s => s.FailureReason)
                .IsRequired(false)
                .HasColumnType("nvarchar(max)");

            builder.Property(s => s.RuntimeMs)
                .IsRequired(false);

            builder.Property(s => s.MemoryKb)
                .IsRequired(false);

            builder.Property(s => s.SubmittedAt)
                .IsRequired();

            // ---------- Index for fetching a user's submission history sorted by date ----------
            builder.HasIndex(s => new { s.UserId, s.SubmittedAt });

            builder.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(s => s.SubmissionTestResults)
                .WithOne(r => r.Submission)
                .HasForeignKey(r => r.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
