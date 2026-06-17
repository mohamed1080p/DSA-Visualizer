@echo off
set "ExternalAuth__Google__ClientId=dev"
set "ExternalAuth__Google__ClientSecret=dev"
set "ExternalAuth__GitHub__ClientId=dev"
set "ExternalAuth__GitHub__ClientSecret=dev"
cd /d "%~dp0"
dotnet run --project D:\Dev\Projects\dsa_final\DSA-Visualizer\DSA-Visualizer.csproj
