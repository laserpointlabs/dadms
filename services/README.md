# DADM Modular Tiered Prompt-Agent-Tool Workflow System

This directory contains the microservices implementation of the DADM (Decision Analysis and Decision Management) system, featuring a modular, tiered architecture with AI oversight capabilities.

## System Architecture

The system consists of 4 core microservices and 1 shared component:

### Core Services

1. **Prompt Service** (Port 3001)
   - Manages prompt templates, validation, test cases, and scoring
   - CRUD operations for prompts with versioning
   - Test execution and validation
   - Event-driven architecture with AI oversight integration

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

2. **Make scripts executable:**
   ```bash
   chmod +x start-all.sh stop-all.sh
   ```

3. **Start all services:**
   ```bash
   ./start-all.sh
   ```

4. **Stop all services:**
   ```bash
   ./stop-all.sh
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
├── shared/
│   └── event-bus/         # Shared event bus component
├── data/                  # Persistent data storage
├── logs/                  # Service logs
├── docker-compose.yml     # Docker orchestration
├── start-all.sh          # Local startup script
├── stop-all.sh           # Local shutdown script
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

- `PORT`: Service port (defaults: 3001-3005)
- `EVENT_BUS_HOST`: Event bus hostname (default: localhost)
- `EVENT_BUS_PORT`: Event bus port (default: 3005)
- `NODE_ENV`: Environment (development/production)

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
