using Infrastructure.Persistence.Data.Configurations.Auth;
using Infrastructure.Persistence.Data.Configurations.Battle;
using Infrastructure.Persistence.Data.Configurations.Problems;
using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Data.Configurations.Topics
{
    public class CategoryConfigurations : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasMany(c => c.Topics)
                .WithOne(t => t.Category)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}



