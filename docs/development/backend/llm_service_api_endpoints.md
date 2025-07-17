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