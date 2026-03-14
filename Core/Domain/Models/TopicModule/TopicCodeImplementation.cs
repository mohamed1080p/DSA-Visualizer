
namespace Domain.Models.TopicModule
{
    public class TopicCodeImplementation
    {
        public int Id { get; set; }
        public ProgrammingLanguage Language { get; set; }
        public string Code { get; set; } = string.Empty;
        public string StepsJson { get; set; } = "[]";

        //////////////////////////////////////////////////////
        public int TopicId { get; set; }
        public Topic Topic { get; set; } = default!;
    }
}
