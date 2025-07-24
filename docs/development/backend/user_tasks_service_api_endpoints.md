# User Tasks Service API Endpoints

## Overview

This document provides detailed specifications for all API endpoints in the User Tasks Service. The service provides a RESTful interface for managing Camunda user tasks with comprehensive filtering, pagination, and real-time capabilities.

## Base URL

```
http://localhost:3022/api
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Common Response Format

### Success Response
```json
{
    "success": true,
    "data": <response-data>,
    "message": "Operation completed successfully",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {}
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

## Core Task Endpoints

### 1. Get User Tasks

**Endpoint:** `GET /tasks`

**Description:** Retrieve a paginated list of user tasks with optional filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | - | Filter by task status (pending, in_progress, completed, overdue) |
| `priority` | number | No | - | Filter by priority (1, 2, 3) |
| `assignee` | string | No | - | Filter by assigned user ID |
| `processDefinition` | string | No | - | Filter by process definition key |
| `businessKey` | string | No | - | Filter by business key |
| `dueDateFrom` | string | No | - | Filter tasks due after this date (ISO 8601) |
| `dueDateTo` | string | No | - | Filter tasks due before this date (ISO 8601) |
| `createdFrom` | string | No | - | Filter tasks created after this date (ISO 8601) |
| `createdTo` | string | No | - | Filter tasks created before this date (ISO 8601) |
| `page` | number | No | 1 | Page number for pagination |
| `size` | number | No | 20 | Number of items per page (max: 100) |
| `sort` | string | No | "created" | Sort field (created, due, priority, name) |
| `order` | string | No | "desc" | Sort order (asc, desc) |

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
                "id": "task-001",
                "name": "Review Budget Approval",
                "description": "Review and approve the quarterly budget allocation",
                "processInstanceId": "proc-001",
                "processDefinitionKey": "budget-approval",
                "processDefinitionName": "Budget Approval Process",
                "businessKey": "BUD-2024-Q3",
                "assignee": "john.doe@company.com",
                "created": "2024-01-15T08:00:00Z",
                "due": "2024-01-17T17:00:00Z",
                "priority": 2,
                "formKey": "budget-review-form",
                "variables": {
                    "budgetAmount": 500000,
                    "department": "Engineering"
                },
                "status": "pending"
            }
        ],
        "pagination": {
            "page": 1,
            "size": 20,
            "total": 45,
            "pages": 3
        }
    }
}
```

### 2. Get Task Counts

**Endpoint:** `GET /tasks/counts`

**Description:** Retrieve task statistics and counts for dashboard display.

**Response:**
```json
{
    "success": true,
    "data": {
        "counts": {
            "pending": 12,
            "inProgress": 5,
            "completed": 28,
            "overdue": 3,
            "total": 48
        },
        "byPriority": {
            "high": 8,
            "medium": 25,
            "low": 15
        },
        "byProcess": {
            "budget-approval": 15,
            "risk-assessment": 20,
            "contract-approval": 13
        }
    }
}
```

### 3. Get Task Details

**Endpoint:** `GET /tasks/{taskId}`

**Description:** Retrieve detailed information about a specific task.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The unique identifier of the task |

**Response:**
```json
{
    "success": true,
    "data": {
        "task": {
            "id": "task-001",
            "name": "Review Budget Approval",
            "description": "Review and approve the quarterly budget allocation",
            "processInstanceId": "proc-001",
            "processDefinitionKey": "budget-approval",
            "processDefinitionName": "Budget Approval Process",
            "businessKey": "BUD-2024-Q3",
            "assignee": "john.doe@company.com",
            "created": "2024-01-15T08:00:00Z",
            "due": "2024-01-17T17:00:00Z",
            "priority": 2,
            "formKey": "budget-review-form",
            "variables": {
                "budgetAmount": 500000,
                "department": "Engineering"
            },
            "status": "pending"
        },
        "processInfo": {
            "processDefinitionName": "Budget Approval Process",
            "businessKey": "BUD-2024-Q3",
            "startTime": "2024-01-15T08:00:00Z",
            "endTime": null,
            "status": "ACTIVE"
        },
        "variables": {
            "budgetAmount": {
                "value": 500000,
                "type": "Long"
            },
            "department": {
                "value": "Engineering",
                "type": "String"
            }
        }
    }
}
```

### 4. Claim Task

**Endpoint:** `POST /tasks/{taskId}/claim`

**Description:** Claim a task for the current user.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The unique identifier of the task |

**Request Body:**
```json
{
    "userId": "john.doe@company.com"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "taskId": "task-001",
        "assignee": "john.doe@company.com",
        "claimedAt": "2024-01-15T10:30:00Z"
    }
}
```

### 5. Unclaim Task

**Endpoint:** `POST /tasks/{taskId}/unclaim`

**Description:** Unclaim a task, making it available for other users.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The unique identifier of the task |

**Response:**
```json
{
    "success": true,
    "data": {
        "taskId": "task-001",
        "unclaimedAt": "2024-01-15T10:35:00Z"
    }
}
```

### 6. Complete Task

**Endpoint:** `POST /tasks/{taskId}/complete`

**Description:** Complete a task with optional variables and comments.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The unique identifier of the task |

**Request Body:**
```json
{
    "variables": {
        "approved": true,
        "comments": "Budget approved with minor adjustments",
        "approvalDate": "2024-01-15T10:30:00Z"
    },
    "comments": "Task completed successfully"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "taskId": "task-001",
        "completedAt": "2024-01-15T10:30:00Z",
        "variables": {
            "approved": true,
            "comments": "Budget approved with minor adjustments",
            "approvalDate": "2024-01-15T10:30:00Z"
        }
    }
}
```

### 7. Get Task Variables

**Endpoint:** `GET /tasks/{taskId}/variables`

**Description:** Retrieve all variables associated with a task.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The unique identifier of the task |

**Response:**
```json
{
    "success": true,
    "data": {
        "variables": {
            "budgetAmount": {
                "value": 500000,
                "type": "Long",
                "valueInfo": {}
            },
            "department": {
                "value": "Engineering",
                "type": "String",
                "valueInfo": {}
            },
            "approved": {
                "value": true,
                "type": "Boolean",
                "valueInfo": {}
            }
        }
    }
}
```

### 8. Set Task Variables

**Endpoint:** `POST /tasks/{taskId}/variables`

**Description:** Set or update variables for a task.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The unique identifier of the task |

**Request Body:**
```json
{
    "variables": {
        "approved": true,
        "comments": "Budget approved with minor adjustments",
        "approvalDate": "2024-01-15T10:30:00Z"
    }
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "taskId": "task-001",
        "updatedVariables": {
            "approved": true,
            "comments": "Budget approved with minor adjustments",
            "approvalDate": "2024-01-15T10:30:00Z"
        },
        "updatedAt": "2024-01-15T10:30:00Z"
    }
}
```

## Advanced Operations

### 9. Bulk Claim Tasks

**Endpoint:** `POST /tasks/bulk/claim`

**Description:** Claim multiple tasks in a single operation.

**Request Body:**
```json
{
    "taskIds": ["task-001", "task-002", "task-003"],
    "userId": "john.doe@company.com"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "claimedTasks": ["task-001", "task-002"],
        "failedTasks": [
            {
                "taskId": "task-003",
                "reason": "Task already claimed by another user"
            }
        ],
        "claimedAt": "2024-01-15T10:30:00Z"
    }
}
```

### 10. Bulk Complete Tasks

**Endpoint:** `POST /tasks/bulk/complete`

**Description:** Complete multiple tasks with the same variables.

**Request Body:**
```json
{
    "taskIds": ["task-001", "task-002"],
    "variables": {
        "approved": true,
        "comments": "Bulk approval completed"
    },
    "comments": "Bulk completion"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "completedTasks": ["task-001", "task-002"],
        "failedTasks": [],
        "completedAt": "2024-01-15T10:30:00Z"
    }
}
```

### 11. Get Task Analytics

**Endpoint:** `GET /tasks/analytics`

**Description:** Retrieve analytics and metrics for task management.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeRange` | string | No | "30d" | Time range for analytics (7d, 30d, 90d, 1y) |
| `groupBy` | string | No | "day" | Grouping for analytics (day, week, month) |

