#!/bin/bash
# Setup script for DADM project - Linux/Codex optimized version
# This script sets up the development environment using venv (no conda)

# Define environment variables and versions
PYTHON_VERSION="3.10"
ENV_NAME="dadm"

echo -e "\033[1;36mDADM Project Setup Script (Linux/Codex)\033[0m"
echo -e "\033[1;36m=========================================\033[0m"
echo ""

# Check if Python is installed and find the best version
PYTHON_CMD=""
if command -v python3.10 &>/dev/null; then
    PYTHON_CMD="python3.10"
elif command -v python3.11 &>/dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3.12 &>/dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3.13 &>/dev/null; then
    PYTHON_CMD="python3.13"
elif command -v python3 &>/dev/null; then
    # Check if python3 is 3.10+
    python_version_check=$(python3 -c "import sys; print(sys.version_info >= (3, 10))" 2>/dev/null)
    if [ "$python_version_check" = "True" ]; then
        PYTHON_CMD="python3"
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo -e "\033[0;31mError: Python 3.10+ not found. Please install Python $PYTHON_VERSION or higher.\033[0m"
    echo -e "\033[0;33mTried: python3.10, python3.11, python3.12, python3.13, python3\033[0m"
    exit 1
fi

python_version=$($PYTHON_CMD --version)
echo -e "\033[0;32mUsing Python: $PYTHON_CMD ($python_version)\033[0m"

# Create virtual environment using venv
echo -e "\n\033[1;36mCreating venv virtual environment...\033[0m"
if [ -d ".venv" ]; then
    echo -e "\033[0;33mVirtual environment already exists. Removing and recreating...\033[0m"
    rm -rf .venv
fi

$PYTHON_CMD -m venv .venv

# Activate virtual environment
echo -e "\n\033[1;36mActivating virtual environment...\033[0m"

# Check for Windows vs Linux virtual environment structure
if [ -f ".venv/Scripts/activate" ]; then
    # Windows (Git Bash, Cygwin, etc.)
    source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
    # Linux/macOS
    source .venv/bin/activate
else
    echo -e "\033[0;31mError: Could not find virtual environment activation script\033[0m"
    echo -e "\033[0;31mChecked: .venv/Scripts/activate and .venv/bin/activate\033[0m"
    exit 1
fi

# Verify activation
if [ "$VIRTUAL_ENV" ]; then
    echo -e "\033[0;32mVirtual environment activated: $VIRTUAL_ENV\033[0m"
else
    echo -e "\033[0;31mError: Failed to activate virtual environment\033[0m"
    exit 1
fi

# Upgrade pip
echo -e "\n\033[1;36mUpgrading pip...\033[0m"
python -m pip install --upgrade pip

# Install project dependencies
echo -e "\n\033[1;36mInstalling project dependencies...\033[0m"
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo -e "\033[0;31mError: requirements.txt not found\033[0m"
    exit 1
fi

# Install project in development mode
echo -e "\n\033[1;36mInstalling project in development mode...\033[0m"
pip install -e .

# Verify installation
echo -e "\n\033[1;36mVerifying installation...\033[0m"
python -c "import src; import scripts; import config; print('All modules imported successfully!')" || {
    echo -e "\033[0;31mError: Module import verification failed\033[0m"
    exit 1
}

# Test entry points
echo -e "\n\033[1;36mTesting entry points...\033[0m"
if command -v dadm &>/dev/null; then
    echo -e "\033[0;32m'dadm' command available\033[0m"
else
    echo -e "\033[0;33mWarning: 'dadm' command not found in PATH\033[0m"
fi

if command -v dadm-deploy-bpmn &>/dev/null; then
    echo -e "\033[0;32m'dadm-deploy-bpmn' command available\033[0m"
else
    echo -e "\033[0;33mWarning: 'dadm-deploy-bpmn' command not found in PATH\033[0m"
fi

echo -e "\n\033[0;32mSetup completed successfully!\033[0m"
echo ""
echo -e "\033[0;33mTo use the project:\033[0m"
if [ -f ".venv/Scripts/activate" ]; then
    echo -e "    source .venv/Scripts/activate  # (Windows/Git Bash)"
else
    echo -e "    source .venv/bin/activate      # (Linux/macOS)"
fi
echo -e "    dadm --help"
echo -e "    dadm-deploy-bpmn --help"
echo ""
echo -e "\033[0;33mTo deactivate the virtual environment:\033[0m"
echo -e "    deactivate"
echo ""
