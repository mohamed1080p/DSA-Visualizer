using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class TopicCodeImplementationConfigurations : IEntityTypeConfiguration<TopicCodeImplementation>
    {
        public void Configure(EntityTypeBuilder<TopicCodeImplementation> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Language)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(c => c.Code)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            builder.Property(c => c.StepsJson)
                .IsRequired()
                .HasColumnType("nvarchar(max)")
                .HasDefaultValue("[]");

            // One topic cannot have duplicate language implementations
            builder.HasIndex(c => new { c.TopicId, c.Language })
                .IsUnique();
        }
    }
}
