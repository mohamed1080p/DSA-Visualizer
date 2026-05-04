#r "nuget: Microsoft.Data.SqlClient, 5.1.5"
using System;
using Microsoft.Data.SqlClient;

var connStr = "Server=.;Database=DSA-VisualizerDB;Trusted_Connection=true;TrustServerCertificate=true";
try {
    using var conn = new SqlConnection(connStr);
    conn.Open();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = "SELECT COUNT(*) FROM UserLearningPathProgresses";
    var count = cmd.ExecuteScalar();
    Console.WriteLine("SQL Server progress count: " + count);
    
    cmd.CommandText = "SELECT TOP 1 CurrentLevelOrder FROM UserLearningPathProgresses ORDER BY Id DESC";
    var order = cmd.ExecuteScalar();
    Console.WriteLine("Top progress Level Order: " + order);
} catch (Exception ex) {
    Console.WriteLine(ex.Message);
}
