
using Domain.Models.ProblemsModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class TestcaseConfigurations:IEntityTypeConfiguration<TestCase>
    {
        public void Configure(EntityTypeBuilder<TestCase> builder)
        {
            builder.HasKey(t => t.Id);

            builder.Property(t => t.Input)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            builder.Property(t => t.ExpectedOutput)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            builder.Property(t => t.IsHidden)
                .IsRequired()
                .HasDefaultValue(false);
        }
    }
}
