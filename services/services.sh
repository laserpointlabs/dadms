#!/bin/bash

# DADM Services Management Script
# Unified script to manage all DADM microservices

set -e
START_DIR=$(pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service configuration
SERVICES=(
    "shared/event-bus:3005"
    "llm-service:3006"
    "prompt-service:3001"
    "tool-service:3002"
    "workflow-service:3003"
    "ai-oversight-service:3004"
)

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

# Function to show usage
show_usage() {
    echo "DADM Services Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show status of all services"
    echo "  test      Run API tests on all services"
    echo "  logs      Show recent logs from all services"
    echo "  health    Check health of all services"
    echo "  clean     Clean all build artifacts and dependencies"
    echo "  install   Install dependencies for all services"
    echo "  build     Build all services"
    echo ""
    echo "Options:"
    echo "  --service NAME    Target specific service (e.g., llm-service)"
    echo "  --port PORT       Target service on specific port"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 stop --service llm-service   # Stop only LLM service"
    echo "  $0 restart --port 3006     # Restart service on port 3006"
    echo "  $0 health                  # Check health of all services"
}

# Function to check dependencies
check_dependencies() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed. Please install curl for health checks."
        exit 1
    fi
}

# Function to get service info from name or port
get_service_info() {
    local identifier=$1
    
    for service_entry in "${SERVICES[@]}"; do
        local service_dir=$(echo "$service_entry" | cut -d':' -f1)
        local service_port=$(echo "$service_entry" | cut -d':' -f2)
        local service_name=$(basename "$service_dir")
        
        if [[ "$identifier" == "$service_name" ]] || [[ "$identifier" == "$service_dir" ]] || [[ "$identifier" == "$service_port" ]]; then
            echo "$service_dir:$service_port"
            return 0
        fi
    done
    
    print_error "Service not found: $identifier"
    return 1
}

# Function to install dependencies
install_deps() {
    local service_dir=$1
    
    if [ ! -d "$service_dir" ]; then
        print_warning "Directory $service_dir not found, skipping..."
        return 0
    fi
    
    if [ ! -f "$service_dir/package.json" ]; then
        print_warning "No package.json found in $service_dir, skipping..."
        return 0
    fi
    
    print_status "Installing dependencies for $service_dir..."
    cd "$service_dir"
    npm install --silent
    cd "$START_DIR"
}

# Function to build service
build_service() {
    local service_dir=$1
    
    if [ ! -d "$service_dir" ]; then
        print_warning "Directory $service_dir not found, skipping..."
        return 0
    fi
    
    if [ ! -f "$service_dir/package.json" ]; then
        print_warning "No package.json found in $service_dir, skipping..."
        return 0
    fi
    
    print_status "Building $service_dir..."
    cd "$service_dir"
    
    # Check if build script exists
    if npm run | grep -q "build"; then
        npm run build --silent
    else
        print_warning "No build script found for $service_dir"
    fi
    
    cd "$START_DIR"
}

# Function to start service
start_service() {
    local service_dir=$1
    local port=$2
    local service_name=$(basename "$service_dir")
    
    if [ ! -d "$service_dir" ]; then
        print_warning "Directory $service_dir not found, skipping..."
        return 0
    fi
    
    # Check if service is already running
    if lsof -ti:$port > /dev/null 2>&1; then
        print_warning "$service_name is already running on port $port"
        return 0
    fi
    
    print_status "Starting $service_name on port $port..."
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    cd "$service_dir"
    
    # Start service in background and save PID
    if [ -f "dist/index.js" ]; then
        # Use built version if available
        nohup node dist/index.js > "../logs/$service_name.log" 2>&1 &
    elif npm run | grep -q "start"; then
        # Use npm start if available
        nohup npm start > "../logs/$service_name.log" 2>&1 &
    elif npm run | grep -q "dev"; then
        # Use npm run dev as fallback
        nohup npm run dev > "../logs/$service_name.log" 2>&1 &
    else
        print_error "No start method found for $service_name"
        cd "$START_DIR"
        return 1
    fi
    
    local pid=$!
    echo $pid > "../logs/$service_name.pid"
    
    cd "$START_DIR"
    
    # Wait a moment and check if service started successfully
    sleep 2
    if ps -p $pid > /dev/null 2>&1; then
        print_success "$service_name started successfully on port $port"
    else
        print_error "$service_name failed to start"
        return 1
    fi
}

