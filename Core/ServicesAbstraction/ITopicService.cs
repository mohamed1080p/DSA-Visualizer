
using Shared.DTOs.TopicsDTOs;

namespace ServicesAbstraction
{
    public interface ITopicService
    {
        Task<IEnumerable<TopicDTO>> GetAllAsync();
        Task<IEnumerable<TopicDTO>> GetAllAsync(TopicQueryParametersDTO parameters);
        Task<TopicDetailDTO> GetBySlugAsync(string slug);
        Task MarkTopicAsCompletedAsync(string slug, string userId);
    }
}
