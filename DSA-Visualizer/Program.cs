using Domain.Exceptions;
using DSA_Visualizer.Extensions;
using Persistence.Data.Seeds;
using Hangfire;
using Microsoft.Extensions.Configuration;

namespace DSA_Visualizer
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers();
            builder.Services.AddSwaggerServices();
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddProblemDetails();
            builder.Services.AddDatabaseServices(builder.Configuration);
            builder.Services.AddIdentityServices();
            builder.Services.AddJwtAuthentication(builder.Configuration);
            builder.Services.AddApplicationServices();
            builder.Services.AddRateLimitingServices(builder.Configuration);
            builder.Services.AddHangfireServices(builder.Configuration);

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var seeder = scope.ServiceProvider.GetRequiredService<DataSeeding>();
                await seeder.SeedAsync();
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseExceptionHandler();
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseRateLimiter();

            var hangfireUser = app.Configuration.GetSection("Hangfire:Dashboard:Users:0");
            var login = hangfireUser["Login"];
            var password = hangfireUser["PasswordClear"];

            app.UseHangfireDashboard("/hangfire", new DashboardOptions
            {
                Authorization = new[] { new BasicAuthAuthorizationFilter(login!, password!) }
            });

            app.MapControllers();
            app.Run();
        }
    }
}