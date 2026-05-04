using Shared.DTOs.ChatbotDTOs;

namespace ServicesAbstraction;

public interface IChatbotService
{
    Task<ChatResponseDTO> SendMessageAsync(ChatRequestDTO request);
}