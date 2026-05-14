




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServicesAbstraction;
using System.Security.Claims;

namespace Infrastructure.Presentation.Controllers.Community
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ILeaderboardService _leaderboardService;
        private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);
        public LeaderboardController(ILeaderboardService leaderboardService)
                    => _leaderboardService = leaderboardService;
        [HttpGet("global")]
        public async Task<IActionResult> GetGlobal([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var entries = await _leaderboardService.GetGlobalLeaderboardAsync(page, pageSize);
            return Ok(entries);
        }
        [HttpGet("weekly")]
        public async Task<IActionResult> GetWeekly([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var entries = await _leaderboardService.GetWeeklyLeaderboardAsync(page, pageSize);
            return Ok(entries);
        }
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthly([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var entries = await _leaderboardService.GetMonthlyLeaderboardAsync(page, pageSize);
            return Ok(entries);
        }
        [HttpGet("friends")]
        [Authorize]
        public async Task<IActionResult> GetFriends()
        {
            if (UserId == null) return Unauthorized();
            var entries = await _leaderboardService.GetFriendsLeaderboardAsync(UserId);
            return Ok(entries);
        }
    }
}




