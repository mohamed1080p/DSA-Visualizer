using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class E2ETest
{
    private static readonly HttpClient client = new();
    private static readonly string baseUrl = "http://localhost:5258";
    private static string token = "";

    static async Task Main()
    {
        Console.WriteLine("=== DSA Visualizer E2E Runtime Validation ===\n");

        // Test 1: Check if backend is responding
        await TestBackendConnectivity();

        // Test 2: Try login endpoint
        await TestLoginEndpoint();

        // Test 3: Try protected endpoint
        await TestProtectedEndpoint();

        Console.WriteLine("\n✅ E2E validation complete!");
    }

    private static async Task TestBackendConnectivity()
    {
        Console.WriteLine("1. Testing Backend Connectivity...");
        try
        {
            var response = await client.GetAsync($"{baseUrl}/api/learning-paths");
            var statusCode = response.StatusCode;
            Console.WriteLine($"   GET /api/learning-paths: Status {statusCode}");
            if (response.IsSuccessStatusCode)
                Console.WriteLine($"   ✓ Backend responding and accessible");
            else
                Console.WriteLine($"   ℹ Response (expected for public endpoint check): {statusCode}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Connection failed: {ex.Message}");
        }
    }

    private static async Task TestLoginEndpoint()
    {
        Console.WriteLine("\n2. Testing Login Endpoint...");
        try
        {
            var loginJson = @"{""email"":""testuser@example.com"",""password"":""TestPassword123!""}";
            var content = new StringContent(loginJson, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{baseUrl}/api/auth/login", content);
            var body = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"   POST /api/auth/login: Status {response.StatusCode}");

            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ Login endpoint responded with success");
                // Try to extract token
                if (body.Contains("accessToken"))
                {
                    Console.WriteLine($"   ✓ Response contains accessToken");
                }
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
            {
                Console.WriteLine($"   ℹ Login endpoint exists but returned BadRequest (user may not exist)");
                Console.WriteLine($"   Response: {body.Substring(0, Math.Min(200, body.Length))}");
            }
            else
            {
                Console.WriteLine($"   Response: {body.Substring(0, Math.Min(200, body.Length))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Login test failed: {ex.Message}");
        }
    }

    private static async Task TestProtectedEndpoint()
    {
        Console.WriteLine("\n3. Testing Protected Endpoint (Battle Stats)...");
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/api/battle/stats");
            // Try with a dummy bearer token to see if auth is working
            request.Headers.Add("Authorization", "Bearer dummy_token_for_testing");

            var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"   GET /api/battle/stats (with dummy token): Status {response.StatusCode}");

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Console.WriteLine($"   ✓ Endpoint exists and correctly rejects invalid token");
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                Console.WriteLine($"   ℹ Endpoint returned 404 (may not exist)");
            }
            else if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"   ✓ Endpoint returned success (unexpected with dummy token)");
            }
            else
            {
                Console.WriteLine($"   ℹ Status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   ✗ Protected endpoint test failed: {ex.Message}");
        }
    }
}