# Function to stop service
stop_service() {
    local service_dir=$1
    local service_name=$(basename "$service_dir")
    local pid_file="logs/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
            print_success "$service_name stopped"
        else
            print_warning "$service_name was not running"
            rm "$pid_file"
        fi
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Function to check service health
check_health() {
    local service_dir=$1
    local port=$2
    local service_name=$(basename "$service_dir")
    local url="http://localhost:$port/health"
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_success "$service_name is healthy (port $port)"
        return 0
    else
        print_error "$service_name health check failed (port $port)"
        return 1
    fi
}

# Function to show service status
show_status() {
    local service_dir=$1
    local port=$2
    local service_name=$(basename "$service_dir")
    
    # Check if process is running on port
    if lsof -ti:$port > /dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        print_success "$service_name is running (PID: $pid, Port: $port)"
    else
        print_warning "$service_name is not running (Port: $port)"
    fi
}

# Function to test service functionality
test_service() {
    local service_dir=$1
    local port=$2
    local service_name=$(basename "$service_dir")
    
    print_status "Testing $service_name..."
    
    case "$service_name" in
        "llm-service")
            test_llm_service $port
            ;;
        "prompt-service")
            test_prompt_service $port
            ;;
        "tool-service")
            test_tool_service $port
            ;;
        "workflow-service")
            test_workflow_service $port
            ;;
        "ai-oversight-service")
            test_ai_oversight_service $port
            ;;
        "event-bus")
            test_event_bus $port
            ;;
        *)
            # Generic health check
            check_health "$service_dir" "$port"
            ;;
    esac
}

# Individual service test functions
test_llm_service() {
    local port=$1
    
    # Test provider status
    local providers_response=$(curl -s "http://localhost:$port/providers/status")
    
    if echo "$providers_response" | grep -q "providers"; then
        print_success "Provider status retrieved successfully"
        
        # Test completion endpoint
        local completion_response=$(curl -s -X POST "http://localhost:$port/v1/complete" \
            -H "Content-Type: application/json" \
            -d '{
                "prompt": "What is 2+2?",
                "temperature": 0.3,
                "max_tokens": 50,
                "model_preference": {
                    "primary": "auto",
                    "cost_priority": "balanced"
                }
            }')
        
        if echo "$completion_response" | grep -q "content"; then
            print_success "LLM completion successful"
        else
            print_warning "LLM completion failed (may need API keys)"
        fi
        
        # Test Swagger docs
        if curl -s "http://localhost:$port/docs" > /dev/null 2>&1; then
            print_success "Swagger documentation accessible"
        fi
    else
        print_error "Provider status test failed"
    fi
}

test_prompt_service() {
    local port=$1
    
    # Test creating a prompt
    local prompt_response=$(curl -s -X POST "http://localhost:$port/prompts" \
        -H "Content-Type: application/json" \
        -H "x-user-id: test-user" \
        -d '{
            "text": "Test prompt for API validation",
            "type": "simple",
            "tags": ["test", "api"]
        }')
    
    if echo "$prompt_response" | grep -q "success.*true"; then
        print_success "Prompt creation successful"
    else
        print_warning "Prompt creation test failed"
    fi
}

test_tool_service() {
    local port=$1
    
    # Test tool registration
    local tool_response=$(curl -s -X POST "http://localhost:$port/tools" \
        -H "Content-Type: application/json" \
        -H "x-user-id: test-user" \
        -d '{
            "name": "Test Tool",
            "description": "A test tool",
            "endpoint": "http://localhost:8080/test",
            "capabilities": ["test"],
            "version": "1.0.0"
        }')
    
    if echo "$tool_response" | grep -q "success.*true"; then
        print_success "Tool registration successful"
    else
        print_warning "Tool registration test failed"
    fi
}

test_workflow_service() {
    local port=$1
    
    # Test workflow creation
    local workflow_response=$(curl -s -X POST "http://localhost:$port/workflows" \
        -H "Content-Type: application/json" \
        -H "x-user-id: test-user" \
        -d '{
            "name": "Test Workflow",
            "description": "A test workflow",
            "steps": []
        }')
    
    if echo "$workflow_response" | grep -q "success.*true"; then
        print_success "Workflow creation successful"
    else
        print_warning "Workflow creation test failed"
    fi
}

test_ai_oversight_service() {
    local port=$1
    
    # Test getting agents
    local agents_response=$(curl -s "http://localhost:$port/ai-review/agents")
    
    if echo "$agents_response" | grep -q "success.*true"; then
        print_success "AI oversight agents retrieval successful"
    else
        print_warning "AI oversight test failed"
    fi
}

test_event_bus() {
    local port=$1
    
    # Test event bus health
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        print_success "Event bus is accessible"
    else
        print_warning "Event bus test failed"
    fi
}

