# EventManager Architecture Diagrams

This document contains the visual diagrams for the DADMS EventManager service architecture and integration patterns.

## 1. EventManager System Integration

This diagram shows how the EventManager integrates with the overall DADMS ecosystem:

```mermaid
graph TD
    subgraph "DADMS Event-Driven System (EDS)"
        EM["🎯 EventManager<br/>(Port 3004)"]
        
        subgraph "Event Storage"
            PG_Events["📊 PostgreSQL<br/>Event Store"]
            Redis["⚡ Redis<br/>Queue Store"]
            DLQ["💀 Dead Letter<br/>Queue"]
        end
        
        subgraph "Event Processing"
            Validator["✅ Schema<br/>Validator"]
            Router["🔀 Topic<br/>Router"]
            PQ["📋 Priority<br/>Queues"]
            Dispatcher["📤 Event<br/>Dispatcher"]
        end
    end
    
    subgraph "DADMS Services (Publishers & Subscribers)"
        PS["📁 Project<br/>Service"]
        KS["📚 Knowledge<br/>Service"]
        LS["🤖 LLM<br/>Service"]
        AAS["🤝 Agent Assistance<br/>Service"]
        BPMN["⚙️ BPMN<br/>Engine"]
        OS["🔗 Ontology<br/>Service"]
    end
    
    subgraph "Context & Learning"
        VS["🧠 Vector Store<br/>(Qdrant)"]
        GS["🕸️ Graph Store<br/>(Neo4j)"]
        LearningEngine["🎓 Learning<br/>Engine"]
        GameTheory["🎮 Game Theory<br/>Simulator"]
    end
    
    subgraph "External Integrations"
        Webhook["🔗 Webhooks"]
        WebSocket["🌐 WebSocket<br/>Clients"]
        API["🔌 REST API<br/>Clients"]
    end
    
    subgraph "Monitoring & Observability"
        Metrics["📈 Metrics<br/>(Prometheus)"]
        Logs["📝 Logs<br/>(ELK Stack)"]
        Tracing["🔍 Distributed<br/>Tracing"]
    end
    
    %% Event Flow
    PS -->|"project.created"| EM
    KS -->|"document.uploaded"| EM
    LS -->|"llm.request.completed"| EM
    AAS -->|"suggestion.generated"| EM
    BPMN -->|"process.started"| EM
    OS -->|"ontology.updated"| EM
    
    EM --> Validator
    Validator --> Router
    Router --> PQ
    PQ --> Dispatcher
    
    %% Subscription Flow
    Dispatcher -->|"Subscribe to topics"| PS
    Dispatcher -->|"Subscribe to topics"| KS
    Dispatcher -->|"Subscribe to topics"| LS
    Dispatcher -->|"Subscribe to topics"| AAS
    Dispatcher -->|"Subscribe to topics"| BPMN
    Dispatcher -->|"Subscribe to topics"| OS
    
    %% Storage
    EM --> PG_Events
    EM --> Redis
    PQ --> DLQ
    
    %% Context Integration
    EM -->|"All events logged"| VS
    EM -->|"Relationship events"| GS
    EM -->|"Learning triggers"| LearningEngine
    EM -->|"Decision events"| GameTheory
    
    %% External Access
    EM --> Webhook
    EM --> WebSocket
    EM --> API
    
    %% Observability
    EM --> Metrics
    EM --> Logs
    EM --> Tracing
    
    %% Styling
    classDef eventManager fill:#2196f3,stroke:#1976d2,stroke-width:3px,color:#fff
    classDef storage fill:#4caf50,stroke:#388e3c,stroke-width:2px,color:#fff
    classDef processing fill:#ff9800,stroke:#f57c00,stroke-width:2px,color:#fff
    classDef services fill:#9c27b0,stroke:#7b1fa2,stroke-width:2px,color:#fff
    classDef context fill:#e91e63,stroke:#c2185b,stroke-width:2px,color:#fff
    classDef external fill:#607d8b,stroke:#455a64,stroke-width:2px,color:#fff
    classDef monitoring fill:#795548,stroke:#5d4037,stroke-width:2px,color:#fff
    
    class EM eventManager
    class PG_Events,Redis,DLQ storage
    class Validator,Router,PQ,Dispatcher processing
    class PS,KS,LS,AAS,BPMN,OS services
    class VS,GS,LearningEngine,GameTheory context
    class Webhook,WebSocket,API external
    class Metrics,Logs,Tracing monitoring
```

