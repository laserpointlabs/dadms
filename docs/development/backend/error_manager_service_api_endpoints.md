# DADMS 2.0 - Error Manager Service API Endpoints

## Overview

The Error Manager Service serves as DADMS 2.0's intelligent error detection, analysis, and autonomous correction engine, providing proactive error management capabilities that enhance system reliability and self-healing. This document provides human-readable examples and usage patterns for all available API endpoints.

**Base URL**: `http://localhost:3019` (development) | `https://api.dadms.example.com/error-manager` (production)

**Authentication**: Bearer Token (JWT)

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Error Reporting** | POST | `/errors/report` | Report new error for processing |
| | GET | `/errors/{errorId}` | Get error details |
| | PUT | `/errors/{errorId}` | Update error information |
| | POST | `/errors/{errorId}/classify` | Classify or reclassify error |
| | POST | `/errors/anomalies/detect` | Detect system anomalies |
| **Error Analysis** | POST | `/errors/{errorId}/analyze` | Analyze error comprehensively |
| | GET | `/errors/{errorId}/root-cause` | Get root cause analysis |
| | GET | `/errors/{errorId}/impact` | Get impact assessment |
| | GET | `/errors/{errorId}/correlate` | Get historical correlation |
| **Correction Management** | POST | `/errors/{errorId}/correction/suggest` | Generate correction plan |
| | POST | `/errors/{errorId}/correction/apply` | Execute correction plan |
| | GET | `/corrections/{executionId}` | Get correction execution status |
| | POST | `/corrections/{executionId}/validate` | Validate correction success |
| | POST | `/corrections/{executionId}/rollback` | Rollback correction |
| **Agent Integration** | POST | `/errors/{errorId}/agents/assign` | Assign agent to error |
| | GET | `/errors/{errorId}/agents/recommendations` | Get agent recommendations |
| | POST | `/errors/{errorId}/agents/delegate` | Delegate resolution to agent |
| | GET | `/agents/{agentId}/assignments` | Get agent assignments |
| **Monitoring & Tracking** | GET | `/errors` | List errors with filtering |
| | GET | `/system/health` | Get system health report |
| | GET | `/errors/metrics` | Get error metrics and analytics |
| **Learning & Prediction** | POST | `/models/{modelType}/update` | Update ML models |
| | POST | `/predict/errors` | Generate error predictions |
| | GET | `/patterns/insights` | Get pattern insights |
| | POST | `/learning/feedback` | Submit learning feedback |
| **Configuration** | GET/POST | `/configuration/thresholds` | Manage alert thresholds |
| | GET/POST | `/configuration/automation-rules` | Manage automation rules |
| | GET/POST | `/configuration/escalation-policies` | Manage escalation policies |
| **Health & Monitoring** | GET | `/health` | Service health check |
| | GET | `/metrics` | Service performance metrics |

---

## 1. Error Reporting & Detection

### Report Error

#### POST `/errors/report`
**Description**: Reports a new error for detection, classification, and analysis processing

**Request Body**:
```json
{
  "source": {
    "serviceId": "llm-service-001",
    "serviceName": "LLM Service",
    "componentId": "model-executor",
    "workflowId": "text-generation-workflow-456",
    "taskId": "task-789",
    "agentId": "agent-pilot-001",
    "sessionId": "session-abc123"
  },
  "error": {
    "message": "Model inference timeout after 30 seconds",
    "details": {
      "model": "gpt-4",
      "timeout": 30000,
      "requestSize": 1024,
      "inputTokens": 2048
    },
    "stackTrace": "TimeoutError: Model inference timeout...",
    "errorCode": "MODEL_TIMEOUT"
  },
  "context": {
    "executionState": {
      "phase": "inference",
      "retryCount": 2,
      "startTime": "2025-01-15T14:30:00Z"
    },
    "inputData": {
      "prompt": "Analyze the following data...",
      "parameters": {
        "temperature": 0.7,
        "maxTokens": 1000
      }
    },
    "environmentInfo": {
      "hostname": "llm-worker-03",
      "gpuMemory": "11GB",
      "loadAverage": 0.85
    }
  },
  "severity": "high",
  "tags": ["model", "timeout", "performance"]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/report" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "source": {
      "serviceId": "llm-service-001",
      "serviceName": "LLM Service",
      "componentId": "model-executor"
    },
    "error": {
      "message": "Model inference timeout after 30 seconds",
      "errorCode": "MODEL_TIMEOUT"
    },
    "severity": "high"
  }'
```

**Example Response**:
```json
{
  "errorId": "error-001",
  "status": "received",
  "classification": {
    "category": "system",
    "type": "timeout",
    "confidence": 0.95,
    "isRecurring": false
  },
  "metadata": {
    "correlationId": "corr-12345",
    "traceId": "trace-67890",
    "detectionMethod": "automated",
    "processingTime": 156
  }
}
```

**SDK Examples**:

**Python**:
```python
import requests
from datetime import datetime

class ErrorManagerClient:
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def report_error(self, source: dict, error: dict, severity: str = "medium", 
                    context: dict = None, tags: list = None) -> dict:
        payload = {
            'source': source,
            'error': error,
            'severity': severity
        }
        if context:
            payload['context'] = context
        if tags:
            payload['tags'] = tags
            
        response = requests.post(
            f'{self.base_url}/errors/report',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

# Usage
client = ErrorManagerClient('http://localhost:3019', 'your-jwt-token')

error_response = client.report_error(
    source={
        'serviceId': 'llm-service-001',
        'serviceName': 'LLM Service',
        'componentId': 'model-executor'
    },
    error={
        'message': 'Model inference timeout after 30 seconds',
        'errorCode': 'MODEL_TIMEOUT'
    },
    severity='high',
    tags=['model', 'timeout']
)

print(f"Error reported: {error_response['errorId']}")
print(f"Classification: {error_response['classification']['category']}")
```

**Node.js**:
```javascript
const axios = require('axios');

class ErrorManagerClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async reportError(source, error, options = {}) {
    const payload = {
      source,
      error,
      severity: options.severity || 'medium',
      context: options.context,
      tags: options.tags
    };

    const response = await this.client.post('/errors/report', payload);
    return response.data;
  }

  async getError(errorId, options = {}) {
    const response = await this.client.get(`/errors/${errorId}`, {
      params: options
    });
    return response.data;
  }

  async analyzeError(errorId, analysisOptions = {}) {
    const response = await this.client.post(`/errors/${errorId}/analyze`, analysisOptions);
    return response.data;
  }
}

// Usage
const client = new ErrorManagerClient('http://localhost:3019', 'your-jwt-token');

async function handleModelTimeout() {
  try {
    const errorReport = await client.reportError(
      {
        serviceId: 'llm-service-001',
        serviceName: 'LLM Service',
        componentId: 'model-executor'
      },
      {
        message: 'Model inference timeout after 30 seconds',
        errorCode: 'MODEL_TIMEOUT'
      },
      {
        severity: 'high',
        tags: ['model', 'timeout', 'performance']
      }
    );
    
    console.log(`Error reported: ${errorReport.errorId}`);
    
    // Automatically trigger analysis
    const analysis = await client.analyzeError(errorReport.errorId, {
      depth: 'comprehensive',
      includeHistorical: true,
      agentAssistance: true
    });
    
    console.log(`Analysis completed: ${analysis.analysisId}`);
    console.log(`Root cause: ${analysis.rootCauseAnalysis.primaryCause.description}`);
    
  } catch (error) {
    console.error('Error management failed:', error.response?.data);
  }
}

handleModelTimeout();
```

### Get Error Details

#### GET `/errors/{errorId}`
**Description**: Retrieves detailed information about a specific error including optional analysis and correction data

**Query Parameters**:
- `includeAnalysis` (optional): Include analysis results
- `includeCorrections` (optional): Include correction plans and executions

