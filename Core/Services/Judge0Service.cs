
using Microsoft.Extensions.Configuration;
using ServicesAbstraction;
using Shared.DTOs.Judge0DTOs;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Services
{
    public class Judge0Service(HttpClient _httpClient, IConfiguration _configuration) : IJudge0Service
    {
        // Judge0 language IDs for supported languages
        public static readonly Dictionary<string, int> LanguageIds = new()
        {
            { "CSharp",     51 },
            { "CPP",        54 },
            { "Java",       62 },
            { "JavaScript", 63 }
        };

        public async Task<Judge0ResultDTO> ExecuteAsync(Judge0RequestDTO request)
        {
            var baseUrl = _configuration["Judge0:BaseUrl"];

            var payload = new
            {
                source_code = request.SourceCode,
                language_id = request.LanguageId,
                stdin = request.Stdin,
                cpu_time_limit = request.CpuTimeLimit,
                memory_limit = request.MemoryLimit
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            // wait=true → synchronous execution, result returned immediately
            var response = await _httpClient.PostAsync(
                $"{baseUrl}/submissions?base64_encoded=false&wait=true",
                content);

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<Judge0Response>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (result is null)
                throw new Exception("Failed to parse Judge0 response.");

            return new Judge0ResultDTO
            {
                Stdout = result.Stdout?.Trim(),
                Stderr = result.Stderr,
                CompileOutput = result.CompileOutput,
                Time = result.Time,
                Memory = result.Memory,
                StatusId = result.Status?.Id ?? 0,
                StatusDescription = result.Status?.Description ?? string.Empty
            };
        }

        // ── Internal response model (maps Judge0 JSON response) ────────────
        private class Judge0Response
        {
            public string? Stdout { get; set; }
            public string? Stderr { get; set; }

            [JsonPropertyName("compile_output")]
            public string? CompileOutput { get; set; }
            public double? Time { get; set; }
            public int? Memory { get; set; }
            public Judge0Status? Status { get; set; }
        }

        private class Judge0Status
        {
            public int Id { get; set; }
            public string Description { get; set; } = string.Empty;
        }
    }
}
