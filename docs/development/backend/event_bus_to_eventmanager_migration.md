# Event Bus → EventManager Migration Plan

## Executive Summary

**Decision Confirmed**: Replace Event Bus Service with EventManager Service on port 3004 to enable enhanced AAS continuous monitoring and event-driven intelligence.

**Key Benefits**:
- ✅ **AAS Continuous Monitoring**: Real-time WebSocket streams + webhook fallback
- ✅ **Enhanced Reliability**: Retry policies, dead letter queues, event persistence
- ✅ **Better Scalability**: Priority queues, smart filtering, batching
- ✅ **Backward Compatibility**: Supports current AAS webhook integration
- ✅ **Future-Proof**: Extensible architecture for advanced intelligence features

## Current vs. Future State

### Before: Event Bus Service
```
Services → Event Bus (Port 3004) → AAS webhook → Manual filtering
```

### After: EventManager Service  
```
Services → EventManager (Port 3004) → AAS (WebSocket + webhook) → Smart filtering + priority queues
```

## Migration Steps

### Phase 1: EventManager Deployment (Week 1)
```bash
# 1. Deploy EventManager service
cd dadms-services/event-manager
npm install
npm run build
pm2 start npm --name "event-manager" -- run start

# 2. Verify port 3004 availability
pm2 stop event-bus  # Stop old Event Bus
pm2 delete event-bus # Remove old Event Bus

# 3. Test EventManager health
curl http://localhost:3004/health
```

### Phase 2: AAS Integration (Week 1)
```typescript
// 1. Update AAS to connect to EventManager
const aasEventManager = new EventManagerClient('http://localhost:3004');

// 2. Establish universal monitoring subscription
await aasEventManager.subscribe({
  topic: '#',                          // ALL events
  endpoint: 'https://aas-service:3005/events/webhook',
  connection_type: 'webhook',
  filter: {
    priority: 'NORMAL',
    exclude_types: ['system.heartbeat', 'metrics.internal'],
    user_relevant: true
  },
  options: {
    batch_size: 20,
    realtime: true,
    fallback_webhook: 'https://aas-service:3005/events/webhook'
  }
});

// 3. Set up WebSocket for real-time events
const aasWebSocket = await aasEventManager.createRealtimeStream({
  endpoint: 'ws://aas-service:3005/events/realtime',
  filters: {
    priority: ['CRITICAL', 'HIGH'],
    userContext: true,
    projectContext: true
  }
});
```

### Phase 3: Service Migration (Week 2)
Update each DADMS service to use EventManager:

```typescript
// Project Service example
class ProjectService {
  constructor() {
    this.eventManager = new EventManagerClient('http://localhost:3004');
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    const project = await this.repository.create(data);
    
    // Publish to EventManager (enhanced format)
    await this.eventManager.publish({
      type: 'project.created',
      source: 'project-service',
      topic: 'project/created',
      priority: 'HIGH',
      payload: { project },
      metadata: {
        projectId: project.id,
        userId: data.userId,
        tags: ['project', 'user-action']
      }
    });
    
    return project;
  }
}
```

### Phase 4: Advanced Features (Week 3)
```typescript
// 1. Implement smart AAS filtering
const aasSmartFilter = {
  userRelevant: true,
  projectScoped: true,
  minimumPriority: 'NORMAL',
  criticalAlways: true,
  includeTypes: [
    'project.*', 'process.*', 'knowledge.*', 'llm.*',
    'user.action.*', 'system.error.*', 'workflow.*'
  ],
  excludeTypes: ['system.heartbeat', 'metrics.internal', 'log.debug'],
  rateLimitPerMinute: 1000,
  batchingEnabled: true
};

// 2. Enable WebSocket real-time streams
await aasEventManager.setupRealtimeStream('aas-service', {
  priority: ['CRITICAL', 'HIGH'],
  userContext: true,
  projectContext: true,
  compressionEnabled: true
});

// 3. Configure replay capabilities for debugging
await eventManager.replay({
  from_timestamp: '2024-01-15T10:00:00Z',
  to_timestamp: '2024-01-15T11:00:00Z',
  topic_pattern: 'process.*',
  subscriber_ids: ['aas-service']
});
```

## AAS Integration Details

