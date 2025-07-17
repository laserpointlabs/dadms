# Agent Assistance Service (AAS) – API Endpoint Specification

This document details the API endpoints for the Agent Assistance Service (AAS) in DADMS 2.0, which provides intelligent, proactive assistance to users throughout the decision-making process.

---

## Service Overview

**Purpose**: Intelligent, proactive assistant that monitors system events and provides context-aware help to users
**Port**: 3005
**Key Features**: Page context awareness, proactive suggestions, natural language interaction, action execution, and learning

---

## Endpoints Summary

| Method | Path                        | Description                           | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|---------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/aas/observe-context`      | Update AAS with current user context  | AASContextRequest (JSON)      | AASContextResponse (JSON)    | Yes   |
| POST   | `/aas/ask`                  | Ask AAS a natural language question   | AASAskRequest (JSON)          | AASAskResponse (JSON)        | Yes   |
| GET    | `/aas/suggestions`          | Get proactive suggestions             | Query parameters              | AASSuggestionsResponse (JSON)| Yes   |
| POST   | `/aas/execute-action`       | Execute an action on user's behalf    | AASActionRequest (JSON)       | AASActionResponse (JSON)     | Yes   |
| POST   | `/aas/learn`                | Provide feedback to improve AAS       | AASLearnRequest (JSON)        | AASLearnResponse (JSON)      | Yes   |
| GET    | `/aas/status`               | Get current AAS status and context    | None                          | AASStatusResponse (JSON)     | Yes   |
| POST   | `/aas/events/webhook`       | Receive events from Event Bus         | Event (JSON)                  | SuccessResponse (JSON)       | No    |
| GET    | `/aas/health`               | Service health/readiness check        | None                          | HealthStatus (JSON)          | No    |

---

## Data Models

### AAS Context
```typescript
interface AASContext {
    current_page: string;           // Current page user is on
    current_project?: string;       // Current project (if applicable)
    user_id: string;                // User identifier
    recent_events: Event[];         // Recent system events
    system_state: {                 // Current system state
        active_processes: number;
        pending_tasks: number;
        system_health: string;
    };
    user_preferences?: {            // User preferences and patterns
        preferred_assistance_level: 'minimal' | 'moderate' | 'proactive';
        notification_preferences: string[];
        learning_enabled: boolean;
    };
    session_data?: {                // Current session information
        session_start: string;
        actions_taken: string[];
        time_on_page: number;
    };
}
```

### AAS Response Types
```typescript
interface AASResponse {
    message: string;                // Human-readable response
    suggestions?: AASSuggestion[];  // Proactive suggestions
    actions?: AASAction[];          // Available actions
    confidence: number;             // Confidence level (0-1)
    context_used: string[];         // Context sources used
}

interface AASSuggestion {
    id: string;
    title: string;
    description: string;
    action_type: 'info' | 'suggestion' | 'warning' | 'action';
    priority: 'low' | 'medium' | 'high';
    can_execute: boolean;
    action_id?: string;
}

