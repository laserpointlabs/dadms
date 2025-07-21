# DADMS EventManager Service Specification

## 1. Purpose & Responsibilities

The `EventManager` serves as the central nervous system of DADMS's Event-Driven System (EDS), providing reliable, scalable event processing and distribution across all microservices and components.

### Core Responsibilities

- **Event Normalization**: Accept and normalize incoming `EventIn` objects into standardized `Event` format
- **Reliable Dispatch**: Ensure idempotent, ordered delivery to subscribed handlers with retry mechanisms
- **Subscription Management**: Dynamic subscribe/unsubscribe operations with topic-based routing
- **Schema Validation**: Enforce event type schemas and metadata requirements
- **Event Persistence**: Store events for replay, debugging, and audit trails
- **Topic Routing**: Support hierarchical topic structures with wildcard matching
- **Dead Letter Handling**: Manage failed events with configurable retry policies

## 2. Event Model & Schema

### Event Structure
```typescript
interface Event {
  id: string;                    // UUID for idempotency
  type: string;                  // Event type (e.g., 'project.created')
  source: string;                // Originating service
  timestamp: Date;               // ISO 8601 timestamp
  version: string;               // Schema version
  topic: string;                 // Routing topic
  priority: EventPriority;       // CRITICAL, HIGH, NORMAL, LOW
  metadata: EventMetadata;       // System metadata
  payload: Record<string, any>;  // Event data
  correlationId?: string;        // For request tracing
  causationId?: string;          // Previous event that caused this
}

interface EventMetadata {
  projectId?: string;
  userId?: string;
  sessionId?: string;
  tags: string[];
  retryCount: number;
  maxRetries: number;
  expiresAt?: Date;
}

enum EventPriority {
  CRITICAL = 0,
  HIGH = 1, 
  NORMAL = 2,
  LOW = 3
}
```

### Topic Hierarchy
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

## 3. API Specification

### Core EventManager Interface
```typescript
interface EventManager {
  // Publishing
  publish(event: EventIn): Promise<PublishResult>;
  publishBatch(events: EventIn[]): Promise<BatchPublishResult>;
  
  // Subscription Management
  subscribe(subscription: SubscriptionRequest): Promise<Subscription>;
  unsubscribe(subscriptionId: string): Promise<void>;
  
  // Topic Management
  createTopic(topic: string, schema?: EventSchema): Promise<void>;
  listTopics(): Promise<TopicInfo[]>;
  
  // Event Querying
  getEvents(query: EventQuery): Promise<Event[]>;
  replayEvents(query: ReplayQuery): Promise<void>;
  
  // Health & Metrics
  getHealth(): Promise<HealthStatus>;
  getMetrics(): Promise<EventMetrics>;
}

interface SubscriptionRequest {
  topic: string;              // Topic pattern (supports wildcards)
  handler: EventHandler;      // Callback function
  filter?: EventFilter;       // Optional filtering criteria
  options?: SubscriptionOptions;
}

interface SubscriptionOptions {
  priority?: EventPriority;   // Minimum priority level
  batchSize?: number;         // For batch processing
  maxConcurrency?: number;    // Parallel processing limit
  retryPolicy?: RetryPolicy;
  deadLetterTopic?: string;
}

type EventHandler = (event: Event) => Promise<HandlerResult>;

interface HandlerResult {
  success: boolean;
  error?: Error;
  retry?: boolean;
  metadata?: Record<string, any>;
}
```

### HTTP API Endpoints
```typescript
// Publishing
POST   /events                    // Publish single event
POST   /events/batch              // Publish multiple events

// Subscriptions
POST   /subscriptions             // Create subscription
GET    /subscriptions             // List subscriptions
DELETE /subscriptions/:id         // Remove subscription

// Topics
GET    /topics                    // List all topics
POST   /topics                    // Create topic
GET    /topics/:topic/events      // Get events for topic

// Management
GET    /health                    // Health check
GET    /metrics                   // Performance metrics
POST   /replay                    // Replay events
```

