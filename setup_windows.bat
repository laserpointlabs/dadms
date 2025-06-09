@echo off
REM Windows test script for DADM setup
echo Testing DADM setup on Windows...
echo.

REM Check Python version
python --version
if %ERRORLEVEL% neq 0 (
    echo Error: Python not found
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
if exist .venv (
    echo Removing existing virtual environment...
    rmdir /s /q .venv
)
python -m venv .venv

REM Activate virtual environment (Windows style)
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Install project
echo Installing project in development mode...
pip install -e .

REM Test installation
echo Testing installation...
python -c "import src; import scripts; import config; print('All modules imported successfully!')"

echo.
echo Setup completed successfully!
echo To use the project:
echo   .venv\Scripts\activate.bat
echo   dadm --help
echo   dadm-deploy-bpmn --help
