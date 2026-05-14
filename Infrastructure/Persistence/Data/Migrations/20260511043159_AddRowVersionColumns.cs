using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace Infrastructure.Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersionColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Problems_TopicId", table: "Problems");
            migrationBuilder.AlterColumn<string>(name: "Status", table: "Submissions", type: "nvarchar(450)", nullable: false, oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AddColumn<byte[]>(name: "RowVersion", table: "Submissions", type: "rowversion", rowVersion: true, nullable: true);
            migrationBuilder.AlterColumn<string>(name: "Slug", table: "Problems", type: "nvarchar(200)", maxLength: 200, nullable: false, oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AlterColumn<string>(name: "Difficulty", table: "Problems", type: "nvarchar(450)", nullable: false, oldClrType: typeof(string), oldType: "nvarchar(max)");
            migrationBuilder.AddColumn<byte[]>(name: "RowVersion", table: "PlayerStats", type: "rowversion", rowVersion: true, nullable: true);
            migrationBuilder.AddColumn<byte[]>(name: "RowVersion", table: "BattleSessions", type: "rowversion", rowVersion: true, nullable: true);
            migrationBuilder.AddColumn<byte[]>(name: "RowVersion", table: "BattleParticipants", type: "rowversion", rowVersion: true, nullable: true);
            migrationBuilder.CreateIndex(name: "IX_Submissions_Status", table: "Submissions", column: "Status");
            migrationBuilder.CreateIndex(name: "IX_Submissions_UserId_ProblemId_SubmittedAt", table: "Submissions", columns: new[] {
"UserId", "ProblemId", "SubmittedAt" });
            migrationBuilder.CreateIndex(name: "IX_Problems_Slug", table: "Problems", column: "Slug", unique: true);
            migrationBuilder.CreateIndex(name: "IX_Problems_TopicId_Difficulty", table: "Problems", columns: new[] {
"TopicId", "Difficulty" });
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Submissions_Status", table: "Submissions");
            migrationBuilder.DropIndex(name: "IX_Submissions_UserId_ProblemId_SubmittedAt", table: "Submissions");
            migrationBuilder.DropIndex(name: "IX_Problems_Slug", table: "Problems");
            migrationBuilder.DropIndex(name: "IX_Problems_TopicId_Difficulty", table: "Problems");
            migrationBuilder.DropColumn(name: "RowVersion", table: "Submissions");
            migrationBuilder.DropColumn(name: "RowVersion", table: "PlayerStats");
            migrationBuilder.DropColumn(name: "RowVersion", table: "BattleSessions");
            migrationBuilder.DropColumn(name: "RowVersion", table: "BattleParticipants");
            migrationBuilder.AlterColumn<string>(name: "Status", table: "Submissions", type: "nvarchar(max)", nullable: false, oldClrType: typeof(string), oldType: "nvarchar(450)");
            migrationBuilder.AlterColumn<string>(name: "Slug", table: "Problems", type: "nvarchar(max)", nullable: false, oldClrType: typeof(string), oldType: "nvarchar(200)", oldMaxLength: 200);
            migrationBuilder.AlterColumn<string>(name: "Difficulty", table: "Problems", type: "nvarchar(max)", nullable: false, oldClrType: typeof(string), oldType: "nvarchar(450)");
            migrationBuilder.CreateIndex(name: "IX_Problems_TopicId", table: "Problems", column: "TopicId");
        }
    }
}

