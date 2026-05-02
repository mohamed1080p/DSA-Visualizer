using Domain.Models.ProblemsModule;
using Shared.DTOs.SubmissionDTOs;

namespace Services;

internal static class SubmissionHelpers
{
    internal static Verdict MapVerdict(CodeExecutionResult result, string expectedOutput)
    {
        if (result.Verdict is Verdict.TimeLimitExceeded
                            or Verdict.MemoryLimitExceeded
                            or Verdict.compilationError)
            return result.Verdict;

        if (result.ExitCode != 0 || result.Verdict == Verdict.RuntimeError)
            return Verdict.RuntimeError;

        return Normalize(result.Output) == Normalize(expectedOutput)
            ? Verdict.Accepted
            : Verdict.WrongAnswer;
    }

    internal static string Normalize(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var normalizedLineBreaks = input.Replace("\r\n", "\n").Replace('\r', '\n');
        var lines = normalizedLineBreaks.Split('\n')
            .Select(line => line.TrimEnd());

        return string.Join('\n', lines).Trim();
    }

    internal static int ConvertKilobytesToMegabytes(int memoryLimitKb)
    {
        if (memoryLimitKb <= 0)
            return 1;

        return (int)Math.Max(1, Math.Ceiling(memoryLimitKb / 1024d));
    }
}
