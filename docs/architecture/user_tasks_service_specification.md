# User Tasks Service Specification

## Overview

The User Tasks Service provides a comprehensive interface for managing manual user tasks from BPMN processes executed in Camunda. This service acts as a bridge between the DADMS UI and Camunda's user task management capabilities, offering a clean, consistent API for task operations.

## Service Architecture

### Service Details
- **Service Name**: User Tasks Service
- **Port**: 3022 (allocated in DADMS port scheme)
- **Technology Stack**: Node.js/Express with TypeScript
- **Database**: PostgreSQL for task metadata, Camunda for process state
- **Integration**: Camunda REST API for task operations

### Core Responsibilities

1. **Task Discovery**: Retrieve user tasks from Camunda process instances
2. **Task Management**: Handle task claiming, completion, and variable management
3. **Task Filtering**: Provide advanced filtering and search capabilities
4. **Task Statistics**: Generate task counts and analytics
5. **Real-time Updates**: WebSocket integration for live task updates
6. **User Context**: Manage user-specific task views and assignments

## Data Model

### UserTask Entity
```typescript
interface UserTask {
    id: string;                    // Camunda task ID
    name: string;                  // Task name from BPMN
    description?: string;          // Task description
    processInstanceId: string;     // Associated process instance
    processDefinitionKey: string;  // Process definition identifier
    processDefinitionName?: string; // Human-readable process name
    businessKey?: string;          // Business context identifier
    assignee?: string;             // Assigned user ID
    created: string;               // ISO timestamp
    due?: string;                  // Optional due date
    priority: number;              // Task priority (1-3)
    formKey?: string;              // Associated form identifier
    variables?: Record<string, any>; // Task variables
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}
```

### TaskFilter Entity
```typescript
interface TaskFilter {
    status?: string;
    priority?: string;
    assignee?: string;
    processDefinition?: string;
    businessKey?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    createdFrom?: string;
    createdTo?: string;
}
```

## API Endpoints

### Core Task Operations

#### GET /api/tasks
Retrieve user tasks with filtering and pagination.

**Query Parameters:**
- `status`: Filter by task status
- `priority`: Filter by priority level
- `assignee`: Filter by assigned user
- `processDefinition`: Filter by process definition
- `page`: Page number (default: 1)
- `size`: Page size (default: 20)
- `sort`: Sort field (default: 'created')
- `order`: Sort order (default: 'desc')

**Response:**
```json
{
    "items": [UserTask],
    "total": number,
    "page": number,
    "size": number,
    "pages": number
}
```

#### GET /api/tasks/counts
Get task statistics and counts.

**Response:**
```json
{
    "counts": {
        "pending": number,
        "inProgress": number,
        "completed": number,
        "overdue": number,
        "total": number
    }
}
```

#### GET /api/tasks/{taskId}
Get detailed information about a specific task.

**Response:**
```json
{
    "task": UserTask,
    "processInfo": {
        "processDefinitionName": string,
        "businessKey": string,
        "startTime": string
    },
    "variables": Record<string, any>
}
```

#### POST /api/tasks/{taskId}/claim
Claim a task for the current user.

**Request Body:**
```json
{
    "userId": string
}
```

#### POST /api/tasks/{taskId}/unclaim
Unclaim a task (make it available for others).

#### POST /api/tasks/{taskId}/complete
Complete a task with variables.

**Request Body:**
```json
{
    "variables": Record<string, any>,
    "comments": string
}
```

#### GET /api/tasks/{taskId}/variables
Get task variables.

#### POST /api/tasks/{taskId}/variables
Set task variables.

**Request Body:**
```json
{
    "variables": Record<string, any>
}
```

### Advanced Operations

#### POST /api/tasks/bulk/claim
Bulk claim multiple tasks.

#### POST /api/tasks/bulk/complete
Bulk complete multiple tasks.

#### GET /api/tasks/analytics
Get task analytics and metrics.

**Response:**
```json
{
    "metrics": {
        "averageCompletionTime": number,
        "tasksByProcess": Record<string, number>,
        "tasksByAssignee": Record<string, number>,
        "overdueTasks": number
    }
}
```