**Example Request**:
```bash
curl -X GET "http://localhost:3019/errors/error-001?includeAnalysis=true&includeCorrections=true" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "id": "error-001",
  "timestamp": "2025-01-15T14:30:00Z",
  "source": {
    "serviceId": "llm-service-001",
    "serviceName": "LLM Service",
    "componentId": "model-executor",
    "workflowId": "text-generation-workflow-456",
    "taskId": "task-789"
  },
  "classification": {
    "category": "system",
    "type": "timeout",
    "subtype": "inference_timeout",
    "tags": ["model", "timeout", "performance"],
    "confidence": 0.95,
    "isRecurring": true,
    "patternId": "pattern-timeout-001"
  },
  "severity": "high",
  "context": {
    "executionState": {
      "phase": "inference",
      "retryCount": 2,
      "startTime": "2025-01-15T14:30:00Z"
    },
    "environmentInfo": {
      "hostname": "llm-worker-03",
      "gpuMemory": "11GB",
      "loadAverage": 0.85
    },
    "resourceUtilization": {
      "cpu": 0.92,
      "memory": 0.78,
      "gpu": 0.95,
      "network": 0.15
    }
  },
  "details": {
    "message": "Model inference timeout after 30 seconds",
    "description": "The model failed to complete inference within the allocated timeout period",
    "errorCode": "MODEL_TIMEOUT",
    "technicalDetails": {
      "errorClass": "TimeoutError",
      "fileName": "model_executor.py",
      "lineNumber": 245,
      "methodName": "execute_inference"
    },
    "businessImpact": {
      "affectedProcesses": ["text-generation", "chat-completion"],
      "customerImpact": "delayed_response",
      "reputationalRisk": "medium"
    }
  },
  "analysis": {
    "analysisId": "analysis-001",
    "rootCauseAnalysis": {
      "primaryCause": {
        "causeId": "cause-001",
        "description": "GPU memory exhaustion causing inference delays",
        "category": "technical",
        "likelihood": 0.88,
        "evidenceStrength": 0.92
      },
      "contributingFactors": [
        {
          "causeId": "cause-002",
          "description": "Large model size relative to available GPU memory",
          "category": "technical",
          "likelihood": 0.75
        },
        {
          "causeId": "cause-003",
          "description": "Concurrent inference requests causing resource contention",
          "category": "procedural",
          "likelihood": 0.65
        }
      ],
      "confidence": 0.89
    },
    "impactAssessment": {
      "overallImpact": "high",
      "affectedSystems": [
        {
          "systemId": "llm-service",
          "impactLevel": "severe",
          "affectedFunctions": ["inference", "completion"]
        }
      ],
      "recoveryTime": {
        "estimated": 1800,
        "confidence": 0.8
      }
    }
  },
  "correctionPlans": [
    {
      "planId": "plan-001",
      "strategy": "immediate_fix",
      "confidence": 0.85,
      "estimatedDuration": 900,
      "actions": [
        {
          "actionId": "action-001",
          "type": "adjust_parameters",
          "description": "Reduce model batch size to prevent GPU memory exhaustion",
          "automation": "fully_automated"
        },
        {
          "actionId": "action-002",
          "type": "restart_service",
          "description": "Restart inference workers to clear memory leaks",
          "automation": "agent_assisted"
        }
      ]
    }
  ]
}
```

### Detect Anomalies

#### POST `/errors/anomalies/detect`
**Description**: Detects anomalies in system behavior and error patterns using machine learning models

**Request Body**:
```json
{
  "scope": {
    "services": ["llm-service", "knowledge-service", "task-orchestrator"],
    "components": ["model-executor", "document-processor"],
    "timeWindow": "2h"
  },
  "timeWindow": "1h",
  "sensitivity": 0.8
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/anomalies/detect" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": {
      "services": ["llm-service", "knowledge-service"],
      "timeWindow": "2h"
    },
    "sensitivity": 0.8
  }'
```

**Example Response**:
```json
[
  {
    "anomalyId": "anomaly-001",
    "type": "error_rate_spike",
    "description": "Unusual spike in timeout errors for LLM Service",
    "severity": "high",
    "affectedServices": ["llm-service"],
    "detectionTime": "2025-01-15T15:30:00Z",
    "metrics": {
      "baselineRate": 0.02,
      "currentRate": 0.15,
      "deviationScore": 6.5,
      "confidence": 0.94
    },
    "recommendations": [
      "Investigate GPU memory utilization",
      "Check for resource contention",
      "Review recent configuration changes"
    ]
  },
  {
    "anomalyId": "anomaly-002",
    "type": "response_time_degradation",
    "description": "Gradual increase in response times across inference operations",
    "severity": "medium",
    "affectedServices": ["llm-service"],
    "detectionTime": "2025-01-15T15:25:00Z",
    "metrics": {
      "baselineTime": 2.1,
      "currentTime": 4.8,
      "deviationScore": 3.2,
      "confidence": 0.87
    },
    "trendAnalysis": {
      "direction": "increasing",
      "rate": 0.3,
      "duration": "45m"
    }
  }
]
```

---

## 2. Error Analysis

### Analyze Error

#### POST `/errors/{errorId}/analyze`
**Description**: Performs comprehensive error analysis including root cause determination, impact assessment, and historical correlation

**Request Body**:
```json
{
  "depth": "comprehensive",
  "includeHistorical": true,
  "includePredictive": true,
  "agentAssistance": true,
  "timeoutMs": 45000
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/error-001/analyze" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "depth": "comprehensive",
    "includeHistorical": true,
    "agentAssistance": true
  }'
```

**Example Response**:
```json
{
  "errorId": "error-001",
  "analysisId": "analysis-001",
  "rootCauseAnalysis": {
    "primaryCause": {
      "causeId": "cause-001",
      "description": "GPU memory exhaustion causing inference delays",
      "category": "technical",
      "likelihood": 0.88,
      "evidenceStrength": 0.92,
      "supportingEvidence": [
        {
          "type": "metric",
          "description": "GPU memory utilization at 98% during error occurrence",
          "source": "system_monitoring",
          "timestamp": "2025-01-15T14:29:45Z"
        },
        {
          "type": "log",
          "description": "CUDA out of memory errors in inference logs",
          "source": "application_logs",
          "count": 5
        }
      ]
    },
    "contributingFactors": [
      {
        "causeId": "cause-002",
        "description": "Large model size relative to available GPU memory",
        "category": "technical",
        "likelihood": 0.75,
        "evidenceStrength": 0.83
      },
      {
        "causeId": "cause-003",
        "description": "Concurrent inference requests causing resource contention",
        "category": "procedural",
        "likelihood": 0.65,
        "evidenceStrength": 0.71
      }
    ],
    "causalChain": [
      {
        "step": 1,
        "event": "Multiple large inference requests queued",
        "cause": "High user demand during peak hours"
      },
      {
        "step": 2,
        "event": "GPU memory allocation increased beyond capacity",
        "cause": "Lack of request throttling mechanism"
      },
      {
        "step": 3,
        "event": "Inference timeout triggered",
        "cause": "Unable to allocate sufficient GPU memory"
      }
    ],
    "confidence": 0.89,
    "analysisMethod": "ml_assisted_correlation"
  },
  "impactAssessment": {
    "overallImpact": "high",
    "affectedSystems": [
      {
        "systemId": "llm-service",
        "impactLevel": "severe",
        "affectedFunctions": ["inference", "completion", "embeddings"],
        "userCount": 245,
        "downtime": 1200
      },
      {
        "systemId": "chat-interface",
        "impactLevel": "moderate",
        "affectedFunctions": ["chat-completion"],
        "userCount": 89,
        "degradation": "response_delay"
      }
    ],
    "businessImpact": {
      "revenue": {
        "estimatedLoss": 2500,
        "currency": "USD",
        "calculationMethod": "usage_interruption"
      },
      "customerSatisfaction": {
        "impactScore": 7.2,
        "affectedUsers": 245,
        "expectedComplaints": 12
      }
    },
    "cascadingEffects": [
      {
        "effectId": "effect-001",
        "description": "Backup inference workers overloaded",
        "severity": "medium",
        "timeToImpact": 300
      }
    ],
    "recoveryTime": {
      "estimated": 1800,
      "confidence": 0.8,
      "factors": [
        "GPU memory clearing",
        "Service restart required",
        "Configuration adjustment time"
      ]
    }
  },
  "historicalCorrelation": {
    "similarErrors": [
      {
        "errorId": "error-456",
        "similarity": 0.93,
        "timestamp": "2025-01-10T09:15:00Z",
        "resolution": "Reduced batch size and implemented request throttling"
      },
      {
        "errorId": "error-789",
        "similarity": 0.87,
        "timestamp": "2025-01-08T16:42:00Z",
        "resolution": "Allocated additional GPU memory"
      }
    ],
    "patternMatches": [
      {
        "patternId": "pattern-timeout-001",
        "matchScore": 0.91,
        "frequency": 8,
        "successfulResolutions": 6,
        "description": "GPU memory exhaustion during peak usage"
      }
    ],
    "learningInsights": [
      {
        "insight": "Timeout errors correlate strongly with GPU memory > 95%",
        "confidence": 0.94,
        "sample_size": 23
      },
      {
        "insight": "Batch size reduction resolves 85% of similar timeouts",
        "confidence": 0.87,
        "sample_size": 18
      }
    ]
  },
  "predictiveInsights": {
    "recurrenceProbability": 0.78,
    "timeToRecurrence": "4-6 hours",
    "preventiveActions": [
      "Implement dynamic batch size adjustment",
      "Add GPU memory monitoring alerts",
      "Configure request throttling during peak usage"
    ]
  },
  "recommendedActions": [
    {
      "actionId": "action-001",
      "type": "immediate",
      "description": "Reduce model batch size from 8 to 4",
      "priority": "high",
      "estimatedEffectiveness": 0.85
    },
    {
      "actionId": "action-002",
      "type": "short_term",
      "description": "Implement request throttling mechanism",
      "priority": "medium",
      "estimatedEffectiveness": 0.92
    },
    {
      "actionId": "action-003",
      "type": "long_term",
      "description": "Upgrade GPU infrastructure or implement model sharding",
      "priority": "low",
      "estimatedEffectiveness": 0.98
    }
  ],
  "confidence": 0.91,
  "analysisTimestamp": "2025-01-15T14:35:22Z"
}
```