## 2. Event Processing Sequence Flow

This sequence diagram illustrates the complete event lifecycle through the EventManager:

```mermaid
sequenceDiagram
    participant PS as Project Service
    participant EM as EventManager
    participant V as Validator
    participant R as Router
    participant PQ as Priority Queue
    participant D as Dispatcher
    participant PG as PostgreSQL
    participant Redis as Redis Cache
    participant AAS as Agent Assistance
    participant VS as Vector Store
    participant DLQ as Dead Letter Queue
    
    Note over PS,VS: Event Publishing & Processing Flow
    
    PS->>EM: publish(event: EventIn)
    EM->>V: validate(event)
    V->>EM: ValidationResult
    
    alt Event Valid
        EM->>R: route(event)
        R->>R: Match topic patterns
        R->>EM: RoutingResult
        
        EM->>PG: persist(event)
        PG->>EM: persisted
        
        EM->>PQ: enqueue(event, priority)
        PQ->>Redis: store(event)
        Redis->>PQ: stored
        PQ->>EM: queued
        
        EM->>PS: PublishResult(success)
        
        Note over PQ,D: Asynchronous Processing
        
        PQ->>D: dequeue(batch)
        D->>D: Group by subscribers
        
        par Parallel Delivery
            D->>AAS: handleEvent(event)
            AAS->>AAS: Process suggestion
            AAS->>D: HandlerResult(success)
        and
            D->>VS: handleEvent(event)
            VS->>VS: Store in vector index
            VS->>D: HandlerResult(success)
        end
        
        D->>PG: markProcessed(eventId)
        PG->>D: updated
        
    else Event Invalid
        EM->>PS: PublishResult(error)
    end
    
    Note over D,DLQ: Error Handling Flow
    
    alt Handler Failure
        D->>AAS: handleEvent(event)
        AAS->>D: HandlerResult(error, retry=true)
        
        D->>D: Apply retry policy
        D->>Redis: scheduleRetry(event, delay)
        Redis->>D: scheduled
        
        Note over D: Wait for retry delay
        
        D->>AAS: handleEvent(event) [Retry]
        AAS->>D: HandlerResult(error, retry=false)
        
        D->>DLQ: sendToDeadLetter(event, error)
        DLQ->>PG: storeDeadLetter(event)
        PG->>DLQ: stored
        DLQ->>D: dead lettered
    end
    
    Note over PS,VS: Subscription Management Flow
    
    AAS->>EM: subscribe(topic: "project.*", handler)
    EM->>R: addSubscription(pattern, handler)
    R->>R: Register pattern matcher
    R->>EM: subscriptionId
    EM->>AAS: Subscription(id)
    
    Note over EM: Real-time Event Flow
    
    PS->>EM: publish("project.created")
    EM->>R: findSubscribers("project.created")
    R->>EM: [AAS, VectorStore]
    EM->>D: dispatchToSubscribers(event, subscribers)
    
    par Real-time Delivery
        D->>AAS: event notification
        D->>VS: event notification
    end
```

## 3. EventManager API Structure

This diagram shows the EventManager's API layers and client interaction patterns:

