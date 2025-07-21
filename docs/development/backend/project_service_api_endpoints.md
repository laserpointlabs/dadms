# Project Service API - Comprehensive Endpoint Documentation

This document provides detailed API endpoint documentation for the **Project Service** in DADMS 2.0, including real request/response examples, cURL commands, and SDK code snippets.

**Service Information:**
- **Base URL**: `http://localhost:3001`
- **Version**: 2.0.0-alpha.2
- **Port**: 3001
- **Status**: ✅ **IMPLEMENTED** - Core functionality operational

---

## Quick Reference

| Method | Endpoint | Description | Auth | Response |
|--------|----------|-------------|------|----------|
| GET | `/health` | Service health check | No | 200 OK |
| GET | `/api` | Service information | No | 200 OK |
| GET | `/api/projects` | List user's projects | user-id | 200 OK |
| POST | `/api/projects` | Create new project | user-id | 201 Created |
| GET | `/api/projects/{id}` | Get project by ID | user-id | 200 OK |
| PUT | `/api/projects/{id}` | Update project | user-id | 200 OK |
| DELETE | `/api/projects/{id}` | Delete project | user-id | 200 OK |

---

## Authentication

**Current Implementation**: Simple header-based authentication
```
Headers:
  user-id: {uuid}
```

**Example**:
```
user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4
```

> **Note**: JWT authentication is planned for Phase 2 development.

---

## Core Endpoints

### 1. Service Health Check

**Endpoint**: `GET /health`

Check if the Project Service is running and healthy.

**Request**:
```bash
curl -X GET http://localhost:3001/health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "user-project-service",
  "timestamp": "2025-01-15T10:30:00Z",
  "port": 3001
}
```

---

### 2. Service Information

**Endpoint**: `GET /api`

Get basic service information and available endpoints.

**Request**:
```bash
curl -X GET http://localhost:3001/api
```

**Response** (200 OK):
```json
{
  "service": "DADMS User & Project Service",
  "version": "1.0.0",
  "endpoints": {
    "projects": "/api/projects",
    "health": "/health"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Project Management

### 3. List User's Projects

**Endpoint**: `GET /api/projects`

Retrieve a paginated list of projects owned by the authenticated user.

**Query Parameters**:
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 50)

**Request**:
```bash
curl -X GET "http://localhost:3001/api/projects?page=1&limit=10" \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "UAV Decision Analysis",
        "description": "Analysis of UAV procurement options for defense applications",
        "owner_id": "0d6838ad-ae0e-4637-96cd-3c3271854da4",
        "status": "active",
        "knowledge_domain": "defense_analysis",
        "settings": {
          "default_llm": "openai/gpt-4",
          "personas": ["analyst", "subject_matter_expert"],
          "tools_enabled": ["rag_search", "web_search"]
        },
        "decision_context": "Analysis required for Q2 procurement decision with $50M budget",
        "created_at": "2025-01-10T09:15:00Z",
        "updated_at": "2025-01-15T14:22:15Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid pagination parameters",
  "message": "Page must be a positive integer",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### 4. Create New Project

**Endpoint**: `POST /api/projects`

Create a new project with the provided information.

**Required Fields**: `name`, `description`, `knowledge_domain`  
**Optional Fields**: `settings`, `decision_context`

**Request**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4" \
  -d '{
    "name": "UAV Decision Analysis",
    "description": "Analysis of UAV procurement options for defense applications",
    "knowledge_domain": "defense_analysis",
    "settings": {
      "default_llm": "openai/gpt-4",
      "personas": ["analyst", "subject_matter_expert"],
      "tools_enabled": ["rag_search", "web_search"]
    },
    "decision_context": "Analysis required for Q2 procurement decision with $50M budget"
  }'
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "UAV Decision Analysis",
    "description": "Analysis of UAV procurement options for defense applications",
    "owner_id": "0d6838ad-ae0e-4637-96cd-3c3271854da4",
    "status": "active",
    "knowledge_domain": "defense_analysis",
    "settings": {
      "default_llm": "openai/gpt-4",
      "personas": ["analyst", "subject_matter_expert"],
      "tools_enabled": ["rag_search", "web_search"]
    },
    "decision_context": "Analysis required for Q2 procurement decision with $50M budget",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "message": "Project created successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed: name is required",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### 5. Get Project by ID

**Endpoint**: `GET /api/projects/{id}`

Retrieve a specific project by its ID. The project must be owned by the authenticated user.

