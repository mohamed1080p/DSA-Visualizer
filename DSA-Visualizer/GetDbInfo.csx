#r "nuget: Microsoft.Data.Sqlite, 8.0.0"
using Microsoft.Data.Sqlite;
using System;
using System.IO;

var dbPath = @"d:\Dev\Projects\dsa_final\DSA-Visualizer\DSA-Visualizer.db";
var conn = new SqliteConnection($"Data Source={dbPath}");
conn.Open();

var cmd = conn.CreateCommand();
cmd.CommandText = "SELECT Id, UserId, CurrentLevelOrder FROM UserLearningPathProgresses";
using (var reader = cmd.ExecuteReader()) {
    while (reader.Read()) {
        Console.WriteLine($"Progress ID: {reader.GetInt32(0)}, UserID: {reader.GetString(1)}, Level: {reader.GetInt32(2)}");
    }
}
