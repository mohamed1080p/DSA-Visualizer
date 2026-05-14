using Domain.Models.IdentityModule;

namespace Domain.Contracts;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task AddRefreshTokenAsync(RefreshToken refreshToken);
    Task RevokeRefreshTokenForUser(string id);
}
