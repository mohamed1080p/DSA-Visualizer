using System;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        Console.WriteLine("═══════════════════════════════════════════════════════");
        Console.WriteLine("    SQL SERVER DATABASE CONNECTION VERIFICATION");
        Console.WriteLine("═══════════════════════════════════════════════════════\n");

        var connectionString = "Server=.;Database=DSA-VisualizerDB;Trusted_Connection=true;TrustServerCertificate=true";
        
        Console.WriteLine($"Connection String: {connectionString}\n");

        // Test 1: Basic Connection
        await TestBasicConnection(connectionString);

        // Test 2: Database Existence
        await TestDatabaseExists(connectionString);

        // Test 3: Check Tables
        await TestTableCheck(connectionString);

        Console.WriteLine("\n═══════════════════════════════════════════════════════");
        Console.WriteLine("         VERIFICATION COMPLETE");
        Console.WriteLine("═══════════════════════════════════════════════════════");
    }

    static async Task TestBasicConnection(string connectionString)
    {
        Console.WriteLine("[1] Testing Basic SQL Server Connection...");
        try
        {
            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                Console.WriteLine("    ✓ Connected successfully!");
                
                var command = connection.CreateCommand();
                command.CommandText = "SELECT @@VERSION;";
                var result = await command.ExecuteScalarAsync();
                Console.WriteLine($"    Server Version: {result}\n");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"    ✗ Connection Failed: {ex.Message}\n");
        }
    }

    static async Task TestDatabaseExists(string connectionString)
    {
        Console.WriteLine("[2] Checking if Database 'DSA-VisualizerDB' Exists...");
        try
        {
            var masterConnectionString = "Server=.;Database=master;Trusted_Connection=true;TrustServerCertificate=true";
            using (var connection = new SqlConnection(masterConnectionString))
            {
                await connection.OpenAsync();
                var command = connection.CreateCommand();
                command.CommandText = "SELECT database_id FROM sys.databases WHERE name = 'DSA-VisualizerDB'";
                var result = await command.ExecuteScalarAsync();
                
                if (result != null)
                    Console.WriteLine("    ✓ Database exists!\n");
                else
                    Console.WriteLine("    ✗ Database NOT found - you need to create it\n");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"    ✗ Error checking database: {ex.Message}\n");
        }
    }

    static async Task TestTableCheck(string connectionString)
    {
        Console.WriteLine("[3] Checking Database Tables...");
        try
        {
            using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                var command = connection.CreateCommand();
                command.CommandText = @"
                    SELECT COUNT(*) FROM information_schema.TABLES 
                    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'";
                var tableCount = await command.ExecuteScalarAsync();
                
                if (tableCount != null && (int)tableCount > 0)
                {
                    Console.WriteLine($"    ✓ Found {tableCount} tables in database\n");
                }
                else
                {
                    Console.WriteLine("    ⚠ No tables found - database may need migration\n");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"    ✗ Error checking tables: {ex.Message}\n");
        }
    }
}

