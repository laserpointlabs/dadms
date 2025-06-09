# Setup script for DADM project
# This script helps with setting up the development environment

# Define environment variables and versions
$PYTHON_VERSION = "3.10"
$ENV_NAME = "dadm"

Write-Host "DADM Project Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python detected: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python not found. Please install Python $PYTHON_VERSION or higher." -ForegroundColor Red
    exit 1
}

# Check if conda is installed
$condaInstalled = $false
try {
    conda --version
    $condaInstalled = $true
    Write-Host "Conda detected, will use conda environment." -ForegroundColor Green
} catch {
    Write-Host "Conda not detected, will use venv instead." -ForegroundColor Yellow
}

# Create virtual environment
if ($condaInstalled) {
    Write-Host "`nCreating conda environment '$ENV_NAME'..." -ForegroundColor Cyan
    conda create -n $ENV_NAME python=$PYTHON_VERSION -y
    conda activate $ENV_NAME
} else {
    Write-Host "`nCreating venv environment..." -ForegroundColor Cyan
    python -m venv .venv
    . .\.venv\Scripts\Activate.ps1
}

# Upgrade pip
Write-Host "`nUpgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

# Install project dependencies
Write-Host "`nInstalling project dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

# Install project in development mode
Write-Host "`nInstalling project in development mode..." -ForegroundColor Cyan
pip install -e .

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Cyan
python -c "import src; import scripts; import config; print('All modules imported successfully!')"

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To use the project, run:" -ForegroundColor Yellow
if ($condaInstalled) {
    Write-Host "    conda activate $ENV_NAME" -ForegroundColor White
} else {
    Write-Host "    .\.venv\Scripts\Activate.ps1" -ForegroundColor White
}
Write-Host "    dadm --help" -ForegroundColor White
Write-Host "    dadm-deploy-bpmn --help" -ForegroundColor White
Write-Host ""
