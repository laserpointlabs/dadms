# DADMS 2.0 - AI Development Guidelines

## Project Overview
DADMS 2.0 is a **clean rebuild** of a decision intelligence platform using microservices architecture. This is not legacy code - it's a fresh implementation following modern best practices with comprehensive documentation driving development.

## Architecture Context

### Monorepo Structure
```
dadms-services/          # Microservices (currently empty - Week 1 implementation)
├── user-project/        # Port 3001 - Project lifecycle management
├── knowledge/           # Port 3003 - RAG with Qdrant vector store
├── llm/                # Port 3002 - Multi-provider LLM service
└── shared/             # @dadms/shared - Common types and utilities

dadms-ui/               # React frontend (empty - to be implemented)
dadms-infrastructure/   # Docker setup with PostgreSQL, Qdrant, Redis
```

### Technology Stack
- **Backend**: Node.js 18+ with TypeScript, Express.js
- **Databases**: PostgreSQL (primary), Qdrant (vectors), Redis (cache)
- **Frontend**: React 18 with TypeScript
- **Build**: Turborepo monorepo with workspace packages
- **Infrastructure**: Docker Compose for development

## Critical Workflows

### Development Commands
```bash
# Use Turborepo for all operations
turbo build              # Build all services
turbo dev                # Start development environment
turbo test               # Run all tests

# Week 1 implementation tracking
npm run week1:day1       # Day 1: User/Project Service
npm run week1:day2       # Day 2: Knowledge Service  
npm run week1:day3       # Day 3: LLM Service
npm run week1:day4       # Day 4: UI Foundation
npm run week1:day5       # Day 5: Integration testing
```

### Database Infrastructure
Services use the shared PostgreSQL instance defined in `dadms-infrastructure/docker-compose.yml`. Schema is in `database/init.sql` with clean tables for users, projects, documents, and tasks.

## Project-Specific Patterns

### Service Architecture
- Each service is independent with its own package.json
- All services import from `@dadms/shared` workspace package
- Services communicate through REST APIs (ports 3001-3003)
- Database per service pattern with shared PostgreSQL instance

### Code Organization
```typescript
// Service structure pattern
src/
├── models/           # TypeScript interfaces and data models
├── routes/           # Express route handlers  
├── middleware/       # Custom Express middleware
├── database/         # Database queries and migrations
└── index.ts          # Service entry point
```

### Shared Package Usage
```typescript
// Import patterns from @dadms/shared
import { Project, User, ApiResponse } from '@dadms/shared/types';
import { logger, validateUUID } from '@dadms/shared/utils';
import { API_ROUTES, HTTP_STATUS } from '@dadms/shared/constants';
```

## Development State

### Current Implementation Status
- **Infrastructure**: ✅ Docker setup complete with PostgreSQL, Qdrant, Redis
- **Shared Package**: ✅ TypeScript foundation with basic types
- **Services**: 🔄 Empty folders - Week 1 implementation in progress
- **UI**: 🔄 Empty folder - to be implemented Day 4

### Week 1 Implementation Plan
Follow `docs/development/DADMS_WEEK1_IMPLEMENTATION_PLAN.md` for detailed daily tasks. This is a **clean slate build** - no legacy code to refactor, just implementing from specifications.

## Key Files for Context
- `docs/specifications/DADMS_MVP_SPECIFICATION.md` - Complete service definitions
- `docs/development/DADMS_WEEK1_IMPLEMENTATION_PLAN.md` - Implementation roadmap
- `dadms-infrastructure/database/init.sql` - Database schema
- `turbo.json` - Build configuration and task dependencies
- `.cursorrules` - Existing AI development context

## Integration Points
- All services connect to shared PostgreSQL database
- Knowledge service uses Qdrant for vector embeddings
- LLM service supports multiple providers (OpenAI, Anthropic, local models)
- Redis for caching and session management
- Services will be containerized with health checks

## Testing Strategy
- Jest for unit and integration tests
- Service-level API testing before UI integration
- Database transactions for test isolation
- Turborepo runs tests across all packages

This is a **documentation-driven development** project - all specifications exist, implementation follows the detailed plans in the `docs/` directory.
