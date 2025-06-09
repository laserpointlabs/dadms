@echo off
REM DADM Unbuffered Runner for Windows
REM This batch file runs DADM with unbuffered output for proper file redirection

REM Set unbuffered output
set PYTHONUNBUFFERED=1
set PYTHONIOENCODING=utf-8

REM Run DADM with all passed arguments
python -u -m src.app %*
