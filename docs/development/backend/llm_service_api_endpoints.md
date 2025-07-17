# LLM Service – API Endpoint Specification

This document details the API endpoints for the LLM Service in DADMS 2.0, including endpoint paths, HTTP methods, descriptions, and example request/response schemas for prompt generation, tool calling, and model/persona management.

---

## Endpoints Summary

| Method | Path                | Description                                 | Request Body / Params         | Response Body                | Auth? |
|--------|---------------------|---------------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/llm/generate`     | Generate a completion from a prompt         | LLMGenerateRequest (JSON)     | LLMGenerateResponse (JSON)   | Yes   |
| POST   | `/llm/tool-call`    | LLM function/tool calling                   | LLMToolCallRequest (JSON)     | LLMToolCallResponse (JSON)   | Yes   |
| GET    | `/llm/models`       | List available LLM models/providers         | None                          | Array of LLMModel            | Yes   |
| GET    | `/llm/providers`    | List available LLM providers and status     | None                          | Array of LLMProvider         | Yes   |
| GET    | `/llm/personas`     | List available personas/system prompts      | None                          | Array of Persona             | Yes   |
| POST   | `/llm/estimate`     | Estimate token/cost for a prompt (optional) | LLMEstimateRequest (JSON)     | LLMEstimateResponse (JSON)   | Yes   |
| GET    | `/llm/health`        | Service health/readiness check              | None                          | HealthStatus (JSON)          | No    |

---

### HealthStatus (Response)
```json
{
  "status": "ok",
  "uptime": 123456,
  "version": "1.0.0"
}
```

---

## Example Schemas

### LLMGenerateRequest
```json
{
  "prompt": "string",
  "model": "string",
  "persona": "string",
  "tools": [
    {
      "name": "string",
      "description": "string",
      "parameters": { "type": "object" }
    }
  ],
  "stream": false
}
```

### LLMGenerateResponse
```json
{
  "completion": "string",
  "model": "string",
  "persona": "string",
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 100,
    "total_tokens": 142,
    "cost": 0.0021
  }
}
```

### LLMToolCallRequest
```json
{
  "prompt": "string",
  "model": "string",
  "persona": "string",
  "tools": [
    {
      "name": "string",
      "description": "string",
      "parameters": { "type": "object" }
    }
  ]
}
```

### LLMToolCallResponse
```json
{
  "completion": "string",
  "tool_calls": [
    {
      "tool": "string",
      "arguments": { "type": "object" },
      "result": { "type": "object" }
    }
  ],
  "model": "string",
  "persona": "string",
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 100,
    "total_tokens": 142,
    "cost": 0.0021
  }
}
```

### LLMModel (Response)
```json
{
  "id": "string",
  "name": "string",
  "provider": "string",
  "description": "string",
  "capabilities": ["completion", "tool_calling", "streaming"]
}
```

### Persona (Response)
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "system_prompt": "string"
}
```

### LLMEstimateRequest
```json
{
  "prompt": "string",
  "model": "string"
}
```

### LLMEstimateResponse
```json
{
  "prompt_tokens": 42,
  "estimated_cost": 0.0012
}
```

### LLMProvider (Response)
```json
{
  "id": "string",
  "name": "string",
  "status": "healthy",
  "models": ["string"],
  "capabilities": ["completion", "tool_calling", "streaming"],
  "quota": { "used": 12000, "limit": 1000000 }
}
```

### Supported Generation Parameters

The following optional parameters can be included in LLM generation requests:
- `temperature` (float, 0–2, default 1.0): Controls randomness/creativity.
- `top_p` (float, 0–1, default 1.0): Nucleus sampling.
- `max_tokens` (int, default 256 or provider default): Maximum output length.
- `presence_penalty` (float, -2–2, optional): Penalizes new topics.
- `frequency_penalty` (float, -2–2, optional): Penalizes repetition.
- `stop` (array of strings, optional): Stop sequences.

**Note:** Unsupported parameters are ignored for models/providers that do not use them. The `/llm/models` or `/llm/providers` endpoint may return which parameters are supported by each model/provider.

