
namespace Domain.Contracts
{
    public interface IUnitOfWork:IAsyncDisposable
    {
        IGenericRepository<TEntity, TKey> genericRepository<TEntity, TKey>() where TEntity : class;
        Task<int> SaveChangesAsync();
    }
}
