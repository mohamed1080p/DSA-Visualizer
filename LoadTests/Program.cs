using System;
using NBomber.CSharp;
using NBomber.Http.CSharp;
using System.Net.Http;

namespace LoadTests
{
    class Program
    {
        static void Main(string[] args)
        {
            var httpClient = new HttpClient();

            var scenario = Scenario.Create("leaderboard_test", async context =>
            {
                var request = Http.CreateRequest("GET", "http://localhost:5000/api/leaderboard/global");
                var response = await Http.Send(httpClient, request);
                return response;
            })
            .WithoutWarmUp()
            .WithLoadSimulations(
                Simulation.Inject(rate: 100, interval: TimeSpan.FromSeconds(1), during: TimeSpan.FromSeconds(10))
            );

            NBomberRunner
                .RegisterScenarios(scenario)
                .Run();
        }
    }
}

