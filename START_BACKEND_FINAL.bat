@echo off
setlocal
cd /d "%~dp0backend"
set "CHRONOGRAPH_DEMO_MODE=true"
echo.
echo ================================================
echo ChronoGraph Backend - Local Evidence Mode
echo ================================================
echo Backend: http://127.0.0.1:8000
echo Swagger: http://127.0.0.1:8000/docs
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

echo.
echo Backend stopped. Press any key to close.
pause >nul
