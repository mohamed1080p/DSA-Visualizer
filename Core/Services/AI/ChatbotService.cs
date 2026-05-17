using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.DTOs.ChatbotDTOs;
using ServicesAbstraction;
using System.Net.Http.Json;
using System.Text.Json;

namespace Services.AI;

internal sealed class GeminiResponse
{
    public List<GeminiCandidate> Candidates { get; set; } = [];
}

internal sealed class GeminiCandidate
{
    public GeminiContent Content { get; set; } = new();
}

internal sealed class GeminiContent
{
    public List<GeminiPart> Parts { get; set; } = [];
}

internal sealed class GeminiPart
{
    public string Text { get; set; } = string.Empty;
}

internal sealed class GeminiRequest
{
    public List<GeminiMessage> Contents { get; set; } = [];

    public GeminiSystemInstruction? SystemInstruction { get; set; }

    public GeminiGenerationConfig GenerationConfig { get; set; } = new();
}

internal sealed class GeminiMessage
{
    public string Role { get; set; } = string.Empty;

    public List<GeminiPart> Parts { get; set; } = [];
}

internal sealed class GeminiGenerationConfig
{
    public double Temperature { get; set; } = 0.7;

    public int MaxOutputTokens { get; set; } = 1024;
}

internal sealed class GeminiSystemInstruction
{
    public List<GeminiPart> Parts { get; set; } = [];
}

public class ChatbotService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<ChatbotService> logger) : IChatbotService
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<ChatbotService> _logger = logger;

    public async Task<ChatResponseDTO> SendMessageAsync(ChatRequestDTO request)
    {
        var aiRequired = _configuration.GetValue("Gemini:Required", false);
        var apiKey = _configuration["Gemini:ApiKey"];
        var endpoint = _configuration["Gemini:Endpoint"] ?? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        var systemPrompt = _configuration["Gemini:SystemPrompt"] ?? "You are a helpful DSA (Data Structures & Algorithms) tutor. Provide clear, concise explanations with code examples when helpful.";

        var contents = new List<GeminiMessage>();

        foreach (var message in request.Messages.Where(message => !string.IsNullOrWhiteSpace(message.Content)))
        {
            contents.Add(new GeminiMessage
            {
                Role = NormalizeRole(message.Role),
                Parts = [new GeminiPart { Text = message.Content.Trim() }]
            });
        }

        var payload = new GeminiRequest
        {
            Contents = contents,
            SystemInstruction = string.IsNullOrWhiteSpace(systemPrompt)
                ? null
                : new GeminiSystemInstruction
                {
                    Parts = [new GeminiPart { Text = systemPrompt }]
                },
            GenerationConfig = new GeminiGenerationConfig
            {
                Temperature = 0.7,
                MaxOutputTokens = 1024
            }
        };

        try
        {
            var client = _httpClientFactory.CreateClient("Gemini");
            var attemptUrl = string.IsNullOrWhiteSpace(apiKey) ? endpoint : $"{endpoint}?key={apiKey}";
            using var response = await client.PostAsJsonAsync(attemptUrl, payload);

            if (response.IsSuccessStatusCode)
            {
                var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiResponse>();
                var reply = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text?.Trim();

                if (!string.IsNullOrWhiteSpace(reply))
                {
                    return new ChatResponseDTO { Reply = reply };
                }

                _logger.LogWarning("Gemini returned an empty chat response.");
            }
            else
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini chat request returned {StatusCode}: {Body}", response.StatusCode, errorBody);

                if (aiRequired)
                {
                    throw new InvalidOperationException("The Gemini AI service is unavailable right now.");
                }

                return BuildLocalFallback(request, errorBody);
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to Gemini.");
            if (aiRequired)
            {
                throw new InvalidOperationException("The Gemini AI service is offline or unreachable.");
            }

            return BuildLocalFallback(request, ex.Message);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Gemini request timed out.");
            if (aiRequired)
            {
                throw new InvalidOperationException("The Gemini AI service timed out while thinking.");
            }

            return BuildLocalFallback(request, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error communicating with Gemini.");
            if (aiRequired)
            {
                throw new InvalidOperationException("An unexpected error occurred while communicating with the AI service.");
            }

            return BuildLocalFallback(request, ex.Message);
        }

        return BuildLocalFallback(request, "Empty response from Gemini.");
    }

    private static string NormalizeRole(string role)
    {
        return role.Trim().ToLowerInvariant() switch
        {
            "assistant" => "model",
            "system" => "user",
            _ => "user"
        };
    }

    private ChatResponseDTO BuildLocalFallback(ChatRequestDTO request, string? diagnostic = null)
    {
        var lastUser = request?.Messages?.LastOrDefault(m => m.Role?.Equals("user", StringComparison.OrdinalIgnoreCase) == true)?.Content
                       ?? request?.Messages?.LastOrDefault()?.Content
                       ?? "your request";

        var excerpt = lastUser.Length > 300 ? lastUser[..300] + "..." : lastUser;

        var reply = $"(Local AI fallback) I couldn't reach the Gemini service right now. Here's a concise response based on your input:\n\n{excerpt}\n\nIf you want the full AI reply, configure a valid Gemini API key and endpoint.";

        if (!string.IsNullOrWhiteSpace(diagnostic))
        {
            _logger.LogDebug("Local fallback diagnostic: {Diag}", diagnostic);
        }

        return new ChatResponseDTO { Reply = reply };
    }
}
