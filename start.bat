@echo off
echo ====================================
echo  Transaction System - Starting...
echo ====================================
echo.

cd backend
echo Starting backend server...
start "Transaction Backend" cmd /k "node server.js"

timeout /t 3 /nobreak > nul

echo Opening frontend...
start "" "..\frontend\index.html"

echo.
echo ====================================
echo  System Started!
echo ====================================
echo  Backend: http://localhost:3000
echo  Frontend: Opened in browser
echo ====================================
echo.
pause