### Universal Event Monitoring
```typescript
// AAS receives ALL events through EventManager
const aasUniversalSubscription = {
  topic: '#',                          // Wildcard for all events
  handler: aasGlobalEventHandler,
  filter: {
    priority: EventPriority.NORMAL,    // Minimum priority
    excludeTypes: ['system.heartbeat', 'metrics.internal'],
    userRelevant: true,                // Only user-relevant events
    projectScoped: true               // Only project-scoped events
  },
  options: {
    batchSize: 20,                     // Efficient batching
    realtime: true,                    // WebSocket delivery
    fallbackWebhook: 'https://aas-service:3005/events/webhook'
  }
};
```

### Real-time Intelligence Feed
```typescript
// WebSocket connection for immediate AAS awareness
const aasRealtimeStream = {
  subscriberId: 'aas-service',
  connectionType: 'websocket',
  endpoint: 'ws://aas-service:3005/events/realtime',
  filters: {
    priority: [EventPriority.CRITICAL, EventPriority.HIGH],
    userContext: true,
    projectContext: true,
    excludeSystemEvents: true
  },
  options: {
    heartbeatInterval: 30000,          // 30 second heartbeat
    reconnectAttempts: 5,
    bufferSize: 100,                   // Buffer during reconnection
    compressionEnabled: true
  }
};
```

### Scalability Optimization
```typescript
// Context-aware filtering to handle growing event volume
const aasContextFilter = {
  includeCritical: true,               // Always include CRITICAL events
  includeUserContext: true,            // Events for current user's context
  includeProjectContext: true,         // Events for user's active projects
  excludeSystemHeartbeat: true,        // Exclude routine system events
  rateLimitPerMinute: 1000,           // Maximum 1000 events/minute to AAS
  smartBatching: true                  // Intelligent batching based on context
};
```

## Deployment Configuration

### Docker Compose Update
```yaml
# Update docker-compose.yml
event-manager:
  build: ./services/event-manager
  ports:
    - "3004:3004"
  environment:
    - NODE_ENV=development
    - DATABASE_URL=postgresql://dadms:password@postgres:5432/dadms_events
    - REDIS_URL=redis://redis:6379
    - VECTOR_STORE_URL=http://qdrant:6333
    - AAS_WEBHOOK_URL=https://aas-service:3005/events/webhook
    - AAS_WEBSOCKET_URL=ws://aas-service:3005/events/realtime
  depends_on:
    - postgres
    - redis
    - qdrant
  volumes:
    - ./services/event-manager:/app
    - /app/node_modules
  restart: unless-stopped
```

### Environment Variables
```bash
# EventManager configuration
EVENT_MANAGER_PORT=3004
EVENT_MANAGER_DATABASE_URL=postgresql://dadms:password@postgres:5432/dadms_events
EVENT_MANAGER_REDIS_URL=redis://redis:6379
EVENT_MANAGER_VECTOR_STORE_URL=http://qdrant:6333

# AAS integration
AAS_SERVICE_URL=https://aas-service:3005
AAS_WEBHOOK_ENDPOINT=/events/webhook
AAS_WEBSOCKET_ENDPOINT=/events/realtime
AAS_REALTIME_ENABLED=true
AAS_BATCH_SIZE=20
AAS_RATE_LIMIT_PER_MINUTE=1000
```

## Testing Strategy

