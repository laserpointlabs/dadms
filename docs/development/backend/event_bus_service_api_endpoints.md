# Event Bus Service – API Endpoint Specification

This document details the API endpoints for the Event Bus Service in DADMS 2.0, which serves as the central nervous system for all system events, enabling real-time communication, monitoring, and intelligent assistance.

---

## Service Overview

**Purpose**: Central event publishing, subscription, and streaming for all DADMS services
**Port**: 3004
**Key Features**: Event publishing, real-time streaming, event history, filtering, and audit trail

---

## Endpoints Summary

| Method | Path                    | Description                           | Request Body / Params         | Response Body                | Auth? |
|--------|-------------------------|---------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/events/publish`       | Publish an event to the bus           | EventPublishRequest (JSON)    | EventPublishResponse (JSON)  | Yes   |
| GET    | `/events/stream`        | Stream events in real-time (SSE)      | Query parameters              | Server-Sent Events stream    | Yes   |
| GET    | `/events/history`       | Get historical events                 | Query parameters              | EventHistoryResponse (JSON)  | Yes   |
| GET    | `/events/types`         | List all event types                  | None                          | EventTypesResponse (JSON)    | Yes   |
| POST   | `/events/subscribe`     | Subscribe to specific event types     | EventSubscribeRequest (JSON)  | EventSubscribeResponse (JSON)| Yes   |
| DELETE | `/events/subscribe/:id` | Unsubscribe from event stream         | None                          | SuccessResponse (JSON)       | Yes   |
| GET    | `/events/stats`         | Get event bus statistics              | None                          | EventStatsResponse (JSON)    | Yes   |
| GET    | `/events/health`        | Service health/readiness check        | None                          | HealthStatus (JSON)          | No    |

---

## Event Data Model

### Event Structure
```typescript
interface Event {
    id: string;                    // Unique event identifier
    event_type: string;            // Event type (e.g., "project.created")
    source_service: string;        // Service that published the event
    data: object;                  // Event payload
    timestamp: string;             // ISO 8601 timestamp
    user_id?: string;              // Associated user (if applicable)
    project_id?: string;           // Associated project (if applicable)
    correlation_id?: string;       // For tracking related events
    metadata?: object;             // Additional metadata
}
```

### Standard Event Types

#### Project Events
- `project.created` - New project created
- `project.updated` - Project modified
- `project.deleted` - Project deleted
- `project.archived` - Project archived

#### Knowledge Events
- `knowledge.uploaded` - Document uploaded
- `knowledge.processed` - Document processed
- `knowledge.indexed` - Document indexed in vector store
- `knowledge.deleted` - Document deleted

#### Process Events
- `process.started` - BPMN process started
- `process.completed` - BPMN process completed
- `process.stuck` - Process waiting/blocked
- `process.failed` - Process failed
- `process.cancelled` - Process cancelled

#### Task Events
- `task.started` - Service task started
- `task.completed` - Service task completed
- `task.failed` - Service task failed
- `task.retried` - Service task retried

#### User Events
- `user.page_view` - User navigated to page
- `user.action` - User performed action
- `user.stuck` - User appears to be stuck
- `user.help_requested` - User requested help

#### System Events
- `system.service_down` - Service unavailable
- `system.service_up` - Service available
- `system.error` - System error occurred
- `system.warning` - System warning

---

## Detailed Endpoint Specifications

### 1. Publish Event

**POST** `/events/publish`

Publishes an event to the event bus for distribution to subscribers.

#### Request Body
```json
{
    "event_type": "project.created",
    "source_service": "project-service",
    "data": {
        "project_id": "uuid",
        "name": "UAV Design Project",
        "owner_id": "user123"
    },
    "user_id": "user123",
    "project_id": "uuid",
    "correlation_id": "corr-123",
    "metadata": {
        "priority": "high",
        "tags": ["urgent", "new-project"]
    }
}
```

#### Response
```json
{
    "event_id": "evt-abc123",
    "status": "published",
    "timestamp": "2024-01-15T10:30:00Z",
    "subscribers_notified": 3
}
```

#### Example Usage
```bash
curl -X POST http://localhost:3004/events/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "event_type": "project.created",
    "source_service": "project-service",
    "data": {"project_id": "uuid", "name": "UAV Design"}
  }'
```

### 2. Stream Events (Server-Sent Events)

**GET** `/events/stream`

Streams events in real-time using Server-Sent Events (SSE).

#### Query Parameters
- `filter` (optional): Comma-separated event types to filter
- `user_id` (optional): Filter events for specific user
- `project_id` (optional): Filter events for specific project
- `since` (optional): ISO timestamp to get events since

#### Response
```
data: {"event_id": "evt-123", "event_type": "project.created", "data": {...}}

data: {"event_id": "evt-124", "event_type": "knowledge.uploaded", "data": {...}}

data: {"event_id": "evt-125", "event_type": "process.started", "data": {...}}
```

#### Example Usage
```javascript
const eventSource = new EventSource('/events/stream?filter=project.created,process.started');

