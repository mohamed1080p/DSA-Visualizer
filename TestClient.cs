using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient { BaseAddress = new Uri("http://localhost:5258") };
        var res = await client.GetAsync("/api/topics/array");
        Console.WriteLine(res.StatusCode);
    }
}