### Unit Tests
```typescript
describe('EventManager AAS Integration', () => {
  test('should deliver all events to AAS universal subscription', async () => {
    const eventManager = new EventManager();
    const aasSubscription = await eventManager.subscribe({
      topic: '#',
      handler: mockAASHandler
    });
    
    // Publish test events
    await eventManager.publish({ type: 'project.created', ... });
    await eventManager.publish({ type: 'process.started', ... });
    
    // Verify AAS received both events
    expect(mockAASHandler).toHaveBeenCalledTimes(2);
  });

  test('should filter events based on AAS criteria', async () => {
    const eventManager = new EventManager();
    await eventManager.subscribe({
      topic: '#',
      handler: mockAASHandler,
      filter: { excludeTypes: ['system.heartbeat'] }
    });
    
    await eventManager.publish({ type: 'system.heartbeat', ... });
    await eventManager.publish({ type: 'user.action', ... });
    
    // Verify only user.action was delivered
    expect(mockAASHandler).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests
```typescript
describe('EventManager to AAS End-to-End', () => {
  test('should establish WebSocket connection with AAS', async () => {
    const eventManager = new EventManager();
    const aasConnection = await eventManager.createRealtimeStream({
      subscriberId: 'aas-service',
      endpoint: 'ws://localhost:3005/events/realtime'
    });
    
    expect(aasConnection.isConnected()).toBe(true);
  });

  test('should handle AAS webhook fallback on WebSocket failure', async () => {
    const eventManager = new EventManager();
    // Simulate WebSocket failure
    await eventManager.simulateWebSocketFailure('aas-service');
    
    await eventManager.publish({ type: 'critical.alert', ... });
    
    // Verify webhook was used as fallback
    expect(mockWebhookDelivery).toHaveBeenCalled();
  });
});
```

### Load Tests
```typescript
describe('EventManager Performance with AAS', () => {
  test('should handle 1000 events/minute to AAS', async () => {
    const eventManager = new EventManager();
    const aasSubscription = await eventManager.subscribe({
      topic: '#',
      handler: mockAASHandler,
      options: { rateLimitPerMinute: 1000 }
    });
    
    // Publish 1000 events rapidly
    const events = Array(1000).fill(0).map(() => ({
      type: 'test.event',
      source: 'test-service',
      topic: 'test',
      payload: {}
    }));
    
    await Promise.all(events.map(event => eventManager.publish(event)));
    
    // Verify all events delivered within rate limit
    expect(mockAASHandler.callCount).toBeLessThanOrEqual(1000);
  });
});
```

## Monitoring & Observability

### Key Metrics to Track
```typescript
const eventManagerMetrics = {
  // AAS-specific metrics
  aasEventsDelivered: Counter,
  aasDeliveryLatency: Histogram,
  aasWebhookFailures: Counter,
  aasWebSocketDisconnections: Counter,
  
  // General metrics
  eventsPublishedTotal: Counter,
  eventsProcessedTotal: Counter,
  activeSubscriptions: Gauge,
  queueDepth: Gauge,
  deadLetterCount: Counter
};
```

### Alerts Configuration
```yaml
# Prometheus alerts for EventManager
alerts:
  - alert: AASEventDeliveryFailure
    expr: rate(aas_webhook_failures[5m]) > 0.1
    for: 2m
    annotations:
      summary: "High AAS event delivery failure rate"
      
  - alert: EventManagerQueueBacklog
    expr: event_manager_queue_depth > 1000
    for: 1m
    annotations:
      summary: "EventManager queue backlog detected"
      
  - alert: AASWebSocketDisconnected
    expr: aas_websocket_connected == 0
    for: 30s
    annotations:
      summary: "AAS WebSocket connection lost"
```

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**:
   ```bash
   pm2 stop event-manager
   pm2 start event-bus
   ```

2. **Service Configuration Rollback**:
   ```typescript
   // Revert services to use old Event Bus API
   const eventBus = new EventBusClient('http://localhost:3004');
   ```

3. **AAS Configuration Rollback**:
   ```typescript
   // Revert AAS to old webhook-only integration
   const aasWebhookUrl = 'https://aas-service:3005/events/webhook';
   ```

## Success Criteria

### ✅ **Migration Complete When**:
1. EventManager running stable on port 3004
2. AAS receiving ALL events via universal subscription
3. WebSocket real-time stream functional for critical events
4. All DADMS services publishing events to EventManager
5. Event delivery latency < 100ms P95
6. Zero data loss during migration
7. AAS proactive assistance functioning normally

### 📊 **Performance Targets**:
- **Event Throughput**: 10,000+ events/second
- **AAS Delivery Latency**: < 100ms P95
- **Event Reliability**: 99.9% successful delivery
- **WebSocket Uptime**: 99.95% connectivity
- **Queue Processing**: < 1 second average processing time

## Post-Migration Enhancements

### Phase 5: Advanced Intelligence (Month 2)
1. **Context-Aware Event Enrichment**: Add user relevance scoring
2. **Predictive Event Filtering**: ML-based relevance prediction for AAS
3. **Advanced Replay Capabilities**: Historical event analysis for insights
4. **Cross-Event Correlation**: Event pattern detection for proactive assistance
5. **Graph-Based Event Relationships**: Event causation tracking

The EventManager is not just a replacement—it's a significant upgrade that transforms DADMS into a truly intelligent, event-driven decision assistance platform with the AAS at its core. 