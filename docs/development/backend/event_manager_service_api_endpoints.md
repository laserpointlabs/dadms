# EventManager Service – API Endpoint Specification

This document details the API endpoints for the EventManager Service in DADMS 2.0, which serves as the central nervous system for event-driven intelligence, providing reliable event processing, real-time notifications, and proactive assistance integration.

---

## Service Overview

**Purpose**: Central nervous system for DADMS event-driven intelligence, providing reliable event processing, real-time notifications, audit trails, and learning workflow triggers
**Port**: 3004 (replaces Event Bus Service)
**Key Features**: Event publishing/subscribing, real-time WebSocket streams, AAS continuous monitoring, priority queues, retry policies, dead letter handling, event replay, and comprehensive observability

---

## Endpoints Summary

| Method | Path                           | Description                              | Request Body / Params            | Response Body                   | Auth? |
|--------|--------------------------------|------------------------------------------|----------------------------------|---------------------------------|-------|
| POST   | `/events`                      | Publish single event                     | EventPublishRequest (JSON)       | PublishResult (JSON)            | Yes   |
| POST   | `/events/batch`                | Publish multiple events in batch        | BatchPublishRequest (JSON)       | BatchPublishResult (JSON)       | Yes   |
| GET    | `/events/query`                | Query event history with filtering      | Query parameters                 | EventQueryResult (JSON)         | Yes   |
| POST   | `/subscriptions`               | Create event subscription               | SubscriptionRequest (JSON)       | SubscriptionResponse (JSON)     | Yes   |
| GET    | `/subscriptions`               | List active subscriptions              | None                             | SubscriptionInfo[] (JSON)       | Yes   |
| DELETE | `/subscriptions/{id}`          | Cancel event subscription              | Path parameter: subscription ID  | Success message                 | Yes   |
| GET    | `/topics`                      | List all available topics              | None                             | TopicInfo[] (JSON)              | Yes   |
| POST   | `/topics`                      | Create new topic with schema           | CreateTopicRequest (JSON)        | Success message                 | Yes   |
| GET    | `/topics/{topic}/events`       | Get events for specific topic          | Path + query parameters          | Event[] (JSON)                  | Yes   |
| GET    | `/aas/realtime`                | AAS real-time WebSocket stream         | WebSocket upgrade headers        | WebSocket connection            | Yes   |
| POST   | `/aas/context`                 | Update AAS event filtering context     | AASContextUpdate (JSON)          | Success message                 | Yes   |
| POST   | `/replay`                      | Replay historical events               | ReplayRequest (JSON)             | ReplayResult (JSON)             | Yes   |
| GET    | `/health`                      | Service health check                   | None                             | HealthStatus (JSON)             | No    |
| GET    | `/metrics`                     | Service performance metrics            | None                             | EventMetrics (JSON)             | Yes   |

---

## Data Models

### Event Structure
```typescript
interface Event {
    id: string;                    // Unique event identifier (UUID)
    type: string;                  // Event type (e.g., 'project.created')
    source: string;                // Originating service
    timestamp: Date;               // Event timestamp
    version: string;               // Event schema version
    topic: string;                 // Routing topic
    priority: EventPriority;       // CRITICAL, HIGH, NORMAL, LOW
    metadata: EventMetadata;       // System metadata
    payload: Record<string, any>;  // Event data
    correlationId?: string;        // Request correlation ID
    causationId?: string;          // ID of event that caused this event
}

enum EventPriority {
    CRITICAL = 0,
    HIGH = 1,
    NORMAL = 2,
    LOW = 3
}

interface EventMetadata {
    projectId?: string;            // Associated project ID
    userId?: string;               // Associated user ID
    sessionId?: string;            // User session ID
    tags: string[];                // Event tags for filtering
    retryCount: number;            // Number of retry attempts
    maxRetries: number;            // Maximum retry attempts
    expiresAt?: Date;              // Event expiration time
}
```

