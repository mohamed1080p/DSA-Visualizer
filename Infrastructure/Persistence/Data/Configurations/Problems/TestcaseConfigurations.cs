using Infrastructure.Persistence.Data.Configurations.Auth;
using Infrastructure.Persistence.Data.Configurations.Battle;
using Infrastructure.Persistence.Data.Configurations.Topics;
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace Infrastructure.Persistence.Data.Configurations.Problems
{
    public class TestcaseConfigurations : IEntityTypeConfiguration<TestCase>
    {
        public void Configure(EntityTypeBuilder<TestCase> builder)
        {
            builder.HasKey(t => t.Id);

            builder.Property(t => t.Input)
                .IsRequired()
                ;

            builder.Property(t => t.ExpectedOutput)
                .IsRequired()
                ;

            builder.Property(t => t.IsHidden)
                .IsRequired()
                .HasDefaultValue(false);
        }
    }
}



