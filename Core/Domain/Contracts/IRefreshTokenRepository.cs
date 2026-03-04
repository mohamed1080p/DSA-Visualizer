
using Domain.Models.IdentityModule;

namespace Domain.Contracts
{
    public interface IRefreshTokenRepository
    {
        // get refresh token
        Task<RefreshToken?> GetRefreshTokenAsync(string token);

        // add refresh token 
        Task AddRefreshTokenAsync(RefreshToken refreshToken);

        // revoke refresh token
        Task RevokeRefreshTokenForUser(string id);
    }
}
