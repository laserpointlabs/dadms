# DADMS 2.0 Deployment Documentation

This directory contains deployment guides, infrastructure configuration, and operational procedures for DADMS 2.0.

## Deployment Environments

### Development Environment
- **Purpose**: Local development and testing
- **Infrastructure**: Docker Compose
- **Configuration**: `.env.development`
- **Setup**: See `../development/SETUP_GUIDE.md`

### Staging Environment  
- **Purpose**: Pre-production testing and validation
- **Infrastructure**: Kubernetes cluster (staging)
- **Configuration**: `.env.staging`
- **Database**: Isolated staging data

### Production Environment
- **Purpose**: Live system serving users
- **Infrastructure**: Kubernetes cluster (production)
- **Configuration**: `.env.production`
- **Database**: Production PostgreSQL with backups

## Infrastructure Components

### Container Images
```yaml
Services:
  - dadms-user-project:latest
  - dadms-knowledge:latest  
  - dadms-llm:latest
  - dadms-ui:latest

Databases:
  - postgres:15-alpine
  - qdrant/qdrant:latest
  - redis:7-alpine
```

### Network Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'orthogonal' }}}%%
flowchart TD
    subgraph External["External"]
        Internet["Internet<br/>Users & APIs"]
    end
    
    subgraph Infrastructure["Infrastructure Layer"]
        LoadBalancer["Load Balancer<br/>Traefik/Nginx"]
        APIGateway["API Gateway<br/>Service Mesh"]
    end
    
    subgraph Services["Service Layer"]
        UI["React UI<br/>(Port 3000)"]
        ProjectService["Project Service<br/>(Port 3001)"]
        LLMService["LLM Service<br/>(Port 3002)"]
        KnowledgeService["Knowledge Service<br/>(Port 3003)"]
        EventManager["EventManager<br/>(Port 3004)"]
        ModelManager["Model Manager<br/>(Port 3010)"]
    end
    
    subgraph Storage["Database Layer"]
        PostgreSQL["PostgreSQL<br/>Primary Database"]
        Qdrant["Qdrant<br/>Vector Store"]
        Redis["Redis<br/>Cache & Queues"]
        MinIO["MinIO<br/>Object Storage"]
        Neo4j["Neo4j<br/>Graph Database"]
    end
    
    Internet --> LoadBalancer
    LoadBalancer --> APIGateway
    
    APIGateway --> UI
    APIGateway --> ProjectService
    APIGateway --> LLMService
    APIGateway --> KnowledgeService
    APIGateway --> EventManager
    APIGateway --> ModelManager
    
    ProjectService --> PostgreSQL
    LLMService --> PostgreSQL
    KnowledgeService --> PostgreSQL
    KnowledgeService --> Qdrant
    KnowledgeService --> MinIO
    EventManager --> PostgreSQL
    EventManager --> Redis
    ModelManager --> PostgreSQL
    ModelManager --> MinIO
    ModelManager --> Neo4j
    
    classDef external fill:#ffebee,stroke:#d32f2f,stroke-width:2px;
    classDef infra fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef service fill:#e8f5e8,stroke:#388e3c,stroke-width:2px;
    classDef storage fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    
    class Internet external;
    class LoadBalancer,APIGateway infra;
    class UI,ProjectService,LLMService,KnowledgeService,EventManager,ModelManager service;
    class PostgreSQL,Qdrant,Redis,MinIO,Neo4j storage;
```

### Storage Requirements
- **PostgreSQL**: 10GB initial, auto-scaling
- **Qdrant**: 5GB initial for embeddings
- **Redis**: 1GB for caching
- **Logs**: 2GB retention (7 days)

## Deployment Procedures

### Docker Compose (Development)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Kubernetes (Staging/Production)
```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=dadms

# View service logs
kubectl logs -l app=dadms-user-project
```

## Configuration Management

### Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/dadms
REDIS_URL=redis://host:6379
QDRANT_URL=http://host:6333

# Service Configuration  
NODE_ENV=development|staging|production
PORT=3001
LOG_LEVEL=info|debug|error

# External APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=ant-...

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### Secrets Management
- **Development**: `.env` files (not committed)
- **Staging/Production**: Kubernetes secrets or cloud key vault
- **Rotation**: Quarterly secret rotation policy

## Monitoring and Observability

### Health Checks
```typescript
// Each service exposes health endpoint
GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Logging
- **Format**: Structured JSON logs
- **Level**: Configurable (info/debug/error)
- **Aggregation**: Centralized log collection
- **Retention**: 7 days development, 30 days production

### Metrics
- **Response Time**: API endpoint performance
- **Error Rate**: 4xx/5xx responses per service
- **Throughput**: Requests per minute
- **Resource Usage**: CPU, memory, disk

### Alerting
- **Service Down**: Any service unhealthy > 2 minutes
- **High Error Rate**: > 5% errors in 5 minutes
- **Response Time**: > 1 second average in 5 minutes
- **Resource Usage**: > 80% CPU/memory for 10 minutes

## Backup and Recovery

### Database Backups
- **Frequency**: Daily automated backups
- **Retention**: 30 days
- **Testing**: Monthly restore validation
- **Location**: Cloud storage with encryption

### Disaster Recovery
- **RTO**: 4 hours (Recovery Time Objective)
- **RPO**: 1 hour (Recovery Point Objective)  
- **Procedure**: Documented runbook for full system restore
- **Testing**: Quarterly DR drills

## Security Considerations

### Network Security
- **TLS**: All external traffic encrypted
- **VPC**: Services in private networks
- **Firewall**: Minimal port exposure
- **WAF**: Web Application Firewall for UI

### Access Control
- **SSH**: Key-based authentication only
- **Kubectl**: RBAC for Kubernetes access
- **Database**: Principle of least privilege
- **Secrets**: No plaintext secrets in configs

### Compliance
- **Data Privacy**: GDPR/CCPA considerations
- **Audit Logs**: User action tracking
- **Encryption**: Data at rest and in transit
- **Vulnerability Scanning**: Regular security scans

## Documentation Contents

### Infrastructure as Code
- [ ] **docker-compose.yml**: Development environment
- [ ] **k8s/**: Kubernetes manifests for staging/production
- [ ] **Dockerfile**: Multi-stage builds for each service
- [ ] **nginx.conf**: Reverse proxy configuration

### Runbooks
- [ ] **Deployment Checklist**: Step-by-step deployment
- [ ] **Rollback Procedure**: How to revert deployments
- [ ] **Incident Response**: Emergency procedures
- [ ] **Maintenance Windows**: Planned downtime procedures

### Monitoring Setup
- [ ] **Prometheus Config**: Metrics collection
- [ ] **Grafana Dashboards**: System observability
- [ ] **Alert Rules**: Notification thresholds
- [ ] **Log Aggregation**: Centralized logging setup

---

*Deployment documentation will be expanded with actual configurations as the infrastructure is implemented.*
