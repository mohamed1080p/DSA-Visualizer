using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class E2ETestComplete
{
    private static readonly HttpClient client = new();
    private static readonly string baseUrl = "http://localhost:5258";
    private static string token = "";
    private static string testEmail = $"e2etest_{Guid.NewGuid().ToString().Substring(0, 8)}@example.com";
    private static string testPassword = "TestPass@123!";
    private static string testUsername = $"e2euser_{Guid.NewGuid().ToString().Substring(0, 8)}";

    static async Task Main()
    {
        Console.WriteLine("=== DSA Visualizer Full E2E Runtime Validation ===\n");

        try
        {
            // Phase 1: Authentication
            Console.WriteLine("PHASE 1: Authentication & User Registration");
            Console.WriteLine("===========================================");
            
            await TestBackendConnectivity();
            await TestUserRegistration();
            await TestUserLogin();
            
            // Phase 2: Protected Endpoints
            if (!string.IsNullOrEmpty(token))
            {
                Console.WriteLine("\nPHASE 2: Protected Endpoints (Authenticated)");
                Console.WriteLine("=============================================");
                
                await TestBattleStats();
                await TestLearningPaths();
                await TestProblems();
            }
            else
            {
                Console.WriteLine("\n⚠ Skipping protected endpoint tests - no valid token");
            }

            Console.WriteLine("\n✅ E2E validation completed!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n❌ Critical error: {ex.Message}");
        }
    }

    private static async Task TestBackendConnectivity()
    {
        Console.WriteLine("\n1. Backend Connectivity Check");
        try
        {
            var response = await client.GetAsync($"{baseUrl}/api/learning-paths");
            Console.WriteLine($"   ✓ Backend is responding (Status: {response.StatusCode})");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Backend unreachable: {ex.Message}");
            throw;
        }
    }

    private static async Task TestUserRegistration()
    {
        Console.WriteLine("\n2. User Registration");
        try
        {
            var registerPayload = new
            {
                email = testEmail,
                password = testPassword,
                userName = testUsername,
                displayName = "E2E Test User"
            };

            var json = JsonSerializer.Serialize(registerPayload, new JsonSerializerOptions
{
PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{baseUrl}/api/auth/register", content);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ User registered successfully");
                Console.WriteLine($"   ✓ Email: {testEmail}");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
            {
                if (body.Contains("already exists") || body.Contains("already registered"))
                {
                    Console.WriteLine($"   ℹ User already exists, will use for login");
                }
                else
                {
                    Console.WriteLine($"   ✗ Registration failed: {body.Substring(0, Math.Min(200, body.Length))}");
                }
            }
            else
            {
                Console.WriteLine($"   ✗ Unexpected response ({response.StatusCode}): {body.Substring(0, Math.Min(200, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Registration error: {ex.Message}");
        }
    }

    private static async Task TestUserLogin()
    {
        Console.WriteLine("\n3. User Login");
        try
        {
            var loginPayload = new
            {
                email = testEmail,
                password = testPassword
            };

            var json = JsonSerializer.Serialize(loginPayload, new JsonSerializerOptions
{
PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{baseUrl}/api/auth/login", content);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                // Extract token
                var jsonDoc = JsonDocument.Parse(body);
                if (jsonDoc.RootElement.TryGetProperty("accessToken", out var tokenProp))
                {
                    token = tokenProp.GetString() ?? "";
                    if (!string.IsNullOrEmpty(token))
                    {
                        Console.WriteLine($"   ✓ Login successful");
                        Console.WriteLine($"   ✓ Access token obtained: {token.Substring(0, Math.Min(20, token.Length))}...");
                    }
                }
            }
            else
            {
                Console.WriteLine($"   ✗ Login failed ({response.StatusCode}): {body.Substring(0, Math.Min(150, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Login error: {ex.Message}");
        }
    }

    private static async Task TestBattleStats()
    {
        Console.WriteLine("\n4. Battle Stats Endpoint (Protected)");
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/api/battle/stats");
            request.Headers.Add("Authorization", $"Bearer {token}");

            var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ Stats endpoint accessible (Status: {response.StatusCode})");
                Console.WriteLine($"   ✓ Response: {body.Substring(0, Math.Min(150, body.Length))}...");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Console.WriteLine($"   ✗ Unauthorized (token may be invalid)");
            }
            else
            {
                Console.WriteLine($"   ℹ Status: {response.StatusCode}, Response: {body.Substring(0, Math.Min(150, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Error: {ex.Message}");
        }
    }

    private static async Task TestLearningPaths()
    {
        Console.WriteLine("\n5. Learning Paths Endpoint");
        try
        {
            var response = await client.GetAsync($"{baseUrl}/api/learning-paths");

            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"   ✓ Learning paths accessible (Status: {response.StatusCode})");
                Console.WriteLine($"   ✓ Response length: {body.Length} chars");
            }
            else
            {
                Console.WriteLine($"   ℹ Status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Error: {ex.Message}");
        }
    }

    private static async Task TestProblems()
    {
        Console.WriteLine("\n6. Problems Endpoint");
        try
        {
            var response = await client.GetAsync($"{baseUrl}/api/problems");

            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"   ✓ Problems endpoint accessible (Status: {response.StatusCode})");
                Console.WriteLine($"   ✓ Response length: {body.Length} chars");
            }
            else
            {
                Console.WriteLine($"   ℹ Status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Error: {ex.Message}");
        }
    }
}

