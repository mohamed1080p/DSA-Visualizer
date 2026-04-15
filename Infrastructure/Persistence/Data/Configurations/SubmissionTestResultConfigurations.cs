
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class SubmissionTestResultConfigurations:IEntityTypeConfiguration<SubmissionTestResult>
    {
        public void Configure(EntityTypeBuilder<SubmissionTestResult> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(r => r.Verdict)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(r => r.ActualOutput)
                .IsRequired(false)
                .HasColumnType("nvarchar(max)");

            builder.Property(r => r.RuntimeMs)
                .IsRequired(false);

            builder.HasOne(r => r.TestCase)
                .WithMany()
                .HasForeignKey(r => r.TestCaseId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
