@echo off
REM Clean up log files and move them to the logs directory

echo Cleaning up log files...

REM Ensure logs directory structure exists
python scripts\setup_logs_directory.py

REM Move existing log files to the logs directory
python scripts\cleanup_logs.py

echo Done cleaning up log files. All logs are now in the logs directory.