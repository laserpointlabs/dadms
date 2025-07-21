# Agent Assistance Service (AAS) - Comprehensive API Endpoint Documentation

This document provides detailed API endpoint documentation for the **Agent Assistance Service (AAS)** in DADMS 2.0, including real request/response examples, cURL commands, and SDK code snippets.

**Service Information:**
- **Base URL**: `http://localhost:3006`
- **Version**: 1.0.0
- **Port**: 3006
- **Status**: 📋 **SPECIFICATION** - Ready for implementation

---

## Quick Reference

| Method | Endpoint | Description | Auth | Response |
|--------|----------|-------------|------|----------|
| GET | `/health` | Service health check | No | 200 OK |
| GET | `/api` | Service information | No | 200 OK |
| POST | `/context` | Update user context | Yes | 200 OK |
| GET | `/context/{userId}` | Get user context | Yes | 200 OK |
| POST | `/ask` | Ask assistant a question | Yes | 200 OK |
| GET | `/suggestions` | Get proactive suggestions | Yes | 200 OK |
| POST | `/suggestions/{suggestionId}/respond` | Respond to suggestion | Yes | 200 OK |
| GET | `/actions` | Get available actions | Yes | 200 OK |
| POST | `/actions/{actionId}/execute` | Execute an action | Yes | 200 OK |
| POST | `/actions/{actionId}/validate` | Validate action | Yes | 200 OK |
| POST | `/feedback` | Provide feedback | Yes | 200 OK |
| GET | `/user/{userId}/profile` | Get user profile | Yes | 200 OK |
| PUT | `/user/{userId}/profile` | Update user preferences | Yes | 200 OK |
| GET | `/insights` | Get system insights | Yes | 200 OK |
| GET | `/anomalies` | Get anomaly detections | Yes | 200 OK |
| POST | `/events/webhook` | Receive system events | No | 200 OK |

---

## Data Models

### Core Context Models
```typescript
interface AASContext {
    user_id: string;                    // UUID
    current_page: string;               // Current page user is on
    current_project?: string;           // Current project UUID (optional)
    session_start: Date;                // Session start time
    actions_taken: string[];            // Actions taken in session
    time_on_page: number;               // Time on current page (seconds)
    system_state: SystemState;          // Current system state
    user_preferences: AssistancePreferences;
    timestamp: Date;                    // Context timestamp
    context_version: number;            // Context version number
}

interface SystemState {
    active_processes: number;
    pending_tasks: number;
    system_health: 'healthy' | 'degraded' | 'unhealthy';
    service_status: Record<string, 'online' | 'offline' | 'degraded'>;
    performance_metrics: PerformanceMetrics;
}

interface AASSuggestion {
    id: string;                         // UUID
    title: string;
    description: string;
    action_type: 'info' | 'suggestion' | 'warning' | 'critical' | 'action';
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;                 // 0.0 - 1.0
    can_execute: boolean;
    action_id?: string;
    requires_confirmation: boolean;
    estimated_time: number;             // seconds
    context_source: string[];
    relevance_score: number;            // 0.0 - 1.0
    expiry_time?: Date;
    created_at: Date;
    category: string;
    tags: string[];
}

interface AASAction {
    id: string;
    name: string;
    description: string;
    category: 'navigation' | 'process' | 'data' | 'knowledge' | 'system';
    parameters: Record<string, any>;
    requires_confirmation: boolean;
    estimated_time: number;             // seconds
    permissions_required: string[];
    reversible: boolean;
    risk_level: 'low' | 'medium' | 'high';
    validation_rules: ValidationRule[];
    implementation: string;             // service.method
    success_rate: number;               // 0.0 - 1.0
    usage_count: number;
}
```

---

## Detailed Endpoint Specifications

### 1. Service Health & Information

#### GET `/health`
Service health and readiness check.

