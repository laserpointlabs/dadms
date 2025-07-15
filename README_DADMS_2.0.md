# DADMS 2.0 - Decision Analysis and Decision Management System

## Overview
DADMS 2.0 is a complete rewrite of the decision intelligence platform, built with clean architecture and modern best practices.

## Project Structure
```
dadms-services/          # Microservices (clean implementation)
├── user-project/        # User and project management
├── knowledge/           # Document storage and RAG
├── llm/                # LLM integration with tool calling
├── context-manager/     # Personas and context management
└── shared/             # Common utilities and types

dadms-ui/               # React frontend (clean implementation)
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page-level components
│   ├── services/      # API client services
│   └── utils/         # Utility functions

dadms-infrastructure/   # Docker and deployment
├── docker/            # Container definitions
├── database/          # Schema and migrations
└── scripts/           # Deployment and setup scripts
```

## Development Status
🚀 **Current Phase**: Week 1 Foundation Development
- ✅ Clean slate workspace with essential context restored
- ✅ MVP specification and implementation plan available
- ✅ Week 1 Day-by-day development guide ready
- 🔄 Ready to begin Day 1: Project Service implementation

## Getting Started
This is a clean rebuild - no legacy dependencies.

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+

### Quick Start
```bash
# This will be implemented as services are built
npm run dev        # Start development environment
npm test          # Run test suite
npm run build     # Build for production
```

## Architecture Principles
- **Clean Architecture**: Clear separation of concerns
- **API-First**: OpenAPI specifications drive implementation
- **Test-Driven**: Comprehensive test coverage
- **Cloud-Native**: Container-ready deployment
- **Security-First**: Authentication and authorization built-in

## Week 1 Implementation Plan
- [x] Clean branch and project structure
- [x] Restore essential context and specifications
- [ ] Day 1: User/Project Service foundation
- [ ] Day 2: Knowledge Service with RAG
- [ ] Day 3: LLM Service with tool calling
- [ ] Day 4: UI foundation and integration
- [ ] Day 5: Testing and documentation

## Available Specifications
📁 **All documentation is now organized in [docs/](docs/README.md)**

### Core Documentation
- **[MVP Specification](docs/specifications/DADMS_MVP_SPECIFICATION.md)**: Complete MVP architecture and service definitions
- **[Demonstrator Specification](docs/specifications/DADMS_DEMONSTRATOR_SPECIFICATION.md)**: Full system specification with 15 core services

### Development Guides  
- **[Week 1 Implementation Plan](docs/development/DADMS_WEEK1_IMPLEMENTATION_PLAN.md)**: Detailed day-by-day implementation guide
- **[Setup Guide](docs/development/SETUP_GUIDE.md)**: Complete development environment setup
- **[AI Development Guidelines](docs/development/.ai-dev-guidelines.md)**: AI assistant development guidance

### Process Documentation
- **[Release Process](docs/deployment/RELEASE_PROCESS.md)**: CI/CD, testing, and release management
- **[Context Migration Guide](docs/development/DADMS_CONTEXT_MIGRATION_GUIDE.md)**: Context preservation and AI tool integration

📖 **See [docs/README.md](docs/README.md) for complete documentation index**

## Contributing
This is a clean rebuild following modern development practices:
- Feature branch workflow
- Comprehensive testing required
- API documentation mandatory
- Clean, readable code standards
