using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Infrastructure.Presentation.Hubs.Community
{
    [Authorize]
    public class CommunityHub : Hub
    {
        private string UserId => Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new HubException("Not authenticated");

        private string UserName => Context.User?.FindFirstValue(ClaimTypes.Name) ?? "User";

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{UserId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{UserId}");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendPrivateMessage(string toUserId, string message)
        {
            await Clients.Group($"user:{toUserId}").SendAsync("ReceivePrivateMessage", new
            {
                fromUserId = UserId,
                fromUserName = UserName,
                message,
                timestamp = DateTime.UtcNow
            });

            await Clients.Caller.SendAsync("MessageSent", new
            {
                toUserId,
                message,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task NotifyPresence()
        {
            // Simple presence notify if needed
            await Clients.All.SendAsync("UserPresenceUpdate", new { userId = UserId, status = "online" });
        }
    }
}