## 4. Behavioral Requirements

### Event Processing Pipeline

For detailed visual diagrams of the EventManager architecture, see: [EventManager Architecture Diagrams](./event_manager_diagrams.md)

The event processing pipeline follows this flow:
1. **Event Input**: Incoming events from DADMS services
2. **Schema Validation**: Validate against event schema
3. **Event Normalization**: Convert to standard Event format
4. **Topic Resolution**: Determine routing topics and subscribers
5. **Priority Queue**: Queue by priority level (CRITICAL, HIGH, NORMAL, LOW)
6. **Handler Dispatch**: Deliver to subscribed handlers
7. **Success/Retry Logic**: Handle successful delivery or retry failed events
8. **Dead Letter Queue**: Store permanently failed events
9. **Context Thread Store**: Log all events to vector store for analysis

### Queue Management
- **Priority Queues**: Separate queues for each priority level
- **Buffering**: In-memory buffer with configurable size (default: 10,000 events)
- **Persistence**: PostgreSQL for event store, Redis for active queues
- **Ordering**: FIFO within priority levels, optional strict ordering per topic

### Retry & Error Handling
```typescript
interface RetryPolicy {
  maxRetries: number;           // Default: 3
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;         // milliseconds
  maxDelay: number;             // milliseconds
  jitter: boolean;              // Add randomness to prevent thundering herd
}

// Default retry policy
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffStrategy: 'exponential',
  initialDelay: 1000,
  maxDelay: 30000,
  jitter: true
};
```

### Filtering & Routing
```typescript
interface EventFilter {
  types?: string[];             // Event types to include
  sources?: string[];           // Source services to include
  priority?: EventPriority;     // Minimum priority
  metadata?: Record<string, any>; // Metadata filters
  payload?: Record<string, any>;  // Payload filters
  tags?: string[];              // Required tags
}

// Topic pattern matching
const topicPatterns = [
  'project.*',                  // All project events
  'knowledge.document.*',       // All document events
  'process.task.executed',      // Specific event
  '*.created',                  // All creation events
  '#'                          // All events (use sparingly)
];
```

## 5. Non-Functional Requirements

### Scalability
- **Throughput**: Support 10,000+ events/second sustained
- **Concurrency**: Handle 1,000+ concurrent subscriptions
- **Horizontal Scaling**: Stateless design for multi-instance deployment
- **Partition Strategy**: Topic-based partitioning for load distribution

### Resilience
- **Zero Data Loss**: Persist events before acknowledgment
- **Circuit Breaker**: Protect against cascading failures
- **Graceful Degradation**: Continue operating with reduced functionality
- **Health Checks**: Comprehensive monitoring and alerting

### Latency Requirements
- **P95 Event Delivery**: < 100ms from publish to handler execution
- **P99 Event Delivery**: < 500ms
- **Subscription Response**: < 10ms for subscribe/unsubscribe operations
- **Query Response**: < 1s for event history queries

### Observability
```typescript
interface EventMetrics {
  // Throughput metrics
  eventsPublished: Counter;
  eventsProcessed: Counter;
  eventsRetried: Counter;
  eventsFailed: Counter;
  
  // Latency metrics
  publishLatency: Histogram;
  handlerLatency: Histogram;
  endToEndLatency: Histogram;
  
  // Queue metrics
  queueDepth: Gauge;
  activeSubscriptions: Gauge;
  deadLetterCount: Counter;
  
  // System metrics
  memoryUsage: Gauge;
  cpuUsage: Gauge;
  connectionPool: Gauge;
}
```

## 6. Integration Points

### DADMS Service Integration
```typescript
// Project Service Integration
class ProjectService {
  constructor(private eventManager: EventManager) {
    // Subscribe to relevant events
    this.eventManager.subscribe({
      topic: 'project.*',
      handler: this.handleProjectEvent.bind(this)
    });
  }
  
  async createProject(data: CreateProjectData): Promise<Project> {
    const project = await this.repository.create(data);
    
    // Publish creation event
    await this.eventManager.publish({
      type: 'project.created',
      source: 'project-service',
      topic: 'project/created',
      payload: { project }
    });
    
    return project;
  }
}
```

