




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using System.Security.Claims;

namespace Infrastructure.Presentation.Controllers.Community
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendshipController : ControllerBase
    {
        private readonly IFriendshipService _friendshipService;
        private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        public FriendshipController(IFriendshipService friendshipService)
                    => _friendshipService = friendshipService;
        [HttpPost("request/{addresseeId}")]
        public async Task<IActionResult> SendRequest(string addresseeId)
        {
            var friendship = await _friendshipService.SendRequestAsync(UserId, addresseeId);
            return Ok(new
            {
                friendship.Id,
                friendship.Status
            });
        }
        [HttpPost("accept/{friendshipId:int}")]
        public async Task<IActionResult> AcceptRequest(int friendshipId)
        {
            await _friendshipService.AcceptRequestAsync(friendshipId, UserId);
            return Ok(new
            {
                message = "Friend request accepted"
            });
        }
        [HttpPost("decline/{friendshipId:int}")]
        public async Task<IActionResult> DeclineRequest(int friendshipId)
        {
            await _friendshipService.DeclineRequestAsync(friendshipId, UserId);
            return Ok(new
            {
                message = "Friend request declined"
            });
        }
        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            var friends = await _friendshipService.GetFriendsAsync(UserId);
            return Ok(friends);
        }
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var pending = await _friendshipService.GetPendingRequestsAsync(UserId);
            return Ok(pending);
        }
        [HttpDelete("{friendId}")]
        public async Task<IActionResult> RemoveFriend(string friendId)
        {
            await _friendshipService.RemoveFriendAsync(UserId, friendId);
            return Ok(new
            {
                message = "Friend removed"
            });
        }
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            var users = await _friendshipService.SearchUsersAsync(q, UserId);
            return Ok(users);
        }
    }
}




