@echo off
setlocal
title Git Auto Backup
cd /d "%~dp0"

echo ============================================
echo   Git Auto Backup and Push
echo ============================================

echo.
echo [1/4] Staging all changes (password files excluded by .gitignore)...
git add -A
if errorlevel 1 goto :fail

echo.
echo [2/4] Checking for new changes...
git diff --cached --quiet >nul 2>&1
if not errorlevel 1 (
    echo       Nothing to back up. Skipping.
    echo.
    if /i not "%~1"=="/q" pause
    exit /b 0
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%i"

echo.
echo [3/4] Committing...
git commit -m "chore: auto-backup %TS%"
if errorlevel 1 goto :fail

echo.
echo [4/4] Syncing and pushing to GitHub...
git pull --rebase origin main >nul 2>&1
git push origin main
if errorlevel 1 goto :fail

echo.
echo ============================================
echo   Backup OK: %TS%
echo ============================================
echo.
if /i not "%~1"=="/q" pause
exit /b 0

:fail
echo.
echo [ERROR] Backup failed. Check network or git config.
echo Tip: if push to GitHub fails, just re-run this script later.
echo.
if /i not "%~1"=="/q" pause
exit /b 1
