using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class E2EPractical
{
    private static readonly HttpClient client = new();
    private static readonly string baseUrl = "http://localhost:5258";
    private static string token = "";
    private static string testEmail = $"e2e_{DateTime.UtcNow.Ticks}@example.com";
    private static string testPassword = "TestPass@123!";
    private static string testUsername = $"user{DateTime.UtcNow.Ticks}";

    static async Task Main()
    {
        Console.WriteLine("=== DSA Visualizer E2E Validation ===\n");

        try
        {
            // Test 1: Registration with manual JSON
            await TestRegistration();

            // Test 2: Login
            await TestLogin();

            // Test 3: Protected endpoint
            if (!string.IsNullOrEmpty(token))
            {
                await TestProtectedEndpoint();
            }

            // Test 4: Check available endpoints
            await TestEndpointDiscovery();

            Console.WriteLine("\n✅ E2E validation completed!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n❌ Error: {ex.Message}");
        }
    }

    private static async Task TestRegistration()
    {
        Console.WriteLine("1. User Registration");
        try
        {
            // Manually construct JSON to avoid reflection issues
            string registerJson = $@"{{
  ""email"": ""{testEmail}"",
  ""password"": ""{testPassword}"",
  ""userName"": ""{testUsername}"",
  ""displayName"": ""E2E Test User""
}}";

            var content = new StringContent(registerJson, Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{baseUrl}/api/auth/register", content);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ Registration successful (Status: {response.StatusCode})");
                Console.WriteLine($"   Email: {testEmail}");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
            {
                if (body.Contains("already") || body.Contains("exists"))
                {
                    Console.WriteLine($"   ℹ User may already exist, proceeding to login...");
                }
                else
                {
                    Console.WriteLine($"   ✗ BadRequest: {body.Substring(0, Math.Min(100, body.Length))}");
                }
            }
            else
            {
                Console.WriteLine($"   ✗ Registration failed ({response.StatusCode})");
                Console.WriteLine($"   Response: {body.Substring(0, Math.Min(100, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Error: {ex.Message}");
        }
    }

    private static async Task TestLogin()
    {
        Console.WriteLine("\n2. User Login");
        try
        {
            // Manually construct JSON
            string loginJson = $@"{{
  ""email"": ""{testEmail}"",
  ""password"": ""{testPassword}""
}}";

            var content = new StringContent(loginJson, Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{baseUrl}/api/auth/login", content);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ Login successful (Status: {response.StatusCode})");
                
                // Extract token from JSON
                var jsonDoc = JsonDocument.Parse(body);
                var root = jsonDoc.RootElement;
                
                if (root.TryGetProperty("accessToken", out var tokenProp))
                {
                    token = tokenProp.GetString() ?? "";
                    Console.WriteLine($"   ✓ Token: {token.Substring(0, Math.Min(20, token.Length))}...");
                }
                else
                {
                    Console.WriteLine($"   ⚠ No accessToken in response");
                }
            }
            else
            {
                Console.WriteLine($"   ✗ Login failed ({response.StatusCode})");
                Console.WriteLine($"   Response: {body.Substring(0, Math.Min(150, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Error: {ex.Message}");
        }
    }

    private static async Task TestProtectedEndpoint()
    {
        Console.WriteLine("\n3. Protected Endpoint (Battle Stats)");
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/api/battle/stats");
            request.Headers.Add("Authorization", $"Bearer {token}");

            var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"   GET /api/battle/stats: Status {response.StatusCode}");
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ Endpoint accessible with token");
                Console.WriteLine($"   Response length: {body.Length} chars");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Console.WriteLine($"   ✗ Token rejected (invalid)");
            }
            else
            {
                Console.WriteLine($"   Response: {body.Substring(0, Math.Min(100, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Error: {ex.Message}");
        }
    }

    private static async Task TestEndpointDiscovery()
    {
        Console.WriteLine("\n4. Endpoint Discovery");
        
        string[] endpoints = new[]
        {
            "/api/learning-paths",
            "/api/problems",
            "/api/submissions",
            "/api/leaderboard",
            "/api/user-progress",
            "/api/friendship",
            "/swagger/ui",
            "/api/health"
        };

        foreach (var endpoint in endpoints)
        {
            try
            {
                var response = await client.GetAsync($"{baseUrl}{endpoint}");
                Console.WriteLine($"   {endpoint}: {response.StatusCode}");
            }
            catch
            {
                // Silently skip errors
            }
        }
    }
}

