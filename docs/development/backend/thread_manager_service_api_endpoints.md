# Thread Manager Service API Endpoints

## Overview

The Thread Manager Service provides comprehensive process thread management, feedback collection, similarity analysis, and impact assessment capabilities. It enables full traceability and auditability of process runs and their tasks, supporting progressive process improvement through human and SME feedback.

## Base URL
```
http://localhost:3008
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Process Threads

### Get Process Threads
**GET** `/api/threads/process`

Returns a list of process threads organized by process definition runs.

**Query Parameters:**
- `processDefinitionKey` (optional): Filter by process definition key
- `processInstanceId` (optional): Filter by specific process instance
- `status` (optional): Filter by thread status (active, completed, failed)
- `startDate` (optional): Filter threads started after date (ISO 8601)
- `endDate` (optional): Filter threads started before date (ISO 8601)
- `limit` (optional): Number of threads to return (default: 20)
- `offset` (optional): Number of threads to skip (default: 0)

**Response:**
```json
{
  "threads": [
    {
      "threadId": "thread-123",
      "processInstanceId": "instance-123",
      "processDefinitionKey": "decision-analysis",
      "processDefinitionName": "Decision Analysis Process",
      "businessKey": "proj-uav-2024",
      "startTime": "2024-01-15T10:30:00Z",
      "endTime": null,
      "status": "active",
      "startedBy": "user-456",
      "taskCount": 5,
      "completedTasks": 3,
      "failedTasks": 0,
      "totalDuration": 3600,
      "currentTask": {
        "taskId": "task-1",
        "name": "Define Objectives",
        "type": "userTask",
        "assignee": "user-789"
      },
      "summary": {
        "totalFeedback": 8,
        "averageRating": 4.2,
        "lastActivity": "2024-01-15T11:30:00Z"
      }
    },
    {
      "threadId": "thread-124",
      "processInstanceId": "instance-124",
      "processDefinitionKey": "uav-acquisition",
      "processDefinitionName": "UAV Acquisition Process",
      "businessKey": "uav-procurement-2024",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "status": "completed",
      "startedBy": "user-123",
      "taskCount": 8,
      "completedTasks": 8,
      "failedTasks": 0,
      "totalDuration": 7200,
      "currentTask": null,
      "summary": {
        "totalFeedback": 12,
        "averageRating": 4.5,
        "lastActivity": "2024-01-15T11:00:00Z"
      }
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

### Get Thread Details
**GET** `/api/threads/process/{threadId}`

Returns detailed information about a specific process thread including all tasks and their context.

**Response:**
```json
{
  "threadId": "thread-123",
  "processInstanceId": "instance-123",
  "processDefinitionKey": "decision-analysis",
  "processDefinitionName": "Decision Analysis Process",
  "businessKey": "proj-uav-2024",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": null,
  "status": "active",
  "startedBy": "user-456",
  "variables": {
    "projectId": "proj-123",
    "decisionType": "acquisition",
    "stakeholders": ["Col. Smith", "Maj. Johnson"]
  },
  "tasks": [
    {
      "taskId": "task-1",
      "name": "Define Objectives",
      "type": "userTask",
      "status": "completed",
      "startTime": "2024-01-15T10:30:05Z",
      "endTime": "2024-01-15T11:00:00Z",
      "duration": 1795,
      "assignee": "user-789",
      "inputContext": {
        "projectId": "proj-123",
        "decisionType": "acquisition",
        "stakeholders": ["Col. Smith", "Maj. Johnson"]
      },
      "injectedContext": {
        "persona": "decision-analyst",
        "tools": ["knowledge-search", "objective-hierarchy"],
        "prompt": "Define clear objectives for UAV acquisition decision"
      },
      "outputContext": {
        "objectives": ["Maximize operational effectiveness", "Minimize cost", "Ensure compliance"],
        "constraints": ["Budget: $5M", "Timeline: 6 months", "Regulatory: FAA approval required"]
      },
      "feedback": {
        "count": 3,
        "averageRating": 4.3,
        "comments": [
          {
            "id": "feedback-1",
            "type": "summary",
            "content": "Well-structured objectives with clear priorities",
            "rating": 5,
            "author": "user-456",
            "timestamp": "2024-01-15T11:05:00Z"
          }
        ]
      }
    },
    {
      "taskId": "task-2",
      "name": "Analyze Alternatives",
      "type": "serviceTask",
      "status": "active",
      "startTime": "2024-01-15T11:00:05Z",
      "endTime": null,
      "duration": 1800,
      "assignee": null,
      "inputContext": {
        "objectives": ["Maximize operational effectiveness", "Minimize cost", "Ensure compliance"],
        "constraints": ["Budget: $5M", "Timeline: 6 months", "Regulatory: FAA approval required"]
      },
      "injectedContext": {
        "serviceType": "llm",
        "serviceName": "alternative-analysis",
        "model": "gpt-4",
        "tools": ["knowledge-search", "cost-analysis", "risk-assessment"]
      },
      "outputContext": null,
      "feedback": {
        "count": 0,
        "averageRating": 0,
        "comments": []
      }
    }
  ],
  "threadFeedback": {
    "count": 2,
    "averageRating": 4.0,
    "comments": [
      {
        "id": "thread-feedback-1",
        "type": "meta",
        "content": "Process is well-designed but could benefit from more stakeholder involvement",
        "rating": 4,
        "author": "user-456",
        "timestamp": "2024-01-15T11:30:00Z"
      }
    ]
  },
  "executionPath": [
    {
      "taskId": "task-1",
      "name": "Define Objectives",
      "timestamp": "2024-01-15T10:30:05Z",
      "status": "started"
    },
    {
      "taskId": "task-1",
      "name": "Define Objectives",
      "timestamp": "2024-01-15T11:00:00Z",
      "status": "completed"
    },
    {
      "taskId": "task-2",
      "name": "Analyze Alternatives",
      "timestamp": "2024-01-15T11:00:05Z",
      "status": "started"
    }
  ]
}
```

### Get Thread Tasks
**GET** `/api/threads/process/{threadId}/tasks`

Returns all tasks for a specific process thread.

**Query Parameters:**
- `status` (optional): Filter by task status (active, completed, failed)
- `type` (optional): Filter by task type (userTask, serviceTask, scriptTask)
- `assignee` (optional): Filter by assignee

**Response:**
```json
{
  "threadId": "thread-123",
  "tasks": [
    {
      "taskId": "task-1",
      "name": "Define Objectives",
      "type": "userTask",
      "status": "completed",
      "startTime": "2024-01-15T10:30:05Z",
      "endTime": "2024-01-15T11:00:00Z",
      "duration": 1795,
      "assignee": "user-789",
      "inputContext": {
        "projectId": "proj-123",
        "decisionType": "acquisition"
      },
      "injectedContext": {
        "persona": "decision-analyst",
        "tools": ["knowledge-search", "objective-hierarchy"]
      },
      "outputContext": {
        "objectives": ["Maximize operational effectiveness", "Minimize cost"],
        "constraints": ["Budget: $5M", "Timeline: 6 months"]
      }
    }
  ]
}
```

---

## Task Context & Details

### Get Task Context
**GET** `/api/threads/tasks/{taskId}/context`

Returns the complete context for a specific task including input, injected, and output context.

**Response:**
```json
{
  "taskId": "task-1",
  "threadId": "thread-123",
  "processInstanceId": "instance-123",
  "name": "Define Objectives",
  "type": "userTask",
  "status": "completed",
  "startTime": "2024-01-15T10:30:05Z",
  "endTime": "2024-01-15T11:00:00Z",
  "duration": 1795,
  "assignee": "user-789",
  "inputContext": {
    "projectId": "proj-123",
    "decisionType": "acquisition",
    "stakeholders": ["Col. Smith", "Maj. Johnson"],
    "projectContext": {
      "title": "UAV Fleet Modernization",
      "description": "Acquire new UAV systems to replace aging fleet",
      "budget": 5000000,
      "timeline": "6 months"
    }
  },
  "injectedContext": {
    "persona": {
      "id": "decision-analyst",
      "name": "Decision Analyst",
      "description": "Expert in decision analysis and multi-criteria evaluation",
      "capabilities": ["objective-definition", "criteria-analysis", "stakeholder-engagement"]
    },
    "tools": [
      {
        "name": "knowledge-search",
        "description": "Search knowledge base for relevant documents",
        "parameters": {
          "query": "UAV acquisition objectives",
          "limit": 10
        }
      },
      {
        "name": "objective-hierarchy",
        "description": "Create hierarchical objective structure",
        "parameters": {
          "maxLevels": 3,
          "includeMetrics": true
        }
      }
    ],
    "prompt": "Define clear, measurable objectives for the UAV acquisition decision that align with organizational goals and stakeholder needs.",
    "model": "gpt-4",
    "temperature": 0.7
  },
  "outputContext": {
    "objectives": [
      {
        "id": "obj-1",
        "name": "Maximize Operational Effectiveness",
        "description": "Ensure UAV systems meet operational requirements",
        "metrics": ["mission-success-rate", "operational-availability"],
        "priority": "high"
      },
      {
        "id": "obj-2",
        "name": "Minimize Total Cost of Ownership",
        "description": "Optimize acquisition and lifecycle costs",
        "metrics": ["acquisition-cost", "maintenance-cost", "training-cost"],
        "priority": "high"
      },
      {
        "id": "obj-3",
        "name": "Ensure Regulatory Compliance",
        "description": "Meet all FAA and military regulations",
        "metrics": ["compliance-score", "certification-status"],
        "priority": "medium"
      }
    ],
    "constraints": [
      {
        "type": "budget",
        "value": 5000000,
        "currency": "USD",
        "description": "Maximum acquisition budget"
      },
      {
        "type": "timeline",
        "value": "6 months",
        "description": "Required completion timeline"
      },
      {
        "type": "regulatory",
        "value": "FAA approval required",
        "description": "Regulatory compliance requirement"
      }
    ],
    "stakeholderAlignment": {
      "score": 0.85,
      "feedback": ["Objectives align well with operational needs", "Cost constraints are realistic"]
    }
  },
  "executionMetrics": {
    "processingTime": 1795,
    "tokenUsage": {
      "input": 250,
      "output": 450,
      "total": 700
    },
    "toolCalls": 3,
    "successRate": 1.0
  }
}
```

---

## Feedback Management

### Get Thread Feedback
**GET** `/api/threads/process/{threadId}/feedback`

Returns all feedback for a specific process thread.

**Query Parameters:**
- `type` (optional): Filter by feedback type (summary, meta, cross-task)
- `author` (optional): Filter by feedback author
- `rating` (optional): Filter by minimum rating (1-5)
- `limit` (optional): Number of feedback items to return (default: 20)
- `offset` (optional): Number of feedback items to skip (default: 0)

**Response:**
```json
{
  "threadId": "thread-123",
  "feedback": [
    {
      "id": "thread-feedback-1",
      "type": "meta",
      "content": "Process is well-designed but could benefit from more stakeholder involvement in early stages",
      "rating": 4,
      "author": {
        "id": "user-456",
        "name": "Col. Smith",
        "role": "stakeholder"
      },
      "timestamp": "2024-01-15T11:30:00Z",
      "tags": ["process-design", "stakeholder-engagement"],
      "attachments": []
    },
    {
      "id": "thread-feedback-2",
      "type": "summary",
      "content": "Overall decision process was thorough and well-documented. Good use of AI assistance for analysis.",
      "rating": 5,
      "author": {
        "id": "user-789",
        "name": "Dr. Williams",
        "role": "decision-analyst"
      },
      "timestamp": "2024-01-15T12:00:00Z",
      "tags": ["decision-quality", "ai-integration"],
      "attachments": []
    }
  ],
  "summary": {
    "totalFeedback": 2,
    "averageRating": 4.5,
    "ratingDistribution": {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 1,
      "5": 1
    },
    "typeDistribution": {
      "summary": 1,
      "meta": 1,
      "cross-task": 0
    }
  }
}
```

### Add Thread Feedback
**POST** `/api/threads/process/{threadId}/feedback`

Add feedback to a process thread.

**Request Body:**
```json
{
  "type": "meta",
  "content": "Process could be improved by adding more stakeholder checkpoints",
  "rating": 4,
  "tags": ["process-improvement", "stakeholder-engagement"],
  "attachments": [
    {
      "name": "process-improvement-suggestions.pdf",
      "url": "https://storage.dadms.com/attachments/process-improvement-suggestions.pdf",
      "type": "application/pdf"
    }
  ]
}
```

**Response:**
```json
{
  "id": "thread-feedback-3",
  "type": "meta",
  "content": "Process could be improved by adding more stakeholder checkpoints",
  "rating": 4,
  "author": {
    "id": "user-456",
    "name": "Col. Smith",
    "role": "stakeholder"
  },
  "timestamp": "2024-01-15T12:30:00Z",
  "tags": ["process-improvement", "stakeholder-engagement"],
  "attachments": [
    {
      "name": "process-improvement-suggestions.pdf",
      "url": "https://storage.dadms.com/attachments/process-improvement-suggestions.pdf",
      "type": "application/pdf"
    }
  ]
}
```

### Get Task Feedback
**GET** `/api/threads/tasks/{taskId}/feedback`

Returns all feedback for a specific task.

**Response:**
```json
{
  "taskId": "task-1",
  "feedback": [
    {
      "id": "task-feedback-1",
      "type": "summary",
      "content": "Well-structured objectives with clear priorities and measurable metrics",
      "rating": 5,
      "author": {
        "id": "user-456",
        "name": "Col. Smith",
        "role": "stakeholder"
      },
      "timestamp": "2024-01-15T11:05:00Z",
      "tags": ["objective-quality", "clarity"],
      "attachments": []
    },
    {
      "id": "task-feedback-2",
      "type": "meta",
      "content": "Consider adding more specific cost metrics for better tracking",
      "rating": 4,
      "author": {
        "id": "user-789",
        "name": "Dr. Williams",
        "role": "decision-analyst"
      },
      "timestamp": "2024-01-15T11:10:00Z",
      "tags": ["metrics", "cost-analysis"],
      "attachments": []
    }
  ],
  "summary": {
    "totalFeedback": 2,
    "averageRating": 4.5,
    "ratingDistribution": {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 1,
      "5": 1
    }
  }
}
```

### Add Task Feedback
**POST** `/api/threads/tasks/{taskId}/feedback`

Add feedback to a specific task.

**Request Body:**
```json
{
  "type": "summary",
  "content": "Excellent use of AI tools for objective definition. Results are comprehensive and actionable.",
  "rating": 5,
  "tags": ["ai-integration", "comprehensiveness"],
  "attachments": []
}
```

---

## Similarity Analysis

### Get Similar Tasks
**GET** `/api/threads/tasks/{taskId}/similar`

Returns tasks similar to the specified task based on semantic similarity analysis.

**Query Parameters:**
- `limit` (optional): Number of similar tasks to return (default: 10)
- `minSimilarity` (optional): Minimum similarity score (0.0-1.0, default: 0.7)
- `includeContext` (optional): Include task context in response (default: false)

**Response:**
```json
{
  "taskId": "task-1",
  "similarTasks": [
    {
      "taskId": "task-456",
      "threadId": "thread-456",
      "processDefinitionKey": "uav-acquisition",
      "processDefinitionName": "UAV Acquisition Process",
      "name": "Define Acquisition Objectives",
      "similarityScore": 0.92,
      "similarityFactors": [
        "objective-definition",
        "acquisition-context",
        "stakeholder-engagement"
      ],
      "context": {
        "inputContext": {
          "projectId": "proj-456",
          "decisionType": "acquisition"
        },
        "outputContext": {
          "objectives": ["Maximize capability", "Minimize cost", "Ensure reliability"]
        }
      },
      "feedback": {
        "averageRating": 4.3,
        "totalFeedback": 5
      },
      "executionMetrics": {
        "duration": 2100,
        "successRate": 1.0
      }
    },
    {
      "taskId": "task-789",
      "threadId": "thread-789",
      "processDefinitionKey": "strategic-planning",
      "processDefinitionName": "Strategic Planning Process",
      "name": "Define Strategic Objectives",
      "similarityScore": 0.85,
      "similarityFactors": [
        "objective-definition",
        "strategic-context"
      ],
      "context": {
        "inputContext": {
          "projectId": "proj-789",
          "decisionType": "strategy"
        },
        "outputContext": {
          "objectives": ["Achieve market leadership", "Increase efficiency", "Foster innovation"]
        }
      },
      "feedback": {
        "averageRating": 4.1,
        "totalFeedback": 3
      },
      "executionMetrics": {
        "duration": 1800,
        "successRate": 1.0
      }
    }
  ],
  "analysis": {
    "totalSimilarTasks": 15,
    "averageSimilarityScore": 0.78,
    "topSimilarityFactors": [
      "objective-definition",
      "acquisition-context",
      "stakeholder-engagement"
    ],
    "recommendations": [
      "Consider reviewing similar objective definitions for best practices",
      "Look at feedback from similar tasks for improvement opportunities"
    ]
  }
}
```

### Get Similar Threads
**GET** `/api/threads/process/{threadId}/similar`

Returns process threads similar to the specified thread.

**Query Parameters:**
- `limit` (optional): Number of similar threads to return (default: 10)
- `minSimilarity` (optional): Minimum similarity score (0.0-1.0, default: 0.7)

**Response:**
```json
{
  "threadId": "thread-123",
  "similarThreads": [
    {
      "threadId": "thread-456",
      "processDefinitionKey": "uav-acquisition",
      "processDefinitionName": "UAV Acquisition Process",
      "businessKey": "uav-procurement-2023",
      "similarityScore": 0.88,
      "similarityFactors": [
        "acquisition-decision",
        "uav-context",
        "similar-stakeholders"
      ],
      "startTime": "2023-12-01T10:00:00Z",
      "endTime": "2023-12-15T15:00:00Z",
      "status": "completed",
      "summary": {
        "totalFeedback": 15,
        "averageRating": 4.4,
        "taskCount": 8,
        "totalDuration": 10800
      }
    }
  ],
  "analysis": {
    "totalSimilarThreads": 8,
    "averageSimilarityScore": 0.75,
    "topSimilarityFactors": [
      "acquisition-decision",
      "uav-context",
      "similar-stakeholders"
    ]
  }
}
```

---

## Impact Analysis

### Get Thread Impact Analysis
**GET** `/api/threads/process/{threadId}/impact`

Returns impact analysis for a process thread, showing potential effects on other processes and historical decisions.

**Response:**
```json
{
  "threadId": "thread-123",
  "impactAnalysis": {
    "timestamp": "2024-01-15T12:00:00Z",
    "analysisType": "proactive",
    "impactedProcesses": [
      {
        "processDefinitionKey": "maintenance-planning",
        "processDefinitionName": "Maintenance Planning Process",
        "impactScore": 0.85,
        "impactType": "dependency",
        "explanation": "UAV acquisition decision will impact maintenance planning for new systems",
        "affectedTasks": [
          {
            "taskId": "maintenance-task-1",
            "name": "Define Maintenance Requirements",
            "impactLevel": "high",
            "reason": "New UAV systems require different maintenance procedures"
          }
        ],
        "recommendations": [
          "Coordinate with maintenance planning team",
          "Include maintenance considerations in acquisition criteria"
        ]
      },
      {
        "processDefinitionKey": "training-development",
        "processDefinitionName": "Training Development Process",
        "impactScore": 0.72,
        "impactType": "resource",
        "explanation": "New UAV systems will require updated training programs",
        "affectedTasks": [
          {
            "taskId": "training-task-1",
            "name": "Develop Training Curriculum",
            "impactLevel": "medium",
            "reason": "New systems require updated training materials"
          }
        ],
        "recommendations": [
          "Plan for training development timeline",
          "Include training costs in acquisition budget"
        ]
      }
    ],
    "impactedHistoricalDecisions": [
      {
        "decisionId": "decision-456",
        "title": "Previous UAV Acquisition Decision",
        "impactScore": 0.68,
        "impactType": "precedent",
        "explanation": "Current decision may set precedent for future acquisitions",
        "similarityFactors": [
          "same-acquisition-type",
          "similar-budget-range",
          "same-stakeholders"
        ],
        "recommendations": [
          "Review previous decision outcomes",
          "Learn from previous decision feedback"
        ]
      }
    ],
    "riskAssessment": {
      "overallRisk": "medium",
      "riskFactors": [
        {
          "factor": "budget-constraints",
          "risk": "high",
          "description": "Acquisition budget may be insufficient for desired capabilities"
        },
        {
          "factor": "timeline-pressure",
          "risk": "medium",
          "description": "6-month timeline may be aggressive for complex acquisition"
        }
      ],
      "mitigationStrategies": [
        "Develop contingency budget options",
        "Create detailed timeline with milestones",
        "Engage stakeholders early in process"
      ]
    },
    "recommendations": [
      "Coordinate with maintenance and training teams",
      "Review historical acquisition decisions",
      "Develop risk mitigation strategies",
      "Establish clear communication channels"
    ]
  }
}
```

### Get Process Change Impact
**POST** `/api/threads/impact/process-change`

Analyze the impact of a proposed process change on historical tasks and processes.

**Request Body:**
```json
{
  "processDefinitionKey": "decision-analysis",
  "changeType": "task-modification",
  "changeDescription": "Add stakeholder review step after objective definition",
  "affectedTasks": [
    {
      "taskId": "task-1",
      "change": "Add stakeholder review checkpoint",
      "impact": "Will increase task duration and improve stakeholder alignment"
    }
  ],
  "analysisScope": {
    "includeHistoricalTasks": true,
    "includeSimilarProcesses": true,
    "includeDependencies": true
  }
}
```

**Response:**
```json
{
  "analysisId": "impact-analysis-123",
  "timestamp": "2024-01-15T12:00:00Z",
  "processDefinitionKey": "decision-analysis",
  "changeType": "task-modification",
  "impactedHistoricalTasks": [
    {
      "taskId": "task-789",
      "threadId": "thread-789",
      "processDefinitionKey": "decision-analysis",
      "name": "Define Objectives",
      "impactScore": 0.85,
      "impactLevel": "high",
      "explanation": "This task would have benefited from stakeholder review",
      "affectedMetrics": {
        "duration": "+30%",
        "quality": "+15%",
        "stakeholderSatisfaction": "+25%"
      }
    }
  ],
  "impactedSimilarProcesses": [
    {
      "processDefinitionKey": "uav-acquisition",
      "processDefinitionName": "UAV Acquisition Process",
      "impactScore": 0.72,
      "explanation": "Similar objective definition tasks would be affected",
      "recommendations": [
        "Apply similar changes to UAV acquisition process",
        "Coordinate changes across related processes"
      ]
    }
  ],
  "dependencyImpact": [
    {
      "dependentProcess": "maintenance-planning",
      "impactScore": 0.45,
      "explanation": "Changes may affect maintenance planning timeline",
      "recommendations": [
        "Update maintenance planning process",
        "Adjust timeline expectations"
      ]
    }
  ],
  "summary": {
    "totalImpactedTasks": 25,
    "totalImpactedProcesses": 3,
    "averageImpactScore": 0.68,
    "riskLevel": "medium",
    "recommendations": [
      "Implement changes gradually",
      "Monitor impact on process performance",
      "Update related process documentation"
    ]
  }
}
```

---

## Analytics & Reporting

### Get Thread Analytics
**GET** `/api/threads/analytics`

Returns analytics and insights about process threads.

**Query Parameters:**
- `startDate` (optional): Start date for analytics (ISO 8601)
- `endDate` (optional): End date for analytics (ISO 8601)
- `processDefinitionKey` (optional): Filter by process definition key
- `groupBy` (optional): Group by day, week, month (default: day)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-15T23:59:59Z"
  },
  "summary": {
    "totalThreads": 150,
    "activeThreads": 25,
    "completedThreads": 120,
    "failedThreads": 5,
    "averageDuration": 7200,
    "averageTasksPerThread": 6.5,
    "totalFeedback": 450,
    "averageFeedbackRating": 4.2
  },
  "byProcess": [
    {
      "processDefinitionKey": "decision-analysis",
      "processDefinitionName": "Decision Analysis Process",
      "threads": 80,
      "activeThreads": 15,
      "completedThreads": 65,
      "averageDuration": 5400,
      "averageTasksPerThread": 7.2,
      "averageFeedbackRating": 4.3
    }
  ],
  "byDay": [
    {
      "date": "2024-01-15",
      "threads": 10,
      "completedThreads": 8,
      "averageDuration": 6000,
      "feedback": 25
    }
  ],
  "insights": [
    {
      "type": "performance",
      "title": "Task Completion Rate Improving",
      "description": "Task completion rate has improved by 15% over the last month",
      "metric": "completion_rate",
      "value": 0.92,
      "trend": "increasing"
    },
    {
      "type": "feedback",
      "title": "High Satisfaction with AI Integration",
      "description": "Tasks with AI assistance receive 20% higher feedback ratings",
      "metric": "ai_satisfaction",
      "value": 4.5,
      "trend": "stable"
    }
  ]
}
```

### Get Task Performance Analytics
**GET** `/api/threads/tasks/analytics`

Returns analytics about task performance and patterns.

**Response:**
```json
{
  "summary": {
    "totalTasks": 975,
    "completedTasks": 920,
    "failedTasks": 25,
    "activeTasks": 30,
    "averageCompletionTime": 2400,
    "averageFeedbackRating": 4.2
  },
  "byTaskType": [
    {
      "taskType": "userTask",
      "totalTasks": 600,
      "completedTasks": 570,
      "averageCompletionTime": 3600,
      "averageFeedbackRating": 4.1
    },
    {
      "taskType": "serviceTask",
      "totalTasks": 375,
      "completedTasks": 350,
      "averageCompletionTime": 1200,
      "averageFeedbackRating": 4.4
    }
  ],
  "byAssignee": [
    {
      "assignee": "user-789",
      "totalTasks": 50,
      "completedTasks": 48,
      "averageCompletionTime": 2800,
      "averageFeedbackRating": 4.3
    }
  ],
  "performanceTrends": [
    {
      "date": "2024-01-15",
      "completionRate": 0.95,
      "averageCompletionTime": 2300,
      "averageFeedbackRating": 4.2
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
    "code": "THREAD_NOT_FOUND",
    "message": "Process thread not found",
    "details": {
      "threadId": "invalid-thread-id"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes
- `THREAD_NOT_FOUND`: Process thread not found
- `TASK_NOT_FOUND`: Task not found
- `FEEDBACK_NOT_FOUND`: Feedback not found
- `INVALID_FEEDBACK_TYPE`: Invalid feedback type
- `INSUFFICIENT_PERMISSIONS`: Insufficient permissions
- `SIMILARITY_ANALYSIS_FAILED`: Similarity analysis failed
- `IMPACT_ANALYSIS_FAILED`: Impact analysis failed
- `ANALYTICS_GENERATION_FAILED`: Analytics generation failed

---

## Rate Limits

- **Standard endpoints**: 100 requests per minute per user
- **Similarity analysis**: 20 requests per minute per user
- **Impact analysis**: 10 requests per minute per user
- **Analytics endpoints**: 30 requests per minute per user
- **Feedback operations**: 50 requests per minute per user

Rate limits are enforced per user and reset every minute. Exceeding limits returns a 429 status code with retry-after header. 