**Request**:
```bash
curl -X GET http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "UAV Decision Analysis",
    "description": "Analysis of UAV procurement options for defense applications",
    "owner_id": "0d6838ad-ae0e-4637-96cd-3c3271854da4",
    "status": "active",
    "knowledge_domain": "defense_analysis",
    "settings": {
      "default_llm": "openai/gpt-4",
      "personas": ["analyst", "subject_matter_expert"],
      "tools_enabled": ["rag_search", "web_search"]
    },
    "decision_context": "Analysis required for Q2 procurement decision with $50M budget",
    "created_at": "2025-01-10T09:15:00Z",
    "updated_at": "2025-01-15T14:22:15Z"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Project not found",
  "message": "The requested project does not exist or you don't have access",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

### 6. Update Project

**Endpoint**: `PUT /api/projects/{id}`

Update an existing project. Only the project owner can update the project.  
All fields are optional - only provided fields will be updated.

**Request**:
```bash
curl -X PUT http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4" \
  -d '{
    "name": "Updated UAV Analysis",
    "description": "Updated analysis with expanded scope",
    "status": "completed"
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated UAV Analysis",
    "description": "Updated analysis with expanded scope",
    "owner_id": "0d6838ad-ae0e-4637-96cd-3c3271854da4",
    "status": "completed",
    "knowledge_domain": "defense_analysis",
    "settings": {
      "default_llm": "openai/gpt-4",
      "personas": ["analyst", "subject_matter_expert"],
      "tools_enabled": ["rag_search", "web_search"]
    },
    "decision_context": "Analysis required for Q2 procurement decision with $50M budget",
    "created_at": "2025-01-10T09:15:00Z",
    "updated_at": "2025-01-15T10:35:00Z"
  },
  "message": "Project updated successfully",
  "timestamp": "2025-01-15T10:35:00Z"
}
```

---

### 7. Delete Project

**Endpoint**: `DELETE /api/projects/{id}`

Delete a project permanently. Only the project owner can delete the project.  
**⚠️ Warning**: This action cannot be undone.

**Request**:
```bash
curl -X DELETE http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4"
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "timestamp": "2025-01-15T10:40:00Z"
}
```

---

## SDK Examples

### Python SDK Example

```python
import requests
import json
from typing import Dict, List, Optional

class ProjectServiceClient:
    def __init__(self, base_url: str = "http://localhost:3001", user_id: str = None):
        self.base_url = base_url
        self.user_id = user_id
        self.headers = {
            "Content-Type": "application/json",
            "user-id": user_id
        }
    
    def list_projects(self, page: int = 1, limit: int = 10) -> Dict:
        """List user's projects with pagination"""
        url = f"{self.base_url}/api/projects"
        params = {"page": page, "limit": limit}
        
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def create_project(self, project_data: Dict) -> Dict:
        """Create a new project"""
        url = f"{self.base_url}/api/projects"
        
        response = requests.post(url, headers=self.headers, json=project_data)
        response.raise_for_status()
        return response.json()
    
    def get_project(self, project_id: str) -> Dict:
        """Get project by ID"""
        url = f"{self.base_url}/api/projects/{project_id}"
        
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def update_project(self, project_id: str, update_data: Dict) -> Dict:
        """Update an existing project"""
        url = f"{self.base_url}/api/projects/{project_id}"
        
        response = requests.put(url, headers=self.headers, json=update_data)
        response.raise_for_status()
        return response.json()
    
    def delete_project(self, project_id: str) -> Dict:
        """Delete a project"""
        url = f"{self.base_url}/api/projects/{project_id}"
        
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

# Usage Example
client = ProjectServiceClient(user_id="0d6838ad-ae0e-4637-96cd-3c3271854da4")

# Create a new project
project_data = {
    "name": "UAV Decision Analysis",
    "description": "Analysis of UAV procurement options",
    "knowledge_domain": "defense_analysis",
    "settings": {
        "default_llm": "openai/gpt-4",
        "personas": ["analyst"],
        "tools_enabled": ["rag_search", "web_search"]
    },
    "decision_context": "Q2 procurement decision analysis"
}

result = client.create_project(project_data)
project_id = result["data"]["id"]

# List projects
projects = client.list_projects(page=1, limit=10)
print(f"Total projects: {projects['data']['total']}")

# Update project
update_data = {"status": "completed"}
updated = client.update_project(project_id, update_data)
```

### Node.js SDK Example

```javascript
const axios = require('axios');

class ProjectServiceClient {
    constructor(baseUrl = 'http://localhost:3001', userId = null) {
        this.baseUrl = baseUrl;
        this.userId = userId;
        this.headers = {
            'Content-Type': 'application/json',
            'user-id': userId
        };
    }

    async listProjects(page = 1, limit = 10) {
        const url = `${this.baseUrl}/api/projects`;
        const params = { page, limit };
        
        const response = await axios.get(url, { 
            headers: this.headers, 
            params 
        });
        return response.data;
    }

