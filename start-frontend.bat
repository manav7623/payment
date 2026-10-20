@echo off
title MD Expense Tracker - Frontend Web App (Port 5173)
color 0B
cls

echo ==========================================================
echo        MD EXPENSE TRACKER - FRONTEND CLIENT
echo ==========================================================
echo.
echo [1/2] Checking frontend dependencies...
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo Installing frontend packages, please wait...
    call npm install
)

echo.
echo [2/2] Starting Frontend Vite Server on http://localhost:5173...
echo.
echo ==========================================================
echo   Frontend is running at: http://localhost:5173
echo   Press Ctrl + C anytime to stop the frontend.
echo ==========================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend stopped with code %errorlevel%.
    pause
)