```mermaid
graph LR
    subgraph "Client Applications"
        WebApp["🌐 Web UI<br/>React App"]
        Mobile["📱 Mobile App<br/>React Native"]
        CLI["⌨️ CLI Tools<br/>Node.js"]
        ExtSys["🔗 External<br/>Systems"]
    end
    
    subgraph "EventManager API Layer (Port 3004)"
        REST["🔌 REST API<br/>/api/v1"]
        WS["🌐 WebSocket<br/>/ws"]
        GraphQL["📊 GraphQL<br/>/graphql"]
        gRPC["⚡ gRPC<br/>:3004"]
    end
    
    subgraph "Core EventManager"
        EM["🎯 EventManager<br/>Core Engine"]
        
        subgraph "API Handlers"
            HTTP["HTTP Handler"]
            WSHandler["WebSocket Handler"] 
            GQLHandler["GraphQL Handler"]
            RPCHandler["gRPC Handler"]
        end
        
        subgraph "Core Services"
            PubSub["Publish/Subscribe<br/>Manager"]
            TopicMgr["Topic<br/>Manager"]
            SubMgr["Subscription<br/>Manager"]
            EventStore["Event<br/>Store"]
        end
    end
    
    subgraph "Event Operations"
        Pub["📤 Publishing<br/>• Single Event<br/>• Batch Events<br/>• Scheduled Events"]
        Sub["📥 Subscribing<br/>• Topic Patterns<br/>• Event Filters<br/>• WebSocket Streams"]
        Query["🔍 Querying<br/>• Event History<br/>• Topic Browse<br/>• Metrics"]
        Mgmt["⚙️ Management<br/>• Health Checks<br/>• Dead Letters<br/>• Replay Events"]
    end
    
    subgraph "Example API Calls"
        Ex1["POST /events<br/>{ type: 'project.created',<br/>  payload: {...} }"]
        Ex2["GET /topics/project.*/events<br/>?limit=100&since=2024-01-01"]
        Ex3["WS: /ws/subscribe<br/>{ topic: 'llm.*',<br/>  filter: { priority: 'HIGH' } }"]
        Ex4["POST /subscriptions<br/>{ topic: 'knowledge.*',<br/>  webhook: 'https://...' }"]
    end
    
    %% Client Connections
    WebApp -.->|"HTTP/WebSocket"| REST
    WebApp -.->|"Real-time"| WS
    Mobile -.->|"HTTP"| REST
    CLI -.->|"gRPC"| gRPC
    ExtSys -.->|"GraphQL"| GraphQL
    
    %% API to Handlers
    REST --> HTTP
    WS --> WSHandler
    GraphQL --> GQLHandler
    gRPC --> RPCHandler
    
    %% Handlers to Core
    HTTP --> EM
    WSHandler --> EM
    GQLHandler --> EM
    RPCHandler --> EM
    
    %% Core Services
    EM --> PubSub
    EM --> TopicMgr
    EM --> SubMgr
    EM --> EventStore
    
    %% Operations
    PubSub -.-> Pub
    SubMgr -.-> Sub
    EventStore -.-> Query
    EM -.-> Mgmt
    
    %% Examples
    Pub -.-> Ex1
    Query -.-> Ex2
    Sub -.-> Ex3
    Sub -.-> Ex4
    
    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef api fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef core fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef handler fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef service fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef operation fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef example fill:#fafafa,stroke:#616161,stroke-width:1px
    
    class WebApp,Mobile,CLI,ExtSys client
    class REST,WS,GraphQL,gRPC api
    class EM core
    class HTTP,WSHandler,GQLHandler,RPCHandler handler
    class PubSub,TopicMgr,SubMgr,EventStore service
    class Pub,Sub,Query,Mgmt operation
    class Ex1,Ex2,Ex3,Ex4 example
```

## Diagram References

These diagrams are referenced in:
- [EventManager Service Specification](./event_manager_specification.md)
- [DADMS Architecture Overview](./DADMS_ARCHITECTURE_OVERVIEW.md)

## Usage Notes

1. **System Integration Diagram**: Use this to understand how EventManager fits into the overall DADMS ecosystem
2. **Sequence Flow Diagram**: Reference this for understanding the event processing lifecycle and error handling
3. **API Structure Diagram**: Use this for client integration planning and API development

All diagrams are designed to be updated as the EventManager implementation evolves through the planned phases. 