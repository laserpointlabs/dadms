# DADM Modular Tiered Prompt-Agent-Tool Workflow System

This directory contains the microservices implementation of the DADM (Decision Analysis and Decision Management) system, featuring a modular, tiered architecture with AI oversight capabilities.

## System Architecture

The system consists of 6 core microservices and 1 shared component:

### Core Services

1. **Prompt Service** (Port 3001)
   - Manages prompt templates, validation, test cases, and scoring
   - CRUD operations for prompts with versioning
   - Test execution and validation
   - Event-driven architecture with AI oversight integration
   - **Enhanced**: Now uses LLM Service for provider abstraction

2. **Tool Service** (Port 3002)
   - Registers and manages analysis tools (e.g., SysML, MATLAB, Scilab)
   - Tool health monitoring and status checks
   - Tool invocation and execution
   - Capability-based tool discovery

3. **Agent Workflow Service** (Port 3003)
   - BPMN-driven workflow orchestration
   - Workflow versioning and execution management
   - Step-by-step execution tracking
   - Integration with prompts and tools

4. **AI Oversight Service** (Port 3004)
   - Domain AI agents for review and analysis
   - Real-time event monitoring and analysis
   - Finding generation and management
   - Agent configuration and management

6. **LLM Service** (Port 3006) **🆕 NEW**
   - Unified LLM provider abstraction layer
   - Support for OpenAI, Ollama, and extensible provider framework
   - Smart model routing and cost optimization
   - Provider health monitoring and fallback logic
   - **Swagger Documentation**: Available at `/docs`

### Shared Components

5. **Event Bus** (Port 3005)
   - Centralized event communication between services
   - Event routing and delivery
   - Subscriber management
   - Event persistence and replay capabilities

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation and Setup

1. **Clone and navigate to the services directory:**
   ```bash
   cd services
   ```

2. **Make the unified management script executable:**
   ```bash
   chmod +x services.sh
   ```

3. **Unified Service Management:**
   ```bash
   # Start all services
   ./services.sh start
   
   # Stop all services
   ./services.sh stop
   
   # Check service status
   ./services.sh status
   
   # Run health checks
   ./services.sh health
   
   # Test all API endpoints
   ./services.sh test
   
   # View recent logs
   ./services.sh logs
   
   # Install dependencies for all services
   ./services.sh install
   
   # Build all services
   ./services.sh build
   ```

4. **Service-Specific Operations:**
   ```bash
   # Start specific service
   ./services.sh start --service llm-service
   
   # Stop service by port
   ./services.sh stop --port 3006
   
   # Health check for specific service
   ./services.sh health --service prompt-service
   
   # View logs for specific service
   ./services.sh logs --service llm-service
   ```

5. **Get help and see all available commands:**
   ```bash
   ./services.sh --help
   ```

### Legacy Scripts (Still Available)

For compatibility, the original scripts are still available:
```bash
# Legacy startup/shutdown
./start-all.sh
./stop-all.sh
./test-api.sh
```

### Using Docker (Alternative)

If you prefer Docker:

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

## API Endpoints

### Prompt Service (http://localhost:3001)

- `GET /prompts` - Get all prompts
- `GET /prompts/:id` - Get prompt by ID
- `POST /prompts` - Create new prompt
- `PUT /prompts/:id` - Update prompt
- `DELETE /prompts/:id` - Delete prompt
- `POST /prompts/:id/test` - Test prompt

### Tool Service (http://localhost:3002)

- `GET /tools` - Get all tools
- `GET /tools/:id` - Get tool by ID
- `POST /tools` - Register new tool
- `PUT /tools/:id` - Update tool
- `DELETE /tools/:id` - Delete tool
- `POST /tools/:id/invoke` - Invoke tool
- `POST /tools/:id/health-check` - Check tool health

### Workflow Service (http://localhost:3003)

- `GET /workflows` - Get all workflows
- `GET /workflows/:id` - Get workflow by ID
- `POST /workflows` - Create new workflow
- `PUT /workflows/:id` - Update workflow
- `DELETE /workflows/:id` - Delete workflow
- `POST /workflows/:id/execute` - Execute workflow
- `GET /executions/:id` - Get execution status
- `GET /workflows/:id/executions` - Get workflow executions

### AI Oversight Service (http://localhost:3004)

- `POST /ai-review/events` - Submit event for review
- `GET /ai-review/findings` - Get findings with filters
- `POST /ai-review/findings/:id/resolve` - Resolve finding
- `GET /ai-review/agents` - Get all agents
- `POST /ai-review/agents/:id/enable` - Enable agent
- `POST /ai-review/agents/:id/disable` - Disable agent

### LLM Service (http://localhost:3006) 🆕

- `GET /health` - Service health check
- `GET /providers/status` - Get all provider statuses
- `POST /v1/complete` - LLM completion endpoint
- `GET /docs` - **Swagger API Documentation**

**LLM Completion Request:**
```json
{
  "prompt": "Your prompt text here",
  "model": "gpt-3.5-turbo", // optional, will auto-select if not provided
  "provider": "openai",     // optional, will auto-route if not provided
  "temperature": 0.7,       // optional
  "max_tokens": 1000       // optional
}
```

**Provider Support:**
- **OpenAI**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Ollama**: Local models (llama2, codellama, etc.)
- **Extensible**: Framework ready for Anthropic and other providers

**Smart Features:**
- Automatic provider selection based on cost and availability
- Fallback routing when primary provider fails
- Health monitoring and status reporting
- Cost estimation and optimization

## Example Usage

### Creating a Prompt

```bash
curl -X POST http://localhost:3001/prompts \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "text": "Analyze the following data and provide insights: {data}",
    "type": "tool-aware",
    "test_cases": [
      {
        "name": "Basic Test",
        "input": {"data": "sample data"},
        "expected_output": {"insights": "sample insights"},
        "enabled": true
      }
    ],
    "tags": ["analysis", "insights"]
  }'
```

