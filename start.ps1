# Transaction System - Startup Script
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Transaction System - Starting..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\Admin\OneDrive\Desktop\task\backend"

Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\Admin\OneDrive\Desktop\task\backend'; node server.js"

Start-Sleep -Seconds 3

Write-Host "Opening frontend..." -ForegroundColor Yellow
Start-Process "c:\Users\Admin\OneDrive\Desktop\task\frontend\index.html"

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " System Started!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host " Backend: http://localhost:3000" -ForegroundColor White
Write-Host " Frontend: Opened in browser" -ForegroundColor White
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
