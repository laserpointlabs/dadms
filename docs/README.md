# DADMS 2.0 Documentation

Welcome to the DADMS 2.0 documentation. This directory contains all project documentation organized by category.

## 📁 Documentation Structure

### 🏗️ Architecture
- **[System Architecture](architecture/README.md)**: Service architecture, data models, and design patterns
- System architecture diagrams
- Service dependency maps
- Data flow documentation
- Technology stack decisions

### 📋 Specifications
- **[MVP Specification](specifications/DADMS_MVP_SPECIFICATION.md)**: Core MVP architecture and service definitions
- **[Demonstrator Specification](specifications/DADMS_DEMONSTRATOR_SPECIFICATION.md)**: Complete 15-service system specification
- Service-specific API specifications (OpenAPI/Swagger)

### 🛠️ Development
- **[Week 1 Implementation Plan](development/DADMS_WEEK1_IMPLEMENTATION_PLAN.md)**: Detailed day-by-day development guide
- **[Development Setup](development/DEVELOPMENT_SETUP.md)**: Repository structure and tooling options  
- **[Setup Guide](development/SETUP_GUIDE.md)**: Complete development environment setup
- **[AI Development Guidelines](development/.ai-dev-guidelines.md)**: AI assistant development guidance
- **[Context Migration Guide](development/DADMS_CONTEXT_MIGRATION_GUIDE.md)**: Context preservation for AI tools
- Code style guides and conventions
- Testing strategies and frameworks

### 🌐 API Documentation
- **[API Overview](api/README.md)**: Service APIs, authentication, and integration guides
- **[Project Service API](development/backend/project_service_api_endpoints.md)**: ✅ **OPERATIONAL** - Complete project lifecycle management API with React UI integration
- **[Model Manager API](api/model_manager_api_endpoints.md)**: Comprehensive model registry API documentation
- **[Simulation Manager API](api/simulation_manager_api_endpoints.md)**: Comprehensive simulation execution and orchestration API
- **[Analysis Manager API](api/analysis_manager_api_endpoints.md)**: Comprehensive intelligent analysis and decision-support API
- **[Parameter Manager API](development/backend/parameter_manager_service_api_endpoints.md)**: Comprehensive parameter lifecycle management and validation API
- **[Requirements Extractor & Conceptualizer API](development/backend/requirements_extractor_service_api_endpoints.md)**: Comprehensive intelligent requirements extraction and conceptual modeling API
- **[Memory Manager API](development/backend/memory_manager_service_api_endpoints.md)**: Comprehensive memory management with categorization, lifecycle intelligence, and semantic retrieval API
- **[Ontology Workspace API](development/backend/ontology_workspace_service_api_endpoints.md)**: Comprehensive visual, collaborative environment for ontology authoring, editing, and validation API
- **[Task Orchestrator API](development/backend/task_orchestrator_service_api_endpoints.md)**: Comprehensive workflow orchestration and task management API for the EDS ecosystem
- **[Decision Analytics API](development/backend/decision_analytics_service_api_endpoints.md)**: Comprehensive decision intelligence engine for decision space analysis, impact assessment, and performance scoring
- **[Error Manager API](development/backend/error_manager_service_api_endpoints.md)**: Comprehensive intelligent error detection, analysis, and autonomous correction API with deep AAS integration
- Service endpoint documentation (OpenAPI specifications)
- Request/response schemas and examples
- Authentication and authorization guides
- Integration examples and SDK usage
- Postman collections

### 🚀 Deployment
- **[Release Process](deployment/RELEASE_PROCESS.md)**: CI/CD, testing, and release management
- **[Infrastructure Guide](deployment/README.md)**: Docker, Kubernetes, monitoring, and operational procedures
- Environment configuration
- Docker and Kubernetes manifests
- Monitoring and observability setup
- Backup and disaster recovery

### 📚 User Documentation
- User guides and tutorials
- Feature documentation
- FAQ and troubleshooting
- Video tutorials and demos

## 🔍 Quick Navigation

### Getting Started
1. [Setup Guide](development/SETUP_GUIDE.md) - Environment setup
2. [Week 1 Plan](development/DADMS_WEEK1_IMPLEMENTATION_PLAN.md) - Start development
3. [MVP Specification](specifications/DADMS_MVP_SPECIFICATION.md) - Understand the architecture

### For Developers
- [AI Development Guidelines](development/.ai-dev-guidelines.md) - AI-assisted development
- [Development Setup](development/DEVELOPMENT_SETUP.md) - Tooling and workflows
- [Release Process](deployment/RELEASE_PROCESS.md) - CI/CD and deployment

### For Architects
- [MVP Specification](specifications/DADMS_MVP_SPECIFICATION.md) - Core system design
- [Demonstrator Specification](specifications/DADMS_DEMONSTRATOR_SPECIFICATION.md) - Full system vision
- Architecture diagrams (coming soon)

## 📖 Documentation Standards

### Writing Guidelines
- Use clear, concise language
- Include code examples where relevant
- Maintain consistent formatting with Prettier
- Update docs with code changes
- Use proper markdown structure

### File Naming Convention
```
docs/
├── category/
│   ├── TITLE_IN_CAPS.md          # Major documents
│   ├── lowercase-with-dashes.md  # Supporting documents
│   └── service-name-api.md       # Service-specific docs
```

### Documentation Review Process
1. Create documentation alongside code changes
2. Include documentation updates in pull requests
3. Review for accuracy and clarity
4. Update navigation and links
5. Validate external references

## 🔄 Maintenance

### Regular Updates
- Review and update quarterly
- Validate all links and references
- Update screenshots and examples
- Archive outdated documentation
- Maintain accuracy with codebase changes

### Contributing to Documentation
1. Follow the established structure
2. Use consistent formatting and style
3. Include relevant examples and diagrams
4. Test all code examples
5. Update the main README and navigation

---

**Current Status**: 📍 Week 1 Foundation Development  
**Last Updated**: July 15, 2025  
**Version**: 2.0.0-alpha.1
