@echo off
title Billing System Launcher
echo ===================================================
echo             BILLING SYSTEM LAUNCHER
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/ before running this.
    echo.
    pause
    exit /b
)

:: Check and install backend dependencies if missing
if not exist "backend\node_modules\" (
    echo [INFO] Backend node_modules not found. Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b
    )
    cd ..
)

:: Check and install frontend dependencies if missing
if not exist "frontend\node_modules\" (
    echo [INFO] Frontend node_modules not found. Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b
    )
    cd ..
)

:: Start the backend server in a separate background window
echo [INFO] Starting Backend Server...
start "Billing System Backend" cmd /k "cd backend && node src/index.js"

:: Start the frontend development server in a separate background window
echo [INFO] Starting Frontend Server...
start "Billing System Frontend" cmd /k "cd frontend && npm run dev"

:: Wait a few seconds for the servers to initialize
echo [INFO] Waiting for servers to initialize...
timeout /t 5 >nul

:: Open the browser to the frontend local URL
echo [INFO] Opening the billing application...
start http://localhost:5173

echo.
echo ===================================================
echo App launched! 
echo Keep the backend and frontend command windows open.
echo You can close this launcher window now.
echo ===================================================
echo.
pause
