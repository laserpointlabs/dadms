# LLM Playground Service API Endpoints

## Overview

The LLM Playground Service provides an interactive interface for testing and experimenting with LLM models, prompts, personas, and tools. It enables users to test different configurations, evaluate responses, and validate prompts before using them in production workflows.

## Base URL
```
http://localhost:3006
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Models & Providers

### Get Available Models
**GET** `/api/models`

Returns a list of all available LLM models across all providers.

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "contextWindow": 8192,
      "maxTokens": 4096,
      "capabilities": ["text-generation", "function-calling", "vision"],
      "pricing": {
        "input": 0.03,
        "output": 0.06,
        "currency": "USD",
        "unit": "per_1k_tokens"
      },
      "status": "available"
    },
    {
      "id": "claude-3-sonnet",
      "name": "Claude 3 Sonnet",
      "provider": "anthropic",
      "contextWindow": 200000,
      "maxTokens": 4096,
      "capabilities": ["text-generation", "function-calling"],
      "pricing": {
        "input": 0.003,
        "output": 0.015,
        "currency": "USD",
        "unit": "per_1k_tokens"
      },
      "status": "available"
    }
  ]
}
```

### Get Model Details
**GET** `/api/models/{modelId}`

Returns detailed information about a specific model.

**Response:**
```json
{
  "id": "gpt-4",
  "name": "GPT-4",
  "provider": "openai",
  "description": "Most capable GPT-4 model for complex reasoning tasks",
  "contextWindow": 8192,
  "maxTokens": 4096,
  "capabilities": ["text-generation", "function-calling", "vision"],
  "parameters": {
    "temperature": {
      "min": 0,
      "max": 2,
      "default": 0.7,
      "description": "Controls randomness in responses"
    },
    "topP": {
      "min": 0,
      "max": 1,
      "default": 1,
      "description": "Controls diversity via nucleus sampling"
    },
    "maxTokens": {
      "min": 1,
      "max": 4096,
      "default": 1000,
      "description": "Maximum tokens to generate"
    }
  },
  "pricing": {
    "input": 0.03,
    "output": 0.06,
    "currency": "USD",
    "unit": "per_1k_tokens"
  },
  "status": "available",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Get Provider Status
**GET** `/api/providers/status`

Returns the status and health of all LLM providers.

**Response:**
```json
{
  "providers": [
    {
      "name": "openai",
      "status": "healthy",
      "models": 5,
      "rateLimit": {
        "requests": "3500",
        "tokens": "90000",
        "window": "per_minute"
      },
      "quota": {
        "used": 1500000,
        "limit": 10000000,
        "resetDate": "2024-02-01T00:00:00Z"
      },
      "lastCheck": "2024-01-15T10:30:00Z"
    },
    {
      "name": "anthropic",
      "status": "healthy",
      "models": 3,
      "rateLimit": {
        "requests": "100",
        "tokens": "50000",
        "window": "per_minute"
      },
      "quota": {
        "used": 500000,
        "limit": 5000000,
        "resetDate": "2024-02-01T00:00:00Z"
      },
      "lastCheck": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Prompt Testing & Execution

### Execute Prompt
**POST** `/api/prompts/execute`

Execute a prompt against a specified model with optional tools and context.

**Request Body:**
```json
{
  "modelId": "gpt-4",
  "prompt": "Analyze the following decision context and provide recommendations:",
  "systemPrompt": "You are an expert decision analyst with 20 years of experience.",
  "context": {
    "projectId": "proj-123",
    "domain": "military",
    "decisionType": "acquisition",
    "stakeholders": ["Col. Smith", "Maj. Johnson"]
  },
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 1000,
    "topP": 0.9
  },
  "tools": [
    {
      "name": "search_knowledge_base",
      "description": "Search the knowledge base for relevant documents",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          }
        },
        "required": ["query"]
      }
    }
  ],
  "stream": false,
  "metadata": {
    "sessionId": "session-456",
    "userId": "user-789",
    "purpose": "decision_analysis"
  }
}
```

**Response:**
```json
{
  "id": "exec-123",
  "modelId": "gpt-4",
  "prompt": "Analyze the following decision context and provide recommendations:",
  "response": "Based on the decision context provided, I recommend the following approach...",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 450,
    "totalTokens": 600,
    "estimatedCost": 0.027
  },
  "tools": [
    {
      "name": "search_knowledge_base",
      "input": {
        "query": "UAV acquisition criteria"
      },
      "output": {
        "documents": [
          {
            "id": "doc-123",
            "title": "UAV Acquisition Guidelines",
            "content": "Key criteria for UAV acquisition include..."
          }
        ]
      }
    }
  ],
  "metadata": {
    "sessionId": "session-456",
    "userId": "user-789",
    "executionTime": 2.3,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Stream Prompt Execution
**POST** `/api/prompts/execute/stream`

Execute a prompt with streaming response for real-time output.

**Request Body:** Same as `/api/prompts/execute`

**Response:** Server-Sent Events (SSE) stream
```
data: {"type": "start", "executionId": "exec-123"}

data: {"type": "content", "content": "Based on the decision context"}

data: {"type": "content", "content": " provided, I recommend"}

data: {"type": "tool_call", "tool": {"name": "search_knowledge_base", "input": {...}}}

data: {"type": "tool_result", "tool": {"name": "search_knowledge_base", "output": {...}}}

data: {"type": "content", "content": " the following approach..."}

data: {"type": "end", "usage": {...}, "metadata": {...}}
```

---

## Prompt Templates

### Get Prompt Templates
**GET** `/api/templates`

Returns available prompt templates organized by category.

**Response:**
```json
{
  "templates": [
    {
      "id": "decision-analysis",
      "name": "Decision Analysis",
      "category": "analysis",
      "description": "Template for analyzing decision contexts and providing recommendations",
      "prompt": "Analyze the following decision context:\n\nContext: {context}\n\nStakeholders: {stakeholders}\n\nProvide a structured analysis including:\n1. Key considerations\n2. Risk assessment\n3. Recommendations",
      "variables": ["context", "stakeholders"],
      "tags": ["decision", "analysis", "recommendation"],
      "usage": 45,
      "rating": 4.8,
      "createdBy": "user-123",
      "createdAt": "2024-01-10T10:00:00Z"
    },
    {
      "id": "risk-assessment",
      "name": "Risk Assessment",
      "category": "assessment",
      "description": "Template for conducting comprehensive risk assessments",
      "prompt": "Conduct a risk assessment for the following scenario:\n\nScenario: {scenario}\n\nConsider:\n- Technical risks\n- Operational risks\n- Financial risks\n- Timeline risks",
      "variables": ["scenario"],
      "tags": ["risk", "assessment", "analysis"],
      "usage": 32,
      "rating": 4.6,
      "createdBy": "user-456",
      "createdAt": "2024-01-12T14:30:00Z"
    }
  ]
}
```

### Create Prompt Template
**POST** `/api/templates`

Create a new prompt template.

**Request Body:**
```json
{
  "name": "Cost-Benefit Analysis",
  "category": "analysis",
  "description": "Template for conducting cost-benefit analysis",
  "prompt": "Conduct a cost-benefit analysis for the following proposal:\n\nProposal: {proposal}\n\nCosts: {costs}\n\nBenefits: {benefits}\n\nProvide a detailed analysis with recommendations.",
  "variables": ["proposal", "costs", "benefits"],
  "tags": ["cost", "benefit", "analysis"],
  "isPublic": true
}
```

### Update Prompt Template
**PUT** `/api/templates/{templateId}`

Update an existing prompt template.

### Delete Prompt Template
**DELETE** `/api/templates/{templateId}`

Delete a prompt template.

---

## Sessions & History

### Create Session
**POST** `/api/sessions`

Create a new testing session.

**Request Body:**
```json
{
  "name": "UAV Decision Analysis Session",
  "description": "Testing prompts for UAV acquisition decision analysis",
  "projectId": "proj-123",
  "tags": ["uav", "acquisition", "decision"]
}
```

**Response:**
```json
{
  "id": "session-456",
  "name": "UAV Decision Analysis Session",
  "description": "Testing prompts for UAV acquisition decision analysis",
  "projectId": "proj-123",
  "tags": ["uav", "acquisition", "decision"],
  "createdBy": "user-789",
  "createdAt": "2024-01-15T10:00:00Z",
  "executionCount": 0,
  "lastExecuted": null
}
```

### Get Session History
**GET** `/api/sessions/{sessionId}/history`

Returns the execution history for a session.

**Response:**
```json
{
  "sessionId": "session-456",
  "executions": [
    {
      "id": "exec-123",
      "modelId": "gpt-4",
      "prompt": "Analyze the UAV acquisition decision...",
      "response": "Based on the analysis...",
      "usage": {
        "promptTokens": 150,
        "completionTokens": 450,
        "totalTokens": 600,
        "estimatedCost": 0.027
      },
      "parameters": {
        "temperature": 0.7,
        "maxTokens": 1000
      },
      "executionTime": 2.3,
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  ],
  "summary": {
    "totalExecutions": 15,
    "totalTokens": 9000,
    "totalCost": 0.405,
    "averageExecutionTime": 2.1
  }
}
```

### Get User Sessions
**GET** `/api/sessions`

Returns all sessions for the current user.

**Query Parameters:**
- `projectId` (optional): Filter by project
- `limit` (optional): Number of sessions to return (default: 20)
- `offset` (optional): Number of sessions to skip (default: 0)

---

## Evaluation & Testing

### Run Probabilistic Test
**POST** `/api/evaluation/probabilistic`

Run a probabilistic test to evaluate prompt reliability.

**Request Body:**
```json
{
  "prompt": "Analyze the decision context and provide recommendations",
  "modelId": "gpt-4",
  "testCases": [
    {
      "input": {
        "context": "UAV acquisition decision",
        "stakeholders": ["Col. Smith", "Maj. Johnson"]
      },
      "expectedOutput": {
        "type": "contains",
        "keywords": ["recommendation", "analysis", "risk"]
      }
    }
  ],
  "parameters": {
    "runs": 10,
    "temperature": 0.7,
    "evaluationCriteria": ["completeness", "relevance", "structure"]
  }
}
```

**Response:**
```json
{
  "testId": "test-789",
  "prompt": "Analyze the decision context and provide recommendations",
  "modelId": "gpt-4",
  "results": {
    "totalRuns": 10,
    "successfulRuns": 9,
    "successRate": 0.9,
    "averageScore": 4.2,
    "executions": [
      {
        "runId": 1,
        "input": {...},
        "output": "Based on the analysis...",
        "score": 4.5,
        "passed": true,
        "feedback": "Good structure and comprehensive analysis"
      }
    ]
  },
  "summary": {
    "completeness": 0.95,
    "relevance": 0.88,
    "structure": 0.92
  },
  "recommendations": [
    "Consider adding more specific criteria for risk assessment",
    "Include cost-benefit analysis in the prompt"
  ]
}
```

### Get Evaluation Results
**GET** `/api/evaluation/{testId}`

Returns detailed results for a specific evaluation test.

---

## Tools & Integrations

### Get Available Tools
**GET** `/api/tools`

Returns all available tools that can be used with LLM prompts.

**Response:**
```json
{
  "tools": [
    {
      "name": "search_knowledge_base",
      "description": "Search the knowledge base for relevant documents",
      "category": "knowledge",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          },
          "limit": {
            "type": "integer",
            "description": "Maximum number of results",
            "default": 10
          }
        },
        "required": ["query"]
      },
      "examples": [
        {
          "query": "UAV acquisition criteria",
          "description": "Search for UAV acquisition guidelines"
        }
      ]
    },
    {
      "name": "calculate_metrics",
      "description": "Calculate various metrics and KPIs",
      "category": "analysis",
      "parameters": {
        "type": "object",
        "properties": {
          "metric": {
            "type": "string",
            "enum": ["roi", "npv", "irr", "payback_period"],
            "description": "Type of metric to calculate"
          },
          "data": {
            "type": "object",
            "description": "Input data for calculation"
          }
        },
        "required": ["metric", "data"]
      }
    }
  ]
}
```

### Test Tool
**POST** `/api/tools/{toolName}/test`

Test a specific tool with provided parameters.

**Request Body:**
```json
{
  "parameters": {
    "query": "UAV acquisition criteria",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "toolName": "search_knowledge_base",
  "parameters": {
    "query": "UAV acquisition criteria",
    "limit": 5
  },
  "result": {
    "documents": [
      {
        "id": "doc-123",
        "title": "UAV Acquisition Guidelines",
        "content": "Key criteria for UAV acquisition include...",
        "relevance": 0.95
      }
    ]
  },
  "executionTime": 0.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Analytics & Usage

### Get Usage Analytics
**GET** `/api/analytics/usage`

Returns usage analytics for the current user.

**Query Parameters:**
- `startDate` (optional): Start date for analytics (ISO 8601)
- `endDate` (optional): End date for analytics (ISO 8601)
- `groupBy` (optional): Group by day, week, month (default: day)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-15T23:59:59Z"
  },
  "summary": {
    "totalExecutions": 150,
    "totalTokens": 45000,
    "totalCost": 2.025,
    "averageExecutionTime": 2.3
  },
  "byModel": [
    {
      "modelId": "gpt-4",
      "executions": 100,
      "tokens": 30000,
      "cost": 1.35
    },
    {
      "modelId": "claude-3-sonnet",
      "executions": 50,
      "tokens": 15000,
      "cost": 0.675
    }
  ],
  "byDay": [
    {
      "date": "2024-01-15",
      "executions": 10,
      "tokens": 3000,
      "cost": 0.135
    }
  ]
}
```

### Get Cost Estimation
**POST** `/api/analytics/cost-estimation`

Estimate the cost of executing a prompt.

**Request Body:**
```json
{
  "modelId": "gpt-4",
  "prompt": "Analyze the decision context...",
  "estimatedOutputTokens": 500
}
```

**Response:**
```json
{
  "modelId": "gpt-4",
  "estimatedCost": 0.027,
  "breakdown": {
    "inputTokens": 150,
    "inputCost": 0.0045,
    "outputTokens": 500,
    "outputCost": 0.03,
    "totalCost": 0.0345
  },
  "currency": "USD"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "INVALID_MODEL",
    "message": "The specified model is not available",
    "details": {
      "modelId": "invalid-model",
      "availableModels": ["gpt-4", "claude-3-sonnet"]
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes
- `INVALID_MODEL`: Model not found or unavailable
- `INVALID_PROMPT`: Prompt validation failed
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded for provider
- `QUOTA_EXCEEDED`: Quota exceeded for provider
- `TOOL_EXECUTION_FAILED`: Tool execution failed
- `STREAMING_NOT_SUPPORTED`: Streaming not supported for model
- `AUTHENTICATION_FAILED`: Authentication failed
- `INSUFFICIENT_PERMISSIONS`: Insufficient permissions

---

## Rate Limits

- **Standard endpoints**: 100 requests per minute per user
- **Streaming endpoints**: 50 requests per minute per user
- **Evaluation endpoints**: 20 requests per minute per user
- **Analytics endpoints**: 30 requests per minute per user

Rate limits are enforced per user and reset every minute. Exceeding limits returns a 429 status code with retry-after header. 