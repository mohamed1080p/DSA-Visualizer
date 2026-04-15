
using Domain.Contracts;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServicesAbstraction;

namespace Services
{
    public class ServiceManager(IUnitOfWork _unitOfWork, UserManager<ApplicationUser> _userManager, IConfiguration _configuration, ILogger<CodeExecutionService> _logger, ICodeExecutionService _codeExecutionService) : IServiceManager
    {
        private readonly Lazy<IAuthService> _authService = new(() => new AuthService(_userManager, _unitOfWork, _configuration));
        public IAuthService AuthService => _authService.Value;

        private readonly Lazy<ITopicService> _topicService = new(() => new TopicService(_unitOfWork));
        public ITopicService TopicService => _topicService.Value;

        private readonly Lazy<IProblemService> _problemService = new(() => new ProblemService(_unitOfWork));
        public IProblemService ProblemService => _problemService.Value;
        private readonly Lazy<ICodeExecutionService> _codeExecutionService = new(() => new CodeExecutionService(_logger));
        public ICodeExecutionService CodeExecutionService => _codeExecutionService.Value;
        private readonly Lazy<ISubmissionService> _submissionService = new(() => new SubmissionService(_unitOfWork, _codeExecutionService));
        public ISubmissionService SubmissionService => _submissionService.Value;

    }
}
