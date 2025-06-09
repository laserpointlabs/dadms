@echo off
REM DADM Service Management Script

echo === DADM Service Management ===
echo.
echo 1. Start services
echo 2. Stop services  
echo 3. Restart services
echo 4. Test services
echo 5. Monitor services
echo 6. Deploy BPMN
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto start_services
if "%choice%"=="2" goto stop_services
if "%choice%"=="3" goto restart_services
if "%choice%"=="4" goto test_services
if "%choice%"=="5" goto monitor_services
if "%choice%"=="6" goto deploy_bpmn
if "%choice%"=="7" goto exit
goto invalid_choice

:start_services
echo Starting services...
python scripts\restart_and_test_services.py
goto end

:stop_services
echo Stopping services...
powershell -Command "Get-Job | Stop-Job; Get-Job | Remove-Job; Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'python' } | Stop-Process -Force -ErrorAction SilentlyContinue"
echo Services stopped.
goto end

:restart_services
echo Restarting services...
call :stop_services
timeout /t 3 /nobreak > nul
call :start_services
goto end

:test_services
echo Running end-to-end tests...
python scripts\test_end_to_end.py
goto end

:monitor_services
echo Starting service monitor...
python scripts\monitor_service_health.py
goto end

:deploy_bpmn
echo Deploying BPMN processes...
python scripts\deploy_bpmn.py
goto end

:invalid_choice
echo Invalid choice. Please enter 1-7.
goto end

:exit
echo Goodbye!
goto end

:end
echo.
pause