### Registering a Tool

```bash
curl -X POST http://localhost:3002/tools \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "name": "Data Analyzer",
    "description": "Analyzes data and provides insights",
    "endpoint": "http://localhost:8080/analyze",
    "capabilities": ["analysis", "insights"],
    "version": "1.0.0"
  }'
```

### Creating a Workflow

```bash
curl -X POST http://localhost:3003/workflows \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "name": "Data Analysis Workflow",
    "description": "Workflow for analyzing data and generating insights",
    "bpmn_xml": "<bpmn:definitions>...</bpmn:definitions>",
    "linked_prompts": ["prompt-123"],
    "linked_tools": ["tool-456"]
  }'
```

### Checking AI Findings

```bash
curl -X GET "http://localhost:3004/ai-review/findings?entity_type=prompt&resolved=false"
```

## Event Flow

1. **User Action**: User performs an action (e.g., creates a prompt)
2. **Service Event**: Service emits event to event bus
3. **AI Review**: AI Oversight Service receives event and routes to appropriate agents
4. **Agent Analysis**: Domain agents analyze the event and generate findings
5. **Finding Storage**: Findings are stored and made available via API
6. **User Notification**: UI can fetch and display findings to user

## Development

### Project Structure

```
services/
├── prompt-service/          # Prompt management service
├── tool-service/           # Tool registration and management
├── workflow-service/       # BPMN workflow execution
├── ai-oversight-service/   # AI agents and oversight
├── llm-service/            # 🆕 LLM provider abstraction
├── shared/
│   └── event-bus/         # Shared event bus component
├── data/                  # Persistent data storage
├── logs/                  # Service logs
├── docker-compose.yml     # Docker orchestration
├── services.sh           # 🆕 Unified service management
├── start-all.sh          # Legacy startup script
├── stop-all.sh           # Legacy shutdown script
├── test-api.sh           # Legacy API testing script
└── README.md             # This file
```

### Adding New Agents

1. Create a new agent class in `ai-oversight-service/src/agents/`
2. Implement the `AgentReviewRequest` and `AgentReviewResponse` interfaces
3. Register the agent in `ai-oversight-service/src/index.ts`
4. Configure event types the agent should listen to

### Adding New Services

1. Create a new service directory with TypeScript configuration
2. Implement Express.js server with health check endpoint
3. Add event publishing for relevant actions
4. Update Docker Compose and startup scripts
5. Add service to the event bus subscriber list

## Configuration

### Environment Variables

**All Services:**
- `NODE_ENV`: Environment (development/production)
- `EVENT_BUS_HOST`: Event bus hostname (default: localhost)
- `EVENT_BUS_PORT`: Event bus port (default: 3005)

**Service-Specific Ports:**
- `PORT`: Service port (defaults: 3001-3006)
  - Prompt Service: 3001
  - Tool Service: 3002
  - Workflow Service: 3003
  - AI Oversight Service: 3004
  - Event Bus: 3005
  - LLM Service: 3006 🆕

**LLM Service Configuration:**
- `OPENAI_API_KEY`: OpenAI API key for GPT models
- `OLLAMA_BASE_URL`: Ollama server URL (default: http://localhost:11434)
- `DEFAULT_PROVIDER`: Default LLM provider (openai/ollama)
- `ENABLE_COST_OPTIMIZATION`: Enable cost-aware model selection

### Logging

All services use Winston for logging. Logs are written to:
- Console output
- `logs/{service-name}.log` files

## Monitoring and Health Checks

Each service provides a health check endpoint at `/health`:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3001-3005 are available
2. **Dependency issues**: Run `npm install` in each service directory
3. **Event bus connectivity**: Check that event bus is running before other services
4. **Database issues**: Ensure data directory is writable

### Debug Mode

To run services in debug mode, set the environment variable:

```bash
export DEBUG=*
./start-all.sh
```

### Logs

Check service logs in the `logs/` directory:

```bash
tail -f logs/prompt-service.log
tail -f logs/ai-oversight-service.log
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure all services start successfully
5. Test event flow and AI oversight integration

## License

This project is part of the DADM system and follows the same licensing terms.

## Unified Service Management 🆕

The new `services.sh` script provides comprehensive service orchestration with advanced features:

### Quick Commands
```bash
# Essential operations
./services.sh start           # Start all services
./services.sh stop            # Stop all services  
./services.sh status          # Show service status
./services.sh health          # Health check all services
./services.sh test            # Test all API endpoints

# Development operations
./services.sh install         # Install all dependencies
./services.sh build          # Build all services
./services.sh clean          # Clean build artifacts
./services.sh logs           # View recent logs
```

### Advanced Operations
```bash
# Service-specific management
./services.sh start --service llm-service
./services.sh stop --port 3006
./services.sh health --service prompt-service
./services.sh logs --service llm-service

# Bulk operations with filtering
./services.sh restart --exclude event-bus
./services.sh test --service "prompt-service,llm-service"
```

### Key Features
- **Smart Dependencies**: Starts services in proper order (Event Bus first)
- **Parallel Operations**: Concurrent health checks and testing for speed
- **Error Handling**: Detailed error messages and recovery suggestions
- **Port Management**: Stop services by port number
- **Selective Operations**: Include/exclude specific services
- **Color-Coded Output**: Visual feedback for operations
- **Comprehensive Testing**: Built-in API endpoint validation

### Migration from Legacy Scripts
```bash
# Old way (3 separate scripts)
./start-all.sh
./test-api.sh  
./stop-all.sh

# New way (single unified script)
./services.sh start
./services.sh test
./services.sh stop
```
