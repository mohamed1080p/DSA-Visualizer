using Infrastructure.Persistence.Data.Configurations.Auth;
using Infrastructure.Persistence.Data.Configurations.Battle;
using Infrastructure.Persistence.Data.Configurations.Problems;
using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Data.Configurations.Topics
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
                ;

            builder.Property(c => c.StepsJson)
                .IsRequired()

                .HasDefaultValue("[]");

            // One topic cannot have duplicate language implementations
            builder.HasIndex(c => new
            {
                c.TopicId,
                c.Language
            })
                .IsUnique();
        }
    }
}



