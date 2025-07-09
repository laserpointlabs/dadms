#!/bin/bash

# Stop all DADM microservices

set -e

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

# Function to stop a service
stop_service() {
    local service=$1
    local pid_file="logs/$service.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service (PID: $pid)..."
            kill $pid
            rm "$pid_file"
            print_success "$service stopped"
        else
            print_warning "$service was not running"
            rm "$pid_file"
        fi
    else
        print_warning "No PID file found for $service"
    fi
}

print_status "Stopping all DADM microservices..."

# Stop services in reverse order
stop_service "ai-oversight-service"
stop_service "workflow-service"
stop_service "tool-service"
stop_service "prompt-service"
stop_service "shared/event-bus"

print_success "All services stopped!"

# Clean up any remaining processes on the ports
print_status "Cleaning up any remaining processes on service ports..."

for port in 3001 3002 3003 3004 3005; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        print_warning "Found process $pid on port $port, stopping..."
        kill $pid 2>/dev/null || true
    fi
done

print_success "Cleanup complete!" 