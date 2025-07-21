# DADMS 2.0 - Task Orchestrator Service API Endpoints

## Overview

The Task Orchestrator service serves as the central execution engine for DADMS 2.0's Event-Driven System (EDS), orchestrating complex workflows and managing task execution across the entire service ecosystem. This document provides human-readable examples and usage patterns for all available API endpoints.

**Base URL**: `http://localhost:3017` (development) | `https://api.dadms.example.com/task-orchestrator` (production)

**Authentication**: Bearer Token (JWT)

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Workflow Definitions** | GET | `/workflow-definitions` | List workflow definitions |
| | POST | `/workflow-definitions` | Create workflow definition |
| | GET | `/workflow-definitions/{id}` | Get workflow definition |
| | PUT | `/workflow-definitions/{id}` | Update workflow definition |
| | DELETE | `/workflow-definitions/{id}` | Delete workflow definition |
| | POST | `/workflow-definitions/{id}/validate` | Validate workflow definition |
| | POST | `/workflow-definitions/{id}/publish` | Publish workflow definition |
| **Workflow Instances** | GET | `/workflow-instances` | List workflow instances |
| | POST | `/workflow-instances` | Create workflow instance |
| | GET | `/workflow-instances/{id}` | Get workflow instance |
| | POST | `/workflow-instances/{id}/start` | Start workflow instance |
| | POST | `/workflow-instances/{id}/pause` | Pause workflow instance |
| | POST | `/workflow-instances/{id}/resume` | Resume workflow instance |
| | POST | `/workflow-instances/{id}/cancel` | Cancel workflow instance |
| | POST | `/workflow-instances/{id}/terminate` | Terminate workflow instance |
| | GET | `/workflow-instances/{id}/status` | Get workflow status |
| | GET | `/workflow-instances/{id}/history` | Get workflow history |
| **Task Management** | GET | `/tasks` | List tasks |
| | GET | `/tasks/{id}` | Get task details |
| | POST | `/tasks/{id}/start` | Start task execution |
| | POST | `/tasks/{id}/complete` | Complete task |
| | POST | `/tasks/{id}/fail` | Mark task as failed |
| | POST | `/tasks/{id}/retry` | Retry failed task |
| | POST | `/tasks/{id}/reassign` | Reassign task |
| | POST | `/tasks/{id}/cancel` | Cancel task |
| | GET | `/tasks/{id}/status` | Get task status |
| | GET | `/tasks/{id}/logs` | Get task execution logs |
| **Execution Control** | POST | `/execution/batch-start` | Start multiple workflows |
| | POST | `/execution/batch-cancel` | Cancel multiple workflows |
| | GET | `/execution/queue-status` | Get execution queue status |
| | POST | `/execution/priority` | Set execution priority |
| **Monitoring & Analytics** | GET | `/monitoring/active-workflows` | Get active workflows |
| | GET | `/monitoring/performance` | Get performance metrics |
| | GET | `/monitoring/resource-usage` | Get resource usage |
| | GET | `/analytics/workflow-performance` | Get workflow analytics |
| | GET | `/analytics/task-distribution` | Get task distribution |
| | GET | `/analytics/failure-analysis` | Get failure analysis |
| **Event Management** | GET | `/events` | List workflow events |
| | POST | `/events/webhook` | Register event webhook |
| | DELETE | `/events/webhook/{id}` | Remove event webhook |
| **Resource Management** | GET | `/resources/agents` | List available agents |
| | GET | `/resources/services` | List available services |
| | GET | `/resources/capacity` | Get capacity information |
| | POST | `/resources/allocation` | Set resource allocation |
| **Health & Monitoring** | GET | `/health` | Service health check |
| | GET | `/metrics` | Service performance metrics |

---

## 1. Workflow Definitions

### List Workflow Definitions

#### GET `/workflow-definitions`
**Description**: Retrieves a list of all workflow definitions with optional filtering