**Request:**
```bash
curl -X GET http://localhost:3006/health
```

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "port": 3006,
    "dependencies": {
        "event_manager": "healthy",
        "llm_service": "healthy",
        "knowledge_service": "healthy",
        "project_service": "healthy",
        "database": "healthy",
        "cache": "healthy"
    },
    "metrics": {
        "active_users": 5,
        "suggestions_generated_today": 47,
        "actions_executed_today": 23,
        "average_response_time": 145.7
    }
}
```

#### GET `/api`
Get service information and available endpoints.

**Request:**
```bash
curl -X GET http://localhost:3006/api
```

**Response:**
```json
{
    "service": "DADMS Agent Assistance Service",
    "version": "1.0.0",
    "port": 3006,
    "status": "operational",
    "endpoints": {
        "context": "/context",
        "ask": "/ask",
        "suggestions": "/suggestions",
        "actions": "/actions"
    }
}
```

---

### 2. Context Management

#### POST `/context`
Update AAS with current user context to enable proactive assistance.

**Request:**
```bash
curl -X POST http://localhost:3006/context \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "current_page": "process-manager",
    "current_project": "uav-design-2024",
    "session_data": {
      "session_start": "2024-01-15T10:00:00Z",
      "actions_taken": ["created_project", "uploaded_documents"],
      "time_on_page": 180
    },
    "user_preferences": {
      "proactivity_level": 0.8,
      "notification_frequency": "normal",
      "explanation_detail": "detailed",
      "learning_enabled": true
    }
  }'
```

**Response:**
```json
{
    "context_updated": true,
    "timestamp": "2024-01-15T10:30:00Z",
    "proactive_suggestions": [
        {
            "id": "sug-001",
            "title": "Create UAV Design Workflow",
            "description": "I notice you're on the process manager page with a UAV project. Based on similar projects, I can help you create a comprehensive UAV design workflow including cost analysis, risk assessment, and design validation steps.",
            "action_type": "suggestion",
            "priority": "high",
            "confidence": 0.85,
            "can_execute": true,
            "action_id": "create_uav_workflow",
            "requires_confirmation": true,
            "estimated_time": 45,
            "context_source": ["current_page", "project_type", "similar_projects"],
            "relevance_score": 0.92,
            "created_at": "2024-01-15T10:30:00Z",
            "category": "workflow_optimization",
            "tags": ["uav", "workflow", "design"]
        }
    ],
    "system_insights": [
        {
            "id": "insight-001",
            "insight_type": "opportunity",
            "title": "Workflow Automation Opportunity",
            "description": "Based on your project history, you could save 2-3 hours by automating the initial UAV design validation steps.",
            "severity": "info",
            "confidence": 0.75,
            "data_sources": ["project_history", "time_tracking"],
            "recommendations": ["Enable automation for validation steps", "Set up approval workflows"],
            "created_at": "2024-01-15T10:30:00Z"
        }
    ],
    "recommendations": [
        "Consider setting up automated notifications for critical design milestones",
        "Review knowledge base for latest UAV design standards"
    ]
}
```

#### GET `/context/{userId}`
Retrieve current context for a user.

**Request:**
```bash
curl -X GET http://localhost:3006/context/3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "current_page": "process-manager",
    "current_project": "uav-design-2024",
    "session_start": "2024-01-15T10:00:00Z",
    "actions_taken": ["created_project", "uploaded_documents", "created_workflow"],
    "time_on_page": 300,
    "system_state": {
        "active_processes": 3,
        "pending_tasks": 7,
        "system_health": "healthy",
        "service_status": {
            "project_service": "online",
            "knowledge_service": "online",
            "llm_service": "online"
        },
        "performance_metrics": {
            "response_time_avg": 145.7,
            "error_rate": 0.02,
            "throughput": 45.3,
            "resource_usage": {
                "cpu_percent": 35.2,
                "memory_percent": 68.7,
                "disk_usage": 125.4,
                "network_io": 12.8
            }
        }
    },
    "user_preferences": {
        "proactivity_level": 0.8,
        "notification_frequency": "normal",
        "explanation_detail": "detailed",
        "auto_execute_permissions": ["low_risk_actions"],
        "quiet_hours": [],
        "learning_enabled": true
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "context_version": 5
}
```

---

### 3. Natural Language Interaction

#### POST `/ask`
Ask AAS a natural language question about the system, current context, or request assistance.

**Request:**
```bash
curl -X POST http://localhost:3006/ask \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the next steps for my UAV project and are there any potential issues I should be aware of?",
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "include_suggestions": true,
    "include_actions": true
  }'
