using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixingDataTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<long>(
                name: "RuntimeMs",
                table: "SubmissionTestResults",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<long>(
                name: "MemoryKb",
                table: "SubmissionTestResults",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MemoryKb",
                table: "SubmissionTestResults");

            migrationBuilder.AlterColumn<int>(
                name: "RuntimeMs",
                table: "SubmissionTestResults",
                type: "int",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "bigint");
        }
    }
}