### **Agent Assistance Service (AAS) Continuous Monitoring**

The EventManager must provide comprehensive event monitoring for the AAS to enable proactive, intelligent assistance. This is a critical requirement as AAS needs visibility into ALL system activities.

#### **AAS Universal Event Subscription**
```typescript
// AAS subscribes to ALL events for continuous monitoring
class AgentAssistanceService {
  async initializeEventMonitoring() {
    // Primary subscription: ALL events via wildcard
    const universalSubscription = await this.eventManager.subscribe({
      topic: '#',                        // ALL events
      handler: this.handleAnyEvent.bind(this),
      options: {
        priority: EventPriority.HIGH,    // High priority processing
        batchSize: 20,                   // Efficient batching
        realtime: true,                  // WebSocket for sub-100ms delivery
        fallbackWebhook: 'https://aas-service:3005/events/webhook'
      }
    });

    // Critical events get immediate attention
    const criticalSubscription = await this.eventManager.subscribe({
      topic: '#',
      handler: this.handleCriticalEvent.bind(this),
      filter: {
        priority: EventPriority.CRITICAL,
        types: ['process.stuck', 'user.error', 'system.failure']
      },
      options: {
        batchSize: 1,                    // Individual delivery for critical events
        realtime: true
      }
    });
  }

  async handleAnyEvent(event: Event): Promise<HandlerResult> {
    // Analyze event for assistance opportunities
    const assistanceContext = await this.analyzeForAssistance(event);
    
    if (assistanceContext.shouldAssist) {
      await this.generateProactiveSuggestion(event, assistanceContext);
    }
    
    // Always log for learning and context building
    await this.updateUserContext(event);
    
    return { success: true };
  }
}
```

#### **Scalability-Aware Event Filtering**
```typescript
// Smart filtering to handle high event volumes
interface AASEventFilter {
  // User context filtering
  userRelevant: boolean;               // Only events relevant to current user
  projectScoped: boolean;              // Only events for user's active projects
  sessionScoped: boolean;              // Only events during user's session
  
  // Priority filtering
  minimumPriority: EventPriority;      // Filter by priority level
  criticalAlways: boolean;             // Always include CRITICAL events
  
  // Type filtering
  includeTypes: string[];              // Specific event types to include
  excludeTypes: string[];              // Event types to exclude (e.g., heartbeats)
  
  // Volume control
  rateLimitPerMinute: number;          // Maximum events per minute
  batchingEnabled: boolean;            // Enable batching for efficiency
}

const aasDefaultFilter: AASEventFilter = {
  userRelevant: true,
  projectScoped: true,
  sessionScoped: false,                // Monitor even when user offline
  minimumPriority: EventPriority.NORMAL,
  criticalAlways: true,
  includeTypes: [
    'project.*', 'process.*', 'knowledge.*', 'llm.*',
    'user.action.*', 'system.error.*', 'workflow.*'
  ],
  excludeTypes: [
    'system.heartbeat', 'metrics.internal', 'log.debug'
  ],
  rateLimitPerMinute: 1000,
  batchingEnabled: true
};
```