```

**Response:**
```json
{
    "answer": "Based on your UAV project progress, you've completed the initial setup and document upload phase. Your next recommended steps are: 1) Complete the design workflow creation (currently 60% done), 2) Set up the cost analysis process, and 3) Begin risk assessment documentation. I notice you have 3 documents in your knowledge base about propulsion systems which will be valuable for the next phase. There are no critical issues, but I recommend scheduling a design review meeting as similar projects typically benefit from early stakeholder input.",
    "confidence": 0.87,
    "suggestions": [
        {
            "id": "sug-002",
            "title": "Schedule Design Review Meeting",
            "description": "Based on project timeline analysis, scheduling a design review meeting now will help catch potential issues early and align stakeholders.",
            "action_type": "suggestion",
            "priority": "medium",
            "confidence": 0.78,
            "can_execute": true,
            "action_id": "schedule_design_review",
            "requires_confirmation": true,
            "estimated_time": 120,
            "context_source": ["project_timeline", "best_practices"],
            "relevance_score": 0.85,
            "created_at": "2024-01-15T10:30:00Z",
            "category": "project_management",
            "tags": ["review", "stakeholders", "timing"]
        }
    ],
    "actions": [
        {
            "id": "create_cost_analysis_workflow",
            "name": "Create Cost Analysis Workflow",
            "description": "Set up automated cost analysis workflow for UAV components",
            "category": "process",
            "parameters": {
                "template": "uav_cost_analysis",
                "components": ["airframe", "propulsion", "avionics", "payload"]
            },
            "requires_confirmation": true,
            "estimated_time": 180,
            "permissions_required": ["workflow_create"],
            "reversible": true,
            "risk_level": "low",
            "validation_rules": [
                {
                    "rule_type": "parameter",
                    "condition": "template_exists",
                    "error_message": "Cost analysis template not found"
                }
            ],
            "implementation": "process_service.create_workflow",
            "success_rate": 0.94,
            "usage_count": 47
        }
    ],
    "context_used": ["project_status", "document_analysis", "similar_projects", "best_practices"],
    "response_time": 1.247,
    "follow_up_questions": [
        "Would you like me to help prioritize these next steps?",
        "Should I set up automated notifications for project milestones?",
        "Do you want to review the propulsion system documents before proceeding?"
    ]
}
```

---

### 4. Proactive Suggestions

#### GET `/suggestions`
Get proactive suggestions based on current context.

**Request:**
```bash
curl -X GET "http://localhost:3006/suggestions?userId=3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1&limit=5&priority=high" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
    "suggestions": [
        {
            "id": "sug-003",
            "title": "Process Performance Alert",
            "description": "Your cost analysis process has been running for 15 minutes, which is 3x longer than typical. This might indicate a data processing issue or resource constraint.",
            "action_type": "warning",
            "priority": "high",
            "confidence": 0.91,
            "can_execute": true,
            "action_id": "investigate_slow_process",
            "requires_confirmation": false,
            "estimated_time": 30,
            "context_source": ["process_monitoring", "performance_metrics"],
            "relevance_score": 0.94,
            "expiry_time": "2024-01-15T11:00:00Z",
            "created_at": "2024-01-15T10:30:00Z",
            "category": "performance",
            "tags": ["performance", "process", "alert"]
        },
        {
            "id": "sug-004",
            "title": "Knowledge Base Update Available",
            "description": "I found 2 new UAV design standards documents that were recently added to the knowledge base and are relevant to your current project phase.",
            "action_type": "info",
            "priority": "medium",
            "confidence": 0.83,
            "can_execute": true,
            "action_id": "review_new_documents",
            "requires_confirmation": true,
            "estimated_time": 300,
            "context_source": ["knowledge_updates", "project_relevance"],
            "relevance_score": 0.87,
            "created_at": "2024-01-15T10:25:00Z",
            "category": "knowledge",
            "tags": ["knowledge", "standards", "updates"]
        }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "context_analyzed": ["current_processes", "project_context", "knowledge_base", "performance_metrics"],
    "total_available": 8
}
```

#### POST `/suggestions/{suggestionId}/respond`
Accept, dismiss, or provide feedback on a suggestion.

**Request:**
```bash
curl -X POST http://localhost:3006/suggestions/sug-003/respond \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "response_type": "accepted",
    "rating": 5,
    "comment": "This was very helpful - I didnt notice the process was taking so long!"
  }'
