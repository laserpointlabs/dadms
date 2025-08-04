# DADMS Release Process & Lifecycle Management

## Release Strategy

### Semantic Versioning
```
MAJOR.MINOR.PATCH (e.g., 2.1.3)
- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible
```

### Release Branches
```
main              # Production releases
develop           # Integration branch
feature/*         # Feature development
release/*         # Release preparation
hotfix/*          # Emergency fixes
```

## Development Workflow

### Feature Development
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/user-project-service

# Development work
# ... implement, test, document

# Ready for review
git push origin feature/user-project-service
# Create Pull Request to develop
```

### Release Preparation
```bash
# Start release branch
git checkout develop
git checkout -b release/2.1.0

# MANDATORY: Backup MCP Memory before release
./dadms-start.sh backup
echo "Memory backup completed: $(ls -la backups/mcp-memory/mcp-memory-backup-*.cypher.gz | tail -1)"

# Version bump, changelog, final testing
npm version minor
git commit -am "Release 2.1.0"

# Merge to main and develop
git checkout main
git merge release/2.1.0
git tag v2.1.0

git checkout develop  
git merge release/2.1.0
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: DADMS CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - run: npm run lint:all
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build:all
      - run: docker build -t dadms:${{ github.sha }} .
      
  deploy:
    needs: [test, build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to production"
```

### Quality Gates
1. **All tests pass** (unit, integration, e2e)
2. **Code coverage** >= 80%
3. **Security scan** passes
4. **Performance benchmarks** meet criteria
5. **Documentation** updated

## Testing Strategy

### Test Pyramid
```
E2E Tests (Few)
├── Critical user journeys
├── Cross-service integration
└── UI workflow validation

Integration Tests (Some)  
├── API endpoint testing
├── Database operations
└── Service communication

Unit Tests (Many)
├── Business logic
├── Utility functions
└── Component behavior
```

### Test Commands
```bash
# Run all tests
npm run test:all

# Test specific service
npm run test:user-project

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Memory Management

### MCP Neo4j Memory Backup
The DADMS system uses Neo4j Memory for storing AI development context, architectural decisions, and problem-solution patterns. **Memory backup is MANDATORY before any release.**

### Structured Memory Organization
The DADMS memory system uses a hierarchical structure to ensure all development knowledge is properly organized and connected:

#### **Memory Hierarchy**
```
DADMS_Development (Root)
├── DADMS_Infrastructure_Development
│   ├── Neo4j_Memory_Startup_Fix
│   ├── Docker_Compose_Neo4j_Configuration
│   └── DADMS_Startup_Script_Improvements
├── DADMS_Backend_Development
│   ├── API_Design_Patterns
│   ├── Database_Integration_Patterns
│   └── Service_Communication_Patterns
├── DADMS_UI_Development
│   ├── Component_Architecture
│   ├── State_Management_Patterns
│   └── UI_Design_Standards
├── DADMS_Memory_System
│   ├── DADMS_Cursor_Configuration_Backup
│   ├── Memory_Backup_Procedures
│   └── AI_Context_Preservation
└── DADMS_Release_Management
    ├── DADMS_Release_Process_Memory_Backup
    ├── Release_Automation_Standards
    └── Version_Control_Procedures
```

#### **Memory Organization Rules**
- **Categorization**: All memories must be categorized by development area
- **Relationships**: Use appropriate relationship types (belongs_to, implements, enables, etc.)
- **Naming Convention**: `DADMS_Category_Specific_Topic`
- **Connection**: All memories should connect to the root DADMS_Development node
- **Context Preservation**: Maintain relationships between problems and solutions

#### Pre-Release Memory Backup
```bash
# Backup MCP Memory before release
./dadms-start.sh backup

# Verify backup was created
ls -la backups/mcp-memory/mcp-memory-backup-*.cypher.gz

# Check backup integrity
./scripts/backup-memory.sh verify
```

#### Memory Backup Best Practices
- **Frequency**: Before every release, major changes, or system updates
- **Location**: `backups/mcp-memory/` directory
- **Format**: Compressed Cypher export (`.cypher.gz`)
- **Naming**: `mcp-memory-backup-YYYYMMDD_HHMMSS.cypher.gz`
- **Verification**: Always verify backup integrity before proceeding

#### Memory Restoration (if needed)
```bash
# Restore from specific backup
./dadms-start.sh restore mcp-memory-backup-20250731_222550.cypher.gz

# Restore latest backup
./dadms-start.sh restore latest
```

#### Memory Health Check
```bash
# Check memory server status
./dadms-start.sh memory

# Run memory diagnostics
./scripts/dev/container-diagnostic.sh
```

### Memory Backup Checklist
- [ ] **Memory server running**: `./dadms-start.sh memory`
- [ ] **Backup created**: `./dadms-start.sh backup`
- [ ] **Backup verified**: Check file size and timestamp
- [ ] **Backup location**: `backups/mcp-memory/` directory
- [ ] **Backup naming**: Follows timestamp format
- [ ] **Memory integrity**: No corruption errors in backup

## Environment Management

### Environment Stages
1. **Development** (local)
   - Docker Compose
   - Hot reload
   - Debug logging

2. **Staging** (pre-production)
   - Production-like data
   - Performance testing
   - User acceptance testing

3. **Production** (live)
   - Monitoring and alerting
   - Backup and recovery
   - Load balancing

### Configuration Management
```typescript
// Environment-specific configs
interface Config {
  database: {
    url: string;
    ssl: boolean;
  };
  llm: {
    providers: {
      openai: { apiKey: string };
      anthropic: { apiKey: string };
    };
  };
  redis: {
    url: string;
  };
}

// Load from environment variables
const config = loadConfig(process.env.NODE_ENV);
```

## Release Checklist

### Pre-Release
- [ ] All planned features implemented
- [ ] Test suite passes (unit, integration, e2e)
- [ ] Security vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] **Memory backup completed** (MCP Neo4j Memory)
- [ ] Backup and rollback plan ready

