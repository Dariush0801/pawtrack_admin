@echo off
title PawTrack Admin Console Server (Port 8080)
cd /d "%~dp0"

echo =======================================================
echo   PawTrack Municipal Admin Console - Auto Startup
echo =======================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ to run the server.
    echo Opening local HTML file in your browser directly...
    start "" index.html
    pause
    exit /b 1
)

echo [*] Starting Node.js backend server on http://localhost:8080 ...
start "" http://localhost:8080

node server.js
if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Node server exited. Opening local HTML fallback...
    start "" index.html
)
pause
