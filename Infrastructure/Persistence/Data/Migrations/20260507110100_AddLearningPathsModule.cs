using System;
using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace Infrastructure.Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningPathsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                                        name: "AspNetUserRoles");
            migrationBuilder.DropTable(
                                        name: "AspNetUserTokens");
            migrationBuilder.CreateTable(
                                        name: "LearningPaths",
                                        columns: table => new
                                        {
                                            Id = table.Column<int>(type: "int", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            Slug = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            Icon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            Order = table.Column<int>(type: "int", nullable: false)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_LearningPaths", x => x.Id);
                                        });
            migrationBuilder.CreateTable(
                                        name: "LearningPathLevels",
                                        columns: table => new
                                        {
                                            Id = table.Column<int>(type: "int", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            Order = table.Column<int>(type: "int", nullable: false),
                                            LearningPathId = table.Column<int>(type: "int", nullable: false),
                                            ProblemId = table.Column<int>(type: "int", nullable: true),
                                            TopicId = table.Column<int>(type: "int", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_LearningPathLevels", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_LearningPathLevels_LearningPaths_LearningPathId",
                                                                            column: x => x.LearningPathId,
                                                                            principalTable: "LearningPaths",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                            table.ForeignKey(
                                                                            name: "FK_LearningPathLevels_Problems_ProblemId",
                                                                            column: x => x.ProblemId,
                                                                            principalTable: "Problems",
                                                                            principalColumn: "Id");
                                            table.ForeignKey(
                                                                            name: "FK_LearningPathLevels_Topics_TopicId",
                                                                            column: x => x.TopicId,
                                                                            principalTable: "Topics",
                                                                            principalColumn: "Id");
                                        });
            migrationBuilder.CreateTable(
                                        name: "UserLearningPathProgresses",
                                        columns: table => new
                                        {
                                            Id = table.Column<int>(type: "int", nullable: false)
                                                .Annotation("SqlServer:Identity", "1, 1"),
                                            UserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                                            LearningPathId = table.Column<int>(type: "int", nullable: false),
                                            CurrentLevelOrder = table.Column<int>(type: "int", nullable: false),
                                            IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                                            StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                                            CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_UserLearningPathProgresses", x => x.Id);
                                            table.ForeignKey(
                                                                            name: "FK_UserLearningPathProgresses_LearningPaths_LearningPathId",
                                                                            column: x => x.LearningPathId,
                                                                            principalTable: "LearningPaths",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                        });
            migrationBuilder.CreateIndex(
                                        name: "IX_LearningPathLevels_LearningPathId",
                                        table: "LearningPathLevels",
                                        column: "LearningPathId");
            migrationBuilder.CreateIndex(
                                        name: "IX_LearningPathLevels_ProblemId",
                                        table: "LearningPathLevels",
                                        column: "ProblemId");
            migrationBuilder.CreateIndex(
                                        name: "IX_LearningPathLevels_TopicId",
                                        table: "LearningPathLevels",
                                        column: "TopicId");
            migrationBuilder.CreateIndex(
                                        name: "IX_UserLearningPathProgresses_LearningPathId",
                                        table: "UserLearningPathProgresses",
                                        column: "LearningPathId");
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                                        name: "LearningPathLevels");
            migrationBuilder.DropTable(
                                        name: "UserLearningPathProgresses");
            migrationBuilder.DropTable(
                                        name: "LearningPaths");
            migrationBuilder.CreateTable(
                                        name: "AspNetUserRoles",
                                        columns: table => new
                                        {
                                            UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_AspNetUserRoles", x => new
                                            {
                                                x.UserId,
                                                x.RoleId
                                            });
                                            table.ForeignKey(
                                                                            name: "FK_AspNetUserRoles_Roles_RoleId",
                                                                            column: x => x.RoleId,
                                                                            principalTable: "Roles",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                            table.ForeignKey(
                                                                            name: "FK_AspNetUserRoles_Users_UserId",
                                                                            column: x => x.UserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                        });
            migrationBuilder.CreateTable(
                                        name: "AspNetUserTokens",
                                        columns: table => new
                                        {
                                            UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                                            Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                                        },
                                        constraints: table =>
                                        {
                                            table.PrimaryKey("PK_AspNetUserTokens", x => new
                                            {
                                                x.UserId,
                                                x.LoginProvider,
                                                x.Name
                                            });
                                            table.ForeignKey(
                                                                            name: "FK_AspNetUserTokens_Users_UserId",
                                                                            column: x => x.UserId,
                                                                            principalTable: "Users",
                                                                            principalColumn: "Id",
                                                                            onDelete: ReferentialAction.Cascade);
                                        });
            migrationBuilder.CreateIndex(
                                        name: "IX_AspNetUserRoles_RoleId",
                                        table: "AspNetUserRoles",
                                        column: "RoleId");
        }
    }
}