**Query Parameters**:
- `status` (optional): Filter by definition status (draft, validated, published, deprecated, archived)
- `category` (optional): Filter by workflow category
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/workflow-definitions?status=published&limit=10" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "workflow_definitions": [
    {
      "id": "wf-def-001",
      "name": "Decision Analysis Workflow",
      "description": "Complete decision analysis pipeline including data gathering, modeling, and recommendation generation",
      "version": "1.2.0",
      "status": "published",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T15:30:00Z",
      "created_by": "user-analyst-001",
      "metadata": {
        "category": "decision_analysis",
        "tags": ["analysis", "modeling", "recommendations"],
        "complexity_score": 8.5,
        "estimated_duration": 3600,
        "dependencies": ["data-manager", "model-manager", "analysis-manager"]
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

**SDK Examples**:

**Python**:
```python
import requests

headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://localhost:3017/workflow-definitions',
    headers=headers,
    params={'status': 'published', 'limit': 10}
)

definitions = response.json()
print(f"Found {len(definitions['workflow_definitions'])} definitions")
```

**Node.js**:
```javascript
const axios = require('axios');

const response = await axios.get('http://localhost:3017/workflow-definitions', {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  params: {
    status: 'published',
    limit: 10
  }
});

console.log(`Found ${response.data.workflow_definitions.length} definitions`);
```

### Create Workflow Definition

#### POST `/workflow-definitions`
**Description**: Creates a new workflow definition from BPMN content

**Request Body**:
```json
{
  "name": "Customer Onboarding Workflow",
  "description": "Automated customer onboarding process with compliance checks",
  "version": "1.0.0",
  "bpmn_content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn2:definitions xmlns:bpmn2=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"...",
  "bpmn_format": "xml",
  "metadata": {
    "category": "customer_management",
    "tags": ["onboarding", "compliance", "automation"],
    "estimated_duration": 1800,
    "dependencies": ["identity-service", "compliance-service"]
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/workflow-definitions" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Onboarding Workflow",
    "description": "Automated customer onboarding process",
    "version": "1.0.0",
    "bpmn_content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
    "bpmn_format": "xml"
  }'
```

**Example Response**:
```json
{
  "id": "wf-def-002",
  "name": "Customer Onboarding Workflow",
  "description": "Automated customer onboarding process",
  "version": "1.0.0",
  "status": "draft",
  "created_at": "2025-01-15T16:45:00Z",
  "updated_at": "2025-01-15T16:45:00Z",
  "created_by": "user-manager-001",
  "validation_result": {
    "is_valid": true,
    "warnings": [],
    "errors": []
  }
}
```

### Validate Workflow Definition

#### POST `/workflow-definitions/{id}/validate`
**Description**: Validates a workflow definition for BPMN compliance and service dependencies

**Path Parameters**:
- `id`: Workflow definition ID

**Request Body**:
```json
{
  "validation_options": {
    "check_service_dependencies": true,
    "validate_agent_assignments": true,
    "check_data_flow": true,
    "strict_mode": false
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/workflow-definitions/wf-def-002/validate" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "validation_options": {
      "check_service_dependencies": true,
      "validate_agent_assignments": true
    }
  }'
```

**Example Response**:
```json
{
  "validation_result": {
    "is_valid": true,
    "timestamp": "2025-01-15T16:50:00Z",
    "warnings": [
      {
        "code": "MISSING_TIMEOUT",
        "message": "Task 'data-collection' does not specify a timeout",
        "element_id": "task-data-001",
        "severity": "warning"
      }
    ],
    "errors": [],
    "service_dependencies": {
      "validated": true,
      "missing_services": [],
      "available_services": ["data-manager", "model-manager"]
    },
    "agent_assignments": {
      "validated": true,
      "unassigned_tasks": [],
      "invalid_assignments": []
    }
  }
}
```

---

## 2. Workflow Instances

### Create Workflow Instance

#### POST `/workflow-instances`
**Description**: Creates a new workflow instance from a workflow definition

**Request Body**:
```json
{
  "workflow_definition_id": "wf-def-001",
  "instance_name": "Aviation Safety Analysis - Flight AA123",
  "input_variables": {
    "flight_data_source": "flight-recorder-aa123",
    "analysis_type": "safety_compliance",
    "priority": "high",
    "deadline": "2025-01-16T12:00:00Z"
  },
  "execution_context": {
    "project_id": "project-aviation-safety",
    "user_id": "user-analyst-001",
    "team_id": "team-safety-analysis",
    "environment": "production"
  },
  "configuration": {
    "auto_start": false,
    "parallel_execution": true,
    "retry_policy": {
      "max_retries": 3,
      "backoff_strategy": "exponential"
    }
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/workflow-instances" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_definition_id": "wf-def-001",
    "instance_name": "Aviation Safety Analysis - Flight AA123",
    "input_variables": {
      "flight_data_source": "flight-recorder-aa123",
      "analysis_type": "safety_compliance"
    }
  }'
```

**Example Response**:
```json
{
  "id": "wf-inst-001",
  "workflow_definition_id": "wf-def-001",
  "instance_name": "Aviation Safety Analysis - Flight AA123",
  "status": "created",
  "created_at": "2025-01-15T17:00:00Z",
  "started_at": null,
  "completed_at": null,
  "created_by": "user-analyst-001",
  "current_tasks": [],
  "execution_context": {
    "project_id": "project-aviation-safety",
    "user_id": "user-analyst-001",
    "team_id": "team-safety-analysis",
    "environment": "production"
  }
}
```

### Start Workflow Instance

#### POST `/workflow-instances/{id}/start`
**Description**: Starts execution of a created workflow instance

**Path Parameters**:
- `id`: Workflow instance ID

**Request Body**:
```json
{
  "start_options": {
    "initial_assignments": {
      "task-data-collection": {
        "agent_id": "agent-data-analyst-001",
        "agent_type": "human"
      }
    },
    "priority": "high",
    "notifications": {
      "on_completion": ["user-analyst-001", "team-safety-analysis"],
      "on_failure": ["user-manager-001"]
    }
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/workflow-instances/wf-inst-001/start" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "start_options": {
      "priority": "high"
    }
  }'
```

**Example Response**:
```json
{
  "id": "wf-inst-001",
  "status": "running",
  "started_at": "2025-01-15T17:05:00Z",
  "current_tasks": [
    {
      "id": "task-001",
      "name": "Data Collection",
      "status": "assigned",
      "assigned_to": {
        "agent_id": "agent-data-analyst-001",
        "agent_type": "human"
      },
      "started_at": "2025-01-15T17:05:00Z",
      "estimated_completion": "2025-01-15T18:00:00Z"
    }
  ],
  "execution_metrics": {
    "total_tasks": 8,
    "completed_tasks": 0,
    "failed_tasks": 0,
    "progress_percentage": 0
  }
}
```

### Get Workflow Status

#### GET `/workflow-instances/{id}/status`
**Description**: Retrieves current status and progress of a workflow instance

**Path Parameters**:
- `id`: Workflow instance ID

**Query Parameters**:
- `include_tasks` (optional): Include detailed task information (default: false)
- `include_metrics` (optional): Include execution metrics (default: true)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/workflow-instances/wf-inst-001/status?include_tasks=true" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "id": "wf-inst-001",
  "status": "running",
  "started_at": "2025-01-15T17:05:00Z",
  "last_updated": "2025-01-15T17:30:00Z",
  "progress": {
    "total_tasks": 8,
    "completed_tasks": 3,
    "failed_tasks": 0,
    "running_tasks": 2,
    "pending_tasks": 3,
    "progress_percentage": 37.5
  },
  "current_tasks": [
    {
      "id": "task-004",
      "name": "Model Execution",
      "status": "running",
      "assigned_to": {
        "service_name": "model-manager",
        "agent_type": "service"
      },
      "started_at": "2025-01-15T17:25:00Z",
      "estimated_completion": "2025-01-15T17:45:00Z"
    },
    {
      "id": "task-005",
      "name": "Data Validation", 
      "status": "running",
      "assigned_to": {
        "service_name": "data-manager",
        "agent_type": "service"
      },
      "started_at": "2025-01-15T17:28:00Z",
      "estimated_completion": "2025-01-15T17:35:00Z"
    }
  ],
  "execution_metrics": {
    "average_task_duration": 420,
    "total_execution_time": 1500,
    "resource_utilization": {
      "cpu_usage": 45.2,
      "memory_usage": 32.8
    }
  }
}
```

---

## 3. Task Management

### Get Task Details

#### GET `/tasks/{id}`
**Description**: Retrieves detailed information about a specific task

**Path Parameters**:
- `id`: Task ID

**Query Parameters**:
- `include_logs` (optional): Include execution logs (default: false)
- `include_context` (optional): Include execution context (default: true)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/tasks/task-004?include_logs=true" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "id": "task-004",
  "workflow_instance_id": "wf-inst-001",
  "name": "Model Execution",
  "description": "Execute decision analysis model with collected data",
  "type": "service_task",
  "status": "running",
  "created_at": "2025-01-15T17:25:00Z",
  "started_at": "2025-01-15T17:25:00Z",
  "assignment": {
    "assigned_to": {
      "service_name": "model-manager",
      "agent_type": "service",
      "endpoint": "http://model-manager:3007/execute"
    },
    "assignment_method": "automatic",
    "assigned_at": "2025-01-15T17:25:00Z"
  },
  "input_data": {
    "model_id": "model-safety-analysis-v2",
    "data_source": "flight-recorder-aa123",
    "parameters": {
      "analysis_depth": "comprehensive",
      "confidence_threshold": 0.85
    }
  },
  "execution_context": {
    "project_id": "project-aviation-safety",
    "user_id": "user-analyst-001",
    "correlation_id": "corr-12345",
    "trace_id": "trace-67890"
  },
  "retry_policy": {
    "max_retries": 3,
    "current_attempt": 1,
    "backoff_strategy": "exponential",
    "next_retry_at": null
  },
  "execution_logs": [
    {
      "timestamp": "2025-01-15T17:25:00Z",
      "level": "info",
      "message": "Task execution started",
      "details": {
        "assigned_service": "model-manager",
        "execution_id": "exec-12345"
      }
    },
    {
      "timestamp": "2025-01-15T17:25:15Z",
      "level": "info", 
      "message": "Model loading completed",
      "details": {
        "model_id": "model-safety-analysis-v2",
        "load_time_ms": 15000
      }
    }
  ]
}
```

### Complete Task

#### POST `/tasks/{id}/complete`
**Description**: Marks a task as completed with results

**Path Parameters**:
- `id`: Task ID

**Request Body**:
```json
{
  "result_data": {
    "analysis_results": {
      "safety_score": 0.92,
      "risk_factors": [
        {
          "factor": "weather_conditions",
          "severity": "medium",
          "probability": 0.3
        }
      ],
      "recommendations": [
        "Implement enhanced weather monitoring",
        "Update navigation protocols"
      ]
    },
    "metadata": {
      "execution_time_ms": 45000,
      "model_confidence": 0.89,
      "data_quality": "high"
    }
  },
  "completion_notes": "Analysis completed successfully with high confidence scores",
  "next_actions": [
    {
      "action": "trigger_next_task",
      "task_id": "task-006"
    }
  ]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/tasks/task-004/complete" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "result_data": {
      "analysis_results": {
        "safety_score": 0.92,
        "recommendations": ["Implement enhanced weather monitoring"]
      }
    },
    "completion_notes": "Analysis completed successfully"
  }'
```

**Example Response**:
```json
{
  "id": "task-004",
  "status": "completed",
  "completed_at": "2025-01-15T17:45:00Z",
  "execution_time": 1200,
  "result_summary": {
    "success": true,
    "data_size": 1024,
    "quality_score": 0.95
  },
  "triggered_actions": [
    {
      "action": "task_triggered", 
      "target_task_id": "task-006",
      "timestamp": "2025-01-15T17:45:01Z"
    }
  ]
}
```

### Reassign Task

#### POST `/tasks/{id}/reassign`
**Description**: Reassigns a task to a different agent or service

**Path Parameters**:
- `id`: Task ID

**Request Body**:
```json
{
  "new_assignment": {
    "agent_id": "agent-senior-analyst-002",
    "agent_type": "human",
    "assignment_reason": "Original assignee unavailable",
    "priority_adjustment": "high"
  },
  "transition_options": {
    "preserve_progress": true,
    "notify_previous_assignee": true,
    "notify_new_assignee": true
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/tasks/task-005/reassign" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "new_assignment": {
      "agent_id": "agent-senior-analyst-002",
      "agent_type": "human",
      "assignment_reason": "Original assignee unavailable"
    }
  }'
```

**Example Response**:
```json
{
  "id": "task-005",
  "status": "assigned",
  "previous_assignment": {
    "agent_id": "agent-data-analyst-001",
    "agent_type": "human",
    "unassigned_at": "2025-01-15T18:00:00Z"
  },
  "current_assignment": {
    "agent_id": "agent-senior-analyst-002",
    "agent_type": "human",
    "assigned_at": "2025-01-15T18:00:00Z",
    "assignment_method": "manual_reassignment"
  },
  "notifications_sent": [
    {
      "recipient": "agent-data-analyst-001",
      "type": "task_unassigned",
      "sent_at": "2025-01-15T18:00:01Z"
    },
    {
      "recipient": "agent-senior-analyst-002", 
      "type": "task_assigned",
      "sent_at": "2025-01-15T18:00:02Z"
    }
  ]
}
```

---

## 4. Execution Control

### Batch Start Workflows

#### POST `/execution/batch-start`
**Description**: Starts multiple workflow instances simultaneously

**Request Body**:
```json
{
  "workflows": [
    {
      "workflow_definition_id": "wf-def-001",
      "instance_name": "Safety Analysis - Flight BB456",
      "input_variables": {
        "flight_data_source": "flight-recorder-bb456"
      }
    },
    {
      "workflow_definition_id": "wf-def-002", 
      "instance_name": "Compliance Check - Aircraft XYZ",
      "input_variables": {
        "aircraft_id": "aircraft-xyz-789"
      }
    }
  ],
  "execution_options": {
    "parallel_execution": true,
    "max_concurrent": 5,
    "priority": "medium",
    "batch_id": "batch-safety-review-001"
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/execution/batch-start" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "workflows": [
      {
        "workflow_definition_id": "wf-def-001",
        "instance_name": "Safety Analysis - Flight BB456"
      }
    ],
    "execution_options": {
      "parallel_execution": true
    }
  }'
```

**Example Response**:
```json
{
  "batch_id": "batch-safety-review-001",
  "started_workflows": [
    {
      "instance_id": "wf-inst-002",
      "instance_name": "Safety Analysis - Flight BB456",
      "status": "running",
      "started_at": "2025-01-15T18:15:00Z"
    },
    {
      "instance_id": "wf-inst-003",
      "instance_name": "Compliance Check - Aircraft XYZ", 
      "status": "running",
      "started_at": "2025-01-15T18:15:01Z"
    }
  ],
  "failed_starts": [],
  "execution_summary": {
    "total_requested": 2,
    "successfully_started": 2,
    "failed_to_start": 0,
    "estimated_completion": "2025-01-15T19:30:00Z"
  }
}
```

### Get Execution Queue Status

#### GET `/execution/queue-status`
**Description**: Retrieves current status of the execution queue and resource utilization

**Query Parameters**:
- `include_details` (optional): Include detailed queue information (default: false)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/execution/queue-status?include_details=true" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "queue_summary": {
    "total_queued": 15,
    "running": 8,
    "pending": 7,
    "paused": 0,
    "average_wait_time": 120,
    "estimated_queue_clear_time": "2025-01-15T20:00:00Z"
  },
  "resource_utilization": {
    "cpu_usage": 68.5,
    "memory_usage": 45.2,
    "active_agents": 12,
    "available_agents": 8,
    "service_load": {
      "model-manager": 85.0,
      "data-manager": 42.3,
      "analysis-manager": 67.8
    }
  },
  "queue_details": [
    {
      "workflow_instance_id": "wf-inst-004",
      "position": 1,
      "priority": "high",
      "estimated_start_time": "2025-01-15T18:25:00Z",
      "resource_requirements": {
        "cpu_cores": 2,
        "memory_mb": 1024,
        "required_services": ["model-manager", "data-manager"]
      }
    }
  ]
}
```

---

## 5. Monitoring & Analytics

### Get Performance Metrics

#### GET `/monitoring/performance`
**Description**: Retrieves detailed performance metrics for workflow execution

**Query Parameters**:
- `time_range` (optional): Time range for metrics (1h, 24h, 7d, 30d) (default: 24h)
- `granularity` (optional): Data granularity (minute, hour, day) (default: hour)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/monitoring/performance?time_range=24h&granularity=hour" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "time_range": {
    "start": "2025-01-14T18:30:00Z",
    "end": "2025-01-15T18:30:00Z",
    "granularity": "hour"
  },
  "workflow_metrics": {
    "total_workflows_started": 45,
    "total_workflows_completed": 38,
    "total_workflows_failed": 2,
    "average_execution_time": 2850,
    "success_rate": 95.0,
    "throughput_per_hour": 1.9
  },
  "task_metrics": {
    "total_tasks_executed": 312,
    "average_task_duration": 380,
    "task_failure_rate": 3.2,
    "most_common_task_types": [
      {"type": "service_task", "count": 156, "percentage": 50.0},
      {"type": "user_task", "count": 98, "percentage": 31.4},
      {"type": "script_task", "count": 58, "percentage": 18.6}
    ]
  },
  "resource_metrics": {
    "average_cpu_usage": 62.3,
    "peak_cpu_usage": 89.7,
    "average_memory_usage": 38.9,
    "peak_memory_usage": 67.2,
    "agent_utilization": {
      "human_agents": 45.6,
      "service_agents": 78.9
    }
  },
  "performance_trends": [
    {
      "timestamp": "2025-01-15T17:00:00Z",
      "workflows_completed": 3,
      "average_execution_time": 2650,
      "cpu_usage": 65.4,
      "memory_usage": 41.2
    }
  ]
}
```