eventSource.onmessage = function(event) {
    const eventData = JSON.parse(event.data);
    console.log('Received event:', eventData);
};
```

### 3. Get Event History

**GET** `/events/history`

Retrieves historical events with filtering and pagination.

#### Query Parameters
- `event_type` (optional): Filter by event type
- `source_service` (optional): Filter by source service
- `user_id` (optional): Filter by user
- `project_id` (optional): Filter by project
- `since` (optional): ISO timestamp for events since
- `until` (optional): ISO timestamp for events until
- `limit` (optional): Number of events to return (default: 50, max: 1000)
- `offset` (optional): Number of events to skip

#### Response
```json
{
    "events": [
        {
            "id": "evt-123",
            "event_type": "project.created",
            "source_service": "project-service",
            "data": {"project_id": "uuid", "name": "UAV Design"},
            "timestamp": "2024-01-15T10:30:00Z",
            "user_id": "user123",
            "project_id": "uuid"
        }
    ],
    "pagination": {
        "total": 150,
        "limit": 50,
        "offset": 0,
        "has_more": true
    }
}
```

### 4. List Event Types

**GET** `/events/types`

Returns all available event types and their descriptions.

#### Response
```json
{
    "event_types": [
        {
            "type": "project.created",
            "description": "New project created",
            "category": "project",
            "data_schema": {
                "type": "object",
                "properties": {
                    "project_id": {"type": "string"},
                    "name": {"type": "string"},
                    "owner_id": {"type": "string"}
                }
            }
        },
        {
            "type": "process.started",
            "description": "BPMN process started",
            "category": "process",
            "data_schema": {
                "type": "object",
                "properties": {
                    "process_id": {"type": "string"},
                    "process_name": {"type": "string"},
                    "project_id": {"type": "string"}
                }
            }
        }
    ]
}
```

### 5. Subscribe to Events

**POST** `/events/subscribe`

Creates a subscription to specific event types with optional filtering.

#### Request Body
```json
{
    "event_types": ["project.created", "process.started"],
    "filters": {
        "user_id": "user123",
        "project_id": "uuid"
    },
    "webhook_url": "https://aas-service:3005/events/webhook",
    "description": "AAS subscription for user assistance"
}
```

#### Response
```json
{
    "subscription_id": "sub-abc123",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "event_types": ["project.created", "process.started"],
    "webhook_url": "https://aas-service:3005/events/webhook"
}
```

### 6. Unsubscribe from Events

**DELETE** `/events/subscribe/:id`

Removes an event subscription.

#### Response
```json
{
    "subscription_id": "sub-abc123",
    "status": "cancelled",
    "cancelled_at": "2024-01-15T10:30:00Z"
}
```

### 7. Get Event Statistics

**GET** `/events/stats`

Returns event bus performance and usage statistics.

#### Response
```json
{
    "total_events": 15420,
    "events_today": 1234,
    "active_subscriptions": 15,
    "events_per_second": 2.5,
    "top_event_types": [
        {"type": "user.page_view", "count": 5432},
        {"type": "project.created", "count": 1234},
        {"type": "knowledge.uploaded", "count": 987}
    ],
    "service_health": {
        "status": "healthy",
        "uptime": 86400,
        "last_event": "2024-01-15T10:30:00Z"
    }
}
```

### 8. Health Check

**GET** `/events/health`

Service health and readiness check.

#### Response
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "dependencies": {
        "database": "healthy",
        "redis": "healthy"
    }
}
```

---

## Event Publishing Best Practices

### 1. Event Naming Convention
- Use dot notation: `domain.action` (e.g., `project.created`)
- Be specific and descriptive
- Use past tense for completed actions

### 2. Event Data Structure
- Keep data payloads focused and relevant
- Include essential identifiers (user_id, project_id)
- Use consistent data types across similar events

### 3. Error Handling
```typescript
// Example: Publishing with error handling
try {
    const response = await fetch('/events/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
        console.error('Failed to publish event:', response.statusText);
        // Implement retry logic or fallback
    }
} catch (error) {
    console.error('Event publishing error:', error);
    // Log error and continue (don't break main flow)
}
```

### 4. Performance Considerations
- Events are asynchronous - don't block main operations
- Use correlation IDs to track related events
- Implement event batching for high-volume scenarios

---

## Integration Examples

### Project Service Integration
```typescript
// After creating a project
const event = {
    event_type: 'project.created',
    source_service: 'project-service',
    data: {
        project_id: project.id,
        name: project.name,
        owner_id: project.owner_id
    },
    user_id: project.owner_id,
    project_id: project.id
};

await eventBus.publish(event);
```

### AAS Service Integration
```typescript
// Subscribe to relevant events
const subscription = await eventBus.subscribe({
    event_types: ['project.created', 'process.stuck', 'user.stuck'],
    webhook_url: 'https://aas-service:3005/events/webhook'
});

// Process incoming events
app.post('/events/webhook', (req, res) => {
    const event = req.body;
    
    switch (event.event_type) {
        case 'project.created':
            aas.welcomeUser(event.data);
            break;
        case 'process.stuck':
            aas.assistWithStuckProcess(event.data);
            break;
        case 'user.stuck':
            aas.offerHelp(event.data);
            break;
    }
    
    res.status(200).send('OK');
});
```

---

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Service-to-service authentication for internal events
- Rate limiting on event publishing

### Authorization
- Users can only access events they're authorized for
- Project-scoped event filtering
- Audit logging for all event operations

### Data Privacy
- Sensitive data should be filtered before publishing
- Event retention policies for compliance
- Encryption of event data in transit and at rest

---

This Event Bus Service provides the foundation for real-time, intelligent assistance in DADMS by enabling all services to communicate and the AAS to monitor and respond to system events proactively. 