```

**Response:**
```json
{
    "success": true,
    "message": "Suggestion response recorded successfully",
    "data": {
        "suggestion_id": "sug-003",
        "response_type": "accepted",
        "rating": 5,
        "learning_applied": true
    },
    "timestamp": "2024-01-15T10:32:00Z"
}
```

---

### 5. Action Management

#### GET `/actions`
Get list of actions available in current context.

**Request:**
```bash
curl -X GET "http://localhost:3006/actions?userId=3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1&category=process&riskLevel=low" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
    "actions": [
        {
            "id": "restart_slow_process",
            "name": "Restart Slow Process",
            "description": "Restart the cost analysis process with optimized settings",
            "category": "process",
            "parameters": {
                "process_id": "required",
                "optimization_level": "optional",
                "preserve_partial_results": "optional"
            },
            "requires_confirmation": true,
            "estimated_time": 60,
            "permissions_required": ["process_manage"],
            "reversible": false,
            "risk_level": "low",
            "validation_rules": [
                {
                    "rule_type": "state",
                    "condition": "process_exists_and_running",
                    "error_message": "Process not found or not running"
                }
            ],
            "implementation": "process_service.restart_process",
            "success_rate": 0.96,
            "usage_count": 234
        },
        {
            "id": "create_workflow_template",
            "name": "Create Workflow Template",
            "description": "Create a reusable workflow template from current process",
            "category": "process",
            "parameters": {
                "template_name": "required",
                "description": "optional",
                "tags": "optional"
            },
            "requires_confirmation": true,
            "estimated_time": 45,
            "permissions_required": ["template_create"],
            "reversible": true,
            "risk_level": "low",
            "validation_rules": [
                {
                    "rule_type": "parameter",
                    "condition": "template_name_unique",
                    "error_message": "Template name already exists"
                }
            ],
            "implementation": "process_service.create_template",
            "success_rate": 0.91,
            "usage_count": 89
        }
    ],
    "total": 12
}
```

#### POST `/actions/{actionId}/execute`
Execute an action on user's behalf with optional confirmation.

**Request:**
```bash
curl -X POST http://localhost:3006/actions/restart_slow_process/execute \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "parameters": {
      "process_id": "proc-abc123",
      "optimization_level": "high",
      "preserve_partial_results": true
    },
    "confirmation": true
  }'
```

**Response:**
```json
{
    "action_executed": true,
    "action_id": "restart_slow_process",
    "result": {
        "new_process_id": "proc-def456",
        "optimization_applied": "high",
        "partial_results_preserved": true,
        "estimated_completion": "2024-01-15T10:45:00Z"
    },
    "message": "Process successfully restarted with high optimization. Estimated completion time is 15 minutes earlier than the original process.",
    "execution_time": 2.3,
    "side_effects": [
        {
            "type": "process_terminated",
            "process_id": "proc-abc123",
            "impact": "Previous process stopped, partial results saved"
        }
    ],
    "next_suggestions": [
        {
            "id": "sug-005",
            "title": "Monitor Optimized Process",
            "description": "I'll monitor the new optimized process and alert you if any issues arise.",
            "action_type": "info",
            "priority": "low",
            "confidence": 0.89,
            "can_execute": true,
            "action_id": "monitor_process",
            "requires_confirmation": false,
            "estimated_time": 0,
            "context_source": ["action_result"],
            "relevance_score": 0.78,
            "created_at": "2024-01-15T10:32:30Z",
            "category": "monitoring",
            "tags": ["monitoring", "process", "optimization"]
        }
    ]
}
```

#### POST `/actions/{actionId}/validate`
Validate an action before execution.

**Request:**
```bash
curl -X POST http://localhost:3006/actions/restart_slow_process/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "parameters": {
      "process_id": "proc-abc123",
      "optimization_level": "high"
    }
  }'
```

**Response:**
```json
{
    "valid": true,
    "checks_passed": [
        "process_exists",
        "user_permissions",
        "parameter_validation",
        "system_resources"
    ],
    "errors": [],
    "warnings": [
        "High optimization may use additional system resources",
        "Process restart will lose real-time monitoring history"
    ],
    "risk_assessment": {
        "risk_level": "low",
        "risk_factors": [
            "Temporary resource usage spike",
            "Brief interruption in process monitoring"
        ]
    }
}
```

---

### 6. Learning & Feedback

#### POST `/feedback`
Provide feedback to help AAS learn and improve.

**Request:**
```bash
curl -X POST http://localhost:3006/feedback \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "feedback_type": "action_successful",
    "target_id": "restart_slow_process",
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "rating": 5,
    "comment": "The action worked perfectly and saved significant time. The optimization suggestion was spot on."
  }'
