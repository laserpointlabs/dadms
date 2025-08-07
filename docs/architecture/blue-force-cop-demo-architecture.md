# DADMS Blue Force COP Demo - System Architecture Documentation

## 🎯 Architecture Overview

This document provides the complete system architecture documentation for the Blue Force Common Operating Picture (COP) demonstration, following DADMS architecture documentation standards. This represents a significant evolution of the DADMS platform toward semantic interoperability and knowledge-driven integration.

## 📋 Architecture Decision Record

### ADR-003: Ontology-Driven Semantic Integration Architecture

**Status**: Accepted  
**Date**: 2024-12-19  
**Context**: Need to demonstrate revolutionary semantic interoperability capabilities for defense contractors

**Decision**: Implement ontology-driven architecture with AI personas for Blue Force COP demonstration

**Consequences**:
- **Positive**: True semantic interoperability, future-proof integration, knowledge preservation
- **Negative**: Increased complexity, new technology dependencies, extended demo time
- **Neutral**: Requires new Ontology Manager service and enhanced existing services

**Alternatives Considered**:
1. Syntactic integration only (rejected - insufficient differentiation)
2. Rule-based mapping (rejected - not scalable)
3. Machine learning classification (rejected - no semantic understanding)

## 🏗️ System Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'basis' }}}%%
flowchart TB
    subgraph PM_Layer["Program Manager Interface"]
        Dashboard["PM Dashboard<br/>Real-time Monitoring"]
        Controls["Workflow Controls<br/>Feedback Interface"]
        Ontology_View["Ontology Explorer<br/>Semantic Relationships"]
    end

    subgraph Orchestration["Task Orchestration Layer"]
        TaskOrch["Task Orchestrator<br/>Port 3017"]
        WorkflowMgr["Workflow Manager"]
        PersonaCoord["Persona Coordinator"]
    end

    subgraph Personas["Enhanced AI Personas Layer"]
        SA["Standards Analyst<br/>Ontology Extraction"]
        DM["Data Modeler<br/>Semantic Alignment"]
        DPE["Pipeline Engineer<br/>Ontology-Driven Code"]
        UXP["UI/UX Prototyper<br/>Semantic Visualization"]
    end

    subgraph Knowledge_Layer["Knowledge & Ontology Layer"]
        OntMgr["Ontology Manager<br/>Port 3015"]
        BaseOnt["Base Defense<br/>Ontology"]
        Link16Ont["Link-16<br/>Extracted Ontology"]
        VMFOnt["VMF<br/>Extracted Ontology"]
        UnifiedOnt["Unified<br/>Semantic Model"]
    end

    subgraph Services["Enhanced DADMS Services"]
        LLM["LLM Service<br/>Port 3002<br/>Semantic Reasoning"]
        Knowledge["Knowledge Service<br/>Port 3003<br/>Ontology Mining"]
        CodeGen["Code Generator<br/>Port 3018<br/>Semantic Pipelines"]
        Viz["COP Visualization<br/>Port 3019<br/>Ontology-Aware"]
        OntWorkspace["Ontology Workspace<br/>Port 3016<br/>Interactive Modeling"]
    end

    subgraph Data["Data & Storage Layer"]
        PG[(PostgreSQL<br/>Workflow & Metadata)]
        Qdrant[(Qdrant<br/>Semantic Vectors)]
        Redis[(Redis<br/>Real-time State)]
        KnowledgeGraph[(Knowledge Graph<br/>RDF/OWL Store)]
        Artifacts[("Generated Artifacts<br/>Semantic Code")]
    end

    %% PM Interface Connections
    Dashboard --> TaskOrch
    Controls --> TaskOrch
    Ontology_View --> OntMgr

    %% Orchestration Connections
    TaskOrch --> WorkflowMgr
    TaskOrch --> PersonaCoord
    WorkflowMgr --> Redis
    PersonaCoord --> SA
    PersonaCoord --> DM
    PersonaCoord --> DPE
    PersonaCoord --> UXP

    %% Ontology Integration Flow
    SA --> Knowledge
    SA --> OntMgr
    Knowledge --> Link16Ont
    Knowledge --> VMFOnt
    
    OntMgr --> BaseOnt
    Link16Ont --> OntMgr
    VMFOnt --> OntMgr
    OntMgr --> UnifiedOnt
    
    DM --> OntMgr
    DM --> UnifiedOnt
    
    UnifiedOnt --> DPE
    UnifiedOnt --> UXP

    %% Service Connections
    SA --> LLM
    DM --> LLM
    DPE --> LLM
    UXP --> LLM
    
    DPE --> CodeGen
    UXP --> Viz
    OntMgr --> OntWorkspace

    %% Data Layer Connections
    LLM --> Redis
    Knowledge --> Qdrant
    OntMgr --> KnowledgeGraph
    CodeGen --> Artifacts
    Viz --> PG
    TaskOrch --> PG

    %% Enhanced Inter-persona Communication
    SA -.->|"Semantic Models"| DM
    DM -.->|"Unified Ontology"| DPE
    DM -.->|"Semantic Schema"| UXP
    DPE -.->|"Code Artifacts"| UXP

    %% Semantic Feedback Loops
    UnifiedOnt -.->|"Validation"| SA
    Artifacts -.->|"Testing Results"| DM

    %% Styling
    classDef pmStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef orchestratorStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef personaStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef knowledgeStyle fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef serviceStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef dataStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class Dashboard,Controls,Ontology_View pmStyle
    class TaskOrch,WorkflowMgr,PersonaCoord orchestratorStyle
    class SA,DM,DPE,UXP personaStyle
    class OntMgr,BaseOnt,Link16Ont,VMFOnt,UnifiedOnt knowledgeStyle
    class LLM,Knowledge,CodeGen,Viz,OntWorkspace serviceStyle
    class PG,Qdrant,Redis,KnowledgeGraph,Artifacts dataStyle