### Get Workflow Analytics

#### GET `/analytics/workflow-performance`
**Description**: Provides analytics and insights on workflow performance patterns

**Query Parameters**:
- `workflow_definition_id` (optional): Analyze specific workflow definition
- `period` (optional): Analysis period (week, month, quarter) (default: month)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/analytics/workflow-performance?workflow_definition_id=wf-def-001&period=week" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "workflow_definition_id": "wf-def-001",
  "analysis_period": {
    "start": "2025-01-08T00:00:00Z",
    "end": "2025-01-15T23:59:59Z",
    "period": "week"
  },
  "performance_summary": {
    "total_executions": 23,
    "successful_executions": 21,
    "failed_executions": 2,
    "success_rate": 91.3,
    "average_execution_time": 3420,
    "median_execution_time": 3120,
    "fastest_execution": 2280,
    "slowest_execution": 5640
  },
  "bottleneck_analysis": {
    "slowest_tasks": [
      {
        "task_name": "Data Collection",
        "average_duration": 1200,
        "frequency": 23,
        "impact_score": 8.5
      },
      {
        "task_name": "Model Execution",
        "average_duration": 980,
        "frequency": 23,
        "impact_score": 7.2
      }
    ],
    "resource_constraints": [
      {
        "resource": "model-manager",
        "constraint_type": "capacity",
        "impact": "medium",
        "recommendation": "Consider scaling model-manager instances"
      }
    ]
  },
  "optimization_recommendations": [
    {
      "type": "task_optimization",
      "target": "Data Collection",
      "recommendation": "Implement parallel data collection for multiple sources",
      "estimated_improvement": "25% faster execution"
    },
    {
      "type": "resource_allocation",
      "target": "model-manager",
      "recommendation": "Add dedicated instance for high-priority workflows",
      "estimated_improvement": "15% better overall throughput"
    }
  ]
}
```

---

## 6. Event Management

### List Workflow Events

#### GET `/events`
**Description**: Retrieves workflow and task events with filtering capabilities

**Query Parameters**:
- `workflow_instance_id` (optional): Filter events for specific workflow
- `event_type` (optional): Filter by event type
- `start_time` (optional): Filter events after timestamp (ISO 8601)
- `end_time` (optional): Filter events before timestamp (ISO 8601)
- `limit` (optional): Number of events to return (default: 100)

**Example Request**:
```bash
curl -X GET "http://localhost:3017/events?workflow_instance_id=wf-inst-001&event_type=task_completed&limit=50" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "events": [
    {
      "id": "event-001",
      "workflow_instance_id": "wf-inst-001", 
      "event_type": "task_completed",
      "timestamp": "2025-01-15T17:45:00Z",
      "source": {
        "component": "task-orchestrator",
        "task_id": "task-004"
      },
      "data": {
        "task_name": "Model Execution",
        "execution_time": 1200,
        "result_summary": {
          "success": true,
          "safety_score": 0.92
        }
      },
      "correlation_id": "corr-12345",
      "metadata": {
        "user_id": "user-analyst-001",
        "project_id": "project-aviation-safety"
      }
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Register Event Webhook

#### POST `/events/webhook`
**Description**: Registers a webhook to receive workflow and task events

**Request Body**:
```json
{
  "url": "https://your-app.com/dadms-webhooks",
  "event_types": [
    "workflow_started",
    "workflow_completed", 
    "workflow_failed",
    "task_completed",
    "task_failed"
  ],
  "filters": {
    "project_ids": ["project-aviation-safety"],
    "workflow_definition_ids": ["wf-def-001", "wf-def-002"],
    "priority_levels": ["high", "critical"]
  },
  "authentication": {
    "auth_type": "bearer_token",
    "credentials": {
      "token": "your-webhook-token"
    }
  },
  "retry_policy": {
    "max_retries": 3,
    "backoff_strategy": "exponential"
  }
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3017/events/webhook" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/dadms-webhooks",
    "event_types": ["workflow_completed", "task_failed"],
    "filters": {
      "project_ids": ["project-aviation-safety"]
    }
  }'
```

**Example Response**:
```json
{
  "webhook_id": "webhook-001",
  "url": "https://your-app.com/dadms-webhooks",
  "status": "active",
  "created_at": "2025-01-15T18:45:00Z",
  "last_triggered": null,
  "delivery_stats": {
    "total_deliveries": 0,
    "successful_deliveries": 0,
    "failed_deliveries": 0,
    "success_rate": 0
  },
  "configuration": {
    "event_types": ["workflow_completed", "task_failed"],
    "filters": {
      "project_ids": ["project-aviation-safety"]
    }
  }
}
```

---

## 7. Resource Management

### List Available Agents

#### GET `/resources/agents`
**Description**: Retrieves list of available agents for task assignment

**Query Parameters**:
- `agent_type` (optional): Filter by agent type (human, ai, service)
- `status` (optional): Filter by availability status (available, busy, offline)
- `capabilities` (optional): Filter by agent capabilities

**Example Request**:
```bash
curl -X GET "http://localhost:3017/resources/agents?agent_type=human&status=available" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "agents": [
    {
      "agent_id": "agent-senior-analyst-002",
      "agent_type": "human",
      "name": "Dr. Sarah Johnson",
      "status": "available",
      "capabilities": [
        "data_analysis",
        "safety_assessment", 
        "report_generation"
      ],
      "current_workload": {
        "active_tasks": 0,
        "queue_length": 0,
        "utilization_percentage": 0
      },
      "expertise": {
        "domains": ["aviation", "safety", "compliance"],
        "experience_level": "senior",
        "certifications": ["FAA_Safety_Inspector", "Aviation_Risk_Analyst"]
      },
      "availability": {
        "next_available": "2025-01-15T19:00:00Z",
        "working_hours": {
          "timezone": "America/New_York",
          "schedule": "09:00-17:00"
        }
      }
    }
  ],
  "summary": {
    "total_agents": 15,
    "available_agents": 8,
    "busy_agents": 6,
    "offline_agents": 1,
    "by_type": {
      "human": 8,
      "ai": 4,
      "service": 3
    }
  }
}
```

### Get Capacity Information

#### GET `/resources/capacity`
**Description**: Provides information about system capacity and resource limits

**Example Request**:
```bash
curl -X GET "http://localhost:3017/resources/capacity" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "overall_capacity": {
    "max_concurrent_workflows": 50,
    "current_workflows": 8,
    "available_capacity": 42,
    "utilization_percentage": 16.0
  },
  "resource_limits": {
    "cpu_cores": 16,
    "memory_gb": 64,
    "storage_gb": 1000,
    "network_bandwidth_mbps": 1000
  },
  "current_usage": {
    "cpu_cores_used": 6.8,
    "memory_gb_used": 24.5,
    "storage_gb_used": 245,
    "network_bandwidth_used": 125
  },
  "service_capacity": [
    {
      "service_name": "model-manager",
      "max_concurrent_requests": 10,
      "current_requests": 3,
      "queue_length": 2,
      "average_response_time": 2500
    },
    {
      "service_name": "data-manager",
      "max_concurrent_requests": 20,
      "current_requests": 5,
      "queue_length": 0,
      "average_response_time": 450
    }
  ],
  "scaling_recommendations": [
    {
      "resource": "model-manager",
      "recommendation": "Consider adding 1 additional instance",
      "reason": "Queue length consistently above threshold",
      "priority": "medium",
      "estimated_impact": "30% improvement in response time"
    }
  ]
}
```

---

## 8. Health & Monitoring

### Service Health Check

#### GET `/health`
**Description**: Performs comprehensive health check of the Task Orchestrator service

**Example Request**:
```bash
curl -X GET "http://localhost:3017/health" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T19:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 15,
      "details": "PostgreSQL connection active"
    },
    "event_manager": {
      "status": "healthy", 
      "response_time_ms": 25,
      "details": "Event publishing operational"
    },
    "workflow_engine": {
      "status": "healthy",
      "active_workflows": 8,
      "queue_length": 3,
      "details": "Engine processing normally"
    },
    "external_services": {
      "model-manager": {
        "status": "healthy",
        "response_time_ms": 120
      },
      "data-manager": {
        "status": "healthy",
        "response_time_ms": 45
      },
      "analysis-manager": {
        "status": "degraded",
        "response_time_ms": 2500,
        "details": "High response times detected"
      }
    }
  },
  "metrics": {
    "requests_per_minute": 45,
    "average_response_time": 250,
    "error_rate": 0.5,
    "active_connections": 12
  }
}
```

### Service Performance Metrics

#### GET `/metrics`
**Description**: Retrieves detailed performance and operational metrics

**Example Request**:
```bash
curl -X GET "http://localhost:3017/metrics" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example Response**:
```json
{
  "timestamp": "2025-01-15T19:00:00Z",
  "service_metrics": {
    "requests_total": 15420,
    "requests_per_second": 12.5,
    "average_response_time_ms": 245,
    "p95_response_time_ms": 850,
    "p99_response_time_ms": 1200,
    "error_rate": 0.3,
    "success_rate": 99.7
  },
  "workflow_metrics": {
    "active_workflows": 8,
    "queued_workflows": 3, 
    "completed_today": 45,
    "failed_today": 2,
    "average_execution_time": 2850,
    "throughput_per_hour": 1.9
  },
  "resource_metrics": {
    "cpu_usage_percent": 68.5,
    "memory_usage_percent": 45.2,
    "memory_usage_mb": 1843,
    "disk_usage_percent": 23.8,
    "network_io_mbps": 15.6
  },
  "queue_metrics": {
    "total_queued_tasks": 12,
    "high_priority_tasks": 3,
    "medium_priority_tasks": 7,
    "low_priority_tasks": 2,
    "average_wait_time_seconds": 120,
    "oldest_queued_task_seconds": 340
  },
  "database_metrics": {
    "connections_active": 8,
    "connections_idle": 4,
    "query_duration_p95_ms": 45,
    "slow_queries_count": 2
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
    "code": "INVALID_REQUEST",
    "message": "Invalid workflow definition format",
    "details": {
      "field": "bpmn_content",
      "reason": "Invalid XML structure"
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

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access workflow definition",
    "details": {
      "required_permission": "workflow:read",
      "resource_id": "wf-def-001"
    }
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Workflow instance not found",
    "details": {
      "resource_type": "workflow_instance",
      "resource_id": "wf-inst-999"
    }
  }
}
```

### 409 Conflict
```json
{
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "Workflow instance is already running",
    "details": {
      "current_status": "running",
      "instance_id": "wf-inst-001"
    }
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Workflow execution failed due to internal error",
    "details": {
      "correlation_id": "corr-12345",
      "timestamp": "2025-01-15T19:00:00Z"
    }
  }
}
```

### 503 Service Unavailable
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Task Orchestrator is temporarily unavailable",
    "details": {
      "reason": "System maintenance in progress",
      "retry_after_seconds": 300
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

class TaskOrchestratorClient:
    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def create_workflow_instance(self, definition_id: str, name: str, 
                               input_vars: Dict) -> Dict:
        payload = {
            'workflow_definition_id': definition_id,
            'instance_name': name,
            'input_variables': input_vars
        }
        response = requests.post(
            f'{self.base_url}/workflow-instances',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def start_workflow(self, instance_id: str, options: Optional[Dict] = None) -> Dict:
        payload = {'start_options': options or {}}
        response = requests.post(
            f'{self.base_url}/workflow-instances/{instance_id}/start',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_workflow_status(self, instance_id: str) -> Dict:
        response = requests.get(
            f'{self.base_url}/workflow-instances/{instance_id}/status',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = TaskOrchestratorClient('http://localhost:3017', 'your-jwt-token')

# Create and start a workflow
instance = client.create_workflow_instance(
    'wf-def-001',
    'Safety Analysis - Flight CC789',
    {'flight_data_source': 'flight-recorder-cc789'}
)

result = client.start_workflow(instance['id'], {'priority': 'high'})
print(f"Workflow started: {result['status']}")
```

### Node.js SDK

```javascript
const axios = require('axios');

class TaskOrchestratorClient {
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

  async createWorkflowInstance(definitionId, name, inputVars) {
    const payload = {
      workflow_definition_id: definitionId,
      instance_name: name,
      input_variables: inputVars
    };
    
    const response = await this.client.post('/workflow-instances', payload);
    return response.data;
  }

  async startWorkflow(instanceId, options = {}) {
    const payload = { start_options: options };
    const response = await this.client.post(
      `/workflow-instances/${instanceId}/start`, 
      payload
    );
    return response.data;
  }

  async getWorkflowStatus(instanceId) {
    const response = await this.client.get(
      `/workflow-instances/${instanceId}/status`
    );
    return response.data;
  }

  async monitorWorkflow(instanceId, callback) {
    const pollStatus = async () => {
      try {
        const status = await this.getWorkflowStatus(instanceId);
        callback(null, status);
        
        if (!['completed', 'failed', 'cancelled'].includes(status.status)) {
          setTimeout(pollStatus, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        callback(error, null);
      }
    };
    
    pollStatus();
  }
}

// Usage example
const client = new TaskOrchestratorClient('http://localhost:3017', 'your-jwt-token');

async function runWorkflow() {
  try {
    // Create workflow instance
    const instance = await client.createWorkflowInstance(
      'wf-def-001',
      'Safety Analysis - Flight DD123',
      { flight_data_source: 'flight-recorder-dd123' }
    );
    
    console.log(`Created instance: ${instance.id}`);
    
    // Start workflow
    const result = await client.startWorkflow(instance.id, { priority: 'high' });
    console.log(`Workflow started: ${result.status}`);
    
    // Monitor progress
    client.monitorWorkflow(instance.id, (error, status) => {
      if (error) {
        console.error('Error monitoring workflow:', error);
        return;
      }
      
      console.log(`Status: ${status.status}, Progress: ${status.progress.progress_percentage}%`);
      
      if (status.status === 'completed') {
        console.log('Workflow completed successfully!');
      } else if (status.status === 'failed') {
        console.log('Workflow failed:', status.failure_reason);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

runWorkflow();
```

---

## Webhook Event Examples

When you register a webhook, you'll receive events in the following format:

### Workflow Started Event
```json
{
  "event_id": "evt-001",
  "event_type": "workflow_started",
  "timestamp": "2025-01-15T19:30:00Z",
  "workflow_instance_id": "wf-inst-005",
  "workflow_definition_id": "wf-def-001",
  "data": {
    "instance_name": "Safety Analysis - Flight EE456",
    "started_by": "user-analyst-003",
    "priority": "high",
    "estimated_completion": "2025-01-15T21:00:00Z"
  },
  "metadata": {
    "project_id": "project-aviation-safety",
    "correlation_id": "corr-67890"
  }
}
```

### Task Completed Event
```json
{
  "event_id": "evt-002",
  "event_type": "task_completed",
  "timestamp": "2025-01-15T19:45:00Z",
  "workflow_instance_id": "wf-inst-005",
  "task_id": "task-010",
  "data": {
    "task_name": "Safety Analysis",
    "execution_time": 900,
    "assigned_to": "agent-safety-expert-001",
    "result_summary": {
      "safety_score": 0.94,
      "risk_level": "low",
      "recommendations_count": 3
    }
  },
  "metadata": {
    "project_id": "project-aviation-safety",
    "correlation_id": "corr-67890"
  }
}
```

### Workflow Failed Event
```json
{
  "event_id": "evt-003",
  "event_type": "workflow_failed",
  "timestamp": "2025-01-15T20:15:00Z",
  "workflow_instance_id": "wf-inst-006",
  "data": {
    "failure_reason": "Data source unavailable",
    "failed_task_id": "task-012",
    "failed_task_name": "Data Collection",
    "error_details": {
      "error_code": "DATA_SOURCE_TIMEOUT",
      "message": "Flight recorder data not accessible"
    },
    "retry_possible": true,
    "suggested_actions": [
      "Check data source connectivity",
      "Retry with alternative data source"
    ]
  },
  "metadata": {
    "project_id": "project-aviation-safety",
    "correlation_id": "corr-98765"
  }
}
```

This completes the comprehensive API documentation for the DADMS 2.0 Task Orchestrator service. The service provides robust workflow orchestration capabilities with extensive monitoring, analytics, and integration features for the Event-Driven System. 