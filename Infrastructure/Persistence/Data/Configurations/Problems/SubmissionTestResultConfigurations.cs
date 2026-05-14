using Infrastructure.Persistence.Data.Configurations.Auth;
using Infrastructure.Persistence.Data.Configurations.Battle;
using Infrastructure.Persistence.Data.Configurations.Topics;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace Infrastructure.Persistence.Data.Configurations.Problems
{
    public class SubmissionTestResultConfigurations : IEntityTypeConfiguration<SubmissionTestResult>
    {
        public void Configure(EntityTypeBuilder<SubmissionTestResult> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(r => r.Verdict)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(r => r.ActualOutput)
                .IsRequired(false)
                ;

            builder.HasOne(r => r.TestCase)
                .WithMany()
                .HasForeignKey(r => r.TestCaseId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}