```

## 🔄 Data Flow Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'basis' }}}%%
flowchart TB
    subgraph Input["Input Standards & Base Knowledge"]
        Link16Doc["Link-16<br/>Technical Specifications"]
        VMFDoc["VMF<br/>Documentation"]
        BaseDefOnt["Base Defense<br/>Ontology"]
    end

    subgraph Analysis["Standards Analysis & Extraction"]
        SA_Parse["Standards Analyst<br/>Document Parsing"]
        SchemaExt["Schema Extraction"]
        OntExtract["Ontology Mining<br/>Concept Extraction"]
        ComplianceAnal["Compliance Analysis"]
    end

    subgraph Ontology["Ontology Integration Layer"]
        OntMgr["Ontology Manager<br/>Semantic Processing"]
        
        subgraph Alignment["Semantic Alignment"]
            ConceptMap["Concept Mapping"]
            ConflictDetect["Conflict Detection"]
            ConflictResolve["Conflict Resolution"]
        end
        
        subgraph Integration["Knowledge Integration"]
            UnifiedCreate["Unified Model Creation"]
            Validation["Ontological Validation"]
            Reasoning["Semantic Reasoning"]
        end
    end

    subgraph Generation["Knowledge-Driven Generation"]
        DM_Align["Data Modeler<br/>Semantic Harmonization"]
        DPE_CodeGen["Pipeline Engineer<br/>Ontology-Driven Code"]
        UXP_Viz["UI Prototyper<br/>Semantic Visualization"]
        
        subgraph Outputs["Generated Artifacts"]
            SemanticParsers["Semantic Parsers"]
            KnowledgePipelines["Knowledge Pipelines"]
            OntologyAwareUI["Ontology-Aware UI"]
            IntegratedOnt["Integrated Ontology"]
        end
    end

    subgraph Validation_Layer["Validation & Testing"]
        SemanticValidation["Semantic Validation"]
        InteropTesting["Interoperability Testing"]
        QualityAssurance["Quality Assurance"]
    end

    %% Data Flow Connections
    Link16Doc --> SA_Parse
    VMFDoc --> SA_Parse
    BaseDefOnt --> OntMgr
    
    SA_Parse --> SchemaExt
    SA_Parse --> OntExtract
    SA_Parse --> ComplianceAnal
    
    SchemaExt --> OntMgr
    OntExtract --> OntMgr
    ComplianceAnal --> OntMgr
    
    OntMgr --> ConceptMap
    ConceptMap --> ConflictDetect
    ConflictDetect --> ConflictResolve
    ConflictResolve --> UnifiedCreate
    UnifiedCreate --> Validation
    Validation --> Reasoning
    
    Reasoning --> DM_Align
    Reasoning --> DPE_CodeGen
    Reasoning --> UXP_Viz
    
    DM_Align --> SemanticParsers
    DPE_CodeGen --> KnowledgePipelines
    UXP_Viz --> OntologyAwareUI
    Reasoning --> IntegratedOnt
    
    SemanticParsers --> SemanticValidation
    KnowledgePipelines --> InteropTesting
    OntologyAwareUI --> QualityAssurance
    IntegratedOnt --> SemanticValidation

    %% Feedback Loops
    SemanticValidation -.->|"Validation Results"| DM_Align
    InteropTesting -.->|"Test Results"| DPE_CodeGen
    QualityAssurance -.->|"Quality Feedback"| UXP_Viz

    %% Styling
    classDef inputStyle fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    classDef analysisStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef ontologyStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef generationStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef validationStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class Link16Doc,VMFDoc,BaseDefOnt inputStyle
    class SA_Parse,SchemaExt,OntExtract,ComplianceAnal analysisStyle
    class OntMgr,ConceptMap,ConflictDetect,ConflictResolve,UnifiedCreate,Validation,Reasoning ontologyStyle
    class DM_Align,DPE_CodeGen,UXP_Viz,SemanticParsers,KnowledgePipelines,OntologyAwareUI,IntegratedOnt generationStyle
    class SemanticValidation,InteropTesting,QualityAssurance validationStyle
```