```

**Response:**
```json
{
    "learning_applied": true,
    "feedback_id": "fb-789def",
    "message": "Thank you for the feedback! This will help improve future suggestions for process optimization scenarios.",
    "improvements_made": [
        "Increased confidence weight for process optimization suggestions",
        "Updated success rate metrics for restart_slow_process action",
        "Enhanced context pattern recognition for similar scenarios"
    ]
}
```

---

### 7. User Profile & Preferences

#### GET `/user/{userId}/profile`
Get user's assistance profile and preferences.

**Request:**
```bash
curl -X GET http://localhost:3006/user/3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "assistance_preferences": {
        "proactivity_level": 0.8,
        "notification_frequency": "normal",
        "explanation_detail": "detailed",
        "auto_execute_permissions": ["low_risk_actions", "monitoring_actions"],
        "quiet_hours": [
            {
                "start_time": "18:00",
                "end_time": "08:00",
                "timezone": "America/New_York"
            }
        ],
        "learning_enabled": true
    },
    "usage_patterns": [
        {
            "pattern_type": "daily",
            "time_distribution": {
                "morning": 0.4,
                "afternoon": 0.5,
                "evening": 0.1
            },
            "common_sequences": [
                ["project_create", "document_upload", "workflow_create"],
                ["process_monitor", "optimization_check", "results_review"]
            ],
            "peak_activity_hours": [9, 10, 14, 15]
        }
    ],
    "skill_level": "intermediate",
    "frequent_tasks": [
        "uav_design_workflow",
        "cost_analysis",
        "document_review",
        "process_optimization"
    ],
    "preferred_workflows": [
        "uav_design_template",
        "cost_benefit_analysis",
        "risk_assessment_framework"
    ],
    "learning_insights": [
        {
            "insight_type": "efficiency",
            "description": "User responds well to proactive process optimization suggestions",
            "confidence": 0.92,
            "impact_score": 0.85,
            "applied_date": "2024-01-10T14:30:00Z"
        },
        {
            "insight_type": "preference",
            "description": "Prefers detailed explanations over brief summaries",
            "confidence": 0.87,
            "impact_score": 0.73,
            "applied_date": "2024-01-08T16:45:00Z"
        }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
}
```

#### PUT `/user/{userId}/profile`
Update user's assistance preferences.

**Request:**
```bash
curl -X PUT http://localhost:3006/user/3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "proactivity_level": 0.9,
    "notification_frequency": "frequent",
    "explanation_detail": "detailed",
    "auto_execute_permissions": ["low_risk_actions", "monitoring_actions", "optimization_actions"],
    "learning_enabled": true
  }'
```

**Response:**
```json
{
    "success": true,
    "message": "User preferences updated successfully",
    "data": {
        "changes_applied": [
            "proactivity_level: 0.8 → 0.9",
            "notification_frequency: normal → frequent",
            "auto_execute_permissions: added optimization_actions"
        ]
    },
    "timestamp": "2024-01-15T10:35:00Z"
}
```

---

### 8. Intelligence & Insights

#### GET `/insights`
Get AI-generated insights about system state and user patterns.

**Request:**
```bash
curl -X GET "http://localhost:3006/insights?userId=3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1&scope=project" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
    "insights": [
        {
            "id": "insight-002",
            "insight_type": "performance",
            "title": "Project Velocity Trend",
            "description": "Your UAV project is progressing 23% faster than similar projects in the system. Key acceleration factors include early stakeholder engagement and efficient document organization.",
            "severity": "info",
            "confidence": 0.89,
            "data_sources": ["project_timeline", "similar_projects", "milestone_tracking"],
            "recommendations": [
                "Continue current stakeholder communication pattern",
                "Document successful practices for future projects",
                "Consider mentoring other teams using similar approach"
            ],
            "created_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": "insight-003",
            "insight_type": "opportunity",
            "title": "Knowledge Reuse Potential",
            "description": "Analysis shows 3 other active UAV projects could benefit from your propulsion system research. Sharing this knowledge could save approximately 15 hours across teams.",
            "severity": "info",
            "confidence": 0.76,
            "data_sources": ["knowledge_analysis", "project_similarity", "time_estimation"],
            "recommendations": [
                "Share propulsion research with identified teams",
                "Create knowledge template for future UAV projects",
                "Set up cross-project collaboration channel"
            ],
            "created_at": "2024-01-15T10:28:00Z"
        }
    ]
}
```

#### GET `/anomalies`
Get detected anomalies and potential issues.

**Request:**
```bash
curl -X GET "http://localhost:3006/anomalies?userId=3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1&severity=high" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
    "anomalies": [
        {
            "id": "anom-001",
            "anomaly_type": "performance",
            "severity": "high",
            "description": "Cost analysis process consuming 300% more memory than baseline, may indicate data processing inefficiency or memory leak.",
            "affected_components": ["cost_analysis_service", "data_processor"],
            "detection_time": "2024-01-15T10:25:00Z",
            "confidence": 0.94,
            "suggested_actions": [
                "Investigate memory usage patterns",
                "Consider process restart with optimization",
                "Review input data size and format"
            ]
        }
    ]
}
```

---

### 9. Event Processing

#### POST `/events/webhook`
Webhook endpoint for receiving events from EventManager.

**Request:**
```bash
curl -X POST http://localhost:3006/events/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt-123",
    "event_type": "process.stuck",
    "source_service": "process_service",
    "data": {
      "process_id": "proc-abc123",
      "process_name": "UAV Cost Analysis",
      "stuck_duration": 900,
      "last_activity": "2024-01-15T10:15:00Z",
      "resource_usage": {
        "cpu": 0.95,
        "memory": 0.87
      }
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "user_id": "3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1",
    "project_id": "uav-design-2024",
    "severity": "warning"
  }'
