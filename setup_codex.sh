#!/bin/bash
# Setup script for DADM project - OpenAI Codex optimized version
# This script installs DADM directly without virtual environment isolation

echo -e "\033[1;36mDADM Project Setup Script (OpenAI Codex)\033[0m"
echo -e "\033[1;36m=======================================\033[0m"
echo ""

# Check Python version
PYTHON_CMD=""
if command -v python3.10 &>/dev/null; then
    PYTHON_CMD="python3.10"
elif command -v python3.11 &>/dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3.12 &>/dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &>/dev/null; then
    python_version_check=$(python3 -c "import sys; print(sys.version_info >= (3, 10))" 2>/dev/null)
    if [ "$python_version_check" = "True" ]; then
        PYTHON_CMD="python3"
    fi
elif command -v python &>/dev/null; then
    python_version_check=$(python -c "import sys; print(sys.version_info >= (3, 10))" 2>/dev/null)
    if [ "$python_version_check" = "True" ]; then
        PYTHON_CMD="python"
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo -e "\033[0;31mError: Python 3.10+ not found.\033[0m"
    exit 1
fi

python_version=$($PYTHON_CMD --version)
echo -e "\033[0;32mUsing Python: $PYTHON_CMD ($python_version)\033[0m"

# Upgrade pip
echo -e "\n\033[1;36mUpgrading pip...\033[0m"
$PYTHON_CMD -m pip install --upgrade pip --user

# Install dependencies directly
echo -e "\n\033[1;36mInstalling project dependencies...\033[0m"
if [ -f "requirements.txt" ]; then
    $PYTHON_CMD -m pip install -r requirements.txt --user
else
    echo -e "\033[0;31mError: requirements.txt not found\033[0m"
    exit 1
fi

# Install project in development mode
echo -e "\n\033[1;36mInstalling DADM project...\033[0m"
$PYTHON_CMD -m pip install -e . --user

# Verify installation
echo -e "\n\033[1;36mVerifying installation...\033[0m"
$PYTHON_CMD -c "import src; import scripts; import config; print('✅ All modules imported successfully!')" || {
    echo -e "\033[0;31mError: Module import verification failed\033[0m"
    exit 1
}

# Test entry points
echo -e "\n\033[1;36mTesting entry points...\033[0m"
if command -v dadm &>/dev/null; then
    echo -e "\033[0;32m✅ 'dadm' command available\033[0m"
    dadm --version 2>/dev/null || echo -e "\033[0;33m⚠️  dadm command found but version check failed\033[0m"
else
    echo -e "\033[0;33m⚠️  'dadm' command not found in PATH\033[0m"
    echo -e "\033[0;33m   Try: export PATH=\$PATH:\$HOME/.local/bin\033[0m"
fi

if command -v dadm-deploy-bpmn &>/dev/null; then
    echo -e "\033[0;32m✅ 'dadm-deploy-bpmn' command available\033[0m"
else
    echo -e "\033[0;33m⚠️  'dadm-deploy-bpmn' command not found in PATH\033[0m"
    echo -e "\033[0;33m   Try: export PATH=\$PATH:\$HOME/.local/bin\033[0m"
fi

# Check environment variables
echo -e "\n\033[1;36mChecking environment...\033[0m"
if [ -n "$OPENAI_API_KEY" ]; then
    echo -e "\033[0;32m✅ OPENAI_API_KEY is set\033[0m"
else
    echo -e "\033[0;33m⚠️  OPENAI_API_KEY not found (should be set by Codex)\033[0m"
fi

echo -e "\n\033[0;32m🎉 Setup completed successfully!\033[0m"
echo ""
echo -e "\033[0;33mReady to use DADM commands:\033[0m"
echo -e "    dadm --help"
echo -e "    dadm-deploy-bpmn --help"
echo -e "    dadm-deploy-bpmn camunda_models/echo_test_process.bpmn"
echo ""
echo -e "\033[0;33mIf commands are not found, try:\033[0m"
echo -e "    export PATH=\$PATH:\$HOME/.local/bin"
echo ""
