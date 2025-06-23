#!/bin/bash
# Setup script for DADM project
# This script helps with setting up the development environment

# Define environment variables and versions
PYTHON_VERSION="3.10"
ENV_NAME="dadm"

echo -e "\033[1;36mDADM Project Setup Script\033[0m"
echo -e "\033[1;36m=========================\033[0m"
echo ""

# Check if Python is installed
if command -v python3 &>/dev/null; then
    python_version=$(python3 --version)
    echo -e "\033[0;32mPython detected: $python_version\033[0m"
else
    echo -e "\033[0;31mError: Python not found. Please install Python $PYTHON_VERSION or higher.\033[0m"
    exit 1
fi

# Check if conda is installed
conda_installed=false
if command -v conda &>/dev/null; then
    conda_installed=true
    echo -e "\033[0;32mConda detected, will use conda environment.\033[0m"
else
    echo -e "\033[0;33mConda not detected, will use venv instead.\033[0m"
fi

# Create virtual environment
if [ "$conda_installed" = true ]; then
    echo -e "\n\033[1;36mCreating conda environment '$ENV_NAME'...\033[0m"
    conda create -n $ENV_NAME python=$PYTHON_VERSION -y
    conda activate $ENV_NAME
else
    echo -e "\n\033[1;36mCreating venv environment...\033[0m"
    python3 -m venv .venv
    source .venv/bin/activate
fi

# Upgrade pip
echo -e "\n\033[1;36mUpgrading pip...\033[0m"
python -m pip install --upgrade pip

# Install project dependencies
echo -e "\n\033[1;36mInstalling project dependencies...\033[0m"
pip install -r requirements.txt

# Install project in development mode
echo -e "\n\033[1;36mInstalling project in development mode...\033[0m"
pip install -e .

# Verify installation
echo -e "\n\033[1;36mVerifying installation...\033[0m"
python -c "import src; import scripts; import config; print('All modules imported successfully!')"

echo -e "\n\033[0;32mSetup completed successfully!\033[0m"
echo ""
echo -e "\033[0;33mTo use the project, run:\033[0m"
if [ "$conda_installed" = true ]; then
    echo -e "    conda activate $ENV_NAME"
else
    echo -e "    source .venv/bin/activate"
fi
echo -e "    dadm --help"
echo -e "    dadm-deploy-bpmn --help"
echo ""
