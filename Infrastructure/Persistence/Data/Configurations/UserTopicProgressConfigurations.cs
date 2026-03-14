using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Data.Configurations
{
    public class UserTopicProgressConfigurations : IEntityTypeConfiguration<UserTopicProgress>
    {
        public void Configure(EntityTypeBuilder<UserTopicProgress> builder)
        {
            builder.HasKey(u => u.Id);

            // User cannot have duplicate progress rows for the same topic
            builder.HasIndex(u => new { u.UserId, u.TopicId })
                .IsUnique();


            builder.Property(u => u.CompletedAt)
                .IsRequired(false);

            builder.HasOne(u => u.Topic)
                .WithMany(t => t.UserProgresses)
                .HasForeignKey(u => u.TopicId)
                .OnDelete(DeleteBehavior.Cascade);

            // No cascade on User side — deleting a user is handled separately
            builder.HasOne(u => u.User)
                .WithMany(a=>a.UserProgresses)
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
