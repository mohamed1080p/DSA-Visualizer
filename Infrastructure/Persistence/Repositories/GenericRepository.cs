
using Domain.Contracts;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;

namespace Persistence.Repositories
{
    public class GenericRepository<TEntity, TKey>(ApplicationDbContext _dbContext) : IGenericRepository<TEntity, TKey> where TEntity:class
    {
        public async Task AddAsync(TEntity entity)
        {
            await _dbContext.Set<TEntity>().AddAsync(entity);
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            var result = await _dbContext.Set<TEntity>().ToListAsync();
            return result;
        }

        public async Task<TEntity?> GetByIdAsync(TKey id)
        {
            var result = await _dbContext.Set<TEntity>().FindAsync(id);
            return result;
        }

        public void Update(TEntity entity)
        {
            _dbContext.Set<TEntity>().Update(entity);
        }
        public void Delete(TEntity entity)
        {
            _dbContext.Set<TEntity>().Remove(entity);
        }
    }
}