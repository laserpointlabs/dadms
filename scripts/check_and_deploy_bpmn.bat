@echo off
REM Check and fix BPMN files before deployment

setlocal enabledelayedexpansion

REM Determine project root directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR:~0,-9%
set MODELS_DIR=%PROJECT_ROOT%\camunda_models

REM Colors for console output using ANSI escape codes (works in newer Windows versions)
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set BLUE=[94m
set NC=[0m

echo %BLUE%BPMN Deployment Helper%NC%
echo This script helps validate, fix, and deploy BPMN models.
echo.

REM Parse command-line options
set ALL=false
set MODEL=
set SERVER=http://localhost:8080
set SKIP_VALIDATION=false
set SKIP_FIX=false
set SKIP_DEPLOY=false

:parse_args
if "%~1"=="" goto check_args
if /i "%~1"=="-a" (
    set ALL=true
    shift
    goto parse_args
)
if /i "%~1"=="--all" (
    set ALL=true
    shift
    goto parse_args
)
if /i "%~1"=="-m" (
    set MODEL=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--model" (
    set MODEL=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-s" (
    set SERVER=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--server" (
    set SERVER=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--skip-validation" (
    set SKIP_VALIDATION=true
    shift
    goto parse_args
)
if /i "%~1"=="--skip-fix" (
    set SKIP_FIX=true
    shift
    goto parse_args
)
if /i "%~1"=="--skip-deploy" (
    set SKIP_DEPLOY=true
    shift
    goto parse_args
)
if /i "%~1"=="-h" (
    goto usage
)
if /i "%~1"=="--help" (
    goto usage
)
echo %RED%Unknown option: %~1%NC%
goto usage

:usage
echo Usage: %~nx0 [options]
echo.
echo Options:
echo   -a, --all                Deploy all BPMN models
echo   -m, --model FILENAME     Deploy a specific BPMN model
echo   -s, --server URL         Camunda server URL (default: http://localhost:8080)
echo   --skip-validation        Skip validation step
echo   --skip-fix               Skip automatic fixing step
echo   --skip-deploy            Skip deployment step (validate and fix only)
echo   -h, --help               Display this help message
exit /b 1

:check_args
REM Check required arguments
if "%ALL%"=="false" if "%MODEL%"=="" (
    echo %RED%Error: Either --all or --model must be specified%NC%
    goto usage
)

REM Step 1: Validate
if "%SKIP_VALIDATION%"=="false" (
    echo %BLUE%Step 1: Validating BPMN models%NC%
    
    if "%ALL%"=="true" (
        python "%SCRIPT_DIR%validate_bpmn.py" --all
    ) else (
        set MODEL_PATH=%MODELS_DIR%\%MODEL%
        if not "%MODEL:~-5%"==".bpmn" (
            set MODEL_PATH=!MODEL_PATH!.bpmn
        )
        python "%SCRIPT_DIR%validate_bpmn.py" --model "!MODEL_PATH!"
    )
    
    REM Check validation result
    set VALIDATION_RESULT=%ERRORLEVEL%
    
    if !VALIDATION_RESULT! NEQ 0 (
        echo %YELLOW%Validation found issues. Attempting to fix...%NC%
    ) else (
        echo %GREEN%Validation successful!%NC%
    )
) else (
    echo %YELLOW%Skipping validation step%NC%
)

REM Step 2: Fix if needed
if "%SKIP_FIX%"=="false" (
    echo %BLUE%Step 2: Fixing BPMN models if needed%NC%
    
    if "%ALL%"=="true" (
        python "%SCRIPT_DIR%fix_bpmn.py" --all
    ) else (
        set MODEL_PATH=%MODELS_DIR%\%MODEL%
        if not "%MODEL:~-5%"==".bpmn" (
            set MODEL_PATH=!MODEL_PATH!.bpmn
        )
        python "%SCRIPT_DIR%fix_bpmn.py" --model "!MODEL_PATH!"
    )
) else (
    echo %YELLOW%Skipping fix step%NC%
)

REM Step 3: Deploy
if "%SKIP_DEPLOY%"=="false" (
    echo %BLUE%Step 3: Deploying BPMN models%NC%
    
    set DEPLOY_CMD=python "%SCRIPT_DIR%deploy_bpmn.py" -s "%SERVER%"
    
    if "%ALL%"=="true" (
        set DEPLOY_CMD=!DEPLOY_CMD! --all
    ) else (
        set DEPLOY_CMD=!DEPLOY_CMD! --model "%MODEL%"
    )
    
    echo Running: !DEPLOY_CMD!
    !DEPLOY_CMD!
    
    set DEPLOY_RESULT=%ERRORLEVEL%
    
    if !DEPLOY_RESULT! EQU 0 (
        echo %GREEN%Deployment completed successfully!%NC%
    ) else (
        echo %RED%Deployment encountered errors.%NC%
        exit /b !DEPLOY_RESULT!
    )
) else (
    echo %YELLOW%Skipping deployment step%NC%
)

echo %GREEN%All steps completed!%NC%