### Get Root Cause Analysis

#### GET `/errors/{errorId}/root-cause`
**Description**: Retrieves detailed root cause analysis for a specific error

**Example Request**:
```bash
curl -X GET "http://localhost:3019/errors/error-001/root-cause" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "primaryCause": {
    "causeId": "cause-001",
    "description": "GPU memory exhaustion causing inference delays",
    "category": "technical",
    "likelihood": 0.88,
    "evidenceStrength": 0.92,
    "supportingEvidence": [
      {
        "type": "metric",
        "description": "GPU memory utilization at 98% during error occurrence",
        "source": "system_monitoring",
        "value": 0.98,
        "threshold": 0.85,
        "timestamp": "2025-01-15T14:29:45Z"
      },
      {
        "type": "log",
        "description": "CUDA out of memory errors in inference logs",
        "source": "application_logs",
        "count": 5,
        "pattern": "RuntimeError: CUDA out of memory"
      }
    ],
    "mitigationOptions": [
      {
        "option": "Reduce batch size",
        "effectiveness": 0.85,
        "implementationTime": 300,
        "riskLevel": "low"
      },
      {
        "option": "Add GPU nodes",
        "effectiveness": 0.95,
        "implementationTime": 3600,
        "riskLevel": "medium"
      }
    ]
  },
  "contributingFactors": [
    {
      "causeId": "cause-002",
      "description": "Large model size relative to available GPU memory",
      "category": "technical",
      "likelihood": 0.75,
      "evidenceStrength": 0.83,
      "impact": "Model requires 10.5GB but only 11GB available with OS overhead"
    },
    {
      "causeId": "cause-003",
      "description": "Concurrent inference requests causing resource contention",
      "category": "procedural",
      "likelihood": 0.65,
      "evidenceStrength": 0.71,
      "impact": "Multiple requests competing for limited GPU memory pool"
    }
  ],
  "causalChain": [
    {
      "step": 1,
      "event": "Peak usage period begins",
      "cause": "High user demand during business hours",
      "timestamp": "2025-01-15T14:25:00Z"
    },
    {
      "step": 2,
      "event": "Multiple large inference requests queued",
      "cause": "No request throttling mechanism in place",
      "timestamp": "2025-01-15T14:28:00Z"
    },
    {
      "step": 3,
      "event": "GPU memory allocation exceeded capacity",
      "cause": "Insufficient memory management for concurrent requests",
      "timestamp": "2025-01-15T14:29:30Z"
    },
    {
      "step": 4,
      "event": "Inference timeout triggered",
      "cause": "Unable to allocate sufficient GPU memory for processing",
      "timestamp": "2025-01-15T14:30:00Z"
    }
  ],
  "confidence": 0.89,
  "analysisMethod": "ml_assisted_correlation",
  "analysisTimestamp": "2025-01-15T14:35:22Z"
}
```

---

## 3. Correction Management

### Suggest Correction

#### POST `/errors/{errorId}/correction/suggest`
**Description**: Generates a comprehensive correction plan for resolving the specified error

**Request Body**:
```json
{
  "automationLevel": "agent_assisted",
  "riskTolerance": "medium",
  "timeConstraints": {
    "maxDuration": 1800,
    "urgency": "high"
  },
  "resourceConstraints": {
    "maxCost": 1000,
    "availableAgents": ["agent-sysadmin-001", "agent-devops-002"]
  },
  "approvalRequired": false
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/error-001/correction/suggest" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "automationLevel": "agent_assisted",
    "riskTolerance": "medium",
    "timeConstraints": {
      "maxDuration": 1800
    }
  }'
```

