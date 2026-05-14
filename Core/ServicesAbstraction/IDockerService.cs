namespace ServicesAbstraction;

public class ContainerResources
{
    public int MemoryLimitMb
    {
        get;
        set;
    } = 512;
    public long CpuLimitNano
    {
        get;
        set;
    } = 2_000_000_000;
    public int PidLimit
    {
        get;
        set;
    } = 64;
}
public interface IDockerService
{
    Task<string> CreateContainerAsync(string image, IEnumerable<string> env, ContainerResources resources, CancellationToken ct = default);
    Task StartContainerAsync(string containerId, CancellationToken ct = default);
    Task<(long statusCode, string stdout, string stderr, bool oomKilled)> WaitAndGetResultsAsync(string containerId, int timeoutMs, CancellationToken ct = default);
    Task RemoveContainerAsync(string containerId, CancellationToken ct = default);
}