#### Example LLMGenerateRequest with Parameters
```json
{
  "prompt": "string",
  "model": "string",
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 256,
  "presence_penalty": 0.5,
  "frequency_penalty": 0.0,
  "stop": ["\n", "User:"],
  "stream": true
}
```

---

## Tool Calling: Concrete Example & Orchestrator Flow

### 1. Tool Definition (JSON Schema)
A tool is defined by its name, description, parameter schema, and endpoint. Example for a simple search tool:

```json
{
  "name": "search",
  "description": "Searches the internal knowledge base for relevant documents.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "The search query." },
      "top_k": { "type": "integer", "default": 3, "description": "Number of results to return." }
    },
    "required": ["query"]
  },
  "endpoint": "http://tool-server/search"
}
```

### 2. Example LLM Tool Call (LLM Output)
When prompted with the tool definition, the LLM may return a tool call like:

```json
{
  "tool": "search",
  "arguments": {
    "query": "weather in Paris",
    "top_k": 2
  }
}
```

### 3. Orchestrator Flow
1. **Receive LLM tool call output** (as above).
2. **Look up tool definition** (from registry/config).
3. **Call the tool server** at the specified endpoint with the arguments:
   - POST to `http://tool-server/search` with body:
     ```json
     { "query": "weather in Paris", "top_k": 2 }
     ```
4. **Receive tool server response**:
   ```json
   { "results": ["It is sunny in Paris.", "Rain expected tomorrow."] }
   ```
5. **Inject tool result** back into the LLM context for further reasoning or as the final answer.

### 4. Summary Table
| Component      | Role                                      | Data Format |
|----------------|-------------------------------------------|-------------|
| Tool Definition| Name, description, param schema, endpoint  | JSON        |
| LLM API        | Accepts tool list, returns tool calls      | JSON        |
| Orchestrator   | Executes tool calls, injects results       | JSON        |
| Tool Server    | Implements tool logic, exposes API         | JSON        |

### 5. When to Use a Separate Document
If your tool orchestration becomes complex (e.g., many tool types, advanced routing, multi-step workflows, or cross-service orchestration), consider breaking this out into a dedicated document (e.g., `tool_orchestration.md`) for deeper design, patterns, and implementation details.

---

## Persona and Tool Handling: Hybrid Pass-Through and Caching Pattern

### Overview
- **Personas and tools are managed in the Context Manager** (source of truth for governance, versioning, and sharing).
- **LLM Service acts as a proxy** for `/llm/personas` and `/llm/tool-call`, fetching from the Context Manager.
- **Redis caching** is used in the LLM Service to store recently fetched personas/tools for resilience and performance.
- **Clients may also supply the full persona/tool object** in the request for stateless, advanced, or fallback operation.

### Request Patterns
- **Proxy by ID (default):**
  ```json
  {
    "prompt": "Explain quantum computing.",
    "model": "gpt-4",
    "persona_id": "expert-educator"
  }
  ```
  (LLM Service fetches persona from Context Manager, caches in Redis)

- **Client-supplied Persona (stateless/fallback):**
  ```json
  {
    "prompt": "Explain quantum computing.",
    "model": "gpt-4",
    "persona": {
      "id": "expert-educator",
      "name": "Expert Educator",
      "system_prompt": "You are a patient, expert science educator...",
      "tools": [ ... ]
    }
  }
  ```
  (LLM Service uses the supplied persona directly)

### Caching and Fallback Behavior
- **Redis is used as the cache backend** for personas and tools in the LLM Service.
- If the Context Manager is unavailable, the LLM Service uses the last-known-good persona/tool from Redis.
- If neither the Context Manager nor cache is available, the client must supply the full persona/tool object, or a default/safe persona is used.

### LLM Auto-Selecting Persona
- Optionally, the client can send a list of available personas (like tools) and let the LLM select the best one.
- The LLM can return a persona selection as part of its output, or the orchestrator can select before calling the LLM.

### Summary Table
| Pattern                | LLM Service Stores | Pros                        | Cons                        | Best For                |
|------------------------|-------------------|-----------------------------|-----------------------------|-------------------------|
| Pass-through           | No                | Clean, centralized          | Proxy dependency            | Clean arch, governance  |
| Pass-through + cache   | No (cache only)   | Resilient, centralized      | Cache complexity            | Most robust             |
| Client-supplied        | No                | Stateless, flexible         | Larger requests             | Advanced, dynamic flows |
| Hybrid                 | No (cache opt.)   | Flexible, robust            | More code paths             | Large/complex systems   |

