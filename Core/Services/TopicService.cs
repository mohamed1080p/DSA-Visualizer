using Domain.Contracts;
using Domain.Models.TopicModule;
using ServicesAbstraction;
using Shared.DTOs.TopicDTOs;
using System.Text.Json;

namespace Services
{
    public class TopicService(IGenericRepository<Topic, string> _topicRepository) : ITopicService
    {
        public async Task<IEnumerable<TopicDTO>> GetAllAsync()
        {
            var topics = await _topicRepository.GetAllAsync();
            return topics.Select(MapToDto);
        }

        public async Task<TopicDTO?> GetByIdAsync(string id)
        {
            var topic = await _topicRepository.GetByIdAsync(id);
            if (topic is null)
            {
                return null;
            }

            return MapToDto(topic);
        }

        private static TopicDTO MapToDto(Topic topic)
        {
            return new TopicDTO
            {
                Id = topic.Id,
                Name = topic.Name,
                Category = topic.Category,
                Icon = topic.Icon,
                Description = topic.Description,
                Difficulty = topic.Difficulty,
                ProblemsCount = topic.ProblemsCount,
                KeyPoints = DeserializeArray(topic.KeyPointsJson),
                UseCases = DeserializeArray(topic.UseCasesJson)
            };
        }

        private static IReadOnlyList<string> DeserializeArray(string json)
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
    }
}