### Subscription Models
```typescript
interface SubscriptionRequest {
    topic: string;                 // Topic pattern (supports wildcards like '#')
    endpoint: string;              // Callback endpoint URL or WebSocket endpoint
    connection_type: 'webhook' | 'websocket' | 'grpc';
    filter?: EventFilter;          // Optional filtering criteria
    options?: SubscriptionOptions; // Subscription options
    description?: string;          // Subscription description
}

interface EventFilter {
    types?: string[];              // Event types to include
    exclude_types?: string[];      // Event types to exclude
    sources?: string[];            // Source services to include
    priority?: EventPriority;      // Minimum priority level
    tags?: string[];               // Required tags
    user_relevant?: boolean;       // Only user-relevant events
    project_scoped?: boolean;      // Only project-scoped events
}

interface SubscriptionOptions {
    batch_size?: number;           // Number of events to batch (1-100)
    max_concurrency?: number;      // Maximum concurrent processing (1-100)
    realtime?: boolean;            // Enable real-time WebSocket delivery
    fallback_webhook?: string;     // Fallback webhook if WebSocket fails
    retry_policy?: RetryPolicy;    // Custom retry configuration
}
```

---

## Detailed Endpoint Documentation

### **POST /events** - Publish Single Event

Publishes a single event to the EventManager for distribution to subscribers.

**Request Body**: `EventPublishRequest`
```json
{
    "type": "project.created",
    "source": "project-service", 
    "topic": "project/created",
    "priority": "HIGH",
    "payload": {
        "project_id": "proj-123",
        "project_name": "UAV Design 2024",
        "created_by": "user-456"
    },
    "metadata": {
        "projectId": "proj-123",
        "userId": "user-456",
        "tags": ["project", "user-action"]
    }
}
```

**Response**: `PublishResult`
```json
{
    "success": true,
    "eventId": "evt-789",
    "message": "Event published successfully"
}
```

---

### **POST /events/batch** - Publish Multiple Events

Publishes multiple events in a single batch operation for efficiency.

**Request Body**: `BatchPublishRequest`
```json
{
    "events": [
        {
            "type": "document.uploaded",
            "source": "knowledge-service",
            "topic": "knowledge/document/uploaded",
            "priority": "NORMAL",
            "payload": {
                "document_id": "doc-123",
                "filename": "requirements.pdf"
            }
        },
        {
            "type": "document.processed",
            "source": "knowledge-service", 
            "topic": "knowledge/document/processed",
            "priority": "NORMAL",
            "payload": {
                "document_id": "doc-123",
                "chunks_created": 15
            }
        }
    ]
}
```

**Response**: `BatchPublishResult`
```json
{
    "success": true,
    "results": [
        {"success": true, "eventId": "evt-001"},
        {"success": true, "eventId": "evt-002"}
    ],
    "failedCount": 0
}
```

---

### **POST /subscriptions** - Create Event Subscription

Creates a new subscription to receive events matching specified criteria. Essential for AAS continuous monitoring.

**Request Body**: `SubscriptionRequest`

**Example 1 - AAS Universal Monitoring**:
```json
{
    "topic": "#",
    "endpoint": "https://aas-service:3005/events/webhook",
    "connection_type": "webhook",
    "filter": {
        "priority": "NORMAL",
        "exclude_types": ["system.heartbeat", "metrics.internal"],
        "user_relevant": true
    },
    "options": {
        "batch_size": 20,
        "realtime": true,
        "fallback_webhook": "https://aas-service:3005/events/webhook"
    },
    "description": "AAS continuous monitoring subscription"
}
```

**Example 2 - Service-Specific Subscription**:
```json
{
    "topic": "project.*",
    "endpoint": "https://project-service:3001/events/webhook",
    "connection_type": "webhook",
    "filter": {
        "priority": "HIGH"
    },
    "description": "Project service event subscription"
}
```

**Response**: `SubscriptionResponse`
```json
{
    "subscriptionId": "sub-123",
    "topic": "#",
    "endpoint": "https://aas-service:3005/events/webhook",
    "filter": {
        "priority": "NORMAL",
        "exclude_types": ["system.heartbeat", "metrics.internal"],
        "user_relevant": true
    },
    "created_at": "2024-01-15T10:00:00Z",
    "status": "active"
}
```

