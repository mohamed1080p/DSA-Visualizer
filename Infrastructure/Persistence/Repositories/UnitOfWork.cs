
using Domain.Contracts;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class UnitOfWork(ApplicationDbContext _applicationDbContext) : IUnitOfWork
    {
        private readonly Dictionary<string, object> _repositories = new();

       

        public IGenericRepository<TEntity, TKey> genericRepository<TEntity, TKey>() where TEntity : class
        {
            string name = typeof(TEntity).Name;
            if(!_repositories.ContainsKey(name))
            {
                _repositories[name] = new GenericRepository<TEntity, TKey>(_applicationDbContext);
            }
            return (IGenericRepository<TEntity, TKey>)_repositories[name];
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _applicationDbContext.SaveChangesAsync();
        }
        public async ValueTask DisposeAsync()
        {
            await _applicationDbContext.DisposeAsync();
        }

        
    }
}