#### **Real-time WebSocket Integration for AAS**
```typescript
// WebSocket stream for immediate AAS awareness
class EventManagerWebSocketHandler {
  async setupAASRealtimeStream(aasServiceId: string) {
    const aasStream = this.createRealtimeStream({
      subscriberId: aasServiceId,
      connectionType: 'websocket',
      endpoint: 'ws://aas-service:3005/events/realtime',
      filters: {
        priority: [EventPriority.CRITICAL, EventPriority.HIGH],
        userContext: true,
        projectContext: true,
        excludeSystemEvents: true
      },
      options: {
        heartbeatInterval: 30000,        // 30 second heartbeat
        reconnectAttempts: 5,
        bufferSize: 100,                 // Buffer events during reconnection
        compressionEnabled: true
      }
    });

    // Enhanced event payload for AAS
    aasStream.onEvent((event: Event) => {
      const enhancedEvent = {
        ...event,
        aasContext: {
          userRelevance: this.calculateUserRelevance(event),
          assistanceOpportunity: this.identifyAssistanceOpportunity(event),
          suggestedActions: this.generateSuggestedActions(event),
          contextualData: this.gatherContextualData(event)
        }
      };
      
      return enhancedEvent;
    });

    return aasStream;
  }
}
```

#### **Backward Compatibility with Current AAS**
```typescript
// Legacy webhook support for current AAS implementation
class LegacyAASAdapter {
  // Convert modern Event to current AAS Event schema
  adaptEventForCurrentAAS(modernEvent: Event): CurrentAASEvent {
    return {
      id: modernEvent.id,
      event_type: modernEvent.type,
      source_service: modernEvent.source,
      data: modernEvent.payload,
      timestamp: modernEvent.timestamp.toISOString(),
      user_id: modernEvent.metadata.userId,
      project_id: modernEvent.metadata.projectId
    };
  }

  // Webhook delivery to current AAS endpoint
  async deliverToCurrentAAS(event: Event): Promise<void> {
    const legacyEvent = this.adaptEventForCurrentAAS(event);
    
    await fetch('https://aas-service:3005/events/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(legacyEvent)
    });
  }
}
```

#### **AAS Performance Monitoring**
```typescript
interface AASIntegrationMetrics {
  // Event delivery metrics
  eventsDeliveredToAAS: Counter;
  aasDeliveryLatency: Histogram;
  aasWebhookFailures: Counter;
  aasWebSocketDisconnections: Counter;
  
  // Volume metrics
  aasEventsPerMinute: Gauge;
  aasFilteredEvents: Counter;
  aasBatchedEvents: Counter;
  
  // Assistance metrics
  assistanceOpportunitiesIdentified: Counter;
  proactiveSuggestionsGenerated: Counter;
  userActionsTriggered: Counter;
}
```

### Context Thread Vector Store Integration
```typescript
// Automatic event logging to vector store
const contextLogger = async (event: Event): Promise<HandlerResult> => {
  try {
    // Convert event to vector store format
    const document = {
      id: event.id,
      content: JSON.stringify(event),
      metadata: {
        type: 'event',
        source: event.source,
        topic: event.topic,
        timestamp: event.timestamp,
        projectId: event.metadata.projectId
      }
    };
    
    await vectorStore.upsert(document);
    
    return { success: true };
  } catch (error) {
    return { success: false, error, retry: true };
  }
};

// Auto-subscribe context logger to all events
eventManager.subscribe({
  topic: '#',
  handler: contextLogger,
  options: { priority: EventPriority.LOW }
});
```

### Learning Workflow Integration
```typescript
// Trigger learning workflows based on events
const learningTrigger = async (event: Event): Promise<HandlerResult> => {
  if (event.type === 'process.finished') {
    // Extract learning data from completed process
    await learningService.extractInsights(event.payload.processInstance);
  }
  
  if (event.type === 'llm.tool.result') {
    // Learn from tool usage patterns
    await learningService.recordToolUsage(event.payload);
  }
  
  return { success: true };
};
```

### Game Theory Simulation Integration
```typescript
// Fork simulations based on decision events
const simulationTrigger = async (event: Event): Promise<HandlerResult> => {
  if (event.type === 'decision.proposed' && event.metadata.tags.includes('high-stakes')) {
    // Run game theory simulations for high-stakes decisions
    await gameTheoryService.runSimulation({
      decision: event.payload.decision,
      context: event.payload.context,
      correlationId: event.correlationId
    });
  }
  
  return { success: true };
};
```

## 7. Implementation Architecture

