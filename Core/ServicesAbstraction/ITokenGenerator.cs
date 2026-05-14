using Domain.Models.IdentityModule;
namespace ServicesAbstraction;

public interface ITokenGenerator
{
    string GenerateAccessToken(ApplicationUser user);
    string GenerateRefreshToken();
}