### Release
- [ ] Version numbers updated
- [ ] Changelog generated
- [ ] Release notes written
- [ ] Docker images built and tagged
- [ ] Database migrations applied
- [ ] Services deployed
- [ ] Health checks passing
- [ ] Monitoring alerts configured

### Post-Release
- [ ] Production monitoring active
- [ ] Error rates within normal range
- [ ] Performance metrics acceptable
- [ ] User feedback collected
- [ ] **Memory backup verified** (confirm backup integrity)
- [ ] Hotfix plan ready if needed

## Monitoring & Observability

### Key Metrics
```typescript
// Service health metrics
interface ServiceMetrics {
  responseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
}

// Business metrics
interface BusinessMetrics {
  activeProjects: number;
  documentsProcessed: number;
  workflowsExecuted: number;
  userSatisfaction: number;
}
```

### Alerting Rules
- **Critical**: Service down, database connection lost
- **Warning**: High error rate, slow response times
- **Info**: High usage, unusual patterns

## Documentation Requirements

### Release Documentation
1. **Release Notes**
   - New features
   - Bug fixes
   - Breaking changes
   - Migration guide

2. **API Documentation**
   - OpenAPI specs
   - Example requests/responses
   - Authentication guide

3. **Deployment Guide**
   - Infrastructure requirements
   - Configuration parameters
   - Troubleshooting guide

4. **User Documentation**
   - Feature guides
   - Tutorials
   - FAQ

## Rollback Procedures

### Database Rollback
```sql
-- Prepared rollback migrations
-- Version-specific rollback scripts
-- Data backup verification
```

### Service Rollback
```bash
# Container rollback
docker service update --image dadms:previous-version service-name

# Traffic rollback
# Blue-green deployment switch
# Canary rollback
```

### Memory Rollback (if needed)
```bash
# Restore memory from pre-release backup
./dadms-start.sh restore mcp-memory-backup-YYYYMMDD_HHMMSS.cypher.gz

# Verify memory restoration
./dadms-start.sh memory
```

## Security & Compliance

### Security Scanning
- **Dependencies**: npm audit, Snyk
- **Code**: SonarQube, CodeQL
- **Containers**: Trivy, Clair
- **Infrastructure**: Terraform security scan

### Compliance Requirements
- **Data Protection**: GDPR, CCPA compliance
- **Audit Logging**: All user actions logged
- **Access Control**: Role-based permissions
- **Encryption**: Data in transit and at rest

## Week 1 Release Planning

### Alpha Release (End of Week 1)
- **Version**: 2.0.0-alpha.1
- **Scope**: Core services (Project, Knowledge, LLM)
- **Audience**: Internal testing only
- **Goals**: Validate architecture, basic functionality

### Beta Release (End of Week 2)
- **Version**: 2.0.0-beta.1  
- **Scope**: UI integration, workflow engine
- **Audience**: Selected users for feedback
- **Goals**: End-to-end workflow validation

### Production Release (End of Week 4)
- **Version**: 2.0.0
- **Scope**: Full MVP with documentation
- **Audience**: General availability
- **Goals**: Complete demonstrator platform

This process ensures quality, reliability, and smooth deployments for DADMS 2.0.
