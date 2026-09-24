@echo off
start "ChronoGraph Backend" cmd /k "cd /d %~dp0backend && set CHRONOGRAPH_DEMO_MODE=true && python -m uvicorn app.main:app --reload"
timeout /t 2 /nobreak >nul
start "ChronoGraph Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
