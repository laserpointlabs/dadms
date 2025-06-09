# Test Consul Integration for OpenAI Service
# This script verifies the Consul integration setup and runs tests

# Set colors for output
$GREEN = [System.ConsoleColor]::Green
$RED = [System.ConsoleColor]::Red
$YELLOW = [System.ConsoleColor]::Yellow
$CYAN = [System.ConsoleColor]::Cyan

# Make sure we have the right environment
Write-Host "Loading environment variables..." -ForegroundColor $CYAN
. "$PSScriptRoot\setup_environment.ps1"

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor $CYAN
$pythonVersion = python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found. Please install Python 3.8 or higher." -ForegroundColor $RED
    exit 1
}
Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor $GREEN

# Create temporary .venv folder if needed
if (-not (Test-Path '.\.venv')) {
    Write-Host "Creating virtual environment..." -ForegroundColor $CYAN
    python -m venv .\.venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment." -ForegroundColor $RED
        exit 1
    }
    Write-Host "✅ Virtual environment created." -ForegroundColor $GREEN
}

# Activate the virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor $CYAN
try {
    . .\.venv\Scripts\Activate.ps1
    Write-Host "✅ Virtual environment activated." -ForegroundColor $GREEN
}
catch {
    Write-Host "❌ Failed to activate virtual environment." -ForegroundColor $RED
    exit 1
}

# Install dependencies if needed
Write-Host "Installing dependencies..." -ForegroundColor $CYAN
pip install -q -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor $RED
    exit 1
}
Write-Host "✅ Dependencies installed." -ForegroundColor $GREEN

# Verify environment variables
Write-Host "Verifying environment variables..." -ForegroundColor $CYAN
python $PSScriptRoot\verify_environment.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Environment variables verification failed." -ForegroundColor $RED
    exit 1
}

# Test Consul integration
Write-Host "Testing Consul integration..." -ForegroundColor $CYAN
Write-Host "1. Testing if Consul is available..." -ForegroundColor $CYAN
python $PSScriptRoot\test_consul_integration.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Consul availability test failed." -ForegroundColor $RED
    Write-Host "   Make sure Consul is running locally or correctly configured." -ForegroundColor $YELLOW
    Write-Host "   You can start Consul with Docker: docker run -d --name consul -p 8500:8500 consul:1.15" -ForegroundColor $YELLOW
    exit 1
}

Write-Host "2. Testing service registration with Consul..." -ForegroundColor $CYAN
python $PSScriptRoot\test_consul_registration.py --wait 5
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Consul service registration test failed." -ForegroundColor $RED
    exit 1
}

# All tests passed
Write-Host "✅ All Consul integration tests passed!" -ForegroundColor $GREEN
Write-Host "You can now run the OpenAI service with Consul integration enabled."
