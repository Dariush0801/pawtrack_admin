@echo off
title PawTrack Admin Git Auto-Sync Watcher
color 0B
echo ========================================================
echo   PawTrack Admin Git Auto-Commit & Auto-Push Watcher
echo   Repository: https://github.com/Dariush0801/pawtrack_admin.git
echo ========================================================
echo.
echo Starting file watcher... Save any file to auto-commit and push.
echo Press Ctrl+C anytime to stop.
echo.
node scripts/auto-sync.js
pause
