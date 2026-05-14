using Domain.Contracts;
using Domain.Models.BattleModule;
using Domain.Models.IdentityModule;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServicesAbstraction;

namespace Services.Community
{
    public class FriendshipService : IFriendshipService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;
        public FriendshipService(IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }
        public async Task<Friendship> SendRequestAsync(string requesterId, string addresseeId)
        {
            if (requesterId == addresseeId)
                throw new InvalidOperationException("Cannot send friend request to yourself");

            var repo = _unitOfWork.GetRepository<Friendship, int>();
            var existing = (await repo.GetAllReadOnlyAsync(predicate: f =>
                (f.RequesterId == requesterId && f.AddresseeId == addresseeId) ||
                (f.RequesterId == addresseeId && f.AddresseeId == requesterId), orderBy: null)).FirstOrDefault();

            if (existing != null)
            {
                if (existing.Status == FriendshipStatus.Accepted)
                    throw new InvalidOperationException("Already friends");
                if (existing.Status == FriendshipStatus.Pending)
                    throw new InvalidOperationException("Request already pending");
            }

            var friendship = new Friendship
            {
                RequesterId = requesterId,
                AddresseeId = addresseeId,
            };

            await repo.AddAsync(friendship);
            await _unitOfWork.SaveChangesAsync();
            return friendship;
        }
        public async Task AcceptRequestAsync(int friendshipId, string userId)
        {
            var repo = _unitOfWork.GetRepository<Friendship, int>();
            var friendship = await repo.GetByIdAsync(friendshipId)
                ?? throw new InvalidOperationException("Request not found");

            if (friendship.AddresseeId != userId)
                throw new InvalidOperationException("Not authorized to accept this request");

            friendship.Status = FriendshipStatus.Accepted;
            friendship.RespondedAt = DateTime.UtcNow;
            repo.Update(friendship);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task DeclineRequestAsync(int friendshipId, string userId)
        {
            var repo = _unitOfWork.GetRepository<Friendship, int>();
            var friendship = await repo.GetByIdAsync(friendshipId)
                ?? throw new InvalidOperationException("Request not found");

            if (friendship.AddresseeId != userId)
                throw new InvalidOperationException("Not authorized to decline this request");

            friendship.Status = FriendshipStatus.Declined;
            friendship.RespondedAt = DateTime.UtcNow;
            repo.Update(friendship);
            await _unitOfWork.SaveChangesAsync();
        }
        public async Task<List<FriendDto>> GetFriendsAsync(string userId)
        {
            var repo = _unitOfWork.GetRepository<Friendship, int>();
            var friends = await repo.GetAllReadOnlyAsync(
                predicate: f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == FriendshipStatus.Accepted,
                orderBy: q => q.OrderByDescending(f => f.CreatedAt));

            var friendIds = friends.Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId).Distinct().ToList();
            var users = await _userManager.Users
                .Where(u => friendIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.DisplayName
                })
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName);

            return friends.Select(f =>
            {
                var friendId = f.RequesterId == userId ? f.AddresseeId : f.RequesterId;
                users.TryGetValue(friendId, out var displayName);
                return new FriendDto(friendId, displayName ?? "Player", f.Status, f.CreatedAt, f.Id);
            }).ToList();
        }
        public async Task<List<FriendDto>> GetPendingRequestsAsync(string userId)
        {
            var repo = _unitOfWork.GetRepository<Friendship, int>();
            var pending = await repo.GetAllReadOnlyAsync(
                predicate: f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending,
                orderBy: q => q.OrderByDescending(f => f.CreatedAt));

            var requesterIds = pending.Select(f => f.RequesterId).Distinct().ToList();
            var users = await _userManager.Users
                .Where(u => requesterIds.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.DisplayName
                })
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName);

            return pending.Select(f =>
            {
                users.TryGetValue(f.RequesterId, out var displayName);
                return new FriendDto(f.RequesterId, displayName ?? "Player", f.Status, f.CreatedAt, f.Id);
            }).ToList();
        }
        public async Task RemoveFriendAsync(string userId, string friendId)
        {
            var repo = _unitOfWork.GetRepository<Friendship, int>();
            var friendship = (await repo.GetAllAsync(predicate: f =>
                ((f.RequesterId == userId && f.AddresseeId == friendId) ||
                 (f.RequesterId == friendId && f.AddresseeId == userId)) &&
                f.Status == FriendshipStatus.Accepted, orderBy: null)).FirstOrDefault();

            if (friendship != null)
            {
                repo.Delete(friendship);
                await _unitOfWork.SaveChangesAsync();
            }
        }
        public async Task<List<FriendDto>> SearchUsersAsync(string query, string currentUserId)
        {
            if (string.IsNullOrWhiteSpace(query)) return new List<FriendDto>();

            var users = await _userManager.Users
                .Where(u => u.Id != currentUserId && (u.UserName!.Contains(query) || u.DisplayName.Contains(query)))
                .Take(20)
                .Select(u => new FriendDto(u.Id, u.DisplayName, FriendshipStatus.None, DateTime.UtcNow))
                .ToListAsync();

            return users;
        }
    }
}




