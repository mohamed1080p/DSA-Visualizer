
using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using ServicesAbstraction;

namespace Services
{
    public class ServiceManager(IIdentityUnitOfWork _identityUnitOfWork, UserManager<ApplicationUser> _userManager, IConfiguration _configuration) : IServiceManager
    {
        private readonly Lazy<IAuthService> _authService = new(() => new AuthService(_userManager, _identityUnitOfWork, _configuration));
        public IAuthService AuthService => _authService.Value;
    }
}
