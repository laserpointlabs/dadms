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
