# Prompt Server Dervice  - Specification

## Goal:
Create a lightweight prompt server in Python using FastAPI. This server will expose a REST API to fetch, add, and update structured prompt templates. Each prompt can be associated with a task type (e.g., "engineering_review", "system_design"), and may optionally include related RAG (retrieval-augmented generation) document references.

## Features:
- FastAPI backend
- Endpoints:
  - GET /prompt/{id} — return prompt template by ID
  - GET /prompts — list all prompt templates
  - POST /prompt — add a new prompt (JSON)
  - PUT /prompt/{id} — update a prompt
- Store prompts in a JSON file (`prompts.json`)
- Prompt structure:
  ```json
  {
    "id": "engineering_review",
    "description": "Used for reviewing system requirements",
    "template": "You are an expert engineer reviewing: {input}. Focus on {criteria}.",
    "tags": ["engineering", "review", "LLM"],
    "rag_sources": ["/docs/regulations/faa.md"]
  }
```

- Add version control (timestamp or `version` field)
- Include simple CLI or script to validate prompt format

## Stretch Goals:

- Add Swagger UI with examples
- Add basic auth for updates
- Serve prompt variants (v1, v2, etc.)
- Link to Git-based versioning for syncing prompts

## Start with:

- `main.py` for FastAPI server
- `prompts.json` for storage
- Models in `pydantic` for schema enforcement

## Tools:

- Python 3.10+
- FastAPI
- Uvicorn
- Pydantic
- JSON flat file storage