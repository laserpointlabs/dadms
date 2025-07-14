#!/bin/bash

# Test script for DADM microservices APIs
# This script tests the basic functionality of all services

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

# Function to test health endpoint
test_health() {
    local service=$1
    local port=$2
    local url="http://localhost:$port/health"
    
    print_status "Testing $service health endpoint..."
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_success "$service is healthy"
        return 0
    else
        print_error "$service health check failed"
        return 1
    fi
}

# Function to test prompt service
test_prompt_service() {
    print_status "Testing Prompt Service..."
    
    # Create a test prompt
    local prompt_response=$(curl -s -X POST http://localhost:3001/prompts \
        -H "Content-Type: application/json" \
        -H "x-user-id: test-user" \
        -d '{
            "text": "This is a test prompt for analysis",
            "type": "simple",
            "test_cases": [
                {
                    "name": "Basic Test",
                    "input": {"test": "data"},
                    "expected_output": {"result": "success"},
                    "enabled": true
                }
            ],
            "tags": ["test", "demo"]
        }')
    
    if echo "$prompt_response" | grep -q "success.*true"; then
        print_success "Prompt created successfully"
        
        # Extract prompt ID for further testing
        local prompt_id=$(echo "$prompt_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        # Test getting the prompt
        if curl -s "http://localhost:3001/prompts/$prompt_id" > /dev/null 2>&1; then
            print_success "Prompt retrieval successful"
        else
            print_warning "Prompt retrieval failed"
        fi
    else
        print_error "Failed to create prompt"
        echo "Response: $prompt_response"
    fi
}

# Function to test tool service
test_tool_service() {
    print_status "Testing Tool Service..."
    
    # Register a test tool
    local tool_response=$(curl -s -X POST http://localhost:3002/tools \
        -H "Content-Type: application/json" \
        -H "x-user-id: test-user" \
        -d '{
            "name": "Test Analyzer",
            "description": "A test tool for analysis",
            "endpoint": "http://localhost:8080/analyze",
            "capabilities": ["analysis", "test"],
            "version": "1.0.0"
        }')
    
    if echo "$tool_response" | grep -q "success.*true"; then
        print_success "Tool registered successfully"
        
        # Extract tool ID for further testing
        local tool_id=$(echo "$tool_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        # Test getting the tool
        if curl -s "http://localhost:3002/tools/$tool_id" > /dev/null 2>&1; then
            print_success "Tool retrieval successful"
        else
            print_warning "Tool retrieval failed"
        fi
    else
        print_error "Failed to register tool"
        echo "Response: $tool_response"
    fi
}

# Function to test workflow service
test_workflow_service() {
    print_status "Testing Workflow Service..."
    
    # Create a test workflow
    local workflow_response=$(curl -s -X POST http://localhost:3003/workflows \
        -H "Content-Type: application/json" \
        -H "x-user-id: test-user" \
        -d '{
            "name": "Test Workflow",
            "description": "A test workflow for demonstration",
            "bpmn_xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"><bpmn:process id=\"test-process\"><bpmn:startEvent id=\"start\"/></bpmn:process></bpmn:definitions>",
            "linked_prompts": [],
            "linked_tools": []
        }')
    
    if echo "$workflow_response" | grep -q "success.*true"; then
        print_success "Workflow created successfully"
        
        # Extract workflow ID for further testing
        local workflow_id=$(echo "$workflow_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        # Test getting the workflow
        if curl -s "http://localhost:3003/workflows/$workflow_id" > /dev/null 2>&1; then
            print_success "Workflow retrieval successful"
        else
            print_warning "Workflow retrieval failed"
        fi
    else
        print_error "Failed to create workflow"
        echo "Response: $workflow_response"
    fi
}

# Function to test AI oversight service
test_ai_oversight_service() {
    print_status "Testing AI Oversight Service..."
    
    # Test getting agents
    local agents_response=$(curl -s "http://localhost:3004/ai-review/agents")
    
    if echo "$agents_response" | grep -q "success.*true"; then
        print_success "Agents retrieved successfully"
        
        # Test getting findings
        local findings_response=$(curl -s "http://localhost:3004/ai-review/findings")
        
        if echo "$findings_response" | grep -q "success.*true"; then
            print_success "Findings retrieved successfully"
        else
            print_warning "Findings retrieval failed"
        fi
    else
        print_error "Failed to retrieve agents"
        echo "Response: $agents_response"
    fi
}

# Function to test LLM service
test_llm_service() {
    print_status "Testing LLM Service..."
    
    # Test provider status
    local providers_response=$(curl -s "http://localhost:3006/providers/status")
    
    if echo "$providers_response" | grep -q "providers"; then
        print_success "Provider status retrieved successfully"
        
        # Test completion endpoint with a simple request
        local completion_response=$(curl -s -X POST http://localhost:3006/v1/complete \
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
            
            # Test Swagger documentation
            if curl -s "http://localhost:3006/docs" > /dev/null 2>&1; then
                print_success "Swagger documentation is accessible"
            else
                print_warning "Swagger documentation not accessible"
            fi
        else
            print_warning "LLM completion failed (this is expected if no API keys are configured)"
            echo "Response: $completion_response"
        fi
    else
        print_error "Failed to get provider status"
        echo "Response: $providers_response"
    fi
}

# Main test execution
main() {
    print_status "Starting API tests..."
    
    # Test health endpoints
    test_health "Event Bus" 3005
    test_health "LLM Service" 3006
    test_health "Prompt Service" 3001
    test_health "Tool Service" 3002
    test_health "Workflow Service" 3003
    test_health "AI Oversight Service" 3004
    
    # Wait a moment for services to be fully ready
    sleep 2
    
    # Test service functionality
    test_llm_service
    test_prompt_service
    test_tool_service
    test_workflow_service
    test_ai_oversight_service
    
    print_success "API tests completed!"
    print_status "Check the logs directory for detailed service logs"
}

# Run tests
main "$@" 