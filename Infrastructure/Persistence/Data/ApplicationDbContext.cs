
using Domain.Models.IdentityModule;
using Microsoft.EntityFrameworkCore;

namespace Persistence.Data
{
    public class ApplicationDbContext:DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options):base(options)
        {
            
        }
        //protected override void OnModelCreating(ModelBuilder modelBuilder)
        //{
        //    modelBuilder.ApplyConfigurationsFromAssembly(
        //        typeof(AssemblyReference).Assembly,
        //        t => t.Namespace!.Contains("Persistence.Data")
        //    );
        //}

    }
}
