# DADM OpenAI Assistant Service

**Version**: 1.0.1  
**Last Updated**: June 5, 2025

## Overview

The DADM OpenAI Assistant Service provides an API gateway to OpenAI's Assistant API, enabling the DADM system to leverage advanced language models for decision analysis and decision-making tasks. It handles assistant creation, verification, and management of data files for RAG (Retrieval-Augmented Generation) capabilities. The service integrates with PostgreSQL-backed Camunda workflows for robust decision process management.

## Features

- **Assistant Management**: Creates and manages OpenAI Assistants
- **Thread Management**: Maintains conversation threads with process-level persistence
- **File Management**: Handles knowledge base file uploads for RAG
- **Database Integration**: Seamless integration with PostgreSQL-backed workflows
- **Consul Integration**: Auto-registers with Consul for service discovery
- **Health Monitoring**: Provides health endpoints for system monitoring
- **Stateful Operation**: Maintains assistant state across restarts
- **Enhanced Reliability**: Improved error handling and recovery mechanisms

## Thread Management

The service implements sophisticated thread management to maintain conversation continuity across multiple requests within the same business process. This enables coherent multi-step conversations in BPMN workflows.

### Process-Level Thread Persistence

When a `process_instance_id` is provided in task requests, the service:

1. **Creates or Reuses Threads**: Maps each unique combination of `process_instance_id` + `assistant_id` to a specific OpenAI thread
2. **Maintains Context**: All tasks within the same process instance share the same conversation thread
3. **Isolates Processes**: Different process instances use separate threads, ensuring conversation isolation
4. **Validates Thread Health**: Automatically checks if cached threads still exist on OpenAI and recreates if necessary

### Thread Lifecycle

```
Process Instance A (ID: proc_123)
├── Task 1 → Creates thread_abc123 
├── Task 2 → Reuses thread_abc123 (context preserved)
└── Task 3 → Reuses thread_abc123 (full conversation history)

Process Instance B (ID: proc_456) 
├── Task 1 → Creates thread_def456 (isolated from Process A)
└── Task 2 → Reuses thread_def456
```

### Benefits

- **Conversation Continuity**: Assistants remember previous interactions within a process
- **Context Preservation**: Critical for multi-step decision making workflows
- **Process Isolation**: Prevents cross-contamination between different business processes
- **Automatic Cleanup**: Invalid or expired threads are automatically detected and replaced

## API Endpoints

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: Basic health status for Consul discovery
- **Example Response**:
  ```json
  {
    "status": "healthy",
    "service": "dadm-openai-assistant",
    "version": "1.0.0",
    "assistant_id": "asst_abc123...",
    "uptime": 3600.5
  }
  ```

### Create or Verify Assistant
- **URL**: `/api/assistant/setup`
- **Method**: `POST`
- **Response**: Information about the created or verified assistant
- **Example Request**:
  ```json
  {
    "name": "DADM Decision Analysis Assistant",
    "instructions": "You are a decision analysis expert...",
    "model": "gpt-4o",
    "tools": ["retrieval"]
  }
  ```

### Run Query
- **URL**: `/api/assistant/query`
- **Method**: `POST`
- **Response**: Response from the assistant
- **Example Request**:
  ```json
  {
    "query": "Analyze this decision problem...",
    "thread_id": "thread_abc123..." // Optional
  }
  ```

### Manage Files
- **URL**: `/api/assistant/files`
- **Method**: `POST`
- **Response**: Information about the uploaded files
- **Example Request**:
  ```json
  {
    "action": "upload",
    "file_paths": ["/path/to/file1.pdf", "/path/to/file2.md"],
    "replace_existing": false 
  }
  ```

### Process Task (Primary Endpoint)
- **URL**: `/process_task`
- **Method**: `POST`
- **Description**: Main endpoint for processing tasks with thread persistence support
- **Example Request**:
  ```json
  {
    "task_description": "Analyze the decision to implement a new software system",
    "task_id": "task_12345",
    "task_name": "Software Decision Analysis",
    "task_documentation": "Consider cost, time, and technical factors",
    "variables": {
      "budget": "$100,000",
      "timeline": "6 months",
      "team_size": 5
    },
    "process_instance_id": "proc_instance_abc123"
  }
  ```
- **Example Response**:
  ```json
  {
    "status": "success",
    "task_id": "task_12345",
    "result": {
      "assistant_id": "asst_UNOI30oiCpdalzRdeLM00qnP",
      "processed_at": "2025-06-11 16:02:11",
      "processed_by": "OpenAI Assistant (DADM Decision Analysis Assistant)",
      "recommendation": "{ ... structured decision analysis ... }",
      "thread_id": "thread_x83GsMOGVrVhG6qeCASIImgY"
    },
    "timestamp": "2025-06-11T16:02:11.531164",
    "approach": "name_based_discovery"
  }
  ```

#### Thread Persistence Behavior

- **With `process_instance_id`**: Tasks with the same process instance ID will reuse the same OpenAI thread, maintaining conversation continuity
- **Without `process_instance_id`**: Each task creates a new thread (legacy behavior)
- **Thread Validation**: The service automatically verifies thread existence and recreates if necessary
- **Process Isolation**: Different process instances always use separate threads