**Example Response**:
```json
{
  "planId": "plan-001",
  "errorId": "error-001",
  "strategy": "immediate_fix",
  "actions": [
    {
      "actionId": "action-001",
      "type": "adjust_parameters",
      "description": "Reduce model batch size from 8 to 4 to prevent GPU memory exhaustion",
      "target": {
        "service": "llm-service",
        "component": "model-executor",
        "configPath": "/config/inference.yaml"
      },
      "parameters": {
        "batchSize": 4,
        "previousValue": 8,
        "configKey": "inference.batchSize"
      },
      "automation": "fully_automated",
      "verification": {
        "method": "metric_check",
        "criteria": [
          {
            "metric": "gpu_memory_utilization",
            "operator": "<",
            "value": 0.85
          },
          {
            "metric": "inference_success_rate",
            "operator": ">",
            "value": 0.95
          }
        ],
        "timeoutMs": 300000
      },
      "rollbackAction": {
        "type": "restore_configuration",
        "parameters": {
          "batchSize": 8
        }
      }
    },
    {
      "actionId": "action-002",
      "type": "restart_service",
      "description": "Restart inference workers to clear any memory leaks",
      "target": {
        "service": "llm-service",
        "component": "inference-workers",
        "instances": ["worker-01", "worker-02", "worker-03"]
      },
      "automation": "agent_assisted",
      "agentAssignment": {
        "preferredAgents": ["agent-devops-002"],
        "requiredCapabilities": ["service_management", "monitoring"]
      },
      "verification": {
        "method": "health_check",
        "criteria": [
          {
            "endpoint": "/health",
            "expectedStatus": 200,
            "timeout": 30000
          }
        ]
      }
    },
    {
      "actionId": "action-003",
      "type": "implement_workaround",
      "description": "Enable request throttling to prevent future memory exhaustion",
      "target": {
        "service": "llm-service",
        "component": "request-handler"
      },
      "parameters": {
        "maxConcurrentRequests": 3,
        "queueSize": 10,
        "throttleEnabled": true
      },
      "automation": "human_supervised",
      "verification": {
        "method": "load_test",
        "criteria": [
          {
            "metric": "request_rejection_rate",
            "operator": "<",
            "value": 0.05
          }
        ]
      }
    }
  ],
  "executionOrder": [
    {
      "stepId": "step-001",
      "actionId": "action-001",
      "dependencies": [],
      "parallelExecution": false,
      "timeoutMs": 300000,
      "retryPolicy": {
        "maxRetries": 2,
        "backoffMs": 1000
      },
      "failureHandling": {
        "onFailure": "rollback_and_escalate",
        "escalationLevel": "human_expert"
      }
    },
    {
      "stepId": "step-002",
      "actionId": "action-002",
      "dependencies": ["step-001"],
      "parallelExecution": false,
      "timeoutMs": 600000,
      "retryPolicy": {
        "maxRetries": 1,
        "backoffMs": 5000
      }
    },
    {
      "stepId": "step-003",
      "actionId": "action-003",
      "dependencies": ["step-002"],
      "parallelExecution": false,
      "timeoutMs": 900000
    }
  ],
  "prerequisites": [
    {
      "type": "backup_configuration",
      "description": "Backup current inference configuration",
      "required": true
    },
    {
      "type": "agent_availability",
      "description": "Ensure DevOps agent is available for service restart",
      "required": true
    }
  ],
  "riskAssessment": {
    "overallRisk": "medium",
    "riskFactors": [
      {
        "factor": "service_downtime",
        "probability": 0.3,
        "impact": "medium",
        "mitigation": "Rolling restart to minimize downtime"
      },
      {
        "factor": "performance_degradation",
        "probability": 0.15,
        "impact": "low",
        "mitigation": "Monitor performance metrics after batch size change"
      }
    ]
  },
  "rollbackPlan": {
    "triggers": [
      "inference_success_rate < 0.9",
      "gpu_memory_utilization > 0.95",
      "user_reported_degradation > 5"
    ],
    "actions": [
      "Restore original batch size configuration",
      "Disable request throttling",
      "Restart services with original configuration"
    ],
    "estimatedTime": 600
  },
  "authorization": {
    "level": "automated",
    "approvalRequired": false,
    "authorizedBy": "system",
    "restrictions": [
      "No production database changes",
      "Must maintain service availability > 95%"
    ]
  },
  "estimatedDuration": 1200,
  "confidence": 0.87
}
```

### Apply Correction

#### POST `/errors/{errorId}/correction/apply`
**Description**: Executes a correction plan for the specified error

**Request Body**:
```json
{
  "planId": "plan-001",
  "overrides": {
    "action-001": {
      "parameters": {
        "batchSize": 3
      }
    }
  },
  "approvalToken": "approval-token-12345"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/error-001/correction/apply" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-001",
    "overrides": {
      "action-001": {
        "parameters": {
          "batchSize": 3
        }
      }
    }
  }'
```

**Example Response**:
```json
{
  "executionId": "execution-001",
  "planId": "plan-001",
  "status": "in_progress",
  "progress": {
    "currentStep": 1,
    "totalSteps": 3,
    "completedSteps": 0,
    "progressPercentage": 0,
    "estimatedTimeRemaining": 1200
  },
  "currentStep": {
    "stepId": "step-001",
    "actionId": "action-001",
    "description": "Reduce model batch size from 8 to 3",
    "status": "in_progress",
    "startedAt": "2025-01-15T14:40:00Z"
  },
  "estimatedCompletion": "2025-01-15T15:00:00Z",
  "results": []
}
```

### Validate Correction

#### POST `/corrections/{executionId}/validate`
**Description**: Validates the success of a correction execution by checking success criteria

**Request Body**:
```json
{
  "validationCriteria": [
    {
      "metric": "gpu_memory_utilization",
      "operator": "<",
      "value": 0.85,
      "timeWindow": "5m"
    },
    {
      "metric": "inference_success_rate",
      "operator": ">",
      "value": 0.95,
      "timeWindow": "10m"
    }
  ],
  "timeoutMs": 600000
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/corrections/execution-001/validate" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "validationCriteria": [
      {
        "metric": "gpu_memory_utilization",
        "operator": "<",
        "value": 0.85
      }
    ]
  }'
```

**Example Response**:
```json
{
  "validationId": "validation-001",
  "executionId": "execution-001",
  "status": "passed",
  "results": [
    {
      "criterion": "gpu_memory_utilization < 0.85",
      "status": "passed",
      "currentValue": 0.72,
      "targetValue": 0.85,
      "measurementTime": "2025-01-15T15:05:00Z"
    },
    {
      "criterion": "inference_success_rate > 0.95",
      "status": "passed",
      "currentValue": 0.98,
      "targetValue": 0.95,
      "measurementTime": "2025-01-15T15:05:00Z"
    }
  ],
  "overallScore": 0.95,
  "recommendations": [
    "Monitor performance for next 24 hours to ensure stability",
    "Consider implementing permanent request throttling"
  ],
  "validatedAt": "2025-01-15T15:05:22Z"
}
```

---

## 4. Agent Integration

### Assign Agent to Error

#### POST `/errors/{errorId}/agents/assign`
**Description**: Assigns an AAS agent to investigate or resolve the specified error

**Request Body**:
```json
{
  "agentId": "agent-devops-002",
  "role": "resolver",
  "capabilities": ["service_management", "configuration_management", "monitoring"],
  "priority": "high"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/error-001/agents/assign" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-devops-002",
    "role": "resolver",
    "capabilities": ["service_management", "monitoring"],
    "priority": "high"
  }'
```

**Example Response**:
```json
{
  "id": "assignment-001",
  "errorId": "error-001",
  "agentId": "agent-devops-002",
  "role": "resolver",
  "capabilities": ["service_management", "configuration_management", "monitoring"],
  "assignmentReason": "Agent has required capabilities for GPU memory and service management issues",
  "status": "assigned",
  "progress": {
    "phase": "investigation",
    "tasksCompleted": 0,
    "totalTasks": 3
  },
  "assignedAt": "2025-01-15T14:45:00Z",
  "estimatedCompletion": "2025-01-15T15:15:00Z"
}
```

### Get Agent Recommendations

#### GET `/errors/{errorId}/agents/recommendations`
**Description**: Retrieves agent recommendations for error resolution based on error characteristics and agent capabilities

**Example Request**:
```bash
curl -X GET "http://localhost:3019/errors/error-001/agents/recommendations" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
[
  {
    "agentId": "agent-devops-002",
    "agentType": "DevOps Specialist",
    "capabilities": [
      "service_management",
      "infrastructure_monitoring",
      "configuration_management",
      "gpu_optimization"
    ],
    "suitabilityScore": 0.94,
    "availability": "available",
    "currentLoad": 0.3,
    "experienceLevel": "expert",
    "recommendationReason": "High expertise in GPU memory issues and service management",
    "previousSuccesses": 18,
    "averageResolutionTime": 1200
  },
  {
    "agentId": "agent-ml-003",
    "agentType": "ML Infrastructure Specialist",
    "capabilities": [
      "model_optimization",
      "gpu_management",
      "performance_tuning",
      "memory_analysis"
    ],
    "suitabilityScore": 0.89,
    "availability": "busy",
    "currentLoad": 0.8,
    "experienceLevel": "expert",
    "recommendationReason": "Specialized in ML model memory optimization",
    "previousSuccesses": 12,
    "averageResolutionTime": 1800,
    "estimatedAvailability": "2025-01-15T15:30:00Z"
  },
  {
    "agentId": "agent-sysadmin-001",
    "agentType": "System Administrator",
    "capabilities": [
      "system_monitoring",
      "service_restart",
      "basic_troubleshooting"
    ],
    "suitabilityScore": 0.71,
    "availability": "available",
    "currentLoad": 0.1,
    "experienceLevel": "intermediate",
    "recommendationReason": "Available immediately for basic service management tasks",
    "previousSuccesses": 25,
    "averageResolutionTime": 900
  }
]
```

### Delegate Resolution to Agent

#### POST `/errors/{errorId}/agents/delegate`
**Description**: Delegates error resolution to an agent with specific capabilities and constraints

