using Shared.DTOs.LearningPathDTOs;
namespace ServicesAbstraction
{
    public interface ILearningPathService
    {
        Task<IEnumerable<LearningPathDTO>> GetAllAsync(string? userId);
        Task<LearningPathDetailDTO> GetBySlugAsync(string slug, string? userId);
        Task StartPathAsync(string slug, string userId);
        Task CompleteLevelAsync(string slug, int levelOrder, string userId);
        Task AdvanceIfCurrentLevelMatchesAsync(string userId, int? topicId = null, int? problemId = null);
    }
}

