@echo off
title MD Expense Tracker - Backend Server (Port 5000)
color 0A
cls

echo ==========================================================
echo        MD EXPENSE TRACKER - BACKEND SERVER
echo ==========================================================
echo.
echo [1/3] Checking MySQL Database connection...

REM Try starting MySQL from XAMPP if xampp exists and port 3306 is not yet listening
netstat -ano | findstr ":3306" >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\xampp\mysql_start.bat" (
        echo MySQL is not running. Starting MySQL from C:\xampp...
        start "" /b cmd /c "C:\xampp\mysql_start.bat" >nul 2>&1
        timeout /t 3 /nobreak >nul
    ) else (
        echo [NOTE] Please make sure MySQL/XAMPP is running on port 3306.
    )
) else (
    echo [OK] MySQL is active on port 3306.
)

echo.
echo [2/3] Checking backend dependencies...
cd /d "%~dp0backend"
if not exist "node_modules\" (
    echo Installing backend packages, please wait...
    call npm install
)

echo.
echo [3/3] Starting Backend Server on http://localhost:5000...
echo.
echo ==========================================================
echo   Backend is running at: http://localhost:5000
echo   Press Ctrl + C anytime to stop the backend.
echo ==========================================================
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend crashed or stopped with code %errorlevel%.
    pause
)
