
namespace Shared.DTOs.Judge0DTOs
{
    public class Judge0RequestDTO
    {
        public string SourceCode { get; set; } = string.Empty;
        public int LanguageId { get; set; }
        public string Stdin { get; set; } = string.Empty;
        public double CpuTimeLimit { get; set; }
        public int MemoryLimit { get; set; }
    }
}
