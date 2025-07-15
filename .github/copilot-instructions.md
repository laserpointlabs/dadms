# DADMS - AI Coding Instructions

## System Architecture Overview

DADMS (Decision Analysis and Decision Management System) is an enterprise decision intelligence platform with a **microservices architecture** implementing the complete decision lifecycle: **Event → Ontology → Data → Models → Simulation → Analysis → Decision → Event**.

### Core Service Architecture (Ports 3001-3025)
- **Context Service** (3001): Context management with personas, tool definitions, and prompt orchestration
- **Tool Service** (3002): Registered tool APIs with schema validation and model templates  
- **Workflow Service** (3003): BPMN workflow orchestration with AI-assisted design
- **AI Oversight Service** (3004): Multi-agent teams with curated personas and moderation
- **Event Bus** (3005): Inter-service communication and event routing
- **Knowledge Service** (3006): RAG-enabled knowledge management with domain integration
- **Requirements Service** (3007): Document processing and constraint extraction
- **Relationship Service** (3008): Impact analysis and knowledge graph management
- **Artifact Service** (3009): Document/diagram storage with context injection
- **Ontology Service** (3010): Domain ontology development and data mapping
- **Data Service** (3011): Real-time, static, and time-series data management
- **Pipeline Service** (3012): Single-shot analysis pipelines (cron/event/on-demand)
- **Model Service** (3013): Model lifecycle management and performance tracking
- **Analysis Service** (3014): Collaborative Jupyter-like analysis environment
- **Task Monitor** (3015): I/O monitoring and efficacy scoring for all tasks
- **LLM Teams** (3016): Multi-agent orchestration with personas and voting protocols
- **Reporting Service** (3017): Executive dashboards, compliance reports, decision analytics
- **Validation Service** (3018): Pre-decision validation, constraint checking, model verification
- **Configuration Service** (3019): Feature flags, environment configs, parameter tuning
- **Notification Service** (3020): Stakeholder alerts, system health, escalation protocols
- **Security Service** (3021): Enterprise authentication, RBAC, audit trails
- **Monitoring Service** (3022): Performance metrics, resource optimization, auto-scaling
- **Integration Service** (3023): ERP/CRM integration, legacy system connectors, API gateway
- **Governance Service** (3024): Approval workflows, decision rollback, lifecycle management
- **User Management** (3025): Multi-tenant user, team, project, and role management

### Primary Data Stores
- **PostgreSQL (Docker)**: Multi-tenant DADMS database with complete hierarchy (Company→Tenant→Team→Project→Decision)
- **Camunda PostgreSQL**: BPMN process instances and execution history
- **Neo4j**: Knowledge graph for relationships, ontologies, and impact analysis
- **Qdrant**: Vector embeddings for RAG and semantic search
- **Artifact Store**: Document/diagram storage with metadata indexing

## Critical Development Patterns

### BPMN Integration with AI Assistant
The comprehensive BPMN modeler (`comprehensive_bpmn_modeler.html`) enables AI-assisted workflow design:
```javascript
// Pattern: AI suggests BPMN nodes based on context analysis
// Integration: BPMN.js + AI overlay for intelligent process design
// Location: ui/comprehensive_bpmn_modeler.html
```

### Knowledge Graph and Ontology Management
Neo4j serves as the backbone for relationship and impact analysis:
```cypher
// Pattern: Ontology-driven node creation with domain mappings
CREATE (decision:Decision {id: $id})-[:IMPACTS]->(requirement:Requirement)
// Relationships: CAUSED_BY, IMPACTS, DEPENDS_ON, CONSTRAINS
```

### Context Management (Beyond Prompts)
Context injection includes personas, tool definitions, and domain knowledge:
```typescript
// services/context-service/src/context-builder.ts
// Injects: persona definitions, tool schemas, ontology mappings, prior decisions
const contextId = '00000000-0000-0000-0000-000000000002'; // Default context tenant
```

