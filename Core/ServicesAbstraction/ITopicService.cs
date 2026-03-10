using Shared.DTOs.TopicDTOs;

namespace ServicesAbstraction
{
    public interface ITopicService
    {
        Task<IEnumerable<TopicDTO>> GetAllAsync();
        Task<TopicDTO?> GetByIdAsync(string id);
    }
}
