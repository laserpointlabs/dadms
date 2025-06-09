#!/bin/bash
# Setup environment variables for DADM OpenAI service

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get OpenAI API key from user if not set
if [ -z "$OPENAI_API_KEY" ]; then
    echo -n "Enter your OpenAI API key: "
    read apiKey
    if [ -n "$apiKey" ]; then
        export OPENAI_API_KEY="$apiKey"
        echo -e "${GREEN}OPENAI_API_KEY set successfully.${NC}"
    else
        echo -e "${RED}OPENAI_API_KEY is required. Setup failed.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Using existing OPENAI_API_KEY environment variable.${NC}"
fi

# Set default environment variables for local development
export PORT="5000"
export ASSISTANT_NAME="DADM Decision Analysis Assistant"
export ASSISTANT_MODEL="gpt-4o"
export CONSUL_HTTP_ADDR="localhost:8500"
export SERVICE_HOST="localhost"
export SERVICE_TYPE="assistant"
export USE_CONSUL="true"
export DOCKER_CONTAINER="false"

echo -e "${CYAN}Environment variables set for local development:${NC}"
echo "- PORT: $PORT"
echo "- ASSISTANT_NAME: $ASSISTANT_NAME"
echo "- ASSISTANT_MODEL: $ASSISTANT_MODEL"
echo "- CONSUL_HTTP_ADDR: $CONSUL_HTTP_ADDR"
echo "- SERVICE_HOST: $SERVICE_HOST"
echo "- SERVICE_TYPE: $SERVICE_TYPE"
echo "- USE_CONSUL: $USE_CONSUL"
echo "- DOCKER_CONTAINER: $DOCKER_CONTAINER"

# Check if Consul is running locally
if curl -s --max-time 2 http://localhost:8500/v1/status/leader > /dev/null; then
    echo -e "${GREEN}✅ Consul is running locally!${NC}"
else
    echo -e "${YELLOW}⚠️ Consul does not appear to be running locally.${NC}"
    echo -e "${YELLOW}You can start it with Docker: docker run -d --name consul -p 8500:8500 consul:1.15${NC}"
fi

# Done
echo -e "\n${GREEN}Setup complete! You can now run the OpenAI service locally.${NC}"
echo "For more information, see docs/environment_variables.md"

# Note: These environment variables are only set for the current shell session.
# To make them permanent, add them to your ~/.bashrc or ~/.zshrc file.
echo -e "\n${YELLOW}Note: These variables are only set for the current shell session.${NC}"
echo "To apply them to new shells, run: source $0"
