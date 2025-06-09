@echo off
REM Monitor Service Control Script
REM This script helps start and stop the DADM service monitor

IF "%1"=="" (
    GOTO usage
) ELSE IF "%1"=="start" (
    GOTO start
) ELSE IF "%1"=="stop" (
    GOTO stop
) ELSE IF "%1"=="status" (
    GOTO status
) ELSE (
    GOTO usage
)

:usage
echo Usage: monitor.bat [start|stop|status] [options]
echo.
echo Commands:
echo   start       Start the monitor service
echo   stop        Stop the monitor service
echo   status      Check if the monitor service is running
echo.
echo Options (for start):
echo   --interval=N    Check interval in seconds (default: 60)
echo   --service=X/Y   Monitor specific service type/name (can be used multiple times)
echo.
echo Examples:
echo   monitor.bat start
echo   monitor.bat start --interval=30
echo   monitor.bat start --service=assistant/openai --service=test/echo
echo   monitor.bat stop
echo   monitor.bat status
GOTO end

:start
echo Starting DADM service monitor...

REM Parse options
SET interval=60
SET services=

:parse_start_args
IF "%2"=="" GOTO run_start
SET arg=%2
IF "%arg:~0,11%"=="--interval=" (
    SET interval=%arg:~11%
    SHIFT
    GOTO parse_start_args
)
IF "%arg:~0,10%"=="--service=" (
    SET services=%services% %arg:~10%
    SHIFT
    GOTO parse_start_args
)
ECHO Unknown option: %arg%
SHIFT
GOTO parse_start_args

:run_start
REM Ensure logs directory exists
SET logs_dir=%~dp0..\logs\monitors
IF NOT EXIST "%logs_dir%" mkdir "%logs_dir%"

IF NOT "%services%"=="" (
    echo Starting monitor for specific services: %services%
    start /B pythonw scripts\service_monitor.py --interval %interval% --services %services% > nul 2>&1
) ELSE (
    echo Starting monitor with %interval% second interval for all services
    start /B pythonw scripts\service_monitor.py --interval %interval% > nul 2>&1
)
echo Monitor service started in background. Check %logs_dir%\service_monitor.log for activity.
GOTO end

:stop
echo Stopping DADM service monitor...
FOR /F "tokens=2" %%i IN ('tasklist ^| findstr "python.*service_monitor"') DO (
    echo Stopping process %%i
    taskkill /PID %%i /F
)
echo Monitor service stopped.
GOTO end

:status
echo Checking monitor service status...
SET found=0
FOR /F "tokens=2" %%i IN ('tasklist ^| findstr "python.*service_monitor"') DO (
    echo Monitor service is running (PID: %%i)
    SET found=1
)
IF %found%==0 (
    echo Monitor service is not running.
)
GOTO end

:end