### Service Structure
```
event-manager/
├── src/
│   ├── core/
│   │   ├── EventManager.ts          // Main service class
│   │   ├── EventStore.ts            // Persistence layer
│   │   ├── TopicManager.ts          // Topic management
│   │   └── SubscriptionManager.ts   // Subscription handling
│   ├── handlers/
│   │   ├── HttpHandler.ts           // REST API endpoints
│   │   ├── WebSocketHandler.ts      // Real-time subscriptions
│   │   └── GrpcHandler.ts           // High-performance RPC
│   ├── queue/
│   │   ├── PriorityQueue.ts         // Priority-based queuing
│   │   ├── RetryQueue.ts            // Retry mechanism
│   │   └── DeadLetterQueue.ts       // Failed event handling
│   ├── storage/
│   │   ├── PostgresEventStore.ts    // PostgreSQL persistence
│   │   ├── RedisQueueStore.ts       // Redis queue backend
│   │   └── VectorStoreAdapter.ts    // Vector store integration
│   └── utils/
│       ├── SchemaValidator.ts       // Event schema validation
│       ├── TopicMatcher.ts          // Pattern matching
│       └── MetricsCollector.ts      // Observability
├── tests/
│   ├── unit/
│   ├── integration/
│   └── load/
├── docs/
│   ├── api/
│   └── examples/
└── deployment/
    ├── docker/
    ├── k8s/
    └── monitoring/
```

### Database Schema
```sql
-- Event storage
CREATE TABLE events (
    id UUID PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    topic VARCHAR(500) NOT NULL,
    priority INTEGER NOT NULL,
    payload JSONB NOT NULL,
    metadata JSONB NOT NULL,
    correlation_id UUID,
    causation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    INDEX idx_events_topic (topic),
    INDEX idx_events_type (type),
    INDEX idx_events_created_at (created_at),
    INDEX idx_events_correlation (correlation_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    topic_pattern VARCHAR(500) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    filter_criteria JSONB,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Dead letter queue
CREATE TABLE dead_letter_events (
    id UUID PRIMARY KEY,
    original_event_id UUID NOT NULL,
    event_data JSONB NOT NULL,
    failure_reason TEXT,
    failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    retry_count INTEGER NOT NULL
);
```

## 8. Deployment Configuration

### Docker Compose Integration
```yaml
# Add to DADMS docker-compose.yml
event-manager:
  build: ./services/event-manager
  ports:
    - "3004:3004"
  environment:
    - NODE_ENV=development
    - DATABASE_URL=postgresql://dadms:password@postgres:5432/dadms_events
    - REDIS_URL=redis://redis:6379
    - VECTOR_STORE_URL=http://qdrant:6333
  depends_on:
    - postgres
    - redis
    - qdrant
  volumes:
    - ./services/event-manager:/app
    - /app/node_modules
  restart: unless-stopped
```

### Environment Configuration
```typescript
interface EventManagerConfig {
  port: number;                    // Default: 3004
  database: {
    url: string;
    maxConnections: number;        // Default: 20
    queryTimeout: number;          // Default: 5000ms
  };
  redis: {
    url: string;
    keyPrefix: string;             // Default: 'dadms:events:'
  };
  queue: {
    maxSize: number;               // Default: 10000
    batchSize: number;             // Default: 100
    flushInterval: number;         // Default: 1000ms
  };
  retry: RetryPolicy;
  metrics: {
    enabled: boolean;              // Default: true
    port: number;                  // Default: 9090
  };
}
```

## 9. Testing Strategy

### Unit Tests
- Event validation and normalization
- Topic pattern matching
- Retry policy execution
- Subscription management

### Integration Tests
- End-to-end event flow
- Database persistence
- Redis queue operations
- External service integration

### Load Tests
- High-volume event publishing
- Concurrent subscription handling
- Memory and CPU performance
- Network bandwidth utilization

### Chaos Engineering
- Database connection failures
- Redis unavailability
- Handler timeout scenarios
- Network partition simulation

