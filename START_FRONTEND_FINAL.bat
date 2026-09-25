@echo off
setlocal
cd /d "%~dp0frontend"
echo.
echo ================================================
echo ChronoGraph Frontend
echo ================================================
echo Frontend: http://localhost:5173
echo.
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort

echo.
echo Frontend stopped. Press any key to close.
pause >nul
