namespace ServicesAbstraction
{
    public interface IServiceManager
    {
        IAuthService AuthService { get; }
        ITopicService TopicService { get; }
    }
}
