# DADMS Development Tools Configuration

## Monorepo Management

This repository uses modern tooling for efficient monorepo development:

### Tool Options (Choose One)

#### Option 1: Nx (Recommended for TypeScript/Node.js)
```bash
# Install Nx globally
npm install -g nx

# Initialize Nx in existing repo
npx nx@latest init

# Generate services and UI
nx generate @nx/node:application user-project-service --directory=dadms-services/user-project
nx generate @nx/react:application dadms-ui --directory=dadms-ui
```

**Benefits**:
- Intelligent build caching
- Dependency graph visualization
- Incremental testing
- Code generation
- Integrated testing and linting

#### Option 2: Turborepo (Alternative)
```bash
# Install Turborepo
npm install -g turbo

# Add turbo.json configuration
# Provides fast, incremental builds
```

#### Option 3: Lerna + Yarn Workspaces (Traditional)
```bash
# For existing multi-package setups
npm install -g lerna
lerna init
```

### Recommended: Nx Configuration

**Why Nx for DADMS:**
- Excellent TypeScript support
- Built-in Docker integration
- Dependency graph helps with microservices
- Code sharing between UI and services
- Powerful generators for consistent code structure

## Development Environment Setup

### 1. Package Manager: pnpm (Recommended)
```bash
# Install pnpm for faster, space-efficient package management
npm install -g pnpm

# Better than npm/yarn for monorepos
# Shared dependencies, faster installs
```

### 2. Docker Development
```bash
# Docker Compose for local development
# Services, databases, and UI in containers
# Hot reload and live development
```

### 3. VS Code Extensions
- **Nx Console**: Visual interface for Nx commands
- **Thunder Client**: API testing within VS Code
- **Docker**: Container management
- **PostgreSQL**: Database management
- **GitLens**: Enhanced Git integration

## Code Quality & Standards

### ESLint + Prettier Configuration
```json
{
  "extends": ["@nx/react", "@nx/typescript"],
  "rules": {
    "prefer-const": "error",
    "no-unused-vars": "error"
  }
}
```

### Husky + lint-staged (Git Hooks)
```bash
# Pre-commit hooks for code quality
npm install --save-dev husky lint-staged
npx husky install
```

### Testing Strategy
- **Unit Tests**: Jest for all services and UI
- **Integration Tests**: Supertest for API testing
- **E2E Tests**: Playwright for full workflow testing

## Build & Deployment

### Multi-stage Docker Builds
```dockerfile
# Optimized Docker images for each service
# Build caching and minimal production images
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
# Build → Test → Security Scan → Deploy
```

## Workspace Commands

### Development
```bash
# Start all services
nx run-many --target=serve --projects=user-project-service,llm-service,dadms-ui

# Build all
nx run-many --target=build --all

# Test all
nx run-many --target=test --all

# Lint all
nx run-many --target=lint --all
```

### Dependency Management
```bash
# View dependency graph
nx graph

# Check affected projects
nx affected:build

# Run tests only on affected
nx affected:test
```

## Recommended Setup Steps

1. **Initialize Nx** (if chosen)
2. **Setup pnpm** for package management
3. **Configure Docker Compose** for local development
4. **Setup GitHub Actions** for CI/CD
5. **Configure code quality tools** (ESLint, Prettier, Husky)
6. **Setup testing framework** (Jest, Supertest, Playwright)

Would you like me to implement any of these specific configurations?
