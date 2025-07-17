# Process Manager Service API Endpoints

## Overview

The Process Manager Service provides comprehensive BPMN process management capabilities including process definitions, instances, deployment, monitoring, and lifecycle management. It serves as the central interface for managing workflow processes in DADMS.

## Base URL
```
http://localhost:3007
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Process Definitions

### Get Process Definitions
**GET** `/api/processes/definitions`

Returns a list of all available process definitions.

**Query Parameters:**
- `key` (optional): Filter by process key
- `version` (optional): Filter by specific version
- `active` (optional): Filter by active status (true/false)
- `limit` (optional): Number of definitions to return (default: 20)
- `offset` (optional): Number of definitions to skip (default: 0)

**Response:**
```json
{
  "definitions": [
    {
      "id": "decision-analysis:1:abc123",
      "key": "decision-analysis",
      "name": "Decision Analysis Process",
      "version": 1,
      "category": "decision",
      "description": "Multi-step decision analysis workflow",
      "deploymentId": "deploy-456",
      "deployedAt": "2024-01-15T10:00:00Z",
      "active": true,
      "suspended": false,
      "instances": 5,
      "xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">...</bpmn:definitions>"
    },
    {
      "id": "uav-acquisition:2:def789",
      "key": "uav-acquisition",
      "name": "UAV Acquisition Process",
      "version": 2,
      "category": "acquisition",
      "description": "UAV acquisition decision workflow",
      "deploymentId": "deploy-789",
      "deployedAt": "2024-01-14T15:30:00Z",
      "active": true,
      "suspended": false,
      "instances": 3,
      "xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">...</bpmn:definitions>"
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

### Get Process Definition Details
**GET** `/api/processes/definitions/{definitionId}`

Returns detailed information about a specific process definition.

**Response:**
```json
{
  "id": "decision-analysis:1:abc123",
  "key": "decision-analysis",
  "name": "Decision Analysis Process",
  "version": 1,
  "category": "decision",
  "description": "Multi-step decision analysis workflow",
  "deploymentId": "deploy-456",
  "deployedAt": "2024-01-15T10:00:00Z",
  "active": true,
  "suspended": false,
  "instances": 5,
  "xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">...</bpmn:definitions>",
  "diagram": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCI+...",
  "startForm": {
    "key": "decision-analysis-start",
    "fields": [
      {
        "id": "projectId",
        "label": "Project ID",
        "type": "string",
        "required": true
      },
      {
        "id": "decisionType",
        "label": "Decision Type",
        "type": "select",
        "options": ["acquisition", "strategy", "operation"],
        "required": true
      }
    ]
  },
  "tasks": [
    {
      "id": "task-1",
      "name": "Define Objectives",
      "type": "userTask",
      "assignee": "decision-analyst",
      "candidateGroups": ["analysts", "stakeholders"]
    },
    {
      "id": "task-2",
      "name": "Analyze Alternatives",
      "type": "serviceTask",
      "serviceType": "llm",
      "serviceName": "alternative-analysis"
    }
  ]
}
```

### Deploy Process Definition
**POST** `/api/processes/definitions`

Deploy a new process definition from BPMN XML.

**Request Body:**
```json
{
  "name": "New Decision Process",
  "key": "new-decision-process",
  "category": "decision",
  "description": "New decision analysis workflow",
  "xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">...</bpmn:definitions>",
  "enableDuplicateFiltering": true,
  "deployChangedOnly": false
}
```

**Response:**
```json
{
  "deploymentId": "deploy-123",
  "definitionId": "new-decision-process:1:def456",
  "name": "New Decision Process",
  "key": "new-decision-process",
  "version": 1,
  "deployedAt": "2024-01-15T11:00:00Z",
  "status": "deployed"
}
```

### Update Process Definition
**PUT** `/api/processes/definitions/{definitionId}`

Update an existing process definition.

**Request Body:**
```json
{
  "name": "Updated Decision Process",
  "description": "Updated decision analysis workflow",
  "xml": "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\">...</bpmn:definitions>"
}
```

### Delete Process Definition
**DELETE** `/api/processes/definitions/{definitionId}`

Delete a process definition and all its instances.

**Query Parameters:**
- `cascade` (optional): Cascade delete to instances (default: false)

### Suspend/Activate Process Definition
**PUT** `/api/processes/definitions/{definitionId}/suspended`

Suspend or activate a process definition.

**Request Body:**
```json
{
  "suspended": true,
  "includeProcessInstances": true,
  "executionDate": "2024-01-15T12:00:00Z"
}
```

---

## Process Instances

### Get Process Instances
**GET** `/api/processes/instances`

Returns a list of process instances.

**Query Parameters:**
- `processDefinitionKey` (optional): Filter by process definition key
- `businessKey` (optional): Filter by business key
- `status` (optional): Filter by status (active, suspended, completed, terminated)
- `startedBefore` (optional): Filter instances started before date (ISO 8601)
- `startedAfter` (optional): Filter instances started after date (ISO 8601)
- `limit` (optional): Number of instances to return (default: 20)
- `offset` (optional): Number of instances to skip (default: 0)

**Response:**
```json
{
  "instances": [
    {
      "id": "instance-123",
      "processDefinitionId": "decision-analysis:1:abc123",
      "processDefinitionKey": "decision-analysis",
      "processDefinitionName": "Decision Analysis Process",
      "businessKey": "proj-uav-2024",
      "startTime": "2024-01-15T10:30:00Z",
      "endTime": null,
      "duration": 3600,
      "status": "active",
      "startedBy": "user-456",
      "variables": {
        "projectId": "proj-123",
        "decisionType": "acquisition",
        "stakeholders": ["Col. Smith", "Maj. Johnson"]
      },
      "currentActivities": [
        {
          "id": "task-1",
          "name": "Define Objectives",
          "type": "userTask",
          "assignee": "user-789"
        }
      ]
    },
    {
      "id": "instance-124",
      "processDefinitionId": "uav-acquisition:2:def789",
      "processDefinitionKey": "uav-acquisition",
      "processDefinitionName": "UAV Acquisition Process",
      "businessKey": "uav-procurement-2024",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "duration": 7200,
      "status": "completed",
      "startedBy": "user-123",
      "variables": {
        "projectId": "proj-456",
        "acquisitionType": "uav",
        "budget": 5000000
      },
      "currentActivities": []
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

### Get Process Instance Details
**GET** `/api/processes/instances/{instanceId}`

Returns detailed information about a specific process instance.

**Response:**
```json
{
  "id": "instance-123",
  "processDefinitionId": "decision-analysis:1:abc123",
  "processDefinitionKey": "decision-analysis",
  "processDefinitionName": "Decision Analysis Process",
  "businessKey": "proj-uav-2024",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": null,
  "duration": 3600,
  "status": "active",
  "startedBy": "user-456",
  "variables": {
    "projectId": "proj-123",
    "decisionType": "acquisition",
    "stakeholders": ["Col. Smith", "Maj. Johnson"]
  },
  "activities": [
    {
      "id": "start-event",
      "name": "Start",
      "type": "startEvent",
      "status": "completed",
      "startTime": "2024-01-15T10:30:00Z",
      "endTime": "2024-01-15T10:30:05Z"
    },
    {
      "id": "task-1",
      "name": "Define Objectives",
      "type": "userTask",
      "status": "active",
      "startTime": "2024-01-15T10:30:05Z",
      "endTime": null,
      "assignee": "user-789",
      "dueDate": "2024-01-16T10:30:00Z"
    }
  ],
  "incidents": [],
  "executionPath": [
    {
      "activityId": "start-event",
      "activityName": "Start",
      "timestamp": "2024-01-15T10:30:05Z"
    },
    {
      "activityId": "task-1",
      "activityName": "Define Objectives",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ]
}
```

### Start Process Instance
**POST** `/api/processes/instances`

Start a new process instance.

**Request Body:**
```json
{
  "processDefinitionKey": "decision-analysis",
  "businessKey": "proj-uav-2024",
  "variables": {
    "projectId": "proj-123",
    "decisionType": "acquisition",
    "stakeholders": ["Col. Smith", "Maj. Johnson"],
    "priority": "high"
  },
  "startInstructions": [
    {
      "type": "startBeforeActivity",
      "activityId": "task-1"
    }
  ]
}
```

**Response:**
```json
{
  "id": "instance-125",
  "processDefinitionId": "decision-analysis:1:abc123",
  "processDefinitionKey": "decision-analysis",
  "businessKey": "proj-uav-2024",
  "startTime": "2024-01-15T12:00:00Z",
  "status": "active",
  "startedBy": "user-456"
}
```

### Suspend/Activate Process Instance
**PUT** `/api/processes/instances/{instanceId}/suspended`

Suspend or activate a process instance.

**Request Body:**
```json
{
  "suspended": true
}
```

### Terminate Process Instance
**DELETE** `/api/processes/instances/{instanceId}`

Terminate a process instance.

**Query Parameters:**
- `deleteReason` (optional): Reason for termination

### Get Process Instance Variables
**GET** `/api/processes/instances/{instanceId}/variables`

Returns all variables for a process instance.

**Response:**
```json
{
  "variables": {
    "projectId": {
      "value": "proj-123",
      "type": "String",
      "valueInfo": {}
    },
    "decisionType": {
      "value": "acquisition",
      "type": "String",
      "valueInfo": {}
    },
    "stakeholders": {
      "value": ["Col. Smith", "Maj. Johnson"],
      "type": "Json",
      "valueInfo": {}
    },
    "priority": {
      "value": "high",
      "type": "String",
      "valueInfo": {}
    }
  }
}
```

### Update Process Instance Variables
**PUT** `/api/processes/instances/{instanceId}/variables`

Update variables for a process instance.

**Request Body:**
```json
{
  "variables": {
    "priority": {
      "value": "urgent",
      "type": "String"
    },
    "deadline": {
      "value": "2024-01-20T00:00:00Z",
      "type": "Date"
    }
  }
}
```

---

## Tasks

### Get Tasks
**GET** `/api/processes/tasks`

Returns a list of tasks.

**Query Parameters:**
- `processInstanceId` (optional): Filter by process instance ID
- `assignee` (optional): Filter by assignee
- `candidateUser` (optional): Filter by candidate user
- `candidateGroup` (optional): Filter by candidate group
- `status` (optional): Filter by status (created, assigned, completed)
- `limit` (optional): Number of tasks to return (default: 20)
- `offset` (optional): Number of tasks to skip (default: 0)

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "name": "Define Objectives",
      "description": "Define the objectives for the decision analysis",
      "processInstanceId": "instance-123",
      "processDefinitionId": "decision-analysis:1:abc123",
      "processDefinitionKey": "decision-analysis",
      "taskDefinitionKey": "define-objectives",
      "assignee": "user-789",
      "created": "2024-01-15T10:30:05Z",
      "due": "2024-01-16T10:30:00Z",
      "followUp": "2024-01-17T10:30:00Z",
      "priority": 50,
      "status": "assigned",
      "variables": {
        "projectId": "proj-123",
        "decisionType": "acquisition"
      }
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

### Get Task Details
**GET** `/api/processes/tasks/{taskId}`

Returns detailed information about a specific task.

**Response:**
```json
{
  "id": "task-123",
  "name": "Define Objectives",
  "description": "Define the objectives for the decision analysis",
  "processInstanceId": "instance-123",
  "processDefinitionId": "decision-analysis:1:abc123",
  "processDefinitionKey": "decision-analysis",
  "taskDefinitionKey": "define-objectives",
  "assignee": "user-789",
  "owner": "user-456",
  "created": "2024-01-15T10:30:05Z",
  "due": "2024-01-16T10:30:00Z",
  "followUp": "2024-01-17T10:30:00Z",
  "priority": 50,
  "status": "assigned",
  "variables": {
    "projectId": "proj-123",
    "decisionType": "acquisition"
  },
  "formKey": "define-objectives-form",
  "candidateUsers": ["user-789", "user-456"],
  "candidateGroups": ["analysts", "stakeholders"]
}
```

### Complete Task
**POST** `/api/processes/tasks/{taskId}/complete`

Complete a task with variables.

**Request Body:**
```json
{
  "variables": {
    "objectives": {
      "value": "Maximize operational effectiveness while minimizing cost",
      "type": "String"
    },
    "constraints": {
      "value": ["budget", "timeline", "regulatory"],
      "type": "Json"
    }
  }
}
```

### Claim Task
**POST** `/api/processes/tasks/{taskId}/claim`

Claim a task for the current user.

### Unclaim Task
**POST** `/api/processes/tasks/{taskId}/unclaim`

Unclaim a task.

### Assign Task
**POST** `/api/processes/tasks/{taskId}/assign`

Assign a task to a specific user.

**Request Body:**
```json
{
  "userId": "user-789"
}
```

---

## Incidents

### Get Incidents
**GET** `/api/processes/incidents`

Returns a list of incidents.

**Query Parameters:**
- `processInstanceId` (optional): Filter by process instance ID
- `incidentType` (optional): Filter by incident type
- `status` (optional): Filter by status (open, resolved)
- `limit` (optional): Number of incidents to return (default: 20)
- `offset` (optional): Number of incidents to skip (default: 0)

**Response:**
```json
{
  "incidents": [
    {
      "id": "incident-123",
      "processInstanceId": "instance-123",
      "processDefinitionId": "decision-analysis:1:abc123",
      "incidentType": "failedJob",
      "incidentMessage": "Service task execution failed",
      "activityId": "service-task-1",
      "activityName": "Analyze Alternatives",
      "created": "2024-01-15T11:00:00Z",
      "status": "open",
      "configuration": "service-task-1",
      "history": [
        {
          "timestamp": "2024-01-15T11:00:00Z",
          "action": "created",
          "message": "Service task execution failed"
        }
      ]
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### Resolve Incident
**POST** `/api/processes/incidents/{incidentId}/resolve`

Resolve an incident.

**Request Body:**
```json
{
  "resolution": "Service restored and task retried successfully"
}
```

---

## Statistics & Analytics

### Get Process Statistics
**GET** `/api/processes/statistics`

Returns process statistics and analytics.

**Query Parameters:**
- `startDate` (optional): Start date for statistics (ISO 8601)
- `endDate` (optional): End date for statistics (ISO 8601)
- `processDefinitionKey` (optional): Filter by process definition key

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-15T23:59:59Z"
  },
  "summary": {
    "totalInstances": 150,
    "activeInstances": 25,
    "completedInstances": 120,
    "terminatedInstances": 5,
    "averageDuration": 7200,
    "totalTasks": 450,
    "completedTasks": 420,
    "openTasks": 30
  },
  "byProcess": [
    {
      "processDefinitionKey": "decision-analysis",
      "processDefinitionName": "Decision Analysis Process",
      "instances": 80,
      "activeInstances": 15,
      "completedInstances": 65,
      "averageDuration": 5400,
      "tasks": 240,
      "completedTasks": 225,
      "openTasks": 15
    }
  ],
  "byDay": [
    {
      "date": "2024-01-15",
      "instances": 10,
      "completedInstances": 8,
      "averageDuration": 6000
    }
  ]
}
```

### Get Task Statistics
**GET** `/api/processes/tasks/statistics`

Returns task statistics and analytics.

**Response:**
```json
{
  "summary": {
    "totalTasks": 450,
    "assignedTasks": 300,
    "unassignedTasks": 150,
    "completedTasks": 420,
    "overdueTasks": 5
  },
  "byAssignee": [
    {
      "assignee": "user-789",
      "totalTasks": 50,
      "completedTasks": 45,
      "overdueTasks": 2,
      "averageCompletionTime": 3600
    }
  ],
  "byTaskType": [
    {
      "taskType": "userTask",
      "totalTasks": 300,
      "completedTasks": 280,
      "averageCompletionTime": 4800
    },
    {
      "taskType": "serviceTask",
      "totalTasks": 150,
      "completedTasks": 140,
      "averageCompletionTime": 1200
    }
  ]
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "PROCESS_DEFINITION_NOT_FOUND",
    "message": "Process definition not found",
    "details": {
      "definitionId": "invalid-definition-id"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes
- `PROCESS_DEFINITION_NOT_FOUND`: Process definition not found
- `PROCESS_INSTANCE_NOT_FOUND`: Process instance not found
- `TASK_NOT_FOUND`: Task not found
- `INCIDENT_NOT_FOUND`: Incident not found
- `INVALID_BPMN_XML`: Invalid BPMN XML format
- `DEPLOYMENT_FAILED`: Process deployment failed
- `TASK_ALREADY_ASSIGNED`: Task is already assigned
- `TASK_NOT_ASSIGNED`: Task is not assigned
- `INSUFFICIENT_PERMISSIONS`: Insufficient permissions
- `PROCESS_INSTANCE_ACTIVE`: Cannot delete active process instance

---

## Rate Limits

- **Standard endpoints**: 100 requests per minute per user
- **Process deployment**: 10 requests per minute per user
- **Process instance operations**: 50 requests per minute per user
- **Task operations**: 100 requests per minute per user
- **Statistics endpoints**: 30 requests per minute per user

Rate limits are enforced per user and reset every minute. Exceeding limits returns a 429 status code with retry-after header. 