## 🏢 Infrastructure Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'orthogonal' }}}%%
flowchart TB
    subgraph Development["COP Demo Development Environment"]
        subgraph UI_Layer["User Interface Layer"]
            UI_Container["DADMS UI<br/>React/TypeScript<br/>Port 3000"]
            PM_Dashboard["PM Dashboard<br/>COP Demo Interface"]
        end
        
        subgraph Service_Layer["Microservices Layer"]
            TaskOrch_Service["Task Orchestrator<br/>Node.js/TypeScript<br/>Port 3017"]
            OntMgr_Service["Ontology Manager<br/>Node.js/TypeScript<br/>Port 3015"]
            LLM_Service["LLM Service<br/>Node.js/TypeScript<br/>Port 3002"]
            Knowledge_Service["Knowledge Service<br/>Node.js/TypeScript<br/>Port 3003"]
            CodeGen_Service["Code Generator<br/>Node.js/TypeScript<br/>Port 3018"]
            Viz_Service["COP Visualization<br/>Node.js/TypeScript<br/>Port 3019"]
            OntWorkspace_Service["Ontology Workspace<br/>Node.js/TypeScript<br/>Port 3016"]
        end
        
        subgraph Data_Layer["Data & Storage Layer"]
            PG_Container["PostgreSQL<br/>Workflow & Metadata<br/>Port 5432"]
            Neo4j_Container["Neo4j Main<br/>Memory System<br/>Port 7474/7687"]
            Neo4j_Memory["Neo4j Memory<br/>Secondary Instance<br/>Port 7475/7688"]
            Redis_Container["Redis<br/>Session & Cache<br/>Port 6379"]
            Qdrant_Container["Qdrant<br/>Vector Store<br/>Port 6333"]
            Fuseki_Container["Apache Jena Fuseki<br/>RDF Triple Store<br/>Port 3030"]
        end
        
        subgraph Management["Management & Orchestration"]
            Docker_Compose["Docker Compose<br/>Container Orchestration"]
            PM2["PM2<br/>Process Management"]
            NGINX["NGINX<br/>Reverse Proxy<br/>Port 80/443"]
        end
    end

    %% UI Connections
    NGINX --> UI_Container
    UI_Container --> PM_Dashboard
    PM_Dashboard --> TaskOrch_Service

    %% Service Connections
    TaskOrch_Service --> LLM_Service
    TaskOrch_Service --> OntMgr_Service
    OntMgr_Service --> Knowledge_Service
    OntMgr_Service --> CodeGen_Service
    OntMgr_Service --> Viz_Service
    OntMgr_Service --> OntWorkspace_Service

    %% Data Connections
    TaskOrch_Service --> PG_Container
    TaskOrch_Service --> Redis_Container
    LLM_Service --> Neo4j_Container
    Knowledge_Service --> Qdrant_Container
    OntMgr_Service --> Fuseki_Container
    OntWorkspace_Service --> Neo4j_Memory

    %% Management Connections
    Docker_Compose --> PG_Container
    Docker_Compose --> Neo4j_Container
    Docker_Compose --> Neo4j_Memory
    Docker_Compose --> Redis_Container
    Docker_Compose --> Qdrant_Container
    Docker_Compose --> Fuseki_Container
    
    PM2 --> TaskOrch_Service
    PM2 --> OntMgr_Service
    PM2 --> LLM_Service
    PM2 --> Knowledge_Service
    PM2 --> CodeGen_Service
    PM2 --> Viz_Service
    PM2 --> OntWorkspace_Service

    %% Styling
    classDef uiStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef serviceStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef dataStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef mgmtStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class UI_Container,PM_Dashboard uiStyle
    class TaskOrch_Service,OntMgr_Service,LLM_Service,Knowledge_Service,CodeGen_Service,Viz_Service,OntWorkspace_Service serviceStyle
    class PG_Container,Neo4j_Container,Neo4j_Memory,Redis_Container,Qdrant_Container,Fuseki_Container dataStyle
    class Docker_Compose,PM2,NGINX mgmtStyle
