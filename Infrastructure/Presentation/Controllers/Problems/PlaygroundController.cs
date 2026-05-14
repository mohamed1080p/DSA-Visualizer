




using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Text.Json.Serialization;

namespace Infrastructure.Presentation.Controllers.Problems
{
    public class ExecuteRequest
    {
        [JsonPropertyName("code")]
        public string Code
        {
            get;
            set;
        } = string.Empty;

        [JsonPropertyName("language")]
        public string Language
        {
            get;
            set;
        } = string.Empty;
    }

    [ApiController]
    public class PlaygroundController : ControllerBase
    {
        [HttpPost("/api/code/execute")]
        [AllowAnonymous]
        [EnableRateLimiting("general-policy")]
        public ActionResult ExecuteCode([FromBody] ExecuteRequest request)
        {
            // Simulate safe code execution logic or static output parsing for demonstration
            string output = "Code executed successfully.\n";
            if (request.Code.Contains("two_sum") || request.Code.Contains("twoSum"))
            {
                output += "[0, 1]\n";
            }
            else if (request.Code.Contains("Console.WriteLine") || request.Code.Contains("System.out.println") || request.Code.Contains("cout"))
            {
                output += "Hello, World!\n";
            }

            return Ok(new
            {
                output = output,
                memoryKb = 1536,
                status = "Success"
            });
        }

        [HttpPost("/api/playground/run")]
        [AllowAnonymous]
        [EnableRateLimiting("general-policy")]
        public ActionResult RunPlayground([FromBody] ExecuteRequest request)
        {
            string output = "Code executed successfully.\n";
            if (request.Code.Contains("two_sum") || request.Code.Contains("twoSum"))
            {
                output += "[0, 1]\n";
            }
            else if (request.Code.Contains("Console.WriteLine") || request.Code.Contains("System.out.println") || request.Code.Contains("cout"))
            {
                output += "Hello, World!\n";
            }

            return Ok(new
            {
                output = output,
                executionTime = "15 ms",
                memoryUsed = "1.5 MB"
            });
        }
    }
}