```

**Response:**
```json
{
    "event_processed": true,
    "actions_taken": [
        "Analyzed process performance metrics",
        "Generated high-priority suggestion for user",
        "Initiated background monitoring"
    ],
    "suggestions_generated": [
        {
            "id": "sug-006",
            "title": "Critical Process Issue Detected",
            "description": "Your UAV Cost Analysis process has been stuck for 15 minutes with high resource usage. I recommend restarting with optimization to resolve the issue.",
            "action_type": "critical",
            "priority": "critical",
            "confidence": 0.96,
            "can_execute": true,
            "action_id": "restart_stuck_process",
            "requires_confirmation": true,
            "estimated_time": 60,
            "context_source": ["event_analysis", "performance_monitoring"],
            "relevance_score": 0.98,
            "created_at": "2024-01-15T10:30:15Z",
            "category": "critical_issue",
            "tags": ["critical", "process", "performance"]
        }
    ],
    "notifications_sent": 1,
    "processing_time": 45.7
}
```

---

## SDK Code Examples

### Node.js/TypeScript SDK

```typescript
// AAS Client SDK
import axios, { AxiosInstance } from 'axios';

export class AASClient {
    private client: AxiosInstance;

    constructor(baseURL: string = 'http://localhost:3006', token?: string) {
        this.client = axios.create({
            baseURL,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    }

    // Context Management
    async updateContext(context: AASContextUpdate): Promise<ContextResponse> {
        const response = await this.client.post('/context', context);
        return response.data;
    }

    async getContext(userId: string): Promise<AASContext> {
        const response = await this.client.get(`/context/${userId}`);
        return response.data;
    }

    // Natural Language Interface
    async ask(question: string, userId: string, options?: {
        include_suggestions?: boolean;
        include_actions?: boolean;
    }): Promise<AssistantResponse> {
        const response = await this.client.post('/ask', {
            question,
            user_id: userId,
            ...options
        });
        return response.data;
    }

    // Suggestions
    async getSuggestions(userId: string, filters?: {
        limit?: number;
        priority?: string;
        category?: string;
    }): Promise<SuggestionsResponse> {
        const params = new URLSearchParams({ userId, ...filters });
        const response = await this.client.get(`/suggestions?${params}`);
        return response.data;
    }

    async respondToSuggestion(
        suggestionId: string, 
        responseType: string, 
        rating?: number, 
        comment?: string
    ): Promise<SuccessResponse> {
        const response = await this.client.post(`/suggestions/${suggestionId}/respond`, {
            response_type: responseType,
            rating,
            comment
        });
        return response.data;
    }

    // Actions
    async getAvailableActions(userId: string, filters?: {
        category?: string;
        riskLevel?: string;
    }): Promise<{actions: AASAction[], total: number}> {
        const params = new URLSearchParams({ userId, ...filters });
        const response = await this.client.get(`/actions?${params}`);
        return response.data;
    }

    async executeAction(
        actionId: string, 
        userId: string, 
        parameters: Record<string, any>, 
        confirmation: boolean = false
    ): Promise<ActionResult> {
        const response = await this.client.post(`/actions/${actionId}/execute`, {
            user_id: userId,
            parameters,
            confirmation
        });
        return response.data;
    }

    async validateAction(
        actionId: string, 
        userId: string, 
        parameters: Record<string, any>
    ): Promise<ValidationResult> {
        const response = await this.client.post(`/actions/${actionId}/validate`, {
            user_id: userId,
            parameters
        });
        return response.data;
    }

    // Feedback & Learning
    async provideFeedback(feedback: UserFeedback): Promise<LearningResponse> {
        const response = await this.client.post('/feedback', feedback);
        return response.data;
    }

    // User Profile
    async getUserProfile(userId: string): Promise<UserProfile> {
        const response = await this.client.get(`/user/${userId}/profile`);
        return response.data;
    }

    async updateUserPreferences(
        userId: string, 
        preferences: AssistancePreferences
    ): Promise<SuccessResponse> {
        const response = await this.client.put(`/user/${userId}/profile`, preferences);
        return response.data;
    }

    // Intelligence
    async getSystemInsights(userId: string, scope?: string): Promise<{insights: SystemInsight[]}> {
        const params = new URLSearchParams({ userId });
        if (scope) params.append('scope', scope);
        const response = await this.client.get(`/insights?${params}`);
        return response.data;
    }

    async getAnomalies(userId: string, severity?: string): Promise<{anomalies: AnomalyReport[]}> {
        const params = new URLSearchParams({ userId });
        if (severity) params.append('severity', severity);
        const response = await this.client.get(`/anomalies?${params}`);
        return response.data;
    }
}

// Usage Example
const aas = new AASClient('http://localhost:3006', 'your-jwt-token');

// Update context when user navigates
await aas.updateContext({
    user_id: 'user-123',
    current_page: 'process-manager',
    current_project: 'uav-design-2024'
});

// Ask a question
const response = await aas.ask(
    "What should I work on next?", 
    'user-123',
    { include_suggestions: true }
);

// Get proactive suggestions
const suggestions = await aas.getSuggestions('user-123', { priority: 'high' });

// Execute an action
const result = await aas.executeAction(
    'create_workflow', 
    'user-123',
    { template: 'uav_design' },
    true
);
```

### Python SDK

```python
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class AASClient:
    base_url: str = "http://localhost:3006"
    token: Optional[str] = None
    
    def __post_init__(self):
        self.headers = {"Content-Type": "application/json"}
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
    
    def update_context(self, context: Dict) -> Dict:
        """Update user context"""
        response = requests.post(
            f"{self.base_url}/context",
            json=context,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def ask(self, question: str, user_id: str, **kwargs) -> Dict:
        """Ask assistant a question"""
        data = {
            "question": question,
            "user_id": user_id,
            **kwargs
        }
        response = requests.post(
            f"{self.base_url}/ask",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_suggestions(self, user_id: str, **filters) -> Dict:
        """Get proactive suggestions"""
        params = {"userId": user_id, **filters}
        response = requests.get(
            f"{self.base_url}/suggestions",
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def execute_action(
        self, 
        action_id: str, 
        user_id: str, 
        parameters: Dict, 
        confirmation: bool = False
    ) -> Dict:
        """Execute an action"""
        data = {
            "user_id": user_id,
            "parameters": parameters,
            "confirmation": confirmation
        }
        response = requests.post(
            f"{self.base_url}/actions/{action_id}/execute",
            json=data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def provide_feedback(self, feedback: Dict) -> Dict:
        """Provide feedback for learning"""
        response = requests.post(
            f"{self.base_url}/feedback",
            json=feedback,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage Example
aas = AASClient("http://localhost:3006", "your-jwt-token")

# Update context
context_response = aas.update_context({
    "user_id": "user-123",
    "current_page": "process-manager",
    "current_project": "uav-design-2024"
})

# Ask a question
answer = aas.ask("What are the next steps for my project?", "user-123")

# Get suggestions
suggestions = aas.get_suggestions("user-123", priority="high", limit=5)

# Execute action
result = aas.execute_action(
    "create_workflow", 
    "user-123",
    {"template": "uav_design"},
    confirmation=True
)

# Provide feedback
aas.provide_feedback({
    "feedback_type": "suggestion_helpful",
    "target_id": "sug-001",
    "user_id": "user-123",
    "rating": 5,
    "comment": "Very helpful suggestion!"
})
```

---

## Integration Examples

### React Frontend Integration

```typescript
// React Hook for AAS Integration
import { useState, useEffect, useCallback } from 'react';
import { AASClient } from './aas-client';

export const useAAS = (userId: string, token: string) => {
    const [client] = useState(() => new AASClient('http://localhost:3006', token));
    const [suggestions, setSuggestions] = useState<AASSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    // Update context when page changes
    const updateContext = useCallback(async (page: string, project?: string) => {
        try {
            setLoading(true);
            const response = await client.updateContext({
                user_id: userId,
                current_page: page,
                current_project: project,
                session_data: {
                    session_start: new Date().toISOString(),
                    actions_taken: [],
                    time_on_page: Date.now()
                }
            });
            setSuggestions(response.proactive_suggestions || []);
        } catch (error) {
            console.error('Failed to update AAS context:', error);
        } finally {
            setLoading(false);
        }
    }, [client, userId]);

    // Ask assistant a question
    const askAssistant = useCallback(async (question: string) => {
        try {
            setLoading(true);
            const response = await client.ask(question, userId, {
                include_suggestions: true,
                include_actions: true
            });
            return response;
        } catch (error) {
            console.error('Failed to ask assistant:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [client, userId]);

    // Execute suggested action
    const executeAction = useCallback(async (
        actionId: string, 
        parameters: Record<string, any>
    ) => {
        try {
            setLoading(true);
            const result = await client.executeAction(actionId, userId, parameters, true);
            // Refresh suggestions after action
            const newSuggestions = await client.getSuggestions(userId);
            setSuggestions(newSuggestions.suggestions);
            return result;
        } catch (error) {
            console.error('Failed to execute action:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [client, userId]);

    // Respond to suggestion
    const respondToSuggestion = useCallback(async (
        suggestionId: string,
        responseType: string,
        rating?: number,
        comment?: string
    ) => {
        try {
            await client.respondToSuggestion(suggestionId, responseType, rating, comment);
            // Remove suggestion from list
            setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        } catch (error) {
            console.error('Failed to respond to suggestion:', error);
        }
    }, [client]);

    return {
        suggestions,
        loading,
        updateContext,
        askAssistant,
        executeAction,
        respondToSuggestion
    };
};

// Usage in React Component
const ProcessManagerPage: React.FC = () => {
    const { user } = useAuth();
    const { 
        suggestions, 
        loading, 
        updateContext, 
        askAssistant, 
        executeAction,
        respondToSuggestion 
    } = useAAS(user.id, user.token);

    useEffect(() => {
        updateContext('process-manager', user.currentProject);
    }, [updateContext, user.currentProject]);

    const handleAskQuestion = async (question: string) => {
        const response = await askAssistant(question);
        // Display response in UI
    };

    const handleExecuteAction = async (suggestion: AASSuggestion) => {
        if (suggestion.action_id) {
            const result = await executeAction(suggestion.action_id, {});
            // Show success message
        }
    };

    return (
        <div>
            {/* Process Manager Content */}
            
            {/* AAS Suggestions */}
            {suggestions.length > 0 && (
                <div className="aas-suggestions">
                    <h3>Assistant Suggestions</h3>
                    {suggestions.map(suggestion => (
                        <div key={suggestion.id} className="suggestion-card">
                            <h4>{suggestion.title}</h4>
                            <p>{suggestion.description}</p>
                            <div className="suggestion-actions">
                                {suggestion.can_execute && (
                                    <button onClick={() => handleExecuteAction(suggestion)}>
                                        Execute
                                    </button>
                                )}
                                <button onClick={() => respondToSuggestion(suggestion.id, 'accepted')}>
                                    Accept
                                </button>
                                <button onClick={() => respondToSuggestion(suggestion.id, 'dismissed')}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

---

## Security Considerations

### Authentication
- All endpoints require valid JWT Bearer token (except health check and webhooks)
- Tokens should include user ID and appropriate permissions
- Service-to-service authentication for webhook endpoints

### Authorization
- User-scoped access: Users can only access their own context and data
- Action execution requires appropriate permissions in JWT claims
- Admin actions require elevated permissions

### Data Privacy
- User context data is encrypted at rest
- Learning data anonymization for cross-user insights
- Audit logging for all user interactions and action executions

### Rate Limiting
- Context updates: 60 requests per minute per user
- Natural language queries: 20 requests per minute per user  
- Action execution: 10 requests per minute per user
- Feedback: 30 requests per minute per user

---

## Performance & Monitoring

### Response Time Targets
- **Context Updates**: < 200ms
- **Natural Language Queries**: < 2 seconds
- **Action Execution**: < 5 seconds (varies by action)
- **Suggestion Generation**: < 500ms

### Monitoring Metrics
- Response times and throughput
- Suggestion acceptance rates
- Action success rates
- Learning effectiveness (improvement over time)
- System resource usage

### Error Handling
- Graceful degradation during service outages
- Comprehensive error logging with context
- User-friendly error messages
- Automatic retry mechanisms for transient failures

---

This Agent Assistance Service API provides a comprehensive foundation for building an intelligent, proactive assistant that enhances user productivity and decision-making effectiveness within the DADMS ecosystem. 