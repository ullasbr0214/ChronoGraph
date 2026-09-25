@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
title ChronoGraph - Final Demo
cd /d "%ROOT%"

echo.
echo ============================================================
echo                 CHRONOGRAPH FINAL DEMO
echo              LOCAL EVIDENCE / OFFLINE SAFE
echo ============================================================
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python is not installed or not in PATH.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js/npm is not installed or not in PATH.
  pause
  exit /b 1
)

python -c "import fastapi,uvicorn,pydantic_settings" >nul 2>&1
if errorlevel 1 (
  echo Installing minimal backend dependencies...
  python -m pip install -r "%ROOT%backend\requirements.txt"
  if errorlevel 1 (
    echo ERROR: Backend dependency installation failed.
    pause
    exit /b 1
  )
)

if not exist "%ROOT%frontend\node_modules" (
  echo Installing frontend dependencies...
  pushd "%ROOT%frontend"
  call npm ci
  if errorlevel 1 (
    popd
    echo ERROR: Frontend dependency installation failed.
    pause
    exit /b 1
  )
  popd
)

rem Stop only processes currently listening on the two ChronoGraph demo ports.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%P >nul 2>&1

echo Starting FastAPI backend...
start "ChronoGraph Backend" cmd /k call "%ROOT%START_BACKEND_FINAL.bat"

timeout /t 3 /nobreak >nul

echo Starting React frontend...
start "ChronoGraph Frontend" cmd /k call "%ROOT%START_FRONTEND_FINAL.bat"

timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo Backend:       http://127.0.0.1:8000
echo Swagger:       http://127.0.0.1:8000/docs
echo Frontend:      http://localhost:5173
echo Investigation: http://localhost:5173/investigation
echo ============================================================
echo.
echo Keep both terminal windows open during the demo.
echo Neo4j is NOT required for the final local review.
echo.
start "" "http://localhost:5173/investigation"
pause
