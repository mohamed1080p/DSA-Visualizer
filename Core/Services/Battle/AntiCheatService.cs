using ServicesAbstraction;

namespace Services.Battle
{
    public class AntiCheatService : IAntiCheatService
    {
        /// <summary>
        /// Compute normalized Levenshtein similarity between two code strings.
        /// Returns 0.0 (completely different) to 1.0 (identical).
        /// </summary>
        public double GetCodeSimilarity(string code1, string code2)
        {
            if (string.IsNullOrEmpty(code1) && string.IsNullOrEmpty(code2)) return 1.0;
            if (string.IsNullOrEmpty(code1) || string.IsNullOrEmpty(code2)) return 0.0;

            // Normalize: strip whitespace for comparison
            var a = NormalizeCode(code1);
            var b = NormalizeCode(code2);

            if (a == b) return 1.0;

            int maxLen = Math.Max(a.Length, b.Length);
            if (maxLen == 0) return 1.0;

            int distance = LevenshteinDistance(a, b);
            return 1.0 - ((double)distance / maxLen);
        }

        /// <summary>
        /// Flag submissions that arrive suspiciously fast after battle start.
        /// </summary>
        public bool IsSuspiciouslyFast(DateTime battleStart, DateTime submitTime, int minimumSeconds = 10)
        {
            return (submitTime - battleStart).TotalSeconds < minimumSeconds;
        }

        private static string NormalizeCode(string code)
        {
            // Remove all whitespace and convert to lowercase for comparison
            return new string(code.Where(c => !char.IsWhiteSpace(c)).ToArray()).ToLowerInvariant();
        }

        private static int LevenshteinDistance(string s, string t)
        {
            int n = s.Length, m = t.Length;

            // Use two-row optimization to avoid O(n*m) memory
            var prev = new int[m + 1];
            var curr = new int[m + 1];

            for (int j = 0;
j <= m;
j++) prev[j] = j;

            for (int i = 1;
i <= n;
i++)
            {
                curr[0] = i;
                for (int j = 1;
j <= m;
j++)
                {
                    int cost = s[i - 1] == t[j - 1] ? 0 : 1;
                    curr[j] = Math.Min(
                        Math.Min(curr[j - 1] + 1, prev[j] + 1),
                        prev[j - 1] + cost);
                }
                (prev, curr) = (curr, prev);
            }

            return prev[m];
        }
    }
}



