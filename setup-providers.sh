#!/bin/bash

# DADM LLM Providers Setup Script
# This script sets up the environment for LLM providers and fixes common issues

set -e  # Exit on any error

echo "🚀 DADM LLM Providers Setup"
echo "================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
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

# Function to create directory if it doesn't exist
ensure_directory() {
    if [ ! -d "$1" ]; then
        print_info "Creating directory: $1"
        mkdir -p "$1"
    else
        print_info "Directory exists: $1"
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_info "Setting up DADM project structure..."

# Ensure we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "services" ]; then
    print_error "This script should be run from the DADM root directory"
    print_error "Current directory: $(pwd)"
    print_error "Expected: A directory containing 'services' folder and 'package.json'"
    exit 1
fi

print_success "Found DADM project structure"

# Create necessary directories
print_info "Creating required directories..."

ensure_directory "logs"
ensure_directory "logs/services"
ensure_directory "data"
ensure_directory "data/analysis_storage"
ensure_directory "data/bpmn_examples"
ensure_directory "data/governance"

# Fix services logs directory structure
if [ -d "services" ]; then
    print_info "Setting up services logs structure..."
    
    # Create logs directory in services parent (for services.sh script)
    ensure_directory "logs"
    
    # Create individual service log files
    for service in "event-bus" "llm-service" "prompt-service" "tool-service" "workflow-service" "ai-oversight-service"; do
        touch "logs/${service}.log"
        print_info "Created log file: logs/${service}.log"
    done
fi

# Check Node.js and npm versions
print_info "Checking Node.js environment..."

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    print_error "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm version: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Python environment (for DADM backend)
print_info "Checking Python environment..."

if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python version: $PYTHON_VERSION"
else
    print_warning "Python3 not found - some DADM features may not work"
fi

# Check for virtual environment
if [ -n "$VIRTUAL_ENV" ]; then
    print_success "Python virtual environment active: $VIRTUAL_ENV"
elif [ -d ".venv" ]; then
    print_info "Virtual environment found but not activated"
    print_info "To activate: source .venv/bin/activate"
else
    print_warning "No Python virtual environment found"
    print_info "Consider creating one: python3 -m venv .venv"
fi

# Environment Variables Setup
print_info "Checking environment variables..."

# Check for OpenAI API Key
if [ -n "$OPENAI_API_KEY" ]; then
    print_success "OpenAI API Key is set"
else
    print_warning "OPENAI_API_KEY is not set"
    print_info "To set it: export OPENAI_API_KEY='your-api-key-here'"
fi

# Check for Anthropic API Key
if [ -n "$ANTHROPIC_API_KEY" ]; then
    print_success "Anthropic API Key is set"
else
    print_warning "ANTHROPIC_API_KEY is not set (optional)"
    print_info "To set it: export ANTHROPIC_API_KEY='your-api-key-here'"
fi

# Check for local LLM setup (Ollama)
if command_exists ollama; then
    print_success "Ollama CLI is installed"
    if pgrep -x "ollama" > /dev/null; then
        print_success "Ollama service is running (local)"
    else
        print_info "Ollama service not running locally - checking for Docker container..."
        if command_exists docker && docker ps | grep -q ollama; then
            print_success "Ollama is running in Docker container"
        elif curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            print_success "Ollama API is accessible on port 11434"
        else
            print_warning "Ollama is not accessible"
            print_info "Check Docker container: docker ps | grep ollama"
            print_info "Or start local: ollama serve"
        fi
    fi
elif curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    print_success "Ollama API is accessible on port 11434 (likely Docker)"
else
    print_warning "Ollama is not accessible (install or check Docker container)"
    print_info "Local install: curl -fsSL https://ollama.ai/install.sh | sh"
    print_info "Docker: docker run -d -p 11434:11434 ollama/ollama"
fi

# Services Setup
if [ -d "services" ]; then
    print_info "Setting up microservices..."
    
    cd services
    
    # Install dependencies for all services
    for service_dir in */; do
        if [ -f "${service_dir}package.json" ]; then
            service_name=$(basename "$service_dir")
            print_info "Installing dependencies for $service_name..."
            
            cd "$service_dir"
            if npm install --silent; then
                print_success "Dependencies installed for $service_name"
            else
                print_warning "Failed to install dependencies for $service_name"
            fi
            cd ..
        fi
    done
    
    # Make services.sh executable
    if [ -f "services.sh" ]; then
        chmod +x services.sh
        print_success "Made services.sh executable"
    fi
    
    cd ..
fi

# UI Setup
if [ -d "ui" ]; then
    print_info "Setting up UI..."
    
    cd ui
    if [ -f "package.json" ]; then
        print_info "Installing UI dependencies..."
        if npm install --silent; then
            print_success "UI dependencies installed"
        else
            print_warning "Failed to install UI dependencies"
        fi
    fi
    cd ..
fi

# Database Setup Check
print_info "Checking database requirements..."

# Check for Docker-based PostgreSQL first
if command_exists docker; then
    if docker ps | grep -q postgres; then
        print_success "PostgreSQL is running in Docker container"
        if curl -s "postgresql://localhost:5432" >/dev/null 2>&1 || nc -z localhost 5432; then
            print_success "PostgreSQL is accessible on port 5432"
        else
            print_warning "PostgreSQL Docker container found but not accessible on port 5432"
            print_info "Check port mapping: docker ps | grep postgres"
        fi
    else
        print_info "No PostgreSQL Docker container found - checking local installation..."
        
        if command_exists psql; then
            print_success "PostgreSQL client is available"
            
            if pg_isready -q; then
                print_success "Local PostgreSQL server is running"
                
                # Check if DADM database and user exist
                if psql -lqt | cut -d \| -f 1 | grep -qw dadm; then
                    print_success "DADM database exists"
                else
                    print_warning "DADM database does not exist"
                    print_info "Create with: createdb dadm"
                fi
                
                if psql -t -c "SELECT 1 FROM pg_roles WHERE rolname='dadm'" | grep -q 1; then
                    print_success "DADM database user exists"
                else
                    print_warning "DADM database user does not exist"
                    print_info "Create with: createuser -s dadm"
                fi
            else
                print_warning "Local PostgreSQL server is not running"
                print_info "Start local: sudo systemctl start postgresql"
                print_info "Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
            fi
        else
            print_warning "PostgreSQL client not found and no Docker container"
            print_info "Install client: sudo apt-get install postgresql-client"
            print_info "Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
        fi
    fi
else
    print_warning "Docker not available - checking local PostgreSQL..."
    
    if command_exists psql; then
        print_success "PostgreSQL client is available"
        if pg_isready -q; then
            print_success "PostgreSQL server is running"
        else
            print_warning "PostgreSQL server is not running"
            print_info "Start with: sudo systemctl start postgresql"
        fi
    else
        print_warning "PostgreSQL client not found"
        print_info "Install with: sudo apt-get install postgresql-client postgresql"
    fi
fi

# Quick database setup option
print_info "Database setup options:"
print_info "1. Docker PostgreSQL (recommended for development):"
print_info "   docker run -d --name postgres-dadm -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
print_info "   docker exec -it postgres-dadm createuser -s dadm"
print_info "   docker exec -it postgres-dadm createdb dadm"
print_info "2. Local PostgreSQL:"
print_info "   sudo -u postgres createuser -s dadm"
print_info "   sudo -u postgres createdb dadm"
print_info "3. Local PostgreSQL with password:"
print_info "   sudo -u postgres createuser -P dadm"
print_info "   sudo -u postgres createdb -O dadm dadm"

# Create sample environment file
if [ ! -f ".env" ]; then
    print_info "Creating sample .env file..."
    cat > .env << 'EOF'
# DADM Environment Variables
# Copy this file and update with your actual values

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Local LLM Configuration
OLLAMA_API_URL=http://localhost:11434

# Database Configuration
DATABASE_URL=postgresql://localhost/dadm
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dadm
POSTGRES_USER=dadm
POSTGRES_PASSWORD=your-password-here

# Service Ports
EVENT_BUS_PORT=3005
LLM_SERVICE_PORT=3006
PROMPT_SERVICE_PORT=3001
TOOL_SERVICE_PORT=3002
WORKFLOW_SERVICE_PORT=3003
AI_OVERSIGHT_SERVICE_PORT=3004

# UI Configuration
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_PROMPT_SERVICE_PORT=3001

# Development
NODE_ENV=development
LOG_LEVEL=info
EOF
    print_success "Created .env template file"
    print_info "Please edit .env with your actual configuration"
else
    print_info ".env file already exists"
fi

# Final Setup Verification
print_info "Running setup verification..."

# Check if services can be built
if [ -d "services" ] && [ -f "services/services.sh" ]; then
    print_info "Testing services build..."
    cd services
    if ./services.sh build --quiet 2>/dev/null; then
        print_success "Services build test passed"
    else
        print_warning "Services build test failed - check individual service configurations"
    fi
    cd ..
fi

# Summary
echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "Recommended Development Setup:"
echo "- Services: Native (better debugging, hot reload)"
echo "- Database: Docker PostgreSQL (isolated, consistent)"
echo "- LLM: Docker Ollama (isolated, consistent)"
echo ""
echo "Startup Sequence (Simple Development Mode):"
echo "1. Start infrastructure (if needed):"
echo "   docker run -d --name postgres-dadm -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
echo "   docker run -d --name ollama-dadm -p 11434:11434 ollama/ollama"
echo ""
echo "2. Start individual services manually (use separate terminals):"
echo "   # Terminal 1: LLM Service"
echo "   cd services/llm-service && node dist/index.js"
echo ""
echo "   # Terminal 2: Prompt Service" 
echo "   cd services/prompt-service && node dist/index.js"
echo ""
echo "   # Terminal 3: UI (after services are running)"
echo "   cd ui && PORT=3000 npm start"
echo ""
echo "   Note: Run 'npm run build' in each service directory first if dist/ doesn't exist"
echo ""
echo "Alternative: Use the DADM backend:"
echo "   cd ui && npm run backend:start"
echo ""
echo "Service URLs:"
echo "- LLM Service: http://localhost:3006"
echo "- Prompt Service: http://localhost:3001"
echo "- Tool Service: http://localhost:3002"
echo "- Workflow Service: http://localhost:3003"
echo "- AI Oversight Service: http://localhost:3004"
echo "- Event Bus: http://localhost:3005"
echo ""

if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI provider will be available"
else
    echo "⚠️  Set OPENAI_API_KEY to enable OpenAI provider"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ Anthropic provider will be available"
else
    echo "⚠️  Set ANTHROPIC_API_KEY to enable Anthropic provider"
fi

if command_exists ollama && pgrep -x "ollama" > /dev/null; then
    echo "✅ Local LLM provider (Ollama) is available"
else
    echo "⚠️  Install and start Ollama for local LLM provider"
fi

print_success "DADM LLM Providers setup complete!"