### Multi-Agent Team Orchestration
LLM teams with curated personas and voting protocols:
```typescript
// services/llm-teams/src/team-orchestrator.ts
// Roles: analyst, critic, moderator, documentor
// Protocols: consensus, majority vote, weighted expertise
```

### Task I/O Monitoring and Efficacy Scoring
All workflow and pipeline tasks tracked for performance optimization:
```typescript
// services/task-monitor/src/task-tracker.ts
// Captures: input_context, output_context, efficacy_score, critique_data
// Purpose: Prime subsequent iterations with learned context
```

### Probabilistic Decision Approach
Batch processing for probabilistic outcomes rather than single-shot decisions:
```typescript
// Pattern: Run N iterations, cluster responses, provide probability distributions
// Implementation: Batch job manager with statistical aggregation
```

### Tool Schema Integration
```typescript
// services/tool-service/src/schema-validator.ts
// Pattern: Tool registration → Input schema → Model template → Output schema
// LLM tasks must conform to registered tool schemas
```

### External System Integration
```typescript
// services/integration-service/src/connector-framework.ts
// Pattern: Adapter pattern for ERP/CRM/Legacy systems
// Features: Data transformation, authentication, error handling, retry logic
```

### Performance and Monitoring
```typescript
// services/monitoring-service/src/metrics-collector.ts
// Metrics: Response times, throughput, error rates, resource utilization
// Alerting: Threshold-based alerts with escalation protocols
```

## Essential Developer Workflows

### Starting the Complete DADMS System
```bash
# Full system startup with all microservices
docker-compose -f docker/docker-compose.yml up -d
python scripts/start_services.py --all  # Starts all 25 microservices

# BPMN Modeler with AI assistance
# Access: http://localhost:3000/bpmn-modeler
# Features: AI-suggested nodes, process validation, direct deployment
```

### Validation and Governance Operations
```bash
# Decision validation
dadms-validate-decision --decision-id=<uuid> --constraints=requirements.json

# Governance workflow
dadms-deploy-governance --workflow=approval_process.bpmn --stakeholders=team-leads

# Audit trail generation
python scripts/generate_audit_report.py --period=monthly --compliance=sox
```

### Knowledge and Ontology Operations
```bash
# Neo4j graph operations
docker exec dadm-neo4j cypher-shell -u neo4j -p password
MATCH (n:Ontology) RETURN n.domain, n.version;

# RAG vector operations
curl http://localhost:6333/collections  # Qdrant collections
python scripts/rebuild_vector_store.py --domain=engineering
```

### Reporting and Analytics Operations
```bash
# Generate executive dashboard
dadms-generate-report --type=executive --timeframe=quarterly
curl http://localhost:3017/dashboards/executive

# Compliance reporting
dadms-compliance-report --standard=sox --export=pdf
python scripts/audit_trail_export.py --format=csv

# Performance monitoring
curl http://localhost:3022/metrics/system-health
python scripts/performance_analysis.py --service=all
```

### Database Operations
```bash
# Check PostgreSQL health and schema
docker exec dadm-postgres psql -U dadm_user -d dadm_db -c "\dt"

# Check Camunda tables  
docker exec dadm-postgres psql -U camunda -d camunda_db -c "\dt"
```

### Testing Microservices
```bash
# API endpoint testing
curl http://localhost:3001/health  # Individual service health
curl http://localhost:3001/docs    # Swagger documentation

# Full system verification
python scripts/verify_environment.py
```

### Pipeline and Workflow Management
```bash
# Deploy analysis pipeline
dadms-deploy-pipeline --type=single-shot --trigger=cron
dadms-deploy-workflow --bpmn=decision_process.bpmn --ai-validate

# Monitor task efficacy
python scripts/task_monitor.py --analysis-id=<uuid> --show-efficacy
```