## Camunda Integration

### Camunda REST API Endpoints Used

1. **Task Queries**
   - `GET /engine-rest/task` - List tasks
   - `GET /engine-rest/task/count` - Get task count
   - `GET /engine-rest/task/{taskId}` - Get task details

2. **Task Operations**
   - `POST /engine-rest/task/{taskId}/claim` - Claim task
   - `POST /engine-rest/task/{taskId}/unclaim` - Unclaim task
   - `POST /engine-rest/task/{taskId}/complete` - Complete task

3. **Variable Management**
   - `GET /engine-rest/task/{taskId}/variables` - Get variables
   - `POST /engine-rest/task/{taskId}/variables` - Set variables

4. **Process Information**
   - `GET /engine-rest/process-instance/{processInstanceId}` - Get process instance
   - `GET /engine-rest/process-definition/{processDefinitionId}` - Get process definition

### Integration Patterns

#### Task Synchronization
- Regular polling of Camunda for new tasks
- WebSocket integration for real-time updates
- Caching layer for performance optimization

#### Variable Handling
- Bidirectional sync of task variables
- Type validation and transformation
- Audit trail for variable changes

#### Error Handling
- Graceful degradation when Camunda is unavailable
- Retry mechanisms for transient failures
- Comprehensive error logging and monitoring

## Security Considerations

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Task-level permissions based on user assignments

### Data Protection
- Encryption of sensitive task variables
- Audit logging for all task operations
- GDPR compliance for user data

## Performance Requirements

### Response Times
- Task list retrieval: < 500ms
- Task completion: < 200ms
- Real-time updates: < 100ms

### Scalability
- Support for 10,000+ concurrent tasks
- Horizontal scaling capability
- Database connection pooling

## Monitoring & Observability

### Metrics
- Task completion rates
- Average task duration
- User activity patterns
- API response times

### Logging
- Structured logging for all operations
- Error tracking and alerting
- Performance monitoring

### Health Checks
- Camunda connectivity status
- Database connection health
- Service availability endpoints

## Development Roadmap

### Phase 1: Core Functionality
- Basic task CRUD operations
- Camunda integration
- Simple filtering and search

### Phase 2: Advanced Features
- Real-time updates via WebSocket
- Advanced analytics and reporting
- Bulk operations

### Phase 3: Enterprise Features
- Advanced security and compliance
- Performance optimization
- Integration with other DADMS services

## Dependencies

### External Dependencies
- Camunda Platform 7.x or 8.x
- PostgreSQL database
- Redis for caching (optional)

### Internal Dependencies
- DADMS Authentication Service
- DADMS Event Manager Service
- DADMS Process Manager Service

## Configuration

### Environment Variables
```bash
# Service Configuration
PORT=3022
NODE_ENV=production

# Camunda Configuration
CAMUNDA_BASE_URL=http://localhost:8080/engine-rest
CAMUNDA_USERNAME=admin
CAMUNDA_PASSWORD=admin

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/dadms_user_tasks

# Security Configuration
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000

# Performance Configuration
CACHE_TTL=300
POLLING_INTERVAL=10000
```

## Testing Strategy

### Unit Tests
- Service layer logic
- Data transformation functions
- Error handling scenarios

### Integration Tests
- Camunda API integration
- Database operations
- Authentication flows

### End-to-End Tests
- Complete task workflows
- UI integration
- Performance benchmarks

## Deployment

### Container Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3022
CMD ["node", "dist/index.js"]
```

### Health Check Endpoint
- `GET /health` - Service health status
- `GET /ready` - Service readiness check
- `GET /metrics` - Prometheus metrics

## Future Enhancements

### AI Integration
- Intelligent task prioritization
- Automated task routing
- Predictive analytics for task completion

### Advanced Workflows
- Task delegation and escalation
- Conditional task assignments
- Dynamic form generation

### Mobile Support
- Mobile-optimized API endpoints
- Push notifications for task updates
- Offline task management capabilities 