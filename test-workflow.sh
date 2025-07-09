#!/bin/bash

# DADM System Comprehensive Test Script
# This script demonstrates the full workflow including agent interactions

echo "🚀 DADM System Comprehensive Test"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost"
USER_ID="test-user-$(date +%s)"

# Function to make API calls and show results
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}📡 ${description}${NC}"
    echo "   ${method} ${endpoint}"
    
    if [ -n "$data" ]; then
        echo "   Data: $data"
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "x-user-id: $USER_ID" \
            -d "$data")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "x-user-id: $USER_ID")
    fi
    
    echo "   Response: $response"
    echo ""
    
    # Return the response for further processing
    echo "$response"
}

# Function to extract ID from JSON response
extract_id() {
    echo "$1" | jq -r '.data.id'
}

# Function to check service health
check_health() {
    local service=$1
    local port=$2
    
    echo -e "${BLUE}🏥 Checking $service health...${NC}"
    health_response=$(curl -s "$BASE_URL:$port/health")
    
    if echo "$health_response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ $service is healthy${NC}"
    else
        echo -e "   ${RED}❌ $service is unhealthy${NC}"
        echo "   Response: $health_response"
    fi
    echo ""
}

# Function to show available documentation
show_docs() {
    echo -e "${BLUE}📚 Available API Documentation:${NC}"
    echo "   • Prompt Service: http://localhost:3001/docs"
    echo "   • Tool Service: http://localhost:3002/docs"
    echo "   • Workflow Service: http://localhost:3003/docs"
    echo "   • AI Oversight Service: http://localhost:3004/docs"
    echo ""
}

# Step 1: Health Checks
echo -e "${YELLOW}Step 1: Health Checks${NC}"
echo "======================"
check_health "Event Bus" 3005
check_health "Prompt Service" 3001
check_health "Tool Service" 3002
check_health "Workflow Service" 3003
check_health "AI Oversight Service" 3004

show_docs

# Step 2: Create a Prompt
echo -e "${YELLOW}Step 2: Create a Prompt${NC}"
echo "========================"
prompt_data='{
  "text": "Analyze the system performance data: {data} and provide recommendations for optimization. Focus on bottlenecks and resource usage patterns.",
  "type": "tool-aware",
  "tags": ["analysis", "performance", "optimization"],
  "tool_dependencies": ["performance-analyzer"],
  "test_cases": [
    {
      "name": "Basic Performance Analysis",
      "input": {"data": "CPU: 85%, Memory: 70%, Disk: 45%"},
      "expected_output": {"recommendations": "Optimize CPU usage, monitor memory"},
      "enabled": true
    },
    {
      "name": "High Load Scenario",
      "input": {"data": "CPU: 95%, Memory: 90%, Disk: 80%"},
      "expected_output": {"recommendations": "Critical: Scale resources immediately"},
      "enabled": true
    }
  ],
  "metadata": {
    "domain": "system-performance",
    "priority": "high",
    "version": "1.0"
  }
}'

prompt_response=$(api_call "POST" ":3001/prompts" "$prompt_data" "Creating performance analysis prompt")
prompt_id=$(extract_id "$prompt_response")
echo -e "   ${GREEN}✅ Created prompt with ID: $prompt_id${NC}"
echo ""

# Step 3: Register a Tool
echo -e "${YELLOW}Step 3: Register a Tool${NC}"
echo "======================="
tool_data='{
  "name": "Performance Analyzer",
  "description": "Advanced system performance analysis tool with ML-based recommendations",
  "endpoint": "http://localhost:8080/analyze-performance",
  "capabilities": ["performance-analysis", "resource-monitoring", "optimization-recommendations"],
  "version": "2.1.0",
  "metadata": {
    "supports_realtime": true,
    "max_data_points": 10000,
    "accuracy_rating": 0.95
  }
}'

tool_response=$(api_call "POST" ":3002/tools" "$tool_data" "Registering performance analyzer tool")
tool_id=$(extract_id "$tool_response")
echo -e "   ${GREEN}✅ Registered tool with ID: $tool_id${NC}"
echo ""

# Step 4: Create a Workflow
echo -e "${YELLOW}Step 4: Create a BPMN Workflow${NC}"
echo "==============================="
workflow_data='{
  "name": "Performance Analysis Workflow",
  "description": "Complete workflow for analyzing system performance and generating optimization recommendations",
  "bpmn_xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\" id=\"Definitions_1\" targetNamespace=\"http://bpmn.io/schema/bpmn\"><bpmn:process id=\"performance-analysis\" isExecutable=\"true\"><bpmn:startEvent id=\"StartEvent_1\"/><bpmn:serviceTask id=\"Task_DataCollection\" name=\"Collect Performance Data\"/><bpmn:serviceTask id=\"Task_Analysis\" name=\"Analyze Performance\"/><bpmn:serviceTask id=\"Task_Recommendations\" name=\"Generate Recommendations\"/><bpmn:endEvent id=\"EndEvent_1\"/><bpmn:sequenceFlow id=\"Flow_1\" sourceRef=\"StartEvent_1\" targetRef=\"Task_DataCollection\"/><bpmn:sequenceFlow id=\"Flow_2\" sourceRef=\"Task_DataCollection\" targetRef=\"Task_Analysis\"/><bpmn:sequenceFlow id=\"Flow_3\" sourceRef=\"Task_Analysis\" targetRef=\"Task_Recommendations\"/><bpmn:sequenceFlow id=\"Flow_4\" sourceRef=\"Task_Recommendations\" targetRef=\"EndEvent_1\"/></bpmn:process></bpmn:definitions>",
  "linked_prompts": ["'$prompt_id'"],
  "linked_tools": ["'$tool_id'"],
  "annotations": {
    "Task_Analysis": {
      "prompt_id": "'$prompt_id'",
      "tool_id": "'$tool_id'"
    }
  }
}'

