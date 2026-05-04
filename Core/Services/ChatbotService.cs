using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.DTOs.ChatbotDTOs;
using ServicesAbstraction;
using System.Net.Http.Json;

namespace Services;

public class ChatbotService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<ChatbotService> logger) : IChatbotService
{
    public async Task<ChatResponseDTO> SendMessageAsync(ChatRequestDTO request)
    {
        var ollamaBaseUrl = configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
        var model = configuration["Ollama:Model"] ?? "neural-chat:latest";
        var systemPrompt = configuration["Ollama:SystemPrompt"] ?? "You are a helpful DSA tutor.";

        var client = httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(ollamaBaseUrl);

        var messages = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };

        foreach (var message in request.Messages.Where(message => !string.IsNullOrWhiteSpace(message.Content)))
        {
            messages.Add(new { role = NormalizeRole(message.Role), content = message.Content });
        }

        var payload = new
        {
            model,
            messages,
            stream = false
        };

        var response = await client.PostAsJsonAsync("/api/chat", payload);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            logger.LogError("Ollama returned {StatusCode}: {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException("The Ollama service is unavailable right now.");
        }

        var ollamaResponse = await response.Content.ReadFromJsonAsync<OllamaChatResponse>();
        var reply = ollamaResponse?.Message?.Content?.Trim();

        return new ChatResponseDTO
        {
            Reply = string.IsNullOrWhiteSpace(reply)
                ? "I could not generate a response from Ollama."
                : reply
        };
    }

    private static string NormalizeRole(string role)
    {
        return role.Trim().ToLowerInvariant() switch
        {
            "assistant" => "assistant",
            "system" => "system",
            _ => "user"
        };
    }

    private sealed class OllamaChatResponse
    {
        public OllamaMessage? Message { get; set; }
    }

    private sealed class OllamaMessage
    {
        public string? Content { get; set; }
    }
}