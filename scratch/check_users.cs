using Microsoft.Extensions.DependencyInjection;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var services = builder.Services;
services.AddDbContext<ApplicationDbContext>(options => 
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=DSAVisualizer;Trusted_Connection=True;MultipleActiveResultSets=true"));

var serviceProvider = services.BuildServiceProvider();
using var scope = serviceProvider.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

var users = await context.Users.Select(u => new { u.UserName, u.DisplayName, u.Email }).ToListAsync();
foreach(var u in users) {
    Console.WriteLine($"User: {u.UserName}, Display: {u.DisplayName}, Email: {u.Email}");
}
