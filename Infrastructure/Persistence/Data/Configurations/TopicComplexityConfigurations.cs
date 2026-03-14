using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class TopicComplexityConfigurations : IEntityTypeConfiguration<TopicComplexity>
    {
        public void Configure(EntityTypeBuilder<TopicComplexity> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.OperationName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(c => c.TimeComplexity)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.SpaceComplexity)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