---

### **GET /events/query** - Query Event History

Queries historical events with filtering and pagination for debugging and analysis.

**Query Parameters**:
- `topic` (string): Topic pattern to filter by (e.g., "project.*")
- `type` (string): Event type to filter by (e.g., "project.created")
- `source` (string): Source service to filter by (e.g., "project-service")
- `since` (date-time): Return events after this timestamp
- `until` (date-time): Return events before this timestamp
- `limit` (integer): Maximum events to return (1-1000, default: 100)
- `offset` (integer): Number of events to skip (default: 0)

**Example Request**:
```
GET /events/query?topic=project.*&since=2024-01-15T00:00:00Z&limit=50
```

**Response**: `EventQueryResult`
```json
{
    "events": [
        {
            "id": "evt-123",
            "type": "project.created",
            "source": "project-service",
            "timestamp": "2024-01-15T10:00:00Z",
            "topic": "project/created",
            "priority": "HIGH",
            "payload": {
                "project_id": "proj-123",
                "project_name": "UAV Design 2024"
            },
            "metadata": {
                "projectId": "proj-123",
                "userId": "user-456",
                "tags": ["project", "user-action"]
            }
        }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
}
```

---

### **GET /aas/realtime** - AAS Real-time WebSocket Stream

WebSocket endpoint for AAS real-time event monitoring. Provides sub-100ms event delivery for critical events.

**WebSocket Upgrade Headers**:
```
Upgrade: websocket
Connection: Upgrade
```

**WebSocket Message Format**:
```json
{
    "type": "event",
    "data": {
        "id": "evt-123",
        "type": "process.stuck",
        "source": "process-service",
        "timestamp": "2024-01-15T10:30:00Z",
        "priority": "CRITICAL",
        "payload": {
            "process_id": "proc-abc123",
            "stuck_duration": 1800
        },
        "aasContext": {
            "userRelevance": 0.95,
            "assistanceOpportunity": "process_intervention",
            "suggestedActions": ["restart_process", "escalate_to_admin"]
        }
    }
}
```

---

### **POST /aas/context** - Update AAS Event Context

Updates contextual information for AAS event filtering and assistance targeting.

**Request Body**: `AASContextUpdate`
```json
{
    "user_id": "user-456",
    "project_id": "proj-123",
    "session_id": "sess-789",
    "current_page": "process-manager",
    "assistance_level": "proactive",
    "relevant_topics": ["project.*", "process.*", "llm.*"]
}
```

**Response**: Success message
```json
{
    "success": true,
    "message": "AAS context updated successfully"
}
```

---

### **POST /replay** - Replay Historical Events

Replays historical events to subscribers for debugging, recovery, or analysis.

**Request Body**: `ReplayRequest`
```json
{
    "from_timestamp": "2024-01-15T10:00:00Z",
    "to_timestamp": "2024-01-15T11:00:00Z",
    "topic_pattern": "process.*",
    "subscriber_ids": ["aas-service"],
    "speed_multiplier": 1.0
}
```

**Response**: `ReplayResult`
```json
{
    "replay_id": "replay-123",
    "status": "started",
    "events_to_replay": 500,
    "estimated_duration": 300
}
```

---

## AAS Integration Patterns

### Universal Event Monitoring
The EventManager enables AAS to monitor ALL system events through a universal subscription:

```typescript
// AAS subscribes to all events with smart filtering
const aasUniversalSubscription = {
    topic: '#',                          // Wildcard for all events
    filter: {
        priority: 'NORMAL',              // Minimum priority
        exclude_types: ['system.heartbeat', 'metrics.internal'],
        user_relevant: true,             // Only user-relevant events
        project_scoped: true             // Only project-scoped events
    },
    options: {
        batch_size: 20,                  // Efficient batching
        realtime: true,                  // WebSocket delivery
        fallback_webhook: 'https://aas-service:3005/events/webhook'
    }
};
```

