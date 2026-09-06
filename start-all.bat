@echo off
title PawTrack Full System Launcher (Admin + Owner)
cd /d "%~dp0"

echo =======================================================
echo   PawTrack Ecosystem Launcher (Dual Server + Live Sync)
echo =======================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [*] Starting Pet Owner Portal (Port 3000)...
start "PawTrack Owner Server (Port 3000)" cmd /c "cd /d \"%~dp0..\PawTrack\" && node server.js"

echo [*] Starting Municipal Admin Console (Port 8080)...
start "PawTrack Admin Server (Port 8080)" cmd /c "cd /d \"%~dp0\" && node server.js"

echo [*] Waiting for services to initialize...
timeout /t 2 /nobreak >nul

echo [*] Opening Pet Owner Portal in default browser...
start "" http://localhost:3000

echo [*] Opening Municipal Admin Console in default browser...
start "" http://localhost:8080

echo.
echo =======================================================
echo   PawTrack Ecosystem is LIVE & SYNCHRONIZED!
echo   - Owner Portal: http://localhost:3000
echo   - Admin Console: http://localhost:8080
echo   - Shared DB: %~dp0..\pawtrack-shared-db.json
echo =======================================================
echo.
echo Press any key to exit this launcher window (servers remain running)...
pause >nul