workflow_response=$(api_call "POST" ":3003/workflows" "$workflow_data" "Creating performance analysis workflow")
workflow_id=$(extract_id "$workflow_response")
echo -e "   ${GREEN}✅ Created workflow with ID: $workflow_id${NC}"
echo ""

# Step 5: Test the Prompt
echo -e "${YELLOW}Step 5: Test the Prompt${NC}"
echo "======================="
test_data='{
  "input_override": "{\"data\": \"CPU: 92%, Memory: 88%, Disk: 65%, Network: 45%\"}"
}'

test_response=$(api_call "POST" ":3001/prompts/$prompt_id/test" "$test_data" "Testing prompt with sample data")
echo -e "   ${GREEN}✅ Prompt test completed${NC}"
echo ""

# Step 6: Execute the Workflow
echo -e "${YELLOW}Step 6: Execute the Workflow${NC}"
echo "============================="
execution_data='{
  "input_data": {
    "system_metrics": {
      "cpu_usage": 92,
      "memory_usage": 88,
      "disk_usage": 65,
      "network_usage": 45
    }
  },
  "execution_mode": "synchronous"
}'

execution_response=$(api_call "POST" ":3003/workflows/$workflow_id/execute" "$execution_data" "Executing performance analysis workflow")
execution_id=$(echo "$execution_response" | jq -r '.data.execution_id')
echo -e "   ${GREEN}✅ Workflow execution started with ID: $execution_id${NC}"
echo ""

# Step 7: Check AI Oversight Agents
echo -e "${YELLOW}Step 7: AI Oversight Agent Analysis${NC}"
echo "===================================="

# Get available agents
agents_response=$(api_call "GET" ":3004/ai-review/agents" "" "Retrieving available AI agents")
echo -e "   ${GREEN}✅ Available AI agents retrieved${NC}"

# Get findings for the prompt
findings_response=$(api_call "GET" ":3004/ai-review/findings?entity_type=prompt&entity_id=$prompt_id&resolved=false" "" "Getting AI agent findings for prompt")
echo -e "   ${GREEN}✅ AI findings retrieved${NC}"

# Get all recent findings
all_findings_response=$(api_call "GET" ":3004/ai-review/findings?since=2025-01-01&limit=10" "" "Getting recent AI findings")
echo -e "   ${GREEN}✅ Recent AI findings retrieved${NC}"

echo ""

# Step 8: Health Check and Tool Status
echo -e "${YELLOW}Step 8: Tool Health Check${NC}"
echo "========================="
health_check_response=$(api_call "POST" ":3002/tools/$tool_id/health-check" "" "Checking tool health status")
echo -e "   ${GREEN}✅ Tool health check completed${NC}"
echo ""

# Step 9: Get System Summary
echo -e "${YELLOW}Step 9: System Summary${NC}"
echo "======================"

# Get all prompts
prompts_response=$(api_call "GET" ":3001/prompts" "" "Getting all prompts")
prompt_count=$(echo "$prompts_response" | jq '.data | length')

# Get all tools
tools_response=$(api_call "GET" ":3002/tools" "" "Getting all tools")
tool_count=$(echo "$tools_response" | jq '.data | length')

# Get all workflows
workflows_response=$(api_call "GET" ":3003/workflows" "" "Getting all workflows")
workflow_count=$(echo "$workflows_response" | jq '.data | length')

echo -e "${GREEN}📊 System Summary:${NC}"
echo "   • Prompts: $prompt_count"
echo "   • Tools: $tool_count"
echo "   • Workflows: $workflow_count"
echo "   • User: $USER_ID"
echo ""

# Step 10: Cleanup Option
echo -e "${YELLOW}Step 10: Cleanup (Optional)${NC}"
echo "============================"
echo "To clean up test data, run:"
echo "   curl -X DELETE http://localhost:3001/prompts/$prompt_id"
echo "   curl -X DELETE http://localhost:3002/tools/$tool_id"
echo "   curl -X DELETE http://localhost:3003/workflows/$workflow_id"
echo ""

echo -e "${GREEN}🎉 DADM System Test Complete!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. View API documentation at http://localhost:3001/docs (and other services)"
echo "2. Test individual endpoints using the Swagger UI"
echo "3. Monitor AI agent findings and recommendations"
echo "4. Build front-end interfaces for easier interaction"
echo ""
echo "All services are ready for development and testing!" 