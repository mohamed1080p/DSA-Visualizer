@echo off
title DSA Visualizer - Full Stack Launcher
color 0B

echo ===================================================================
echo               DSA Visualizer - Full Stack Launcher
echo ===================================================================
echo.
echo Starting Backend API Server (Port 5258) in a new window...
set ASPNETCORE_ENVIRONMENT=Development
start "DSA Visualizer Backend" cmd /c "dotnet run --project DSA-Visualizer --urls http://127.0.0.1:5258"

echo Starting Frontend client (Port 5173) in a new window...
start "DSA Visualizer Frontend" cmd /c "cd client && npm run dev"

echo.
echo ===================================================================
echo Servers are launching!
echo  - Backend: http://127.0.0.1:5258
echo  - Frontend: http://localhost:5173/
echo.
echo You can open http://localhost:5173/ in your browser now.
echo Keep this window and the newly opened windows open while using.
echo ===================================================================
timeout /t 5
