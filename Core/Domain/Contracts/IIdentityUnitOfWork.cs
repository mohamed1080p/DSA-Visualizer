
namespace Domain.Contracts
{
    public interface IIdentityUnitOfWork:IAsyncDisposable
    {
        IRefreshTokenRepository RefreshTokenRepository { get; }
        Task<int> SaveChangesAsync();
    }
}
