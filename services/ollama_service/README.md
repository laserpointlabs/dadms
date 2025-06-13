# DADM Ollama Assistant Service

This service exposes a local Ollama model as a microservice so it can be called from BPMN workflows through the `ServiceOrchestrator`.

## Features
* Chat endpoint using Ollama models
* Optional thread persistence keyed by `process_instance_id`
* Integration with the Analysis Data Manager
* Consul registration support

## Usage
The `/process_task` endpoint accepts the same payload used for the OpenAI service. The service returns a JSON response with the assistant output.

Example request:
```json
{
  "task_description": "Evaluate cloud options",
  "task_id": "123",
  "task_name": "cloud_decision",
  "variables": {},
  "process_instance_id": "proc_1"
}
```

The response is wrapped in `{"result": { ... }}` so it can be consumed by the orchestrator.