**Request Body**:
```json
{
  "agentCapabilities": {
    "skills": ["gpu_management", "service_optimization", "monitoring"],
    "experience": "expert",
    "availability": "immediate",
    "specializations": ["memory_optimization", "performance_tuning"]
  },
  "constraints": {
    "maxResolutionTime": 1800,
    "riskTolerance": "medium",
    "allowServiceRestart": true,
    "requireApproval": false
  },
  "deadline": "2025-01-15T15:30:00Z"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/errors/error-001/agents/delegate" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "agentCapabilities": {
      "skills": ["gpu_management", "service_optimization"],
      "experience": "expert",
      "availability": "immediate"
    },
    "constraints": {
      "maxResolutionTime": 1800,
      "allowServiceRestart": true
    }
  }'
```

**Example Response**:
```json
{
  "delegationId": "delegation-001",
  "errorId": "error-001",
  "selectedAgent": {
    "agentId": "agent-devops-002",
    "agentType": "DevOps Specialist",
    "matchScore": 0.94,
    "selectionReason": "Best match for required capabilities and immediate availability"
  },
  "delegationStatus": "in_progress",
  "assignedTasks": [
    {
      "taskId": "task-001",
      "description": "Analyze GPU memory utilization patterns",
      "priority": "high",
      "estimatedDuration": 300
    },
    {
      "taskId": "task-002",
      "description": "Implement batch size optimization",
      "priority": "high",
      "estimatedDuration": 600,
      "dependencies": ["task-001"]
    },
    {
      "taskId": "task-003",
      "description": "Monitor system stability post-resolution",
      "priority": "medium",
      "estimatedDuration": 900,
      "dependencies": ["task-002"]
    }
  ],
  "progress": {
    "currentTask": "task-001",
    "completedTasks": 0,
    "totalTasks": 3,
    "progressPercentage": 0
  },
  "estimatedCompletion": "2025-01-15T15:20:00Z",
  "delegatedAt": "2025-01-15T14:50:00Z"
}
```

---

## 5. Monitoring & Tracking

### List Errors with Filtering

#### GET `/errors`
**Description**: Retrieves error history with comprehensive filtering capabilities

**Query Parameters**:
- `entityId`: Filter by specific entity
- `category`: Filter by error category
- `severity`: Filter by error severity
- `status`: Filter by processing status
- `startTime`: Start of time range
- `endTime`: End of time range
- `limit`: Maximum number of results
- `offset`: Pagination offset

**Example Request**:
```bash
curl -X GET "http://localhost:3019/errors?category=system&severity=high&startTime=2025-01-15T00:00:00Z&limit=50" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "errors": [
    {
      "id": "error-001",
      "timestamp": "2025-01-15T14:30:00Z",
      "source": {
        "serviceId": "llm-service-001",
        "serviceName": "LLM Service"
      },
      "classification": {
        "category": "system",
        "type": "timeout",
        "severity": "high"
      },
      "message": "Model inference timeout after 30 seconds",
      "status": "resolved",
      "resolutionTime": 1200
    },
    {
      "id": "error-002",
      "timestamp": "2025-01-15T13:45:00Z",
      "source": {
        "serviceId": "knowledge-service-001",
        "serviceName": "Knowledge Service"
      },
      "classification": {
        "category": "system",
        "type": "database",
        "severity": "high"
      },
      "message": "Database connection pool exhausted",
      "status": "investigating",
      "assignedAgent": "agent-db-001"
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 127,
    "hasMore": true
  },
  "summary": {
    "totalErrors": 127,
    "byCategory": {
      "system": 89,
      "logic": 23,
      "data": 15
    },
    "bySeverity": {
      "critical": 5,
      "high": 31,
      "medium": 65,
      "low": 26
    },
    "resolutionStats": {
      "resolved": 98,
      "investigating": 18,
      "pending": 11
    }
  }
}
```

### Get System Health Report

#### GET `/system/health`
**Description**: Retrieves comprehensive system health report including error rates and component status

**Query Parameters**:
- `scope`: Health scope (all, services, workflows, agents)
- `includeMetrics`: Include detailed metrics

**Example Request**:
```bash
curl -X GET "http://localhost:3019/system/health?scope=all&includeMetrics=true" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "overallHealth": "degraded",
  "timestamp": "2025-01-15T15:30:00Z",
  "components": [
    {
      "componentId": "llm-service",
      "name": "LLM Service",
      "status": "degraded",
      "healthScore": 0.72,
      "issues": [
        {
          "type": "performance",
          "description": "Elevated response times due to GPU memory pressure",
          "severity": "medium"
        }
      ],
      "lastCheck": "2025-01-15T15:29:30Z"
    },
    {
      "componentId": "knowledge-service",
      "name": "Knowledge Service",
      "status": "healthy",
      "healthScore": 0.95,
      "issues": [],
      "lastCheck": "2025-01-15T15:29:45Z"
    },
    {
      "componentId": "task-orchestrator",
      "name": "Task Orchestrator",
      "status": "healthy",
      "healthScore": 0.98,
      "issues": [],
      "lastCheck": "2025-01-15T15:29:50Z"
    }
  ],
  "metrics": {
    "errorRates": {
      "overall": 0.07,
      "byService": {
        "llm-service": 0.15,
        "knowledge-service": 0.02,
        "task-orchestrator": 0.01
      }
    },
    "responseTimePercentiles": {
      "p50": 1250,
      "p95": 4200,
      "p99": 8900
    },
    "availabilityStats": {
      "overall": 0.987,
      "byService": {
        "llm-service": 0.972,
        "knowledge-service": 0.995,
        "task-orchestrator": 0.999
      }
    }
  },
  "alerts": [
    {
      "alertId": "alert-001",
      "type": "performance_degradation",
      "severity": "medium",
      "component": "llm-service",
      "description": "GPU memory utilization consistently above 85%",
      "triggeredAt": "2025-01-15T14:25:00Z",
      "actions": ["Investigate memory optimization", "Consider resource scaling"]
    }
  ],
  "recommendations": [
    "Implement GPU memory optimization for LLM Service",
    "Add proactive monitoring for resource utilization",
    "Consider implementing auto-scaling for peak usage periods"
  ]
}
```

### Get Error Metrics

#### GET `/errors/metrics`
**Description**: Retrieves detailed error metrics and analytics with time-based aggregation

**Query Parameters**:
- `timeRange`: Analysis time range (1h, 24h, 7d, 30d, 90d)
- `aggregation`: Time aggregation (hour, day, week, month)
- `groupBy`: Grouping dimensions (category, severity, service, agent)

**Example Request**:
```bash
curl -X GET "http://localhost:3019/errors/metrics?timeRange=24h&aggregation=hour&groupBy=category,severity" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "timeRange": "24h",
  "aggregation": "hour",
  "totalErrors": 156,
  "errorsByCategory": {
    "system": 89,
    "logic": 23,
    "data": 15,
    "external": 12,
    "agent": 8,
    "user": 5,
    "process": 4
  },
  "errorsBySeverity": {
    "critical": 3,
    "high": 28,
    "medium": 67,
    "low": 58
  },
  "trends": [
    {
      "timestamp": "2025-01-15T00:00:00Z",
      "errorCount": 4,
      "categories": {
        "system": 2,
        "logic": 1,
        "data": 1
      }
    },
    {
      "timestamp": "2025-01-15T14:00:00Z",
      "errorCount": 18,
      "categories": {
        "system": 12,
        "logic": 3,
        "external": 2,
        "agent": 1
      }
    }
  ],
  "topErrors": [
    {
      "errorPattern": "GPU memory timeout",
      "count": 23,
      "percentage": 14.7,
      "lastOccurrence": "2025-01-15T15:15:00Z",
      "trend": "increasing"
    },
    {
      "errorPattern": "Database connection failure",
      "count": 18,
      "percentage": 11.5,
      "lastOccurrence": "2025-01-15T14:50:00Z",
      "trend": "stable"
    }
  ],
  "resolutionMetrics": {
    "averageResolutionTime": 1847,
    "resolutionTimePercentiles": {
      "p50": 1200,
      "p90": 3600,
      "p99": 7200
    },
    "resolutionSuccessRate": 0.89,
    "automatedResolutionRate": 0.67
  },
  "agentMetrics": {
    "agentAssignments": 45,
    "agentSuccessRate": 0.91,
    "averageAgentResolutionTime": 1623,
    "topPerformingAgents": [
      {
        "agentId": "agent-devops-002",
        "successRate": 0.95,
        "averageTime": 1200,
        "assignmentCount": 12
      }
    ]
  }
}
```

