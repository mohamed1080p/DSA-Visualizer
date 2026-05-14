using System.Linq.Expressions;
namespace Domain.Contracts
{
    public interface IGenericRepository<TEntity, TKey> where TEntity : class
    {
        Task<IEnumerable<TEntity>> GetAllAsync();
        Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>>? predicate, Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy, params Expression<Func<TEntity, object>>[] includes);
        Task<IEnumerable<TEntity>> GetAllReadOnlyAsync(Expression<Func<TEntity, bool>>? predicate = null, Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null, params Expression<Func<TEntity, object>>[] includes);
        Task<TEntity?> GetByIdAsync(TKey id);
        Task<TEntity?> GetByIdAsync(TKey id, params Expression<Func<TEntity, object>>[] includes);
        Task AddAsync(TEntity entity);
        void Update(TEntity entity);
        void Delete(TEntity entity);
    }
}

