@echo off
REM View logs from all DADM services and components

setlocal enabledelayedexpansion

REM Determine project root directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR:~0,-9%
set LOGS_DIR=%PROJECT_ROOT%\logs

REM Parse command line arguments
set TYPE=
set NAME=
set FOLLOW=false
set LINES=10
set ALL=false

:parse_args
if "%~1"=="" goto :run
if /i "%~1"=="-t" (
    set TYPE=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--type" (
    set TYPE=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-n" (
    set NAME=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--name" (
    set NAME=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-f" (
    set FOLLOW=true
    shift
    goto :parse_args
)
if /i "%~1"=="--follow" (
    set FOLLOW=true
    shift
    goto :parse_args
)
if /i "%~1"=="-l" (
    set LINES=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--lines" (
    set LINES=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-a" (
    set ALL=true
    shift
    goto :parse_args
)
if /i "%~1"=="--all" (
    set ALL=true
    shift
    goto :parse_args
)
if /i "%~1"=="-h" (
    goto :usage
)
if /i "%~1"=="--help" (
    goto :usage
)
echo Unknown option: %~1
goto :usage

:usage
echo Usage: %~nx0 [options]
echo.
echo Options:
echo   -t, --type TYPE     View logs for a specific type (services, monitors, processes)
echo   -n, --name NAME     View a specific log file by name (e.g., service_monitor)
echo   -f, --follow        Follow the log file(s) (like tail -f)
echo   -l, --lines LINES   Number of lines to show (default: 10)
echo   -a, --all           Show all lines, not just the most recent
echo   -h, --help          Display this help message
echo.
echo Examples:
echo   %~nx0                           # List all available log files
echo   %~nx0 --type services           # List service log files
echo   %~nx0 --name service_monitor    # Show service_monitor.log
echo   %~nx0 --name service_monitor -f # Follow service_monitor.log
echo.
exit /b 0

:run
REM Ensure logs directory exists
if not exist "%LOGS_DIR%" (
    echo Logs directory not found. Creating logs directory structure...
    python "%SCRIPT_DIR%setup_logs_directory.py"
)

REM If a specific log name is provided, view that log
if not "%NAME%"=="" (
    call :view_log_file "%NAME%" "%FOLLOW%" "%LINES%" "%ALL%"
) else (
    REM Otherwise, list available logs
    call :list_log_files "%TYPE%"
)
exit /b 0

:list_log_files
setlocal
set type=%~1
set target_dir=%LOGS_DIR%

if not "%type%"=="" (
    set target_dir=%LOGS_DIR%\%type%
    if not exist "!target_dir!" (
        echo Error: Log type directory '%type%' not found
        exit /b 1
    )
)

echo Available log files:
echo.

REM Find log files in the target directory and subdirectories
for /r "%target_dir%" %%f in (*.log) do (
    set "log_file=%%f"
    set "rel_path=!log_file:%LOGS_DIR%\=!"
    
    REM Get file size
    for %%A in ("!log_file!") do set "size=%%~zA bytes"
    
    REM Get last modified time
    for %%A in ("!log_file!") do set "mod_time=%%~tA"
    
    echo   !rel_path! (!size!, last modified: !mod_time!)
)
endlocal
exit /b 0

:view_log_file
setlocal
set name=%~1
set follow=%~2
set lines=%~3
set all=%~4
set log_file=

REM Find the log file
for /r "%LOGS_DIR%" %%f in (*%name%*.log) do (
    set "log_file=%%f"
    goto :found_log
)

:found_log
if "%log_file%"=="" (
    echo Error: No log file found matching '%name%'
    echo Available log files:
    call :list_log_files
    exit /b 1
)

echo Viewing log file: %log_file%
echo ----------------------------------------
echo.

REM View the log file
if "%all%"=="true" (
    type "%log_file%"
) else (
    REM Use PowerShell to get the last N lines since Windows has no built-in tail
    powershell -Command "Get-Content -Tail %lines% '%log_file%'"
)

REM If follow is enabled, keep updating
if "%follow%"=="true" (
    echo.
    echo Following log file... Press Ctrl+C to stop.
    echo.
    
    REM Use PowerShell's equivalent of tail -f
    powershell -Command "Get-Content -Tail %lines% -Wait '%log_file%'"
)

endlocal
exit /b 0