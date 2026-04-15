
namespace Domain.Contracts
{
    public interface IUnitOfWork:IAsyncDisposable
    {
        IGenericRepository<TEntity, TKey> GetRepository<TEntity, TKey>() where TEntity : class;
        IRefreshTokenRepository RefreshTokenRepository { get; }
        ISubmissionRepository SubmissionRepository { get; }
        Task<int> SaveChangesAsync();
    }
}
