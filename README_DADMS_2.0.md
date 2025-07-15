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
- Building core services from scratch
- Clean architecture implementation
- Modern tooling and best practices

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
- [ ] Day 1: User/Project Service
- [ ] Day 2: Knowledge Service with RAG
- [ ] Day 3: LLM Service with tool calling
- [ ] Day 4: UI foundation and integration
- [ ] Day 5: Testing and documentation

## Contributing
This is a clean rebuild following modern development practices:
- Feature branch workflow
- Comprehensive testing required
- API documentation mandatory
- Clean, readable code standards
