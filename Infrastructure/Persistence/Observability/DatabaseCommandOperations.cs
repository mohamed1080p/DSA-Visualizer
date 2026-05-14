using System.Data.Common;
namespace Infrastructure.Persistence.Observability;

internal static class DatabaseCommandOperations
{
    public static string GetOperation(string? commandText)
    {
        if (string.IsNullOrWhiteSpace(commandText)) return "unknown";
        var trimmed = commandText.TrimStart();
        var spaceIndex = trimmed.IndexOfAny([' ', '\r', '\n', '\t']);
        return spaceIndex <= 0 ? trimmed.ToUpperInvariant() : trimmed[..spaceIndex].ToUpperInvariant();
    }
}

