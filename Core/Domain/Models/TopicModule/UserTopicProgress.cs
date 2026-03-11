
using Domain.Models.IdentityModule;

namespace Domain.Models.TopicModule
{
    public class UserTopicProgress
    {
        public int Id { get; set; }
        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedAt { get; set; }

        ///////////////////////////////////////////////////////
        public int TopicId { get; set; }
        public Topic Topic { get; set; } = default!;
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = default!;
    }
}
