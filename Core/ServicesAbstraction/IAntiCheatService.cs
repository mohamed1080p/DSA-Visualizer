namespace ServicesAbstraction
{
    public interface IAntiCheatService
    {
        double GetCodeSimilarity(string code1, string code2);
        bool IsSuspiciouslyFast(DateTime battleStart, DateTime submitTime, int minimumSeconds = 10);
    }
}

