using ServicesAbstraction;

namespace Services.Battle
{
    public class EloRatingService : IEloRatingService
    {
        private const int K_FACTOR = 32;
        private const int FAST_SOLVE_BONUS = 5;
        private const int PERFECT_ACCURACY_BONUS = 10;
        private const int STREAK_BONUS_PER_WIN = 3;
        private const int MAX_STREAK_BONUS = 15;
        private const double FAST_SOLVE_THRESHOLD_MINUTES = 3.0;
        public (int newWinnerRating, int newLoserRating) Calculate(
                    int winnerRating, int loserRating,
                    TimeSpan solveTime, bool perfectAccuracy, int currentStreak)
        {
            // Standard ELO expected scores
            double expectedWinner = 1.0 / (1 + Math.Pow(10, (loserRating - winnerRating) / 400.0));
            double expectedLoser = 1.0 - expectedWinner;
            // Base deltas
            int winnerDelta = (int)(K_FACTOR * (1.0 - expectedWinner));
            int loserDelta = (int)(K_FACTOR * (0.0 - expectedLoser));
            // Bonus: fast solve (under 3 minutes average)
            if (solveTime.TotalMinutes < FAST_SOLVE_THRESHOLD_MINUTES)
                winnerDelta += FAST_SOLVE_BONUS;
            // Bonus: perfect accuracy (no wrong submissions)
            if (perfectAccuracy)
                winnerDelta += PERFECT_ACCURACY_BONUS;
            // Bonus: win streak
            int streakBonus = Math.Min(currentStreak * STREAK_BONUS_PER_WIN, MAX_STREAK_BONUS);
            winnerDelta += streakBonus;
            // Ensure minimum change
            winnerDelta = Math.Max(winnerDelta, 1);
            loserDelta = Math.Min(loserDelta, -1);

            return (
                winnerRating + winnerDelta,
                Math.Max(0, loserRating + loserDelta)
            );
        }
        public int CalculateLevel(int rankPoints) => rankPoints switch
        {
            < 500 => 1,
            // Bronze
            < 1000 => 2,
            // Silver
            < 1500 => 3,
            // Gold
            < 2000 => 4,
            // Platinum
            < 2500 => 5,
            // Diamond
            _ => 6,
            // Master
        };
    }
}