**Response:**
```json
{
    "success": true,
    "data": {
        "metrics": {
            "averageCompletionTime": 86400000,
            "tasksByProcess": {
                "budget-approval": 15,
                "risk-assessment": 20,
                "contract-approval": 13
            },
            "tasksByAssignee": {
                "john.doe@company.com": 25,
                "jane.smith@company.com": 18,
                "unassigned": 5
            },
            "overdueTasks": 3,
            "completionRate": 0.85
        },
        "trends": {
            "daily": [
                {
                    "date": "2024-01-15",
                    "created": 5,
                    "completed": 4,
                    "overdue": 1
                }
            ]
        }
    }
}
```

## WebSocket Endpoints

### 12. Task Updates WebSocket

**Endpoint:** `WS /tasks/updates`

**Description:** Real-time WebSocket connection for task updates.

**Connection Parameters:**
- `token`: JWT authentication token
- `userId`: Current user ID for filtering updates

**Message Types:**

#### Task Created
```json
{
    "type": "task_created",
    "data": {
        "task": UserTask
    }
}
```

#### Task Updated
```json
{
    "type": "task_updated",
    "data": {
        "task": UserTask,
        "changes": {
            "status": "in_progress",
            "assignee": "john.doe@company.com"
        }
    }
}
```

#### Task Completed
```json
{
    "type": "task_completed",
    "data": {
        "taskId": "task-001",
        "completedAt": "2024-01-15T10:30:00Z",
        "completedBy": "john.doe@company.com"
    }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TASK_NOT_FOUND` | 404 | Task with specified ID not found |
| `TASK_ALREADY_CLAIMED` | 409 | Task is already claimed by another user |
| `TASK_NOT_CLAIMED` | 400 | Task must be claimed before completion |
| `INVALID_VARIABLES` | 400 | Invalid variable format or values |
| `CAMUNDA_UNAVAILABLE` | 503 | Camunda service is unavailable |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |

## Rate Limiting

- **Standard endpoints**: 1000 requests per minute per user
- **Bulk operations**: 100 requests per minute per user
- **WebSocket connections**: 10 concurrent connections per user

## Pagination

All list endpoints support pagination with the following parameters:

- `page`: Page number (1-based)
- `size`: Items per page (1-100)
- `total`: Total number of items
- `pages`: Total number of pages

## Filtering

Supported filter operators:

- **Exact match**: `status=pending`
- **Range**: `createdFrom=2024-01-01&createdTo=2024-01-31`
- **Multiple values**: `priority=1,2,3`
- **Contains**: `name=budget` (searches task names containing "budget")

## Sorting

Supported sort fields:

- `created`: Task creation date
- `due`: Task due date
- `priority`: Task priority
- `name`: Task name
- `assignee`: Assigned user
- `processDefinition`: Process definition key

Sort order: `asc` or `desc` 