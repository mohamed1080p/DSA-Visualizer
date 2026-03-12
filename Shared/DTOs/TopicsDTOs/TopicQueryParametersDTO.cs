
namespace Shared.DTOs.TopicsDTOs
{
    public class TopicQueryParametersDTO
    {
        public string? SearchTerm { get; set; }        // search by name
        public string? Difficulty { get; set; }        // filter by difficulty
        public int? CategoryId { get; set; }           // filter by category
    }
}
