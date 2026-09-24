@echo off
cd /d "%~dp0backend"
echo Starting ChronoGraph FastAPI backend...
python -m uvicorn app.main:app --reload
pause