### Security and Integration Operations
```bash
# User management and RBAC
dadms-user-create --tenant=<uuid> --role=analyst --team=<uuid>
dadms-permissions-audit --user-id=<uuid>

# External system integration
dadms-integrate-system --type=erp --endpoint=<url> --auth=oauth2
python scripts/legacy_data_sync.py --system=sap --incremental

# Security audit
python scripts/security_audit.py --check-encryption --check-access
dadms-compliance-check --standard=gdpr
```

## Service-Specific Conventions

### Context Service (3001)
- **Beyond Prompts**: Manages personas, tool definitions, domain context injection
- **Context Builder**: `src/context-builder.ts` orchestrates multi-source context assembly
- **Tenant Scoping**: All context tied to Company→Tenant→Team→Project→Decision hierarchy

### Knowledge Service (3006)
- **RAG Implementation**: Flexible domain integration with Qdrant vector store
- **Document Processing**: Requirements extraction with constraint publishing
- **Knowledge Graph**: Neo4j integration for relationship mapping and impact analysis

### Ontology Service (3010)
- **Domain Extraction**: Automated ontology development from core domain knowledge
- **Data Mapping**: External domain data mapped to DADMS ontology
- **Schema Validation**: Ensures data references align with published ontologies

### Pipeline Service (3012)
- **Single-Shot Analysis**: Repetitive tasks (stock quotes, motor analysis, etc.)
- **Triggers**: Cron, event-driven, or on-demand execution
- **Call Activities**: Integration with BPMN workflows as external service tasks

### Analysis Service (3014)
- **Jupyter Integration**: Collaborative analysis environment
- **Artifact Storage**: Results automatically saved to artifact database
- **Context Injection**: Access to full DADMS context for analysis

### Task Monitor (3015)
- **I/O Capture**: Every workflow/pipeline task input and output
- **Efficacy Scoring**: Performance metrics and critique data
- **Iteration Priming**: Use historical performance to improve subsequent runs

### LLM Teams (3016)
- **Multi-Agent Orchestration**: Analyst, critic, moderator, documentor roles
- **Persona Management**: Curated persona definitions per team member
- **Voting Protocols**: Consensus, majority vote, weighted expertise scoring

### Reporting Service (3017)
- **Dashboard Generation**: Executive dashboards with decision outcome analytics
- **Compliance Reports**: Regulatory reporting, audit trails, performance metrics
- **Stakeholder Communication**: Automated reports for decision transparency

### Validation Service (3018)
- **Pre-Decision Validation**: Constraint checking against requirements before execution
- **Model Verification**: Accuracy validation and performance monitoring over time
- **Decision Rollback**: Procedures for reversing decisions and their impacts

### Configuration Service (3019)
- **Feature Flags**: Gradual rollout control and A/B testing capabilities
- **Environment Management**: Dev/staging/prod configuration isolation
- **Parameter Tuning**: Dynamic optimization based on performance metrics

### Governance Service (3024)
- **Approval Workflows**: Multi-stakeholder sign-off processes for critical decisions
- **Decision Lifecycle**: Review cycles, updates, and change management
- **Rollback Procedures**: Systematic approach to reversing failed decisions

## Critical Integration Points

### Event-Driven Decision Lifecycle
Complete event loop implementation:
```typescript
// Event Flow: Event → Ontology → Data → Models → Simulation → Analysis → Decision → Event
// services/event-bus/src/decision-lifecycle.ts
// Events: domain-event-received, ontology-updated, data-mapped, model-executed, analysis-complete
```

### BPMN AI-Assisted Design
```javascript
// comprehensive_bpmn_modeler.html integration patterns
// AI suggests nodes based on: context analysis, domain knowledge, prior decisions
// Real-time validation against ontologies and requirements
```

### Knowledge Graph Integration
```cypher
// Neo4j relationship patterns for impact analysis
MATCH (decision:Decision)-[:IMPACTS*1..3]->(affected)
RETURN decision, collect(affected) as impact_chain
```

