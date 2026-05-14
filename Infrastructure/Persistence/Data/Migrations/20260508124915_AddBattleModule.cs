using System;
using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace Infrastructure.Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBattleModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                                        name: "BattleSessions",
                                        columns: table => new
                                        {
                                            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                                            Mode = table.Column<int>(type: "int", nullable: false),
                                            Status = table.Column<int>(type: "int", nullable: false),
                                            CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                                            StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                                            FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                                            TimeLimitSeconds = table.Column<int>(type: "int", nullable: false),
                                            ProblemsToWin = table.Column<int>(type: "int", nullable: false),
                                            WinnerUserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_BattleSessions", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_BattleSessions_Users_WinnerUserId",
                                                                            column: x => x.WinnerUserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateTable(
                                        name: "Friendships",
                                        columns: table => new
                                        {
                                            Id = table.Column<int>(type: "int", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            RequesterId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            AddresseeId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            Status = table.Column<int>(type: "int", nullable: false),
                                            CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                                            RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_Friendships", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_Friendships_Users_AddresseeId",
                                                                            column: x => x.AddresseeId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id");
                                            table.ForeignKey(
                                                                            name: "FK_Friendships_Users_RequesterId",
                                                                            column: x => x.RequesterId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateTable(
                                        name: "MatchmakingEntries",
                                        columns: table => new
                                        {
                                            Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                                            UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            RankPoints = table.Column<int>(type: "int", nullable: false),
                                            Mode = table.Column<int>(type: "int", nullable: false),
                                            QueuedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                                            Status = table.Column<int>(type: "int", nullable: false),
                                            TargetUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                                            ResultBattleSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_MatchmakingEntries", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_MatchmakingEntries_Users_UserId",
                                                                            column: x => x.UserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateTable(
                                        name: "PlayerStats",
                                        columns: table => new
                                        {
                                            UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            RankPoints = table.Column<int>(type: "int", nullable: false, defaultValue: 1000),
                                            Level = table.Column<int>(type: "int", nullable: false),
                                            WinCount = table.Column<int>(type: "int", nullable: false),
                                            LossCount = table.Column<int>(type: "int", nullable: false),
                                            DrawCount = table.Column<int>(type: "int", nullable: false),
                                            CurrentStreak = table.Column<int>(type: "int", nullable: false),
                                            BestStreak = table.Column<int>(type: "int", nullable: false),
                                            PreferredLanguage = table.Column<int>(type: "int", nullable: false)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_PlayerStats", x => x.UserId);
                                            table.ForeignKey(
                                                                            name: "FK_PlayerStats_Users_UserId",
                                                                            column: x => x.UserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                        });
            migrationBuilder.CreateTable(
                                        name: "BattleParticipants",
                                        columns: table => new
                                        {
                                            Id = table.Column<int>(type: "int", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            BattleSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                                            UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            SolvedCount = table.Column<int>(type: "int", nullable: false),
                                            RatingBefore = table.Column<int>(type: "int", nullable: false),
                                            RatingAfter = table.Column<int>(type: "int", nullable: false),
                                            RatingDelta = table.Column<int>(type: "int", nullable: false),
                                            JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_BattleParticipants", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_BattleParticipants_BattleSessions_BattleSessionId",
                                                                            column: x => x.BattleSessionId,
                                                                            principalTable: "BattleSessions",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                            table.ForeignKey(
                                                                            name: "FK_BattleParticipants_Users_UserId",
                                                                            column: x => x.UserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateTable(
                                        name: "BattleProblems",
                                        columns: table => new
                                        {
                                            Id = table.Column<int>(type: "int", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            BattleSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                                            ProblemId = table.Column<int>(type: "int", nullable: false),
                                            Order = table.Column<int>(type: "int", nullable: false)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_BattleProblems", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_BattleProblems_BattleSessions_BattleSessionId",
                                                                            column: x => x.BattleSessionId,
                                                                            principalTable: "BattleSessions",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                            table.ForeignKey(
                                                                            name: "FK_BattleProblems_Problems_ProblemId",
                                                                            column: x => x.ProblemId,
                                                                            principalTable: "Problems",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateTable(
                                        name: "BattleSubmissions",
                                        columns: table => new
                                        {
                                            Id = table.Column<long>(type: "bigint", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            BattleSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                                            UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            BattleProblemId = table.Column<int>(type: "int", nullable: false),
                                            Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            Language = table.Column<int>(type: "int", nullable: false),
                                            Verdict = table.Column<int>(type: "int", nullable: true),
                                            RuntimeMs = table.Column<long>(type: "bigint", nullable: true),
                                            MemoryKb = table.Column<long>(type: "bigint", nullable: true),
                                            SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                                            IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                                            PassedTestCases = table.Column<int>(type: "int", nullable: false),
                                            TotalTestCases = table.Column<int>(type: "int", nullable: false),
                                            BattleParticipantId = table.Column<int>(type: "int", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_BattleSubmissions", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_BattleSubmissions_BattleParticipants_BattleParticipantId",
                                                                            column: x => x.BattleParticipantId,
                                                                            principalTable: "BattleParticipants",
                                                                            principalColumn: "Id");
                                            table.ForeignKey(
                                                                            name: "FK_BattleSubmissions_BattleProblems_BattleProblemId",
                                                                            column: x => x.BattleProblemId,
                                                                            principalTable: "BattleProblems",
                                                                            principalColumn: "Id");
                                            table.ForeignKey(
                                                                            name: "FK_BattleSubmissions_BattleSessions_BattleSessionId",
                                                                            column: x => x.BattleSessionId,
                                                                            principalTable: "BattleSessions",
                                                                            principalColumn: "Id");
                                            table.ForeignKey(
                                                                            name: "FK_BattleSubmissions_Users_UserId",
                                                                            column: x => x.UserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleParticipants_BattleSessionId",
                                        table: "BattleParticipants",
                                        column: "BattleSessionId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleParticipants_UserId",
                                        table: "BattleParticipants",
                                        column: "UserId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleProblems_BattleSessionId",
                                        table: "BattleProblems",
                                        column: "BattleSessionId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleProblems_ProblemId",
                                        table: "BattleProblems",
                                        column: "ProblemId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleSessions_WinnerUserId",
                                        table: "BattleSessions",
                                        column: "WinnerUserId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleSubmissions_BattleParticipantId",
                                        table: "BattleSubmissions",
                                        column: "BattleParticipantId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleSubmissions_BattleProblemId",
                                        table: "BattleSubmissions",
                                        column: "BattleProblemId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleSubmissions_BattleSessionId",
                                        table: "BattleSubmissions",
                                        column: "BattleSessionId");
            migrationBuilder.CreateIndex(
                                        name: "IX_BattleSubmissions_UserId",
                                        table: "BattleSubmissions",
                                        column: "UserId");
            migrationBuilder.CreateIndex(
                                        name: "IX_Friendships_AddresseeId",
                                        table: "Friendships",
                                        column: "AddresseeId");
            migrationBuilder.CreateIndex(
                                        name: "IX_Friendships_RequesterId_AddresseeId",
                                        table: "Friendships",
                                        columns: new[]
                        {
"RequesterId", "AddresseeId" },
                                        unique: true);
            migrationBuilder.CreateIndex(
                                        name: "IX_MatchmakingEntries_UserId",
                                        table: "MatchmakingEntries",
                                        column: "UserId");
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                                        name: "BattleSubmissions");
            migrationBuilder.DropTable(
                                        name: "Friendships");
            migrationBuilder.DropTable(
                                        name: "MatchmakingEntries");
            migrationBuilder.DropTable(
                                        name: "PlayerStats");
            migrationBuilder.DropTable(
                                        name: "BattleParticipants");
            migrationBuilder.DropTable(
                                        name: "BattleProblems");
            migrationBuilder.DropTable(
                                        name: "BattleSessions");
        }
    }
}

