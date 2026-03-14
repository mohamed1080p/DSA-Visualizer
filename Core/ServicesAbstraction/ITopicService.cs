
using Shared.DTOs.TopicsDTOs;

namespace ServicesAbstraction
{
    public interface ITopicService
    {
        Task<IEnumerable<TopicDTO>> GetAllAsync();
        Task<IEnumerable<TopicDTO>> GetAllAsync(TopicQueryParametersDTO parameters);
        Task<TopicDetailDTO> GetByIdAsync(int id);
        Task MarkTopicAsCompletedAsync(int topicId, string userId);
    }
}
