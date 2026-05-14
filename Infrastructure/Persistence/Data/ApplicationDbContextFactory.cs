using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Persistence.Data;

/// <summary>
/// Design-time factory so EF Core tools do not need to boot the web host (avoids startup security validation).
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var cs = Environment.GetEnvironmentVariable("DSA_MIGRATIONS_CONNECTION")
                 ?? "Server=(localdb)\\mssqllocaldb;Database=DSA_Migrations_DesignTime;Trusted_Connection=True;MultipleActiveResultSets=true";
        optionsBuilder.UseSqlServer(cs);
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

