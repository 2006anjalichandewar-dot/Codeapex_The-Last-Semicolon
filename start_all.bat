@echo off
setlocal EnableDelayedExpansion
cd /d %~dp0

REM Pick free ports (use higher defaults to avoid common conflicts)
call :pickPort 9100 BACKEND_PORT
call :pickPort 3100 FRONTEND_PORT

REM Fallbacks in case port detection fails
if not defined BACKEND_PORT set "BACKEND_PORT=9100"
if not defined FRONTEND_PORT set "FRONTEND_PORT=3100"

REM Ensure frontend env points to backend
set "API_URL=http://127.0.0.1:%BACKEND_PORT%"
echo NEXT_PUBLIC_API_URL=%API_URL%> "%~dp0frontend2\.env"

REM Start Docker services (Postgres)
start "docker" cmd /k "docker compose -f docker-compose.postgres.yml up -d"

REM Wait briefly for Postgres to accept connections (avoids backend crash)
call :waitPort 5432 15

REM Apply DB migration for dynamic thresholds
python -m app.scripts.migrate_threshold

REM Start backend
start "backend" cmd /k "cd /d %~dp0 && python -m uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT%"

REM Start frontend (frontend2)
call :waitPort %BACKEND_PORT% 20
if errorlevel 1 (
  echo Backend did not start on port %BACKEND_PORT%. Check the backend window for errors.
  goto :eof
)

REM Start frontend (frontend2)
if not exist "%~dp0frontend2\node_modules" (
  start "frontend" cmd /k "cd /d %~dp0frontend2 && npm install && npm run dev -- -p %FRONTEND_PORT%"
) else (
  start "frontend" cmd /k "cd /d %~dp0frontend2 && npm run dev -- -p %FRONTEND_PORT%"
)

echo Backend: %API_URL%
echo Frontend: http://localhost:%FRONTEND_PORT%

endlocal
goto :eof

:pickPort
set port=%1
:checkPort
for /f "tokens=*" %%A in ('netstat -ano ^| findstr /R /C:":%port% .*LISTENING"') do set busy=1
if defined busy (
  set busy=
  set /a port+=1
  goto checkPort
)
set "%2=%port%"
exit /b

:waitPort
set port=%1
set retries=%2
for /l %%i in (1,1,%retries%) do (
  for /f "tokens=*" %%A in ('netstat -ano ^| findstr /R /C:":%port% .*LISTENING"') do exit /b 0
  timeout /t 1 /nobreak >nul
)
exit /b 1