```

## 🎭 AI Persona Interaction Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'basis' }}}%%
flowchart LR
    subgraph Orchestration["Task Orchestration"]
        TaskOrch["Task Orchestrator<br/>Workflow Coordination"]
        PersonaManager["Persona Manager<br/>Lifecycle Management"]
    end

    subgraph Standards_Analyst["Standards Analyst Persona"]
        SA_Parse["Document Parsing"]
        SA_Extract["Schema Extraction"]
        SA_Ontology["Ontology Mining"]
        SA_Compliance["Compliance Analysis"]
    end

    subgraph Data_Modeler["Data Modeler Persona"]
        DM_Align["Ontology Alignment"]
        DM_Conflict["Conflict Resolution"]
        DM_Unify["Unified Model Creation"]
        DM_Validate["Semantic Validation"]
    end

    subgraph Pipeline_Engineer["Pipeline Engineer Persona"]
        PE_Design["Pipeline Design"]
        PE_Generate["Code Generation"]
        PE_Semantic["Semantic Integration"]
        PE_Test["Interoperability Testing"]
    end

    subgraph UX_Prototyper["UI/UX Prototyper Persona"]
        UX_Design["Interface Design"]
        UX_Visualize["Data Visualization"]
        UX_Ontology["Ontology Display"]
        UX_Prototype["Interactive Prototyping"]
    end

    subgraph Shared_Services["Shared AI Services"]
        LLM_Reasoning["LLM Service<br/>Semantic Reasoning"]
        Knowledge_Base["Knowledge Service<br/>Information Retrieval"]
        Memory_System["Memory System<br/>Context Preservation"]
    end

    %% Orchestration to Personas
    TaskOrch --> PersonaManager
    PersonaManager --> SA_Parse
    PersonaManager --> DM_Align
    PersonaManager --> PE_Design
    PersonaManager --> UX_Design

    %% Standards Analyst Flow
    SA_Parse --> SA_Extract
    SA_Extract --> SA_Ontology
    SA_Ontology --> SA_Compliance

    %% Data Modeler Flow
    DM_Align --> DM_Conflict
    DM_Conflict --> DM_Unify
    DM_Unify --> DM_Validate

    %% Pipeline Engineer Flow
    PE_Design --> PE_Generate
    PE_Generate --> PE_Semantic
    PE_Semantic --> PE_Test

    %% UX Prototyper Flow
    UX_Design --> UX_Visualize
    UX_Visualize --> UX_Ontology
    UX_Ontology --> UX_Prototype

    %% Shared Service Connections
    SA_Ontology --> LLM_Reasoning
    DM_Align --> LLM_Reasoning
    PE_Generate --> LLM_Reasoning
    UX_Design --> LLM_Reasoning

    SA_Extract --> Knowledge_Base
    DM_Unify --> Knowledge_Base
    PE_Semantic --> Knowledge_Base
    UX_Ontology --> Knowledge_Base

    SA_Compliance --> Memory_System
    DM_Validate --> Memory_System
    PE_Test --> Memory_System
    UX_Prototype --> Memory_System

    %% Inter-Persona Communication
    SA_Ontology -.->|"Extracted Ontologies"| DM_Align
    DM_Unify -.->|"Unified Semantic Model"| PE_Design
    DM_Unify -.->|"Semantic Schema"| UX_Design
    PE_Generate -.->|"Generated Artifacts"| UX_Visualize

    %% Feedback Loops
    DM_Validate -.->|"Validation Results"| SA_Compliance
    PE_Test -.->|"Test Results"| DM_Conflict
    UX_Prototype -.->|"UI Feedback"| PE_Semantic

    %% Styling
    classDef orchStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef saStyle fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    classDef dmStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef peStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef uxStyle fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef sharedStyle fill:#fff8e1,stroke:#f57f17,stroke-width:2px

    class TaskOrch,PersonaManager orchStyle
    class SA_Parse,SA_Extract,SA_Ontology,SA_Compliance saStyle
    class DM_Align,DM_Conflict,DM_Unify,DM_Validate dmStyle
    class PE_Design,PE_Generate,PE_Semantic,PE_Test peStyle
    class UX_Design,UX_Visualize,UX_Ontology,UX_Prototype uxStyle
    class LLM_Reasoning,Knowledge_Base,Memory_System sharedStyle
```

## 📊 Service Registry & Port Allocation

