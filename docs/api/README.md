# API Documentation

This directory contains API documentation for all DADMS services.

## Service APIs

### Core Services (Week 1)
- **[User/Project Service API](user-project-api.md)** (Port 3001)
- **[LLM Service API](llm-service-api.md)** (Port 3002)  
- **[Knowledge Service API](knowledge-service-api.md)** (Port 3003)

### Extended Services (Week 2+)
- **[Context Manager API](context-manager-api.md)** (Port 3005)
- **[Tool Service API](tool-service-api.md)** (Port 3006)
- **[Process Management API](process-management-api.md)** (Port 3007)

## API Standards

### REST Conventions
- Use standard HTTP methods (GET, POST, PUT, DELETE)
- RESTful URL patterns: `/api/v1/resource` 
- Consistent error response format
- Proper HTTP status codes

### Authentication
- JWT token-based authentication
- Bearer token in Authorization header
- Service-to-service authentication

### Request/Response Format
```json
{
  "data": {},
  "meta": {
    "timestamp": "2025-07-15T13:00:00Z",
    "version": "2.0.0"
  },
  "errors": []
}
```

### OpenAPI Specifications
Each service will include:
- `openapi.yaml` - Complete API specification
- Generated documentation
- Postman collections
- Code examples

## Documentation Status

- [ ] User/Project Service API
- [ ] LLM Service API  
- [ ] Knowledge Service API
- [ ] Context Manager API
- [ ] Tool Service API
- [ ] Process Management API

*API documentation will be generated as services are implemented during Week 1 development.*
