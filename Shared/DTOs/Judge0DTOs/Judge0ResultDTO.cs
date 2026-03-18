
namespace Shared.DTOs.Judge0DTOs
{
    public class Judge0ResultDTO
    {
        public string? Stdout { get; set; }
        public string? Stderr { get; set; }
        public string? CompileOutput { get; set; }
        public double? Time { get; set; }        // runtime in seconds
        public int? Memory { get; set; }         // memory in KB
        public int StatusId { get; set; }        // Judge0 status code
        public string StatusDescription { get; set; } = string.Empty;
    }
}