## 10. Security Considerations

### Authentication & Authorization
- Service-to-service authentication via JWT tokens
- Topic-based access control (RBAC)
- Event payload encryption for sensitive data
- Audit trail for all operations

### Data Protection
- Event payload sanitization
- PII detection and masking
- Secure event transmission (TLS)
- Configurable data retention policies

This specification provides a comprehensive foundation for implementing a robust, scalable EventManager that serves as the backbone of DADMS's event-driven architecture. The design emphasizes reliability, observability, and seamless integration with existing DADMS services while maintaining flexibility for future enhancements. 

## 11. Summary & Key Benefits

### Strategic Benefits for DADMS
- **Real-time Intelligence**: Enables the Agent Assistance Service (AAS) to provide proactive, context-aware assistance based on live system events
- **Audit & Compliance**: Complete event trail supports governance requirements and decision traceability
- **Learning & Adaptation**: Event stream feeds machine learning workflows for continuous system improvement
- **Scalable Architecture**: Decoupled, event-driven design supports horizontal scaling and service evolution
- **Developer Productivity**: Clean APIs and comprehensive tooling accelerate feature development

### Technical Advantages
- **Zero Data Loss**: Persistent event store with replay capabilities ensures system resilience
- **Sub-100ms Latency**: Real-time event delivery enables responsive user experiences
- **Flexible Integration**: Multiple API formats (REST, WebSocket, gRPC, GraphQL) support diverse client needs
- **Operational Excellence**: Built-in metrics, monitoring, and debugging tools support production operations

### Implementation Roadmap

#### Phase 1: Core EventManager (Week 1-2)
- [ ] Basic event publishing and subscription
- [ ] PostgreSQL persistence layer
- [ ] REST API endpoints
- [ ] Topic routing and pattern matching
- [ ] Unit and integration tests

#### Phase 2: Reliability & Performance (Week 3-4)
- [ ] Redis queue backend
- [ ] Retry policies and dead letter handling
- [ ] Priority queues and batch processing
- [ ] WebSocket real-time subscriptions
- [ ] Load testing and optimization

#### Phase 3: Advanced Features (Week 5-6)
- [ ] Event replay and debugging tools
- [ ] GraphQL and gRPC APIs
- [ ] Advanced filtering and routing
- [ ] Metrics and monitoring integration
- [ ] Security and authentication

#### Phase 4: DADMS Integration (Week 7-8)
- [ ] Service-by-service event integration
- [ ] Vector store and graph database connectors
- [ ] AAS proactive assistance triggers
- [ ] Learning workflow automation
- [ ] Production deployment and monitoring

### Success Metrics
- **Throughput**: 10,000+ events/second sustained load
- **Reliability**: 99.9% successful event delivery
- **Latency**: P95 < 100ms end-to-end event processing
- **Uptime**: 99.95% service availability
- **Integration**: All 7 core DADMS services publishing/subscribing events

### Alignment with DADMS 2.0 Goals
This EventManager specification directly supports DADMS 2.0's vision of intelligent, proactive decision assistance:

1. **Real-time Decision Intelligence**: Events trigger immediate AAS suggestions and risk alerts
2. **Continuous Learning**: Event streams feed machine learning models for pattern recognition
3. **Audit & Governance**: Complete event trail supports compliance and decision justification
4. **Scalable Architecture**: Event-driven design enables horizontal scaling and service evolution
5. **Developer Experience**: Clean APIs and comprehensive tooling accelerate feature development

The EventManager serves as the nervous system that transforms DADMS from a collection of services into a unified, intelligent decision assistance platform. By implementing this specification, DADMS will achieve the real-time, proactive intelligence that differentiates it from traditional workflow and knowledge management systems.

**Next Steps**: Begin Phase 1 implementation with the Project Service as the first event publisher and the Agent Assistance Service as the primary subscriber, establishing the foundation for DADMS's event-driven intelligence. 