# DADMS Development Environment Setup

This document provides instructions for setting up the DADMS 2.0 development environment.

## Prerequisites

### Required Software
- **Node.js 18+** (LTS recommended)
- **pnpm 8+** (package manager)
- **Docker & Docker Compose** (for databases and services)
- **Git** (version control)

### Development Tools (Recommended)
- **VS Code** with extensions:
  - Thunder Client (API testing)
  - Docker
  - PostgreSQL
  - GitLens
  - Prettier
  - ESLint

## Quick Setup

### 1. Install Package Manager
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# This installs dependencies for:
# - Root workspace
# - All services in dadms-services/*
# - UI application in dadms-ui
# - Infrastructure tools
```

### 3. Setup Development Infrastructure
```bash
# Start databases and infrastructure
pnpm run docker:up

# This starts:
# - PostgreSQL (port 5432)
# - Qdrant (port 6333)
# - Redis (port 6379)
# - Camunda (port 8080)
```

### 4. Initialize Database
```bash
# Run database migrations
pnpm run db:migrate

# Seed with sample data (optional)
pnpm run db:seed
```

### 5. Start Development
```bash
# Start all services and UI
pnpm run dev

# Or start individually:
pnpm run services:dev  # All services only
pnpm run ui:dev        # UI only
```

## Development Workflow

### Daily Development
```bash
# Start your day
pnpm run docker:up     # Ensure infrastructure is running
pnpm run dev           # Start all development servers

# Your services will be available at:
# - User/Project Service: http://localhost:3001
# - LLM Service: http://localhost:3002  
# - Knowledge Service: http://localhost:3003
# - UI: http://localhost:3000
```

### Code Quality
```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Type checking
pnpm run type-check

# Run tests
pnpm run test
```

### Database Operations
```bash
# View database logs
pnpm run docker:logs

# Reset all data (careful!)
pnpm run docker:reset

# Access PostgreSQL
docker exec -it dadms-postgres psql -U dadms -d dadms
```

## Monorepo Structure

### Workspace Organization
```
dadms-2.0/
├── dadms-services/           # Backend microservices
│   ├── user-project/        # Port 3001
│   ├── llm/                 # Port 3002
│   ├── knowledge/           # Port 3003
│   ├── context-manager/     # Port 3005
│   └── shared/              # Common utilities
├── dadms-ui/                # React frontend
│   └── src/
├── dadms-infrastructure/    # Docker, DB, deployment
└── docs/                    # Documentation
```

### Package Management
- **Root package.json**: Workspace configuration and scripts
- **Service package.json**: Individual service dependencies
- **Shared dependencies**: Managed at workspace level
- **pnpm workspaces**: Efficient dependency sharing

## Build & Test

### Building
```bash
# Build all projects
pnpm run build

# Build specific workspace
pnpm run services:build
pnpm run ui:build
```

### Testing
```bash
# Run all tests
pnpm run test

# Test specific service
cd dadms-services/user-project
pnpm test

# Run with coverage
pnpm run test:coverage
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000-3010

# Kill conflicting processes
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Reset Docker containers
pnpm run docker:down
docker system prune -f
pnpm run docker:up

# Check container logs
pnpm run docker:logs
```

#### TypeScript Errors
```bash
# Clean and rebuild
pnpm run clean
pnpm install
pnpm run build
```

#### pnpm Issues
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall all dependencies
rm -rf node_modules dadms-*/node_modules
pnpm install
```

### Getting Help

1. **Check Documentation**: Review specification files in `/docs`
2. **Check Logs**: Use `pnpm run docker:logs` for infrastructure
3. **Health Checks**: Use `pnpm run health` for service status
4. **AI Assistant**: Reference `.ai-dev-guidelines.md` for context

## Week 1 Development

### Day-by-Day Setup

#### Day 1: Project Service
```bash
# Create service structure
cd dadms-services
mkdir -p user-project/src/{controllers,services,models,routes}

# Set up development
pnpm run week1:day1
```

#### Day 2: Knowledge Service  
```bash
# Verify Qdrant connection
curl http://localhost:6333/health

# Start knowledge service development
pnpm run week1:day2
```

#### Day 3: LLM Service
```bash
# Set up environment variables for LLM providers
cp .env.example .env
# Edit .env with API keys

pnpm run week1:day3
```

#### Day 4: UI Development
```bash
# Start UI development server
pnpm run ui:dev

pnpm run week1:day4
```

#### Day 5: Integration
```bash
# Run full integration tests
pnpm run test
pnpm run week1:day5
```

## Production Deployment

### Environment Preparation
```bash
# Build production images
docker build -t dadms-ui:latest ./dadms-ui
docker build -t dadms-services:latest ./dadms-services

# Deploy with Docker Compose
docker-compose -f dadms-infrastructure/docker-compose.prod.yml up -d
```

This setup provides a robust, scalable development environment for DADMS 2.0 with modern tooling and best practices.