interface AASAction {
    id: string;
    name: string;
    description: string;
    parameters: object;
    requires_confirmation: boolean;
    estimated_time: number;         // Seconds
}
```

---

## Detailed Endpoint Specifications

### 1. Observe Context

**POST** `/aas/observe-context`

Updates AAS with current user context to enable proactive assistance.

#### Request Body
```json
{
    "current_page": "process-manager",
    "current_project": "uav-design-2024",
    "user_id": "user123",
    "session_data": {
        "session_start": "2024-01-15T10:00:00Z",
        "actions_taken": ["created_project", "uploaded_documents"],
        "time_on_page": 300
    },
    "user_preferences": {
        "preferred_assistance_level": "proactive",
        "notification_preferences": ["suggestions", "warnings"],
        "learning_enabled": true
    }
}
```

#### Response
```json
{
    "context_updated": true,
    "timestamp": "2024-01-15T10:30:00Z",
    "proactive_suggestions": [
        {
            "id": "sug-001",
            "title": "Create UAV Design Workflow",
            "description": "I see you're on the process manager page. Based on your project context, I can help you create a UAV design workflow template.",
            "action_type": "suggestion",
            "priority": "high",
            "can_execute": true,
            "action_id": "create_uav_workflow"
        }
    ],
    "system_insights": {
        "project_status": "ready_for_workflow",
        "recommended_next_steps": ["design_workflow", "configure_tasks"],
        "potential_issues": []
    }
}
```

### 2. Ask AAS

**POST** `/aas/ask`

Ask AAS a natural language question about the system, current context, or request assistance.

#### Request Body
```json
{
    "question": "What's happening with my UAV project?",
    "context": {
        "current_page": "process-manager",
        "current_project": "uav-design-2024",
        "user_id": "user123"
    },
    "include_suggestions": true,
    "include_actions": true
}
```

#### Response
```json
{
    "answer": "Your UAV project is ready for workflow design. You've uploaded 3 documents about propulsion systems and have completed the initial project setup. I can see that similar projects typically include cost analysis, risk assessment, and design validation steps.",
    "suggestions": [
        {
            "id": "sug-002",
            "title": "Start Cost Analysis Process",
            "description": "Begin the cost analysis workflow to evaluate UAV design economics",
            "action_type": "action",
            "priority": "medium",
            "can_execute": true,
            "action_id": "start_cost_analysis"
        }
    ],
    "actions": [
        {
            "id": "start_cost_analysis",
            "name": "Start Cost Analysis",
            "description": "Launch the cost analysis workflow",
            "parameters": {"workflow_type": "cost_analysis"},
            "requires_confirmation": true,
            "estimated_time": 30
        }
    ],
    "confidence": 0.85,
    "context_used": ["project_status", "uploaded_documents", "similar_projects"]
}
```

### 3. Get Proactive Suggestions

**GET** `/aas/suggestions`

Get proactive suggestions based on current context without being asked.

#### Query Parameters
- `context` (optional): Comma-separated context elements to consider
- `limit` (optional): Number of suggestions to return (default: 5)
- `priority` (optional): Filter by priority level

#### Response
```json
{
    "suggestions": [
        {
            "id": "sug-003",
            "title": "Process Stuck - Need Attention",
            "description": "Your cost analysis process has been running for 45 minutes. This is longer than usual. Would you like me to investigate?",
            "action_type": "warning",
            "priority": "high",
            "can_execute": true,
            "action_id": "investigate_stuck_process"
        },
        {
            "id": "sug-004",
            "title": "New Knowledge Available",
            "description": "I found 2 new documents in your knowledge base that might be relevant to your current workflow.",
            "action_type": "info",
            "priority": "medium",
            "can_execute": true,
            "action_id": "review_new_knowledge"
        }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "context_analyzed": ["process_status", "knowledge_base", "user_activity"]
}
```

### 4. Execute Action

**POST** `/aas/execute-action`

Execute an action on the user's behalf with optional confirmation.

#### Request Body
```json
{
    "action_id": "create_uav_workflow",
    "parameters": {
        "template_type": "uav_design",
        "include_cost_analysis": true,
        "include_risk_assessment": true
    },
    "context": {
        "current_page": "process-manager",
        "current_project": "uav-design-2024",
        "user_id": "user123"
    },
    "confirmation": true
}
```

#### Response
```json
{
    "action_executed": true,
    "action_id": "create_uav_workflow",
    "result": {
        "workflow_id": "wf-abc123",
        "tasks_created": 5,
        "estimated_duration": "2 hours"
    },
    "message": "I've created a UAV design workflow template with 5 tasks including cost analysis and risk assessment. The workflow is ready to run.",
    "next_suggestions": [
        {
            "id": "sug-005",
            "title": "Review Workflow",
            "description": "Review the created workflow before execution",
            "action_type": "suggestion",
            "priority": "medium",
            "can_execute": true,
            "action_id": "review_workflow"
        }
    ],
    "execution_time": 2.3
}
```

### 5. Learn from Feedback

**POST** `/aas/learn`

Provide feedback to help AAS learn and improve its assistance.

#### Request Body
```json
{
    "feedback_type": "suggestion_helpful",
    "suggestion_id": "sug-001",
    "user_rating": 5,
    "user_comment": "This was exactly what I needed!",
    "context": {
        "current_page": "process-manager",
        "current_project": "uav-design-2024",
        "user_id": "user123"
    }
}
```

#### Response
```json
{
    "learning_applied": true,
    "feedback_id": "fb-abc123",
    "message": "Thank you for the feedback! I'll use this to provide better suggestions in the future.",
    "improvements_made": [
        "Increased confidence for UAV workflow suggestions",
        "Updated user preference model"
    ]
}
```

### 6. Get AAS Status

**GET** `/aas/status`

Get current AAS status and context information.

#### Response
```json
{
    "status": "active",
    "current_context": {
        "current_page": "process-manager",
        "current_project": "uav-design-2024",
        "user_id": "user123",
        "session_duration": 1800
    },
    "active_monitoring": {
        "processes_watched": 3,
        "alerts_active": 1,
        "suggestions_pending": 2
    },
    "user_preferences": {
        "assistance_level": "proactive",
        "learning_enabled": true
    },
    "system_health": {
        "event_bus_connected": true,
        "llm_service_available": true,
        "knowledge_service_available": true
    }
}
```

### 7. Event Webhook

**POST** `/aas/events/webhook`

Receive events from the Event Bus for proactive monitoring and assistance.

#### Request Body (Event from Event Bus)
```json
{
    "id": "evt-123",
    "event_type": "process.stuck",
    "source_service": "process-service",
    "data": {
        "process_id": "proc-abc123",
        "process_name": "UAV Cost Analysis",
        "stuck_duration": 1800,
        "last_activity": "2024-01-15T10:00:00Z"
    },
    "user_id": "user123",
    "project_id": "uav-design-2024",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Response
```json
{
    "event_processed": true,
    "actions_taken": [
        "Created high-priority suggestion for stuck process",
        "Analyzed process logs for root cause"
    ],
    "proactive_response": {
        "suggestion_id": "sug-006",
        "message": "I detected your UAV Cost Analysis process is stuck. I've analyzed the logs and found the issue. Would you like me to fix it?"
    }
}
```

### 8. Health Check

**GET** `/aas/health`

Service health and readiness check.

#### Response
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "dependencies": {
        "event_bus": "healthy",
        "llm_service": "healthy",
        "knowledge_service": "healthy",
        "project_service": "healthy"
    },
    "active_users": 5,
    "suggestions_generated_today": 23
}
```

---

## AAS Capabilities and Actions

### Available Actions

#### Process Management
- `create_workflow_template` - Create workflow from template
- `start_process` - Start a BPMN process
- `pause_process` - Pause running process
- `resume_process` - Resume paused process
- `investigate_stuck_process` - Analyze and fix stuck processes

#### Knowledge Management
- `search_knowledge` - Search knowledge base
- `upload_documents` - Upload and process documents
- `create_knowledge_summary` - Generate knowledge summary
- `link_related_knowledge` - Connect related documents

#### Project Management
- `create_project` - Create new project
- `update_project` - Update project settings
- `archive_project` - Archive completed project
- `generate_project_report` - Create project summary

#### User Assistance
- `show_tutorial` - Display contextual tutorial
- `explain_feature` - Explain current feature
- `suggest_best_practices` - Provide best practice guidance
- `optimize_workflow` - Suggest workflow improvements

### Learning and Adaptation

#### Feedback Types
- `suggestion_helpful` - User found suggestion useful
- `suggestion_not_helpful` - User didn't find suggestion useful
- `action_successful` - Executed action was successful
- `action_failed` - Executed action failed
- `user_correction` - User corrected AAS understanding

#### Learning Mechanisms
- **User Preference Learning**: Adapts to user's preferred assistance level
- **Context Pattern Recognition**: Learns from user behavior patterns
- **Suggestion Effectiveness**: Tracks which suggestions are most helpful
- **Action Success Rate**: Monitors action execution success rates

---

## Integration Examples

### Frontend Integration
```typescript
// Update context when user navigates
const updateAASContext = async (page: string, project?: string) => {
    const response = await fetch('/aas/observe-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            current_page: page,
            current_project: project,
            user_id: currentUser.id,
            session_data: {
                session_start: sessionStart,
                actions_taken: userActions,
                time_on_page: timeOnPage
            }
        })
    });
    
    const context = await response.json();
    
    // Display proactive suggestions
    if (context.proactive_suggestions.length > 0) {
        showSuggestions(context.proactive_suggestions);
    }
};