---

## 6. Learning & Prediction

### Update Learning Model

#### POST `/models/{modelType}/update`
**Description**: Updates machine learning models with new training data for improved error prediction and classification

**Request Body**:
```json
{
  "trainingData": {
    "datasetId": "error-dataset-2025-01",
    "features": [
      {
        "featureId": "gpu_utilization",
        "type": "numeric",
        "description": "GPU memory utilization percentage"
      },
      {
        "featureId": "request_rate",
        "type": "numeric", 
        "description": "Requests per second"
      },
      {
        "featureId": "service_type",
        "type": "categorical",
        "description": "Type of service generating error"
      }
    ],
    "labels": ["timeout", "memory_exhaustion", "network_failure"],
    "size": 10000
  },
  "updateStrategy": "incremental"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/models/classification/update" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "trainingData": {
      "datasetId": "error-dataset-2025-01",
      "size": 10000
    },
    "updateStrategy": "incremental"
  }'
```

**Example Response**:
```json
{
  "updateId": "model-update-001",
  "modelType": "classification",
  "status": "in_progress",
  "estimatedCompletion": "2025-01-15T16:30:00Z",
  "progress": {
    "phase": "data_preprocessing",
    "percentage": 15,
    "currentStep": "feature_extraction"
  },
  "previousVersion": "1.2.3",
  "targetVersion": "1.2.4",
  "expectedImprovements": [
    "5% improvement in classification accuracy",
    "Reduced false positive rate for timeout errors",
    "Better detection of memory-related issues"
  ]
}
```

### Predict Errors

#### POST `/predict/errors`
**Description**: Generates error predictions based on current system context and learned patterns

**Request Body**:
```json
{
  "context": {
    "systemMetrics": {
      "gpuUtilization": 0.87,
      "cpuUtilization": 0.65,
      "memoryUtilization": 0.78,
      "requestRate": 145,
      "responseTime": 2.3
    },
    "serviceStates": {
      "llm-service": "stressed",
      "knowledge-service": "healthy",
      "task-orchestrator": "healthy"
    },
    "environmentFactors": {
      "timeOfDay": "peak_hours",
      "userLoad": "high",
      "recentChanges": ["model_update", "config_change"]
    }
  },
  "timeHorizon": "6h",
  "includeProbabilities": true
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/predict/errors" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "systemMetrics": {
        "gpuUtilization": 0.87,
        "requestRate": 145
      },
      "serviceStates": {
        "llm-service": "stressed"
      }
    },
    "timeHorizon": "6h"
  }'
```

**Example Response**:
```json
[
  {
    "predictionId": "prediction-001",
    "predictedErrorType": "timeout",
    "probability": 0.78,
    "timeframe": "30-60 minutes",
    "affectedComponents": ["llm-service", "model-executor"],
    "triggers": [
      "GPU memory utilization > 90%",
      "Request rate > 150/sec",
      "Concurrent model loads > 3"
    ],
    "preventiveActions": [
      "Reduce batch size preemptively",
      "Enable request throttling",
      "Scale GPU resources",
      "Implement request queuing"
    ],
    "confidence": 0.85,
    "basedOnPatterns": ["pattern-timeout-001", "pattern-memory-002"],
    "historicalPrecedent": {
      "similarConditions": 15,
      "actualOccurrences": 12,
      "accuracyRate": 0.8
    }
  },
  {
    "predictionId": "prediction-002",
    "predictedErrorType": "resource_exhaustion",
    "probability": 0.45,
    "timeframe": "2-4 hours",
    "affectedComponents": ["llm-service", "infrastructure"],
    "triggers": [
      "Sustained high load",
      "Memory allocation patterns",
      "Peak usage period"
    ],
    "preventiveActions": [
      "Monitor memory allocation",
      "Prepare additional resources",
      "Implement load balancing"
    ],
    "confidence": 0.71,
    "basedOnPatterns": ["pattern-resource-001"]
  }
]
```

### Get Pattern Insights

#### GET `/patterns/insights`
**Description**: Retrieves insights about error patterns, trends, and learning from historical data

**Query Parameters**:
- `domain`: Filter by specific domain
- `timeRange`: Analysis time range (1w, 1m, 3m, 6m, 1y)

**Example Request**:
```bash
curl -X GET "http://localhost:3019/patterns/insights?domain=llm-service&timeRange=1m" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
[
  {
    "patternId": "pattern-timeout-001",
    "description": "GPU memory timeout pattern during peak usage",
    "frequency": 23,
    "trend": "increasing",
    "impact": "high",
    "affectedServices": ["llm-service"],
    "conditions": [
      {
        "condition": "gpu_utilization > 0.85",
        "frequency": 0.95
      },
      {
        "condition": "concurrent_requests > 5",
        "frequency": 0.89
      },
      {
        "condition": "time_of_day in peak_hours",
        "frequency": 0.78
      }
    ],
    "recommendations": [
      "Implement dynamic batch size adjustment",
      "Add GPU memory monitoring with early warnings",
      "Consider request throttling during peak hours",
      "Investigate GPU resource scaling options"
    ],
    "successfulResolutions": [
      {
        "resolution": "Batch size reduction",
        "successRate": 0.85,
        "averageTime": 1200
      },
      {
        "resolution": "Request throttling",
        "successRate": 0.92,
        "averageTime": 600
      }
    ],
    "learningInsights": [
      "Early detection at 80% GPU utilization prevents 60% of timeouts",
      "Batch size of 4 or lower maintains stable performance",
      "Peak hours (9-11 AM, 2-4 PM) show highest vulnerability"
    ]
  },
  {
    "patternId": "pattern-cascade-001",
    "description": "Cascading failure pattern from LLM to downstream services",
    "frequency": 8,
    "trend": "stable",
    "impact": "severe",
    "affectedServices": ["llm-service", "knowledge-service", "task-orchestrator"],
    "conditions": [
      {
        "condition": "llm_service_error_rate > 0.1",
        "frequency": 1.0
      },
      {
        "condition": "downstream_timeout_increase > 2x",
        "frequency": 0.87
      }
    ],
    "recommendations": [
      "Implement circuit breaker patterns",
      "Add service isolation mechanisms",
      "Improve error handling in downstream services",
      "Implement graceful degradation"
    ],
    "preventionStrategies": [
      "Early LLM service health detection",
      "Automatic failover mechanisms",
      "Reduced dependency chains during instability"
    ]
  }
]
```

### Submit Learning Feedback

#### POST `/learning/feedback`
**Description**: Submits feedback about error resolution outcomes to improve machine learning models

**Request Body**:
```json
{
  "errorId": "error-001",
  "correctionExecutionId": "execution-001",
  "feedbackType": "resolution_success",
  "outcome": "success",
  "effectivenessScore": 0.92,
  "lessonsLearned": [
    "Batch size reduction to 3 was more effective than expected",
    "GPU memory cleared faster than predicted",
    "No performance degradation observed with smaller batch size"
  ],
  "improvementSuggestions": [
    "Consider batch size 3 as default for high GPU utilization scenarios",
    "Update prediction model to account for faster memory clearing",
    "Add performance monitoring checks post-resolution"
  ]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/learning/feedback" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "errorId": "error-001",
    "correctionExecutionId": "execution-001",
    "feedbackType": "resolution_success",
    "outcome": "success",
    "effectivenessScore": 0.92,
    "lessonsLearned": [
      "Batch size reduction to 3 was more effective than expected"
    ]
  }'
```