    async createProject(projectData) {
        const url = `${this.baseUrl}/api/projects`;
        
        const response = await axios.post(url, projectData, { 
            headers: this.headers 
        });
        return response.data;
    }

    async getProject(projectId) {
        const url = `${this.baseUrl}/api/projects/${projectId}`;
        
        const response = await axios.get(url, { 
            headers: this.headers 
        });
        return response.data;
    }

    async updateProject(projectId, updateData) {
        const url = `${this.baseUrl}/api/projects/${projectId}`;
        
        const response = await axios.put(url, updateData, { 
            headers: this.headers 
        });
        return response.data;
    }

    async deleteProject(projectId) {
        const url = `${this.baseUrl}/api/projects/${projectId}`;
        
        const response = await axios.delete(url, { 
            headers: this.headers 
        });
        return response.data;
    }
}

// Usage Example
const client = new ProjectServiceClient(
    'http://localhost:3001', 
    '0d6838ad-ae0e-4637-96cd-3c3271854da4'
);

async function example() {
    try {
        // Create project
        const projectData = {
            name: "UAV Decision Analysis",
            description: "Analysis of UAV procurement options",
            knowledge_domain: "defense_analysis",
            settings: {
                default_llm: "openai/gpt-4",
                personas: ["analyst"],
                tools_enabled: ["rag_search", "web_search"]
            },
            decision_context: "Q2 procurement decision analysis"
        };

        const result = await client.createProject(projectData);
        const projectId = result.data.id;
        console.log(`Created project: ${projectId}`);

        // List projects
        const projects = await client.listProjects(1, 10);
        console.log(`Total projects: ${projects.data.total}`);

        // Update project
        const updateData = { status: "completed" };
        const updated = await client.updateProject(projectId, updateData);
        console.log('Project updated successfully');

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

example();
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional context (optional)",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes

| Status | Description | When it occurs |
|--------|-------------|----------------|
| 200 | OK | Successful GET, PUT, DELETE operations |
| 201 | Created | Successful POST operations |
| 400 | Bad Request | Validation errors, malformed requests |
| 404 | Not Found | Project doesn't exist or access denied |
| 500 | Internal Server Error | Server-side errors |

### Validation Errors

The service uses Joi validation schemas. Common validation errors:

**Missing required field**:
```json
{
  "success": false,
  "error": "Validation failed: \"name\" is required",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Field too long**:
```json
{
  "success": false,
  "error": "Validation failed: \"name\" length must be less than or equal to 255 characters long",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Invalid status**:
```json
{
  "success": false,
  "error": "Validation failed: \"status\" must be one of [active, completed]",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Testing

### Health Check Test
```bash
# Verify service is running
curl -f http://localhost:3001/health || echo "Service is down"
```

### Complete Workflow Test
```bash
# 1. Check service info
curl http://localhost:3001/api

# 2. Create a test project
PROJECT_ID=$(curl -s -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4" \
  -d '{"name":"Test Project","description":"Test","knowledge_domain":"test"}' \
  | jq -r '.data.id')

# 3. List projects
curl -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4" \
  "http://localhost:3001/api/projects"

# 4. Get specific project
curl -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4" \
  "http://localhost:3001/api/projects/$PROJECT_ID"

# 5. Update project
curl -X PUT http://localhost:3001/api/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4" \
  -d '{"status":"completed"}'

# 6. Delete project
curl -X DELETE http://localhost:3001/api/projects/$PROJECT_ID \
  -H "user-id: 0d6838ad-ae0e-4637-96cd-3c3271854da4"
```

---

## Development Notes

### Current Implementation Status
- ✅ **Core CRUD Operations**: Fully implemented and tested
- ✅ **PostgreSQL Integration**: Working with proper schema
- ✅ **React UI Integration**: Complete frontend integration
- ✅ **Validation**: Joi schema validation for all endpoints
- ✅ **Error Handling**: Comprehensive error middleware
- ✅ **Documentation**: Swagger/OpenAPI integration at `/api-docs`

### Future Enhancements (Phase 2)
- 🔄 **JWT Authentication**: Replace simple user-id header
- 🔄 **User Management**: Multi-user project collaboration
- 🔄 **Advanced Search**: Full-text search with filters
- 🔄 **Event Integration**: Publishing to Event Manager
- 🔄 **Bulk Operations**: Multi-project management

### Integration Points
- **React UI**: `dadms-ui/src/services/projectApi.ts`
- **Database**: PostgreSQL via `pg` library
- **Swagger Docs**: Available at `http://localhost:3001/api-docs`
- **Health Monitoring**: `/health` endpoint for monitoring

---

**Last Updated**: Current  
**Version**: 2.0.0-alpha.2  
**Port**: 3001  
**Status**: ✅ Production-ready core functionality 