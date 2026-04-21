namespace ServicesAbstraction
{
    public interface IServiceManager
    {
        IAuthService AuthService { get; }
        ITopicService TopicService { get; }
        IProblemService ProblemService { get; }
        ISubmissionService SubmissionService { get; }
        ICodeExecutionService CodeExecutionService { get; }
        IUserProgressService UserProgressService { get; }

    }
}