### Real-time Intelligence Feed
For critical events requiring immediate AAS attention:

```typescript
// WebSocket connection for sub-100ms critical event delivery
const aasRealtimeStream = {
    endpoint: 'ws://aas-service:3005/events/realtime',
    filters: {
        priority: ['CRITICAL', 'HIGH'],
        userContext: true,
        projectContext: true
    },
    options: {
        heartbeat_interval: 30000,       // 30 second heartbeat
        reconnect_attempts: 5,
        buffer_size: 100                 // Buffer during reconnection
    }
};
```

---

## Topic Hierarchy

EventManager uses a hierarchical topic structure for efficient routing:

```
project/
├── created
├── updated
├── deleted
└── member/
    ├── added
    └── removed

knowledge/
├── document/
│   ├── uploaded
│   ├── processed
│   └── indexed
└── search/
    ├── executed
    └── completed

llm/
├── request/
│   ├── started
│   └── completed
└── tool/
    ├── called
    └── result

process/
├── started
├── task/
│   ├── executed
│   └── completed
└── finished

aas/
├── suggestion/
│   ├── generated
│   └── accepted
└── alert/
    ├── risk
    └── recommendation
```

---

## Performance & Reliability Features

### Retry Policies
```typescript
interface RetryPolicy {
    max_retries: number;           // Default: 3
    backoff_strategy: 'linear' | 'exponential' | 'fixed';
    initial_delay: number;         // milliseconds
    max_delay: number;             // milliseconds
    jitter: boolean;               // Add randomness
}
```

### Priority Handling
- **CRITICAL**: Immediate delivery, bypass all queues
- **HIGH**: Priority queue, < 100ms delivery target
- **NORMAL**: Standard queue, < 500ms delivery target  
- **LOW**: Background processing, < 5s delivery target

### Dead Letter Queue
Failed events are moved to dead letter queue for investigation and potential replay.

---

## Monitoring & Observability

### Health Check Response
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:00:00Z",
    "version": "2.0.0",
    "dependencies": {
        "postgresql": "healthy",
        "redis": "healthy", 
        "vector_store": "healthy"
    },
    "metrics": {
        "events_per_second": 1250.5,
        "active_subscriptions": 25,
        "queue_depth": 150,
        "memory_usage_mb": 512.3
    }
}
```

### Performance Metrics
```json
{
    "events_published_total": 1500000,
    "events_processed_total": 1498500,
    "events_retried_total": 1500,
    "events_failed_total": 0,
    "publish_latency_p95_ms": 85.2,
    "handler_latency_p95_ms": 95.7,
    "active_subscriptions": 25,
    "queue_depth": 150,
    "dead_letter_count": 0,
    "aas_integration": {
        "events_delivered_to_aas": 500000,
        "aas_delivery_latency_p95_ms": 75.3,
        "aas_webhook_failures": 0,
        "aas_websocket_disconnections": 2
    }
}
```

---

## Security Considerations

- **Authentication**: Bearer token authentication for all endpoints except health check
- **Authorization**: Topic-based access control (RBAC)
- **Event Encryption**: Optional payload encryption for sensitive data
- **Audit Trail**: All operations logged for compliance
- **Rate Limiting**: Configurable rate limits per subscriber
- **Data Retention**: Configurable event retention policies

---

## Migration from Event Bus

EventManager is a drop-in replacement for the Event Bus Service on port 3004:

1. **Backward Compatibility**: Supports current Event Bus webhook patterns
2. **Enhanced Features**: Adds WebSocket streams, priority queues, retry policies
3. **AAS Integration**: Designed specifically for AAS continuous monitoring
4. **Performance**: 10x better throughput and reliability
5. **Observability**: Comprehensive metrics and monitoring

For detailed migration instructions, see: [Event Bus to EventManager Migration Guide](./event_bus_to_eventmanager_migration.md)

---

This EventManager serves as the central nervous system that transforms DADMS from a collection of services into a unified, intelligent decision assistance platform with real-time event-driven intelligence. 