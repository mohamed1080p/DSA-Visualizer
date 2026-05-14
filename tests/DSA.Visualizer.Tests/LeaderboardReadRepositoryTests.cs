using Domain.Models.BattleModule;
using Domain.Models.IdentityModule;
using Infrastructure.Persistence.Data;
using Infrastructure.Persistence.Repositories.Leaderboard;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DSA.Visualizer.Tests;
public sealed class LeaderboardReadRepositoryTests
{
    [Fact]
    public async Task GetGlobalLeaderboardPageAsync_OrdersAndPages_OnDatabase()
    {
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        await using (var arrange = new ApplicationDbContext(options))
        {
            for (var i = 0;
i < 25;
i++)
            {
                var user = new ApplicationUser
                {
                    Id = $"u{i}",
                    UserName = $"user{i}@t.com",
                    Email = $"user{i}@t.com",
                    DisplayName = $"User {i}",
                    EmailConfirmed = true,
                };
                arrange.Users.Add(user);
                arrange.PlayerStats.Add(new PlayerStats
                {
                    UserId = user.Id,
                    RankPoints = i * 10,
                    Level = 1,
                });
            }

            await arrange.SaveChangesAsync();
        }

        await using var db = new ApplicationDbContext(options);
        var sut = new LeaderboardReadRepository(db);

        var page0 = await sut.GetGlobalLeaderboardPageAsync(0, 10);
        Assert.Equal(10, page0.Count);
        Assert.Equal("u24", page0[0].UserId);
        Assert.Equal(240, page0[0].RankPoints);
        Assert.Equal("u15", page0[9].UserId);

        var page1 = await sut.GetGlobalLeaderboardPageAsync(10, 10);
        Assert.Equal(10, page1.Count);
        Assert.Equal("u14", page1[0].UserId);
    }
[Fact]
    public async Task GetRowsForUserIdsAsync_ReturnsEmpty_ForEmptySet()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new ApplicationDbContext(options);
        var sut = new LeaderboardReadRepository(db);

        var rows = await sut.GetRowsForUserIdsAsync([]);

        Assert.Empty(rows);
    }
}



