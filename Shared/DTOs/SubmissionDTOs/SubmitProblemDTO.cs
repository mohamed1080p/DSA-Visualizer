
namespace Shared.DTOs.SubmissionDTOs
{
    public class SubmitProblemDTO
    {
        public int ProblemId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }
}
