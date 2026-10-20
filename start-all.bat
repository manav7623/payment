@echo off
title MD Expense Tracker - One-Click Launcher
color 0E
cls

echo ==========================================================
echo        MD EXPENSE TRACKER - ONE-CLICK LAUNCHER
echo ==========================================================
echo.
echo Launching Backend and Frontend in separate windows...
echo.

REM 1. Start Backend in a separate window
echo [1/2] Starting Backend Server (Port 5000)...
start "MD Backend Server (Port 5000)" cmd /k "call \"%~dp0start-backend.bat\""

REM Wait 2 seconds for backend to start up
timeout /t 2 /nobreak >nul

REM 2. Start Frontend in a separate window
echo [2/2] Starting Frontend Client (Port 5173)...
start "MD Frontend Client (Port 5173)" cmd /k "call \"%~dp0start-frontend.bat\""

REM Wait 2 seconds then open in browser
timeout /t 2 /nobreak >nul
echo.
echo Opening MD Expense Tracker in your browser (http://localhost:5173)...
start http://localhost:5173

echo.
echo ==========================================================
echo   Both Frontend and Backend are now running!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo ==========================================================
echo.
echo You can close this window now.
timeout /t 5 >nul
exit