| Service | Port | Technology | Purpose | Dependencies |
|---------|------|------------|---------|--------------|
| **DADMS UI** | 3000 | React/TypeScript | PM Dashboard & COP Interface | - |
| **LLM Service** | 3002 | Node.js/Express | AI Reasoning & Persona Logic | OpenAI/Claude APIs |
| **Knowledge Service** | 3003 | Node.js/Express | Document Storage & Ontology Mining | Qdrant, PostgreSQL |
| **Ontology Manager** | 3015 | Node.js/Express | Semantic Processing & Alignment | Apache Jena Fuseki |
| **Ontology Workspace** | 3016 | Node.js/Express | Interactive Ontology Development | Neo4j Memory |
| **Task Orchestrator** | 3017 | Node.js/Express | Workflow & Persona Coordination | PostgreSQL, Redis |
| **Code Generator** | 3018 | Node.js/Express | Ontology-Driven Code Generation | - |
| **COP Visualization** | 3019 | Node.js/Express | Tactical Display Generation | PostgreSQL |
| **Apache Jena Fuseki** | 3030 | Java/Jena | RDF Triple Store | - |
| **PostgreSQL** | 5432 | PostgreSQL 15 | Primary Database | - |
| **Redis** | 6379 | Redis 7 | Cache & Session Store | - |
| **Qdrant** | 6333 | Rust/Qdrant | Vector Database | - |
| **Neo4j Main** | 7474/7687 | Neo4j | Graph Database (HTTP/Bolt) | - |
| **Neo4j Memory** | 7475/7688 | Neo4j | Memory System (HTTP/Bolt) | - |

## 🔒 Security Architecture

### Authentication & Authorization
- **OAuth 2.0**: Token-based authentication for all services
- **RBAC**: Role-based access control (PM/Developer/Analyst roles)
- **JWT Tokens**: Stateless session management

### Data Protection
- **Encryption at Rest**: Database encryption for sensitive ontology data
- **Encryption in Transit**: TLS 1.3 for all service communication
- **Sensitive Data Masking**: Classification-aware data protection

### API Security
- **Rate Limiting**: API throttling to prevent abuse
- **Input Validation**: Schema validation for all API endpoints
- **CORS Policy**: Controlled cross-origin resource sharing

### Network Security
- **Firewall Rules**: Port-based access control
- **VPN Access**: Secure remote development access
- **Container Isolation**: Docker network segmentation

## 📈 Performance & Scalability

### Performance Targets
- **Persona Response Time**: < 30 seconds per task
- **Ontology Extraction**: < 3 minutes per standard document
- **Semantic Alignment**: < 2 minutes for 1,000 concepts
- **Code Generation**: < 1 minute for complete pipeline
- **UI Response**: < 500ms for dashboard updates

### Scalability Design
- **Horizontal Scaling**: Stateless service architecture
- **Load Balancing**: NGINX for request distribution
- **Caching Strategy**: Redis for frequently accessed data
- **Database Optimization**: Indexed queries and connection pooling

### Resource Requirements
- **CPU**: 4-8 cores per service instance
- **Memory**: 4-8GB per service (16GB for Ontology Manager)
- **Storage**: SSD for databases, network storage for artifacts
- **Network**: Gigabit ethernet for inter-service communication

## 🔄 Integration Patterns

### Service Communication
- **RESTful APIs**: HTTP/JSON for service-to-service communication
- **WebSocket**: Real-time updates for PM dashboard
- **Message Queues**: Redis pub/sub for event-driven communication
- **Database Access**: Direct database connections for data persistence

### External Integrations
- **LLM Providers**: OpenAI/Claude API integration
- **Document Processing**: PDF/DOCX parsing libraries
- **Ontology Tools**: Apache Jena for RDF/OWL processing
- **Vector Search**: Qdrant for semantic similarity

### Data Integration
- **RDF/OWL**: Semantic data representation
- **JSON-LD**: Linked data serialization
- **GraphQL**: Flexible data querying
- **SPARQL**: Semantic query language

## 📝 Documentation Maintenance

This architecture documentation will be automatically maintained according to [DADMS Architecture Maintenance Rules](../../.cursor/rules/dadms-architecture-maintenance.md):

### Update Triggers
- **Service Changes**: Adding/modifying COP demo services
- **Infrastructure Changes**: Container or port modifications
- **API Changes**: Endpoint or interface modifications
- **Integration Changes**: External service integrations

### Diagram Maintenance
- **System Architecture**: Updated for new services or relationships
- **Data Flow**: Updated for processing changes
- **Infrastructure**: Updated for deployment changes
- **Security**: Updated for security pattern changes

---

**This architecture documentation provides a comprehensive foundation for implementing revolutionary semantic interoperability capabilities through the Blue Force COP demonstration! 🏗️🚀**
