using Domain.Models.BattleModule;
namespace ServicesAbstraction
{
    public record FriendDto(string UserId, string DisplayName, FriendshipStatus Status, DateTime Since, int FriendshipId = 0);
    public interface IFriendshipService
    {
        Task<Friendship> SendRequestAsync(string requesterId, string addresseeId);
        Task AcceptRequestAsync(int friendshipId, string userId);
        Task DeclineRequestAsync(int friendshipId, string userId);
        Task<List<FriendDto>> GetFriendsAsync(string userId);
        Task<List<FriendDto>> GetPendingRequestsAsync(string userId);
        Task RemoveFriendAsync(string userId, string friendId);
        Task<List<FriendDto>> SearchUsersAsync(string query, string currentUserId);
    }
}
