
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Persistence.Identity
{
    public class ApplicationIdentityDbContext(DbContextOptions<ApplicationIdentityDbContext> options):IdentityDbContext<ApplicationUser>(options)
    {
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<ApplicationUser>().ToTable("Users");
            builder.Entity<IdentityRole>().ToTable("Roles");
            builder.Ignore<IdentityUserClaim<string>>();
            builder.Ignore<IdentityRoleClaim<string>>();

            builder.ApplyConfigurationsFromAssembly(typeof(IdentityAssemblyReference).Assembly,
            t => t.Namespace!.Contains("Persistence.Identity"));
        }
    }
}
