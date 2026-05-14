namespace ServicesAbstraction
{
    public interface IEloRatingService
    {
        (int newWinnerRating, int newLoserRating) Calculate(
            int winnerRating, int loserRating,
            TimeSpan solveTime, bool perfectAccuracy, int currentStreak);

        int CalculateLevel(int rankPoints);
    }
}

