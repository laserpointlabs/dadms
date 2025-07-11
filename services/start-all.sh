#!/bin/bash

# Start all DADM microservices locally
# This script starts all services in the background and provides logs

set -e
START_DIR=$(pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if we're in the services directory (optional check)
if [ ! -d "prompt-service" ]; then
    print_warning "prompt-service directory not found. Make sure you're in the services directory."
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p data logs

# Function to install dependencies for a service
install_deps() {
    local service=$1
    print_status "Installing dependencies for $service..."
    print_status "Current directory: $(pwd)"
    print_status "Checking for directory: $service"
    if [ ! -d "$service" ]; then
        print_error "Service directory $service not found!"
        print_error "Available directories: $(ls -d */ 2>/dev/null || echo 'none')"
        exit 1
    fi
    cd "$service"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd "$START_DIR"
}

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    print_status "Starting $service on port $port..."
    
    if [ ! -d "$service" ]; then
        print_error "Service directory $service not found!"
        exit 1
    fi
    
    cd "$service"
    
    # Build TypeScript
    print_status "Building $service..."
    npm run build
    
    # Extract service name for log files
    local service_name=$(basename "$service")
    
    # Start service in background
    nohup npm run dev > "$START_DIR/logs/$service_name.log" 2>&1 &
    local pid=$!
    echo $pid > "$START_DIR/logs/$service_name.pid"
    
    cd "$START_DIR"
    
    # Wait a moment for service to start
    sleep 2
    
    # Check if service is running
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        print_success "$service started successfully on port $port"
    else
        print_warning "$service may not be fully started yet. Check logs at logs/$service_name.log"
    fi
}

# Function to build a service
build_service() {
    local service=$1
    print_status "Building $service..."
    if [ ! -d "$service" ]; then
        print_error "Service directory $service not found!"
        exit 1
    fi
    cd "$service"
    npm run build
    cd "$START_DIR"
}

# Service directories
PROMPT_SERVICE_DIR="prompt-service"
TOOL_SERVICE_DIR="tool-service"
WORKFLOW_SERVICE_DIR="workflow-service"
AI_OVERSIGHT_SERVICE_DIR="ai-oversight-service"
EVENT_BUS_DIR="shared/event-bus"

# Install dependencies for all services
print_status "Installing dependencies for all services..."
install_deps "$EVENT_BUS_DIR"
install_deps "$PROMPT_SERVICE_DIR"
install_deps "$TOOL_SERVICE_DIR"
install_deps "$WORKFLOW_SERVICE_DIR"
install_deps "$AI_OVERSIGHT_SERVICE_DIR"

# Build all services
print_status "Building all services..."
build_service "$EVENT_BUS_DIR"
build_service "$PROMPT_SERVICE_DIR"
build_service "$TOOL_SERVICE_DIR"
build_service "$WORKFLOW_SERVICE_DIR"
build_service "$AI_OVERSIGHT_SERVICE_DIR"

# Start all services
print_status "Starting services..."
start_service "$EVENT_BUS_DIR" 3005
start_service "$PROMPT_SERVICE_DIR" 3001
start_service "$TOOL_SERVICE_DIR" 3002
start_service "$WORKFLOW_SERVICE_DIR" 3003
start_service "$AI_OVERSIGHT_SERVICE_DIR" 3004

print_success "All services started!"
print_status "Service URLs:"
echo "  - Prompt Service: http://localhost:3001"
echo "  - Tool Service: http://localhost:3002"
echo "  - Workflow Service: http://localhost:3003"
echo "  - AI Oversight Service: http://localhost:3004"
echo "  - Event Bus: http://localhost:3005"

print_status "Logs are available in the logs/ directory"
print_status "To stop all services, run: ./stop-all.sh"

# Show recent logs
print_status "Recent logs from all services:"
echo "----------------------------------------"
tail -n 5 logs/*.log 2>/dev/null || print_warning "No log files found yet"
echo "----------------------------------------"

print_success "Setup complete! You can now use the DADM microservices." 