using Domain.Models.IdentityModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Persistence.Identity.Configurations
{
    public class RefreshTokenConfigurations : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.HasKey(a => a.Id);

            builder.Property(r => r.Token).IsRequired().HasMaxLength(500);

            builder.Property(r => r.ExpiresAt).IsRequired();

            builder.Property(r => r.IsRevoked).HasDefaultValue(false);

            builder.HasOne(r => r.User)
               .WithMany(u => u.RefreshTokens)
               .HasForeignKey(r => r.UserId)
               .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
