# DADMS 2.0 – Architecture Overview

```mermaid
%%{init: { 'flowchart': { 'curve': 'orthogonal' }}}%%
flowchart TD
    subgraph PM2["pm2-managed (Node.js)"]
      UI["Modern React UI (TypeScript)"]
      ProjectService["Project Service"]
      KnowledgeService["Knowledge Service"]
      OntologyService["Ontology Builder Service"]
      LLMService["LLM Service"]
      AAS["Agent Assistance Service (AAS)"]
      API["API Gateway / Backend for Frontend"]
      TaskOrchestrator["Task Orchestrator (TEM)"]
      EventBus["Event Bus / Orchestration"]
      EventLog["Event Logging / Audit Service"]
    end

    subgraph External["External / Containerized (DADMS)"]
      Traefik["Traefik / Nginx (Reverse Proxy)"]
      MessageBroker["Message Broker (Kafka/RabbitMQ/NATS)"]
      BPMN["BPMN Engine (Camunda)"]
      VectorDB["Qdrant (Vector Store)"]
      GraphDB["Neo4j (Graph DB)"]
      Postgres["PostgreSQL (Primary DB)"]
      MinIO["MinIO (Object Store)"]
      Fuseki["Apache Jena Fuseki (RDF Store)"]
      Ollama["Ollama / LLM Server"]
    end

    subgraph Cloud["External Cloud LLM Providers"]
      OpenAI["OpenAI (GPT-4, etc.)"]
      Claude["Claude (Anthropic)"]
      OtherCloudLLM["Other Cloud LLMs"]
    end

    UI --> API
    API --> ProjectService
    API --> KnowledgeService
    API --> OntologyService
    API --> LLMService
    API --> AAS
    API --> TaskOrchestrator
    API --> EventBus
    API --> BPMN
    Traefik --> API
    Traefik --> UI
    EventBus --> MessageBroker
    MessageBroker --> EventBus
    ProjectService --> Postgres
    KnowledgeService --> Postgres
    KnowledgeService --> MinIO
    KnowledgeService --> VectorDB
    KnowledgeService --> GraphDB
    OntologyService --> Postgres
    OntologyService --> VectorDB
    OntologyService --> GraphDB
    OntologyService --> Fuseki
    OntologyService --> KnowledgeService
    OntologyService --> LLMService
    LLMService --> VectorDB
    LLMService --> AAS
    LLMService --> Ollama
    LLMService --> OpenAI
    LLMService --> Claude
    LLMService --> OtherCloudLLM
    TaskOrchestrator --> Ollama
    TaskOrchestrator --> OpenAI
    TaskOrchestrator --> Claude
    TaskOrchestrator --> OtherCloudLLM
    AAS --> VectorDB
    AAS --> GraphDB
    BPMN --> Postgres
    BPMN --> TaskOrchestrator
    BPMN --> EventBus
    BPMN --> AAS
    TaskOrchestrator --> ProjectService
    TaskOrchestrator --> KnowledgeService
    TaskOrchestrator --> OntologyService
    TaskOrchestrator --> LLMService
    TaskOrchestrator --> AAS
    TaskOrchestrator --> VectorDB
    TaskOrchestrator --> GraphDB
    TaskOrchestrator --> MinIO
    TaskOrchestrator --> EventBus
    TaskOrchestrator --> EventLog
    EventBus --> EventLog
    EventBus --> AAS
    EventLog --> AAS
    EventBus --> Postgres
    EventLog --> Postgres
    EventBus --> KnowledgeService
    EventBus --> OntologyService
    EventBus --> ProjectService
    EventBus --> LLMService
    MinIO -.-> VectorDB
    MinIO -.-> KnowledgeService

    classDef pm2 fill:#e0f7fa,stroke:#00796b,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px;
    classDef cloud fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    class UI,ProjectService,KnowledgeService,OntologyService,LLMService,AAS,API,TaskOrchestrator,EventBus,EventLog pm2;
    class BPMN,VectorDB,GraphDB,Postgres,MinIO,Fuseki,Traefik,MessageBroker,Ollama external;
    class OpenAI,Claude,OtherCloudLLM cloud;
```

## Overview

This diagram illustrates the high-level architecture of DADMS 2.0:
- **pm2-managed (blue):** Node.js-based services typically managed by pm2 in local/dev environments.
- **External/Containerized (purple):** Databases, BPMN engine, object stores, RDF store (Apache Jena Fuseki), reverse proxy (Traefik/Nginx), message brokers, and LLM servers (Ollama, etc.) managed outside pm2 (e.g., via Docker Compose, Kubernetes).
- **External Cloud (orange):** Cloud-based LLM providers such as OpenAI, Claude, and others, accessed via API for advanced AI capabilities.
- **Task Orchestrator (TEM):** The core backend service that receives tasks from the BPMN Engine, determines and invokes the appropriate microservice/LLM/tool (local or cloud), manages context/results, and emits events to the Event Bus. It is the critical link between BPMN execution and the rest of the system.
- **Event Bus & Event Log:** The Event Bus handles orchestration and automation, while the Event Log provides audit and traceability. Both are watched by the AAS for oversight and user assistance.
- **AAS Oversight:** The AAS observes all major services, the event bus, and the event log, providing real-time feedback, risk alerts, and recommendations to users.
- **Reverse Proxy:** Traefik or Nginx routes external traffic to the API and UI.
- **Message Broker:** Kafka, RabbitMQ, or NATS can be used for scalable, decoupled event/message handling.
- **RDF Store (Apache Jena Fuseki):** Semantic web triple store for ontology storage, SPARQL queries, and RDF data management.
- **LLM Server (Ollama, etc.):** Pluggable local or remote LLM providers for AI-powered features and orchestration.

**Current Services:**
- **Ontology Builder Service:** For probabilistic extraction, management, and integration of ontologies across domains and projects using LLM teams.

**Future Services (Planned for Extensibility):**
- **Data Management Service:** For connecting, mapping, and synchronizing external, live, or historical datasets.
- **Requirements & Conceptualization Service:** For extracting requirements, constraints, and conceptual models from project documents.
- **Event Management Service:** For advanced event capture, logging, and reaction (beyond the core event bus/log).
- **Modeling & Analysis Service:** For flexible modeling, simulation, optimization, and analytics (e.g., JupyterLab/Hub integration).
- **Other Specialized Services:** As DADMS evolves, additional services may be added for advanced knowledge management, compliance, collaboration, and automation.

**Legend:**
- <span style="background:#e0f7fa; color:#00796b; padding:2px 6px; border-radius:3px;">pm2-managed (Node.js)</span>
- <span style="background:#f3e5f5; color:#6a1b9a; padding:2px 6px; border-radius:3px;">External / Containerized (DADMS)</span>
- <span style="background:#fff3e0; color:#ef6c00; padding:2px 6px; border-radius:3px;">External Cloud LLM Providers</span>

This is a living document—details and relationships will be expanded as the system evolves. 