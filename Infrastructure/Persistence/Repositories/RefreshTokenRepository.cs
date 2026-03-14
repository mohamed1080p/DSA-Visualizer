using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class RefreshTokenRepository(ApplicationDbContext _dbContext) : IRefreshTokenRepository
    {
        public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
        {
            return await _dbContext.Set<RefreshToken>().Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Token == token && a.IsRevoked == false && a.ExpiresAt > DateTime.UtcNow);
        }

        public async Task AddRefreshTokenAsync(RefreshToken refreshToken)
        {
            await _dbContext.Set<RefreshToken>().AddAsync(refreshToken);
        }

        public async Task RevokeRefreshTokenForUser(string id)
        {
            await _dbContext.Set<RefreshToken>().Where(a => a.UserId == id).
                ExecuteUpdateAsync(a => a.SetProperty(p => p.IsRevoked, true));
        }
    }
}