### RAG Context Assembly
```typescript
// services/knowledge-service/src/rag-assembler.ts
// Combines: domain knowledge, prior decisions, requirements, artifacts
// Vector similarity + graph traversal for comprehensive context
```

### Probabilistic Decision Processing
```typescript
// services/pipeline-service/src/batch-processor.ts
// Pattern: Execute N iterations → Cluster responses → Probability distributions
// Used for: decision uncertainty, scenario analysis, risk assessment
```

### Decision Rollback and Recovery
```typescript
// services/governance-service/src/decision-rollback.ts
// Pattern: Capture decision state → Impact analysis → Rollback execution → Verification
// Integrates: Event Bus + Neo4j impact chain + Artifact restoration
```

### What-If Analysis and Simulation
```typescript
// services/analysis-service/src/scenario-analyzer.ts
// Pattern: Probabilistic batch jobs → Statistical clustering → Confidence intervals
// Used for: Decision uncertainty modeling, risk assessment, scenario planning
```

### Audit Trail and Compliance
```typescript
// services/security-service/src/audit-trail.ts
// Captures: decision_id, user_id, timestamp, rationale, approvals, changes, impacts
// Compliance: SOX, GDPR, industry-specific regulatory requirements
```

## Common Debugging Commands

```bash
# Service logs
docker logs dadm-postgres -f
tail -f services/knowledge-service/logs/knowledge-service.log

# Database queries
docker exec -it dadm-postgres psql -U dadm_user -d dadm_db
\dt                              # List tables
SELECT * FROM analysis_metadata LIMIT 5;

# Neo4j graph queries
docker exec -it dadm-neo4j cypher-shell -u neo4j -p password
MATCH (n) RETURN labels(n), count(n);

# Qdrant vector store
curl http://localhost:6333/collections
curl http://localhost:6333/collections/knowledge/points/search

# Health check all services
python scripts/check_service_status.py

# Task efficacy analysis
python scripts/task_monitor.py --show-performance --service=all

# BPMN deployment validation
python scripts/validate_bpmn.py --file=workflows/decision_process.bpmn
```

When working on this codebase, always verify service health, check database schema alignment, and use the unified LLM service rather than direct provider integration.

## Critical Architecture Gaps & Requirements

### Missing Core Services
- **Reporting Service** (3017): Executive dashboards, compliance reports, decision analytics
- **Validation Service** (3018): Pre-decision validation, constraint checking, model verification
- **Configuration Service** (3019): Feature flags, environment configs, parameter tuning
- **Notification Service** (3020): Stakeholder alerts, system health, escalation protocols
- **Security Service** (3021): Enterprise authentication, RBAC, audit trails
- **Monitoring Service** (3022): Performance metrics, resource optimization, auto-scaling
- **Integration Service** (3023): ERP/CRM integration, legacy system connectors, API gateway
- **Governance Service** (3024): Approval workflows, decision rollback, lifecycle management

### Key Functional Requirements
```typescript
// Decision Rollback Capability
// services/governance-service/src/rollback-manager.ts
// Pattern: Capture decision state + impact chain + rollback procedures
```

### Non-Functional Requirements
- **Performance SLAs**: <500ms for simple decisions, <5s for complex analysis
- **Availability**: 99.9% uptime for mission-critical decision processes
- **Scalability**: Support 1000+ concurrent users, 10K+ decisions/day
- **Security**: End-to-end encryption, RBAC, SOX/GDPR compliance

### Compliance & Governance Framework
```typescript
// Audit Trail Pattern
// services/security-service/src/audit-logger.ts
// Captures: decision_id, user_id, timestamp, rationale, approvals, changes
```

### Critical Assumptions Requiring Validation
- **Neo4j Scale**: Enterprise knowledge graphs with millions of relationships
- **LLM Costs**: Multi-agent processing budget at enterprise scale
- **Data Quality**: Real-time feeds from legacy systems are reliable
- **User Adoption**: Teams ready for AI-assisted decision transformation
- **Integration Complexity**: Legacy system APIs available and documented
