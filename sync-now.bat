@echo off
title PawTrack Admin - Instant Git Sync
color 0B
echo ========================================================
echo   PawTrack Admin Instant Git Commit & Push
echo   Repository: https://github.com/Dariush0801/pawtrack_admin.git
echo ========================================================
echo.
echo [1/3] Staging modified files...
git add -A
echo.
set /p COMMIT_MSG="Enter commit message (or press ENTER for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Manual sync update: PawTrack Admin Console
echo.
echo [2/3] Committing changes...
git commit -m "%COMMIT_MSG%"
echo.
echo [3/3] Pushing to GitHub (main branch)...
git push origin main
echo.
echo ========================================================
echo   PawTrack Admin Sync Complete!
echo ========================================================
pause
