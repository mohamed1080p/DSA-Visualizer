using Domain.Models.TopicModule;
using Microsoft.EntityFrameworkCore;

namespace Persistence.Data
{
    public class ApplicationDbContext:DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options):base(options)
        {
            
        }
        public DbSet<Topic> Topics { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<TopicCodeImplementation> TopicCodeImplementations { get; set; }
        public DbSet<TopicComplexity> TopicComplexities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(
                typeof(AssemblyReference).Assembly,
                t => t.Namespace!.Contains("Persistence.Data")
            );
        }

    }
}
