
using Domain.Contracts;
using Persistence.Identity;

namespace Persistence.Repositories
{
    public class IdentityUnitOfWork(ApplicationIdentityDbContext _identityDbContext) : IIdentityUnitOfWork
    {
        private readonly Lazy<IRefreshTokenRepository> _refreshTokenRepository = new(() => new RefreshTokenRepository(_identityDbContext));
        public IRefreshTokenRepository RefreshTokenRepository => _refreshTokenRepository.Value;


        public async Task<int> SaveChangesAsync()
        {
            return await _identityDbContext.SaveChangesAsync();
        }
        public async ValueTask DisposeAsync()
        {
            await _identityDbContext.DisposeAsync();
        }
    }
}