**Example Response**:
```json
{
  "feedbackId": "feedback-001",
  "status": "accepted",
  "processingStatus": "queued_for_analysis",
  "impact": {
    "modelsToUpdate": ["classification", "prediction", "resolution_effectiveness"],
    "estimatedImprovements": [
      "Better batch size recommendations for GPU memory issues",
      "Improved effectiveness scoring for similar resolutions",
      "Enhanced prediction accuracy for timeout scenarios"
    ]
  },
  "acknowledgment": {
    "contributionScore": 8.5,
    "feedbackQuality": "high",
    "noveltyScore": 0.7
  },
  "submittedAt": "2025-01-15T15:45:00Z",
  "estimatedProcessingTime": "2-4 hours"
}
```

---

## 7. Configuration Management

### Configure Alert Thresholds

#### POST `/configuration/thresholds`
**Description**: Configures alert thresholds for error detection and monitoring

**Request Body**:
```json
[
  {
    "scope": "llm-service",
    "metric": "gpu_memory_utilization",
    "thresholdValue": 0.85,
    "comparisonOperator": ">",
    "severity": "high",
    "notificationChannels": ["email", "slack", "webhook"]
  },
  {
    "scope": "global",
    "metric": "error_rate",
    "thresholdValue": 0.05,
    "comparisonOperator": ">",
    "severity": "medium",
    "notificationChannels": ["slack"]
  }
]
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/configuration/thresholds" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "scope": "llm-service",
      "metric": "gpu_memory_utilization",
      "thresholdValue": 0.85,
      "comparisonOperator": ">",
      "severity": "high"
    }
  ]'
```

### Manage Automation Rules

#### POST `/configuration/automation-rules`
**Description**: Creates or updates automation rules for error handling

**Request Body**:
```json
[
  {
    "name": "GPU Memory Timeout Auto-Resolution",
    "description": "Automatically resolve GPU memory timeout errors by reducing batch size",
    "conditions": [
      {
        "field": "error.type",
        "operator": "=",
        "value": "timeout"
      },
      {
        "field": "error.details.errorCode",
        "operator": "=",
        "value": "MODEL_TIMEOUT"
      },
      {
        "field": "context.resourceUtilization.gpu",
        "operator": ">",
        "value": 0.9
      }
    ],
    "actions": [
      {
        "type": "adjust_parameters",
        "parameters": {
          "configPath": "/config/inference.yaml",
          "changes": {
            "batchSize": 4
          }
        },
        "timeout": 300000
      }
    ],
    "automationLevel": "fully_automated",
    "riskThreshold": 0.2,
    "approvalRequired": false,
    "maxExecutionsPerHour": 5
  }
]
```

**Example Request**:
```bash
curl -X POST "http://localhost:3019/configuration/automation-rules" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "GPU Memory Timeout Auto-Resolution",
      "conditions": [
        {
          "field": "error.type",
          "operator": "=",
          "value": "timeout"
        }
      ],
      "actions": [
        {
          "type": "adjust_parameters",
          "parameters": {
            "batchSize": 4
          }
        }
      ],
      "automationLevel": "fully_automated"
    }
  ]'
```

---

## 8. Health & Monitoring

### Service Health Check

#### GET `/health`
**Description**: Comprehensive health check of Error Manager service and its dependencies

**Example Request**:
```bash
curl -X GET "http://localhost:3019/health" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T16:00:00Z",
  "version": "1.0.0",
  "uptime": 345600,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTimeMs": 15,
      "details": "PostgreSQL connection pool: 8/20 connections active"
    },
    "eventManager": {
      "status": "healthy",
      "responseTimeMs": 22,
      "details": "Event publishing operational, queue length: 3"
    },
    "mlModels": {
      "status": "healthy",
      "responseTimeMs": 45,
      "details": "All 4 ML models loaded and operational"
    },
    "agentIntegration": {
      "status": "healthy",
      "responseTimeMs": 18,
      "details": "AAS connection active, 12 agents available"
    }
  }
}
```

### Service Performance Metrics

#### GET `/metrics`
**Description**: Retrieves detailed Error Manager service performance metrics

**Example Request**:
```bash
curl -X GET "http://localhost:3019/metrics" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "timestamp": "2025-01-15T16:00:00Z",
  "requestMetrics": {
    "requestsTotal": 15432,
    "requestsPerSecond": 23.7,
    "averageResponseTimeMs": 145,
    "errorRate": 0.3,
    "successRate": 99.7
  },
  "errorMetrics": {
    "errorsDetected": 156,
    "errorsAnalyzed": 142,
    "errorsResolved": 127,
    "averageResolutionTime": 1847,
    "resolutionSuccessRate": 0.89
  },
  "correctionMetrics": {
    "correctionsPlanned": 89,
    "correctionsExecuted": 81,
    "correctionsSuccessful": 74,
    "averageExecutionTime": 1623,
    "rollbackRate": 0.08
  },
  "agentMetrics": {
    "agentsAssigned": 45,
    "agentTasksCompleted": 67,
    "agentSuccessRate": 0.91,
    "averageAgentResponseTime": 1200
  },
  "resourceMetrics": {
    "cpuUsagePercent": 42.3,
    "memoryUsagePercent": 67.8,
    "diskUsagePercent": 34.2,
    "networkIoMbps": 12.5
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_ERROR_REPORT",
    "message": "Error report missing required source information",
    "details": {
      "missingFields": ["source.serviceId", "error.message"],
      "suggestions": ["Provide complete source identification", "Include descriptive error message"]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "ERROR_NOT_FOUND",
    "message": "Error with specified ID not found",
    "details": {
      "errorId": "error-999",
      "suggestions": ["Verify error ID is correct", "Check if error has been archived"]
    }
  }
}
```

### 422 Processing Failed
```json
{
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "Error analysis could not be completed",
    "details": {
      "reason": "Insufficient context data for reliable analysis",
      "suggestions": ["Provide additional error context", "Retry with basic analysis depth"]
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Error processing engine encountered an error",
    "details": {
      "correlationId": "corr-67890",
      "timestamp": "2025-01-15T16:00:00Z",
      "supportContact": "support@dadms.example.com"
    }
  }
}
```

---

## SDK Examples

### Python SDK

