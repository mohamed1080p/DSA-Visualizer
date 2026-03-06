using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.EntityFrameworkCore;
using Persistence.Identity;

namespace Persistence.Repositories
{
    public class RefreshTokenRepository(ApplicationIdentityDbContext _identityDbContext) : IRefreshTokenRepository
    {
        public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
        {
            return await _identityDbContext.Set<RefreshToken>().Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Token == token && a.IsRevoked == false && a.ExpiresAt > DateTime.UtcNow);
        }

        public async Task AddRefreshTokenAsync(RefreshToken refreshToken)
        {
            await _identityDbContext.Set<RefreshToken>().AddAsync(refreshToken);
            await _identityDbContext.SaveChangesAsync();
        }

        public async Task RevokeRefreshTokenForUser(string id)
        {
            await _identityDbContext.Set<RefreshToken>().Where(a => a.UserId == id).
                ExecuteUpdateAsync(a => a.SetProperty(p => p.IsRevoked, true));
            await _identityDbContext.SaveChangesAsync();
        }
    }
}
