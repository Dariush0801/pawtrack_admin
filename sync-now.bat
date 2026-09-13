@echo off
title PawTrack Admin - Instant Git Sync
color 0B
echo ========================================================
echo   PawTrack Admin Instant Git Commit & Push
echo   Repository: https://github.com/Dariush0801/pawtrack_admin.git
echo ========================================================
echo.
echo [1/4] Staging modified files...
git add -A
echo.
set /p COMMIT_MSG="Enter commit message (or press ENTER for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Manual sync update: PawTrack Admin Console
echo.
echo [2/4] Committing changes...
git commit -m "%COMMIT_MSG%"
echo.
echo [3/4] Pulling remote updates with rebase (if any)...
git pull --rebase origin main
echo.
echo [4/4] Pushing to GitHub (main branch)...
git push origin main
echo.
echo ========================================================
echo   PawTrack Admin Sync Complete!
echo ========================================================
pause
