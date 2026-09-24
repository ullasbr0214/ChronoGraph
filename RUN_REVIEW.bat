@echo off
setlocal
title ChronoGraph Review

echo.
echo ==========================================
echo        CHRONOGRAPH REVIEW MODE
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python...
python --version
if errorlevel 1 (
  echo ERROR: Python is not installed or not in PATH.
  pause
  exit /b 1
)

echo [2/3] Checking backend dependencies...
python -c "import fastapi, uvicorn, pydantic_settings" >nul 2>&1
if errorlevel 1 (
  echo Installing backend dependencies...
  python -m pip install -r backend\requirements.txt
  if errorlevel 1 (
    echo ERROR: Backend dependency installation failed.
    pause
    exit /b 1
  )
)

echo [3/3] Checking frontend dependencies...
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend
  call npm ci
  if errorlevel 1 (
    echo ERROR: Frontend dependency installation failed.
    pause
    exit /b 1
  )
  cd ..
)

echo.
echo Starting backend in LOCAL EVIDENCE mode...
start "ChronoGraph Backend" cmd /k "cd /d %~dp0backend && set CHRONOGRAPH_DEMO_MODE=true && python -m uvicorn app.main:app --reload"

timeout /t 3 /nobreak >nul

echo Starting frontend...
start "ChronoGraph Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo Backend:  http://127.0.0.1:8000
echo Swagger:  http://127.0.0.1:8000/docs
echo Frontend: http://localhost:5173
echo ==========================================
echo.
echo Open: http://localhost:5173/investigation
echo.
pause