// Ask AAS for help
const askAAS = async (question: string) => {
    const response = await fetch('/aas/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question,
            context: currentContext,
            include_suggestions: true,
            include_actions: true
        })
    });
    
    const answer = await response.json();
    displayAASResponse(answer);
};
```

### Event Bus Integration
```typescript
// Subscribe to relevant events
const eventSubscription = await eventBus.subscribe({
    event_types: [
        'project.created',
        'process.started',
        'process.stuck',
        'process.completed',
        'task.failed',
        'user.stuck'
    ],
    webhook_url: 'https://aas-service:3005/events/webhook'
});

// Process incoming events
app.post('/events/webhook', async (req, res) => {
    const event = req.body;
    
    try {
        switch (event.event_type) {
            case 'project.created':
                await aas.welcomeNewProject(event.data);
                break;
            case 'process.stuck':
                await aas.assistWithStuckProcess(event.data);
                break;
            case 'user.stuck':
                await aas.offerProactiveHelp(event.data);
                break;
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('AAS event processing error:', error);
        res.status(500).send('Error processing event');
    }
});
```

---

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Service-to-service authentication for webhooks
- Rate limiting on user interactions

### Authorization
- Users can only access their own context and data
- Project-scoped access control
- Action execution requires appropriate permissions

### Privacy
- User context data is encrypted at rest
- Learning data is anonymized where possible
- User preferences are stored securely
- Audit logging for all AAS interactions

---

## Performance Considerations

### Response Times
- Context updates: < 100ms
- Natural language questions: < 2 seconds
- Action execution: < 5 seconds
- Proactive suggestions: < 500ms

### Scalability
- Stateless design for horizontal scaling
- Connection pooling for service dependencies
- Caching of user preferences and context
- Asynchronous event processing

### Monitoring
- Response time tracking
- Suggestion effectiveness metrics
- User satisfaction scores
- System health monitoring

---

This Agent Assistance Service transforms DADMS from a static workflow tool into an intelligent, proactive decision assistant that feels like having an expert colleague by your side. 