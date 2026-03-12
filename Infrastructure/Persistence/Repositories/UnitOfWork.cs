
using Domain.Contracts;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class UnitOfWork(ApplicationDbContext _dbContext) : IUnitOfWork
    {
        private readonly Dictionary<string, object> _repositories = new();

        private readonly Lazy<IRefreshTokenRepository> _refreshTokenRepository = new(() => new RefreshTokenRepository(_dbContext));
        public IRefreshTokenRepository RefreshTokenRepository => _refreshTokenRepository.Value;

        public IGenericRepository<TEntity, TKey> GetRepository<TEntity, TKey>() where TEntity : class
        {
            string name = typeof(TEntity).Name;
            if(!_repositories.ContainsKey(name))
            {
                _repositories[name] = new GenericRepository<TEntity, TKey>(_dbContext);
            }
            return (IGenericRepository<TEntity, TKey>)_repositories[name];
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _dbContext.SaveChangesAsync();
        }
        public async ValueTask DisposeAsync()
        {
            await _dbContext.DisposeAsync();
        }

        
    }
}
