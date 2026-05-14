using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerStatsRankPointsIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PlayerStats_RankPoints",
                table: "PlayerStats",
                column: "RankPoints");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlayerStats_RankPoints",
                table: "PlayerStats");
        }
    }
}