```python
import requests
from typing import Dict, List, Optional
from datetime import datetime

class ErrorManagerClient:
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def report_error(self, source: dict, error: dict, severity: str = "medium", 
                    context: dict = None, tags: list = None) -> dict:
        """Report a new error for processing"""
        payload = {
            'source': source,
            'error': error,
            'severity': severity
        }
        if context:
            payload['context'] = context
        if tags:
            payload['tags'] = tags
            
        response = requests.post(
            f'{self.base_url}/errors/report',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def analyze_error(self, error_id: str, options: Optional[Dict] = None) -> Dict:
        """Perform comprehensive error analysis"""
        response = requests.post(
            f'{self.base_url}/errors/{error_id}/analyze',
            headers=self.headers,
            json=options or {}
        )
        response.raise_for_status()
        return response.json()
    
    def suggest_correction(self, error_id: str, preferences: Optional[Dict] = None) -> Dict:
        """Generate correction plan for error"""
        response = requests.post(
            f'{self.base_url}/errors/{error_id}/correction/suggest',
            headers=self.headers,
            json=preferences or {}
        )
        response.raise_for_status()
        return response.json()
    
    def apply_correction(self, error_id: str, plan_id: str, overrides: Optional[Dict] = None) -> Dict:
        """Execute correction plan"""
        payload = {'planId': plan_id}
        if overrides:
            payload['overrides'] = overrides
            
        response = requests.post(
            f'{self.base_url}/errors/{error_id}/correction/apply',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def assign_agent(self, error_id: str, agent_id: str, role: str, capabilities: List[str] = None) -> Dict:
        """Assign agent to error resolution"""
        payload = {
            'agentId': agent_id,
            'role': role,
            'capabilities': capabilities or []
        }
        
        response = requests.post(
            f'{self.base_url}/errors/{error_id}/agents/assign',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_error_metrics(self, time_range: str, aggregation: str = 'hour', group_by: List[str] = None) -> Dict:
        """Get error metrics and analytics"""
        params = {
            'timeRange': time_range,
            'aggregation': aggregation
        }
        if group_by:
            params['groupBy'] = group_by
            
        response = requests.get(
            f'{self.base_url}/errors/metrics',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = ErrorManagerClient('http://localhost:3019', 'your-jwt-token')

async def handle_gpu_timeout_error():
    try:
        # Report the error
        error_report = client.report_error(
            source={
                'serviceId': 'llm-service-001',
                'serviceName': 'LLM Service',
                'componentId': 'model-executor'
            },
            error={
                'message': 'Model inference timeout after 30 seconds',
                'errorCode': 'MODEL_TIMEOUT'
            },
            severity='high',
            context={
                'resourceUtilization': {
                    'gpu': 0.95,
                    'memory': 0.78
                }
            },
            tags=['gpu', 'timeout', 'model']
        )
        
        print(f"Error reported: {error_report['errorId']}")
        
        # Analyze the error
        analysis = client.analyze_error(error_report['errorId'], {
            'depth': 'comprehensive',
            'includeHistorical': True,
            'agentAssistance': True
        })
        
        print(f"Root cause: {analysis['rootCauseAnalysis']['primaryCause']['description']}")
        
        # Get correction suggestions
        correction_plan = client.suggest_correction(error_report['errorId'], {
            'automationLevel': 'agent_assisted',
            'riskTolerance': 'medium'
        })
        
        print(f"Correction plan: {correction_plan['planId']}")
        print(f"Strategy: {correction_plan['strategy']}")
        
        # Apply the correction
        execution = client.apply_correction(
            error_report['errorId'],
            correction_plan['planId']
        )
        
        print(f"Correction executing: {execution['executionId']}")
        print(f"Estimated completion: {execution['estimatedCompletion']}")
        
    except requests.exceptions.RequestException as e:
        print(f"Error management failed: {e}")
```

### Node.js SDK

```javascript
const axios = require('axios');

class ErrorManagerClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async reportError(source, error, options = {}) {
    const payload = {
      source,
      error,
      severity: options.severity || 'medium',
      context: options.context,
      tags: options.tags
    };

    const response = await this.client.post('/errors/report', payload);
    return response.data;
  }

  async analyzeError(errorId, options = {}) {
    const response = await this.client.post(`/errors/${errorId}/analyze`, options);
    return response.data;
  }

  async suggestCorrection(errorId, preferences = {}) {
    const response = await this.client.post(`/errors/${errorId}/correction/suggest`, preferences);
    return response.data;
  }

  async applyCorrection(errorId, planId, overrides = {}) {
    const payload = { planId, overrides };
    const response = await this.client.post(`/errors/${errorId}/correction/apply`, payload);
    return response.data;
  }

  async assignAgent(errorId, agentId, role, capabilities = []) {
    const payload = { agentId, role, capabilities };
    const response = await this.client.post(`/errors/${errorId}/agents/assign`, payload);
    return response.data;
  }

  async delegateResolution(errorId, agentCapabilities, constraints = {}) {
    const payload = { agentCapabilities, constraints };
    const response = await this.client.post(`/errors/${errorId}/agents/delegate`, payload);
    return response.data;
  }

  async getSystemHealth(scope = 'all', includeMetrics = true) {
    const response = await this.client.get('/system/health', {
      params: { scope, includeMetrics }
    });
    return response.data;
  }

  async predictErrors(context, timeHorizon = '6h') {
    const payload = { context, timeHorizon, includeProbabilities: true };
    const response = await this.client.post('/predict/errors', payload);
    return response.data;
  }
}

// Usage example
const client = new ErrorManagerClient('http://localhost:3019', 'your-jwt-token');

async function intelligentErrorHandling() {
  try {
    // Report error with full context
    const errorReport = await client.reportError(
      {
        serviceId: 'llm-service-001',
        serviceName: 'LLM Service',
        componentId: 'model-executor',
        workflowId: 'text-generation-456'
      },
      {
        message: 'Model inference timeout after 30 seconds',
        errorCode: 'MODEL_TIMEOUT',
        details: {
          model: 'gpt-4',
          timeout: 30000,
          inputTokens: 2048
        }
      },
      {
        severity: 'high',
        context: {
          resourceUtilization: {
            gpu: 0.95,
            memory: 0.78,
            cpu: 0.65
          },
          environmentInfo: {
            hostname: 'llm-worker-03',
            gpuMemory: '11GB'
          }
        },
        tags: ['gpu', 'timeout', 'model', 'performance']
      }
    );

    console.log(`Error reported: ${errorReport.errorId}`);
    console.log(`Classification: ${errorReport.classification.category}/${errorReport.classification.type}`);

    // Comprehensive analysis with agent assistance
    const analysis = await client.analyzeError(errorReport.errorId, {
      depth: 'comprehensive',
      includeHistorical: true,
      includePredictive: true,
      agentAssistance: true,
      timeoutMs: 45000
    });

    console.log(`Analysis completed: ${analysis.analysisId}`);
    console.log(`Root cause: ${analysis.rootCauseAnalysis.primaryCause.description}`);
    console.log(`Confidence: ${analysis.confidence}`);

    // Generate intelligent correction plan
    const correctionPlan = await client.suggestCorrection(errorReport.errorId, {
      automationLevel: 'agent_assisted',
      riskTolerance: 'medium',
      timeConstraints: { maxDuration: 1800 },
      approvalRequired: false
    });

    console.log(`Correction plan: ${correctionPlan.planId}`);
    console.log(`Strategy: ${correctionPlan.strategy}`);
    console.log(`Actions: ${correctionPlan.actions.length}`);

    // Delegate resolution to best-fit agent
    const delegation = await client.delegateResolution(
      errorReport.errorId,
      {
        skills: ['gpu_management', 'service_optimization', 'monitoring'],
        experience: 'expert',
        availability: 'immediate',
        specializations: ['memory_optimization', 'performance_tuning']
      },
      {
        maxResolutionTime: 1800,
        riskTolerance: 'medium',
        allowServiceRestart: true,
        requireApproval: false
      }
    );

    console.log(`Delegated to agent: ${delegation.selectedAgent.agentId}`);
    console.log(`Match score: ${delegation.selectedAgent.matchScore}`);
    console.log(`Estimated completion: ${delegation.estimatedCompletion}`);

    // Monitor system health
    const systemHealth = await client.getSystemHealth('all', true);
    console.log(`Overall health: ${systemHealth.overallHealth}`);
    
    if (systemHealth.alerts.length > 0) {
      console.log(`Active alerts: ${systemHealth.alerts.length}`);
      systemHealth.alerts.forEach(alert => {
        console.log(`- ${alert.type}: ${alert.description}`);
      });
    }

    // Get predictive insights
    const predictions = await client.predictErrors({
      systemMetrics: {
        gpuUtilization: 0.87,
        requestRate: 145,
        responseTime: 2.3
      },
      serviceStates: {
        'llm-service': 'stressed',
        'knowledge-service': 'healthy'
      }
    }, '6h');

    if (predictions.length > 0) {
      console.log(`\nPredicted errors in next 6 hours:`);
      predictions.forEach(pred => {
        console.log(`- ${pred.predictedErrorType}: ${(pred.probability * 100).toFixed(1)}% probability`);
        console.log(`  Timeframe: ${pred.timeframe}`);
        console.log(`  Preventive actions: ${pred.preventiveActions.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('Intelligent error handling failed:', error.response?.data || error.message);
  }
}

// Run intelligent error handling
intelligentErrorHandling();
```

---

This completes the comprehensive API documentation for the DADMS 2.0 Error Manager Service. The service provides intelligent error management capabilities combining real-time detection, ML-powered analysis, agent-driven resolution, and continuous learning to create a self-healing system that improves reliability and reduces downtime across the entire DADMS ecosystem. 