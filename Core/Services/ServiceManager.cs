
using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using ServicesAbstraction;

namespace Services
{
    public class ServiceManager(IUnitOfWork _unitOfWork, UserManager<ApplicationUser> _userManager, IConfiguration _configuration) : IServiceManager
    {
        private readonly Lazy<IAuthService> _authService = new(() => new AuthService(_userManager, _unitOfWork, _configuration));
        public IAuthService AuthService => _authService.Value;

        private readonly Lazy<ITopicService> _topicService = new(() => new TopicService(_unitOfWork));
        public ITopicService TopicService => _topicService.Value;
    }
}