### Implementation Note
- **Redis is recommended as the cache backend** for personas and tools in the LLM Service, enabling high availability and fast lookups.
- This hybrid approach enables robust governance, resilience, and advanced use cases for persona and tool management in DADMS.

---

## Planned: Asynchronous LLM Generation & Event Bus Integration

To support high-throughput, event-driven, or background LLM tasks (such as those triggered by the AAS or event bus), the LLM Service will support asynchronous generation in a future release.

### Async Pattern & Endpoints (Planned)
- `POST /llm/generate-async` — Submit a generation request, receive a job/task ID immediately.
- `GET /llm/generate/{job_id}/status` — Poll for job status and result.
- (Optional) Register a webhook for result delivery.
- (Optional) Integrate with the event bus for decoupled, scalable workflows.

#### Example Async Request
```json
POST /llm/generate-async
{
  "prompt": "string",
  "model": "string",
  "stream": false
}
```

#### Example Async Response
```json
{
  "job_id": "abc123",
  "status": "pending"
}
```

#### Example Status Polling
```json
GET /llm/generate/abc123/status
{
  "status": "completed",
  "result": { "completion": "..." }
}
```

### Event Bus Integration (Planned)
- The LLM Service may subscribe to a topic (e.g., `aas.llm.requests`) and publish results to another (e.g., `aas.llm.results`).
- Enables decoupled, scalable, and resilient LLM workflows for AAS and other services.

### When to Use Async vs Sync
| Pattern         | Pros                        | Cons                        | When to Use                |
|-----------------|----------------------------|-----------------------------|----------------------------|
| Synchronous     | Simple, real-time           | Blocks, not scalable        | UI, low volume, quick calls|
| Asynchronous    | Scalable, non-blocking      | More complex, needs infra   | Event bus, batch, high volume, AAS|

**Note:** These async features are planned for future implementation and are not part of the MVP.

---

## Planned: Additional Endpoints for Robustness & Compliance

The following endpoints are planned for future implementation to enhance robustness, monitoring, and compliance:

- **Rate Limiting/Quota:**
  - `GET /llm/rate-limit` — Returns current usage and quota for the user/service.
  - Example response:
    ```json
    { "limit": 10000, "used": 123, "reset_in": 3600 }
    ```

- **Audit Log:**
  - `GET /llm/audit-log` — Returns recent LLM/tool calls for the user/service (for compliance and debugging).
  - Example response:
    ```json
    [
      { "timestamp": "2024-06-01T12:00:00Z", "action": "generate", "model": "gpt-4", "user": "alice" }
    ]
    ```

- **Input/Output Size Limits:**
  - Documented in API docs and enforced in the backend. Optionally, expose via `GET /llm/limits`.
  - Example response:
    ```json
    { "max_prompt_tokens": 4096, "max_completion_tokens": 1024 }
    ```

**Note:** These endpoints are planned for future releases and are not part of the MVP.

---

## Notes
- **Authentication:** All endpoints require authentication (e.g., JWT or session-based; to be specified in implementation).
- **Streaming:** The `/llm/generate` endpoint supports streaming responses for long completions (set `stream: true`).
- **Error Handling:** Error responses follow a standard error schema, e.g.:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string (optional)"
  }
}
```

- **Provider Health/Status:** The `/llm/providers` endpoint returns the status and capabilities of each configured provider for diagnostics and UI/UX.
- **Extensibility:** The service is designed to support multiple providers (OpenAI, Ollama, Claude, etc.), tool/function calling, and dynamic provider management.
- **Generation Parameters:** The API supports standard LLM generation parameters (see above). Providers/models may support a subset; unsupported parameters are ignored.
- **Provider Capabilities:** The `/llm/models` or `/llm/providers` endpoint can return which parameters are supported by each model/provider for dynamic UI/UX and validation.

---

**This document serves as the reference for LLM Service API design and implementation.** 