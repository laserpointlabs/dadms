# DADM Ollama Assistant Service

This service provides a local LLM backed by [Ollama](https://ollama.com/). It is designed to be called from BPMN service tasks via the DADM `ServiceOrchestrator`. The service exposes a simple HTTP API and registers itself in Consul for discovery.

## Features

- Uses the `mistral` model running on an Ollama server
- Thread management stored in Qdrant for conversation continuity
- Retrieval augmented generation using file chunks stored in Qdrant
- Results are stored using the DADM Analysis Data Manager
- JSON responses for easy consumption by BPMN workflows

## Endpoints

- `GET /health` – basic health check
- `POST /process` – process a task with optional `process_instance_id`
- `POST /upload_files` – upload one or more files for retrieval augmentation
- `GET /files` – list uploaded files

## Running

The service is built via Docker and included in `docker-compose.yml`. It depends on the `ollama-server`, `qdrant`, and `consul` services.

## Detailed Usage Guide

### 1. Upload Documents for Context

Upload documents that will be used as context for conversations:

```bash
# Upload a single file
curl -X POST -F "files=@/path/to/document.txt" http://localhost:5300/upload_files

# Upload multiple files
curl -X POST \
  -F "files=@/path/to/doc1.txt" \
  -F "files=@/path/to/doc2.pdf" \
  http://localhost:5300/upload_files
```

Response example:
```json
{
    "status": "success",
    "results": [
        {"file": "doc1.txt", "chunks": 3},
        {"file": "doc2.pdf", "chunks": 5}
    ]
}
```

### 2. Check Available Documents

List all uploaded documents and their chunks:

```bash
curl http://localhost:5300/files
```

Response example:
```json
{
    "files": [
        {"name": "doc1.txt", "chunks": 3},
        {"name": "doc2.pdf", "chunks": 5}
    ]
}
```

### 3. Process Tasks/Queries

Send queries to the service and get responses:

```bash
# Start a new conversation
curl -X POST http://localhost:5300/process \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "analyze_documents",
    "task_description": "What are the main topics in the uploaded documents?",
    "variables": {
        "additional_context": "Focus on technical aspects"
    }
  }'

# Continue a conversation using thread_id
curl -X POST http://localhost:5300/process \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "f7afe5bb-6059-4514-90f3-87991ddf662a",
    "task_description": "Can you provide more details about the first topic?"
  }'

# Process within BPMN context
curl -X POST http://localhost:5300/process \
  -H "Content-Type: application/json" \
  -d '{
    "process_instance_id": "7890",
    "task_name": "technical_analysis",
    "task_description": "Analyze the technical requirements",
    "variables": {
        "requirements": ["req1", "req2"],
        "constraints": {"budget": 10000}
    }
  }'
```

Response example:
```json
{
    "success": true,
    "response": {
        "analysis": "The documents primarily discuss...",
        "key_points": ["point1", "point2"],
        "recommendations": ["rec1", "rec2"]
    },
    "thread_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 4. Health Check

Verify the service is running:

```bash
curl http://localhost:5300/health
```

Response:
```json
{
    "status": "healthy",
    "service": "dadm-ollama-assistant"
}
```

## Environment Variables

The service can be configured using these environment variables:

```bash
OLLAMA_HOST=http://localhost:11434  # Ollama API endpoint
QDRANT_HOST=localhost               # Qdrant host
QDRANT_PORT=6333                    # Qdrant port
PORT=5300                           # Service port
USE_CONSUL=true                     # Enable Consul registration
```

## Integration with BPMN

In your BPMN process, configure service tasks to use this service:

```xml
<bpmn:serviceTask id="Activity_1" name="Analyze Documents">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="assistant" />
      <camunda:property name="service.name" value="dadm-ollama-assistant" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```