# Main command handlers
cmd_start() {
    local target_service=$1
    
    check_dependencies
    
    if [ -n "$target_service" ]; then
        # Start specific service
        local service_info=$(get_service_info "$target_service")
        if [ $? -eq 0 ]; then
            local service_dir=$(echo "$service_info" | cut -d':' -f1)
            local service_port=$(echo "$service_info" | cut -d':' -f2)
            
            install_deps "$service_dir"
            build_service "$service_dir"
            start_service "$service_dir" "$service_port"
        fi
    else
        # Start all services
        print_status "Starting all DADM services..."
        
        # Create logs directory
        mkdir -p logs
        
        # Install dependencies for all services
        print_status "Installing dependencies..."
        for service_entry in "${SERVICES[@]}"; do
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            install_deps "$service_dir"
        done
        
        # Build all services
        print_status "Building services..."
        for service_entry in "${SERVICES[@]}"; do
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            build_service "$service_dir"
        done
        
        # Start all services
        print_status "Starting services..."
        for service_entry in "${SERVICES[@]}"; do
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            local service_port=$(echo "$service_entry" | cut -d':' -f2)
            start_service "$service_dir" "$service_port"
        done
        
        print_success "All services started!"
        print_status "Service URLs:"
        for service_entry in "${SERVICES[@]}"; do
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            local service_port=$(echo "$service_entry" | cut -d':' -f2)
            local service_name=$(basename "$service_dir")
            echo "  - $service_name: http://localhost:$service_port"
        done
    fi
}

