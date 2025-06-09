#!/bin/bash
# Test Consul Integration for OpenAI Service
# This script verifies the Consul integration setup and runs tests

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Make sure we have the right environment
echo -e "${CYAN}Loading environment variables...${NC}"
source "$(dirname "$0")/setup_environment.sh"

# Check if Python is installed
echo -e "${CYAN}Checking Python installation...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Python not found. Please install Python 3.8 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python installed: $PYTHON_VERSION${NC}"

# Create temporary .venv folder if needed
if [ ! -d "./.venv" ]; then
    echo -e "${CYAN}Creating virtual environment...${NC}"
    python3 -m venv ./.venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create virtual environment.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Virtual environment created.${NC}"
fi

# Activate the virtual environment
echo -e "${CYAN}Activating virtual environment...${NC}"
source ./.venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to activate virtual environment.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Virtual environment activated.${NC}"

# Install dependencies if needed
echo -e "${CYAN}Installing dependencies...${NC}"
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed.${NC}"

# Verify environment variables
echo -e "${CYAN}Verifying environment variables...${NC}"
python "$(dirname "$0")/verify_environment.py"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Environment variables verification failed.${NC}"
    exit 1
fi

# Test Consul integration
echo -e "${CYAN}Testing Consul integration...${NC}"
echo -e "${CYAN}1. Testing if Consul is available...${NC}"
python "$(dirname "$0")/test_consul_integration.py"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Consul availability test failed.${NC}"
    echo -e "${YELLOW}   Make sure Consul is running locally or correctly configured.${NC}"
    echo -e "${YELLOW}   You can start Consul with Docker: docker run -d --name consul -p 8500:8500 consul:1.15${NC}"
    exit 1
fi

echo -e "${CYAN}2. Testing service registration with Consul...${NC}"
python "$(dirname "$0")/test_consul_registration.py" --wait 5
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Consul service registration test failed.${NC}"
    exit 1
fi

# All tests passed
echo -e "${GREEN}✅ All Consul integration tests passed!${NC}"
echo -e "You can now run the OpenAI service with Consul integration enabled."
