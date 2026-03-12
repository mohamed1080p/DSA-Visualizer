
namespace Shared.DTOs.TopicsDTOs
{
    public class TopicDetailDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public IEnumerable<TopicComplexityDTO> Complexities { get; set; } = new List<TopicComplexityDTO>();
        public IEnumerable<TopicCodeImplementationDTO> CodeImplementations { get; set; } = new List<TopicCodeImplementationDTO>();
    }
}
