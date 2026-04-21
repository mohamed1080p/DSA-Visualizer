using Shared.DTOs.UserProgressDTOs;

namespace ServicesAbstraction
{
    public interface IUserProgressService
    {
        Task<UserProgressDTO> GetUserProgressAsync(string userId);
    }
}
