using Services.CodeExecution;
using Domain.Models.ProblemsModule;
using Shared.DTOs.SubmissionDTOs;
using System.Text;

namespace Services.CodeExecution;

internal static class CodeExecutionHelpers
{
    public static CodeExecutionResult CreateTimeLimitExceededResult(long elapsedMs)
    {
        return new CodeExecutionResult
        {
            Output = string.Empty,
            Error = "Time Limit Exceeded",
            ExitCode = 124,
            ExecutionTimeMs = elapsedMs,
            MemoryUsedKB = 0,
            Verdict = Verdict.TimeLimitExceeded
        };
    }
    public static int CalculateTimeoutMs(CodeExecutionRequest request)
    {
        var timeoutMs = request.TimeLimitMs + 2000;

        if (request.Language.Equals("csharp", StringComparison.OrdinalIgnoreCase) ||
            request.Language.Equals("java", StringComparison.OrdinalIgnoreCase) ||
            request.Language.Equals("cpp", StringComparison.OrdinalIgnoreCase))
        {
            timeoutMs += 10000;
            timeoutMs = Math.Max(timeoutMs, 15000);
        }

        return timeoutMs;
    }
    public static int CalculateBatchTimeoutMs(BatchCodeExecutionRequest request)
    {
        var perCaseTimeoutMs = request.TimeLimitMs + 2000;
        var total = Math.Max(5000, perCaseTimeoutMs * request.Inputs.Count);
        return total + 3000;
    }
    public static string DecodeBase64OrEmpty(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        try
        {
            return Encoding.UTF8.GetString(Convert.FromBase64String(value));
        }
        catch (FormatException)
        {
            return string.Empty;
        }
    }
    public static Verdict DetermineVerdict(long exitCode, string stdout, string stderr, bool oomKilled)
    {
        if (exitCode == 124)
            return Verdict.TimeLimitExceeded;

        if (oomKilled || exitCode == 137)
            return Verdict.MemoryLimitExceeded;

        if (exitCode == 0)
            return Verdict.Accepted;

        var combinedOutput = $"{stdout}\n{stderr}";
        if (LooksLikeCompilationError(combinedOutput))
            return Verdict.compilationError;

        return Verdict.RuntimeError;
    }

    private static bool LooksLikeCompilationError(string output)
    {
        if (string.IsNullOrWhiteSpace(output))
            return false;

        return output.Contains("error:", StringComparison.OrdinalIgnoreCase)
               || output.Contains("fatal error", StringComparison.OrdinalIgnoreCase)
               || output.Contains("compilation failed", StringComparison.OrdinalIgnoreCase)
               || output.Contains("Build FAILED", StringComparison.OrdinalIgnoreCase);
    }
}