cmd_stop() {
    local target_service=$1
    
    if [ -n "$target_service" ]; then
        # Stop specific service
        local service_info=$(get_service_info "$target_service")
        if [ $? -eq 0 ]; then
            local service_dir=$(echo "$service_info" | cut -d':' -f1)
            local service_port=$(echo "$service_info" | cut -d':' -f2)
            stop_service "$service_dir"
            
            # Also kill any process on the port
            local pid=$(lsof -ti:$service_port 2>/dev/null || true)
            if [ ! -z "$pid" ]; then
                print_status "Killing process $pid on port $service_port"
                kill $pid 2>/dev/null || true
            fi
        fi
    else
        # Stop all services
        print_status "Stopping all DADM services..."
        
        # Stop services in reverse order
        for ((i=${#SERVICES[@]}-1; i>=0; i--)); do
            local service_entry="${SERVICES[$i]}"
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            stop_service "$service_dir"
        done
        
        # Clean up any remaining processes on service ports
        print_status "Cleaning up any remaining processes..."
        for service_entry in "${SERVICES[@]}"; do
            local service_port=$(echo "$service_entry" | cut -d':' -f2)
            local pid=$(lsof -ti:$service_port 2>/dev/null || true)
            if [ ! -z "$pid" ]; then
                print_warning "Found process $pid on port $service_port, stopping..."
                kill $pid 2>/dev/null || true
            fi
        done
        
        print_success "All services stopped!"
    fi
}

cmd_restart() {
    local target_service=$1
    
    print_status "Restarting services..."
    cmd_stop "$target_service"
    sleep 2
    cmd_start "$target_service"
}

cmd_status() {
    local target_service=$1
    
    if [ -n "$target_service" ]; then
        # Show status for specific service
        local service_info=$(get_service_info "$target_service")
        if [ $? -eq 0 ]; then
            local service_dir=$(echo "$service_info" | cut -d':' -f1)
            local service_port=$(echo "$service_info" | cut -d':' -f2)
            show_status "$service_dir" "$service_port"
        fi
    else
        # Show status for all services
        print_status "DADM Services Status:"
        for service_entry in "${SERVICES[@]}"; do
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            local service_port=$(echo "$service_entry" | cut -d':' -f2)
            show_status "$service_dir" "$service_port"
        done
    fi
}

cmd_health() {
    local target_service=$1
    local failed=0
    
    if [ -n "$target_service" ]; then
        # Check health for specific service
        local service_info=$(get_service_info "$target_service")
        if [ $? -eq 0 ]; then
            local service_dir=$(echo "$service_info" | cut -d':' -f1)
            local service_port=$(echo "$service_info" | cut -d':' -f2)
            check_health "$service_dir" "$service_port" || failed=1
        fi
    else
        # Check health for all services
        print_status "Checking health of all services..."
        for service_entry in "${SERVICES[@]}"; do
            local service_dir=$(echo "$service_entry" | cut -d':' -f1)
            local service_port=$(echo "$service_entry" | cut -d':' -f2)
            check_health "$service_dir" "$service_port" || failed=1
        done
        
        if [ $failed -eq 0 ]; then
            print_success "All services are healthy!"
        else
            print_warning "Some services failed health checks"
        fi
    fi
    
    return $failed
}

cmd_test() {
    local target_service=$1
    
    if [ -n "$target_service" ]; then
        # Test specific service
        local service_info=$(get_service_info "$target_service")
        if [ $? -eq 0 ]; then
            local service_dir=$(echo "$service_info" | cut -d':' -f1)
            local service_port=$(echo "$service_info" | cut -d':' -f2)
            test_service "$service_dir" "$service_port"
        fi
    else
        # Test all services
        print_status "Running API tests on all services..."
        
        # First check health
        cmd_health
        
        if [ $? -eq 0 ]; then
            print_status "Running functionality tests..."
            for service_entry in "${SERVICES[@]}"; do
                local service_dir=$(echo "$service_entry" | cut -d':' -f1)
                local service_port=$(echo "$service_entry" | cut -d':' -f2)
                test_service "$service_dir" "$service_port"
            done
            print_success "API tests completed!"
        else
            print_error "Health checks failed, skipping functionality tests"
            return 1
        fi
    fi
}

cmd_logs() {
    local target_service=$1
    
    if [ -n "$target_service" ]; then
        # Show logs for specific service
        local service_info=$(get_service_info "$target_service")
        if [ $? -eq 0 ]; then
            local service_dir=$(echo "$service_info" | cut -d':' -f1)
            local service_name=$(basename "$service_dir")
            local log_file="logs/$service_name.log"
            
            if [ -f "$log_file" ]; then
                print_status "Recent logs for $service_name:"
                tail -n 50 "$log_file"
            else
                print_warning "No log file found for $service_name"
            fi
        fi
    else
        # Show logs for all services
        print_status "Recent logs from all services:"
        echo "----------------------------------------"
        if ls logs/*.log > /dev/null 2>&1; then
            tail -n 10 logs/*.log
        else
            print_warning "No log files found"
        fi
        echo "----------------------------------------"
    fi
}

cmd_clean() {
    print_status "Cleaning build artifacts and dependencies..."
    
    for service_entry in "${SERVICES[@]}"; do
        local service_dir=$(echo "$service_entry" | cut -d':' -f1)
        local service_name=$(basename "$service_dir")
        
        if [ -d "$service_dir" ]; then
            print_status "Cleaning $service_name..."
            cd "$service_dir"
            
            # Remove build artifacts
            rm -rf dist/ build/ .next/
            
            # Remove dependencies (optional - commented out by default)
            # rm -rf node_modules/
            
            cd "$START_DIR"
        fi
    done
    
    # Clean logs
    print_status "Cleaning logs..."
    rm -f logs/*.log logs/*.pid
    
    print_success "Cleanup completed!"
}

cmd_install() {
    print_status "Installing dependencies for all services..."
    
    for service_entry in "${SERVICES[@]}"; do
        local service_dir=$(echo "$service_entry" | cut -d':' -f1)
        install_deps "$service_dir"
    done
    
    print_success "Dependencies installed!"
}

cmd_build() {
    print_status "Building all services..."
    
    for service_entry in "${SERVICES[@]}"; do
        local service_dir=$(echo "$service_entry" | cut -d':' -f1)
        build_service "$service_dir"
    done
    
    print_success "All services built!"
}

# Parse command line arguments
COMMAND=""
TARGET_SERVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        start|stop|restart|status|health|test|logs|clean|install|build)
            COMMAND="$1"
            shift
            ;;
        --service)
            TARGET_SERVICE="$2"
            shift 2
            ;;
        --port)
            TARGET_SERVICE="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Execute command
case "$COMMAND" in
    start)
        cmd_start "$TARGET_SERVICE"
        ;;
    stop)
        cmd_stop "$TARGET_SERVICE"
        ;;
    restart)
        cmd_restart "$TARGET_SERVICE"
        ;;
    status)
        cmd_status "$TARGET_SERVICE"
        ;;
    health)
        cmd_health "$TARGET_SERVICE"
        ;;
    test)
        cmd_test "$TARGET_SERVICE"
        ;;
    logs)
        cmd_logs "$TARGET_SERVICE"
        ;;
    clean)
        cmd_clean
        ;;
    install)
        cmd_install
        ;;
    build)
        cmd_build
        ;;
    "")
        print_error "No command specified"
        show_usage
        exit 1
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac
