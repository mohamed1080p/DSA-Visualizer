using System;class TestEnv
{
static void Main()
{
Console.WriteLine(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "NULL");
} }