## Configuration

The OpenAI Assistant service can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for authentication | None (Required) |
| `ASSISTANT_NAME` | Name of the OpenAI assistant | DADM Decision Analysis Assistant |
| `ASSISTANT_MODEL` | Model to use for the assistant | gpt-4o |
| `CONSUL_HTTP_ADDR` | Address of the Consul service | localhost:8500 |
| `SERVICE_HOST` | Host name for this service | openai-service |
| `PORT` | Port for the API | 5000 |
| `USE_CONSUL` | Whether to register with Consul | true |

## Usage

The OpenAI Assistant service is typically started via Docker Compose as defined in the DADM `docker-compose.yml` file:

```yaml
openai-service:
  build:
    context: ..
    dockerfile: services/openai_service/Dockerfile
  container_name: openai-service
  ports:
    - "5000:5000"
  environment:
    - PORT=5000
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - ASSISTANT_NAME=${ASSISTANT_NAME:-DADM Decision Analysis Assistant}
    - ASSISTANT_MODEL=${ASSISTANT_MODEL:-gpt-4o}
    - CONSUL_HTTP_ADDR=consul:8500
    - SERVICE_HOST=openai-service
    - USE_CONSUL=true
  volumes:
    - ../config:/app/config
    - ../data:/app/data
  restart: unless-stopped
```

The service can also be run directly as a Python module:

```bash
python -m services.openai_service.service
```

## Dependencies

- Flask: Web server for API endpoints
- OpenAI: Client library for OpenAI API
- Requests: HTTP client for service communication
- Python-dotenv: Environment variable management
- Consul Client: Service discovery integration

## File Storage

Knowledge base files for the assistant are stored in:
- `/app/data/` (within container)
- `data/` (host mapped volume)

Assistant IDs are persisted in:
- `/app/logs/assistant_id.json` (within container)
- `logs/assistant_id.json` (host mapped volume)

## Docker Configuration

Example docker-compose configuration for the OpenAI service:

```yaml
openai-service:
  build:
    context: ..
    dockerfile: services/openai_service/Dockerfile
  container_name: openai-service
  ports:
    - "5000:5000"
  environment:
    - PORT=5000
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - ASSISTANT_NAME=${ASSISTANT_NAME:-DADM Decision Analysis Assistant}
    - ASSISTANT_MODEL=${ASSISTANT_MODEL:-gpt-4o}
    - CONSUL_HTTP_ADDR=consul:8500
    - SERVICE_HOST=openai-service
    - QDRANT_HOST=qdrant
    - NEO4J_URI=bolt://neo4j:7687
    - ENABLE_QDRANT=true
    - ENABLE_NEO4J=true
  volumes:
    - ../config:/app/config
    - ../services/openai_service/data:/app/services/openai_service/data
  restart: unless-stopped
  depends_on:
    - consul
    - qdrant
    - neo4j
```

## Enhanced Features (v1.0.1)

### PostgreSQL Integration
- **Workflow Persistence**: Seamless integration with PostgreSQL-backed Camunda workflows
- **Enhanced Reliability**: No data size limitations, supporting complex decision processes
- **Scalable Storage**: Production-ready database backend for enterprise use

### Database Connectivity
- **Connection Pooling**: Efficient database connection management
- **Retry Logic**: Automatic retry with exponential backoff for database operations
- **Health Monitoring**: Continuous monitoring of database connectivity

### Error Handling
- **Graceful Degradation**: Service continues operating even if some databases are unavailable
- **Detailed Logging**: Comprehensive error logging for troubleshooting
- **Recovery Mechanisms**: Automatic recovery when services become available

## Troubleshooting

### Database Connectivity Issues
1. **PostgreSQL Connection**:
   - Verify Camunda database is accessible
   - Check network connectivity between containers
   - Validate PostgreSQL credentials

2. **Neo4j Connection**:
   - Ensure Neo4j container is running
   - Verify bolt://neo4j:7687 is accessible
   - Check Neo4j authentication credentials

3. **Qdrant Connection**:
   - Confirm Qdrant service is healthy
   - Verify qdrant:6333 port accessibility
   - Check vector database initialization

### Assistant Issues
1. **Assistant Creation Fails**:
   - Verify OpenAI API key validity and credits
   - Check internet connectivity from container
   - Review API rate limits and quotas

2. **Knowledge Base Not Working**:
   - Ensure files are uploaded successfully
   - Verify supported file formats (PDF, Markdown, Word)
   - Confirm assistant has retrieval capability enabled

3. **Service Registration Issues**:
   - Check Consul service is running
   - Verify CONSUL_HTTP_ADDR environment variable
   - Ensure USE_CONSUL is set to true

## Development Notes

### Version 1.0.1 Changes
- Enhanced database integration with PostgreSQL
- Improved error handling and recovery mechanisms
- Added comprehensive health monitoring
- Updated documentation for new database architecture

### Future Enhancements
- Advanced caching mechanisms for improved performance
- Custom function calling for specialized decision tasks
- Enhanced monitoring and metrics collection
- Support for multiple assistant instances
