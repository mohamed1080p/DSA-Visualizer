using System;
class Program { static void Main() { Console.WriteLine(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "NULL"); } }
