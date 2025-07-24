# Jupyter Lab Integration Specification

## Overview

This document specifies the integration of Jupyter Lab into the DADMS (Decision Analysis and Decision Management System) platform as a prototyping and analysis tool. The integration provides seamless access to interactive computing capabilities while maintaining the native DADMS user experience.

## Architecture

### High-Level Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DADMS UI      │    │  Jupyter Lab    │    │   DADMS API     │
│   (React)       │◄──►│   (Docker)      │◄──►│   Gateway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Kernel        │    │   Notebook      │    │   Execution     │
│   Management    │    │   Storage       │    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Allocation

- **Jupyter Lab Service**: Port 8888
- **DADMS UI**: Port 3000 (development), Port 9999 (testing)
- **API Gateway**: Port 3001 (Project Service)

## API Endpoints

### Jupyter Lab REST API

#### Authentication
All requests require token-based authentication:
```
Authorization: token dadms_jupyter_token
```

#### Core Endpoints

##### 1. Server Status
```http
GET /api/status
```
**Response:**
```json
{
  "version": "2.4.0",
  "started": "2025-07-24T16:00:00.000Z",
  "last_activity": "2025-07-24T16:30:00.000Z",
  "connections": 1,
  "kernels": 2,
  "kernel_specs": {
    "python3": {
      "name": "python3",
      "spec": {
        "argv": ["python", "-m", "ipykernel_launcher", "-f", "{connection_file}"],
        "env": {},
        "display_name": "Python 3",
        "language": "python"
      }
    }
  }
}
```

##### 2. Kernel Management

###### List Kernels
```http
GET /api/kernels
```
**Response:**
```json
[
  {
    "id": "kernel-uuid",
    "name": "python3",
    "last_activity": "2025-07-24T16:30:00.000Z",
    "execution_state": "idle",
    "connections": 1
  }
]
```

###### Create Kernel
```http
POST /api/kernels
Content-Type: application/json

{
  "name": "python3",
  "path": "/"
}
```
**Response:**
```json
{
  "id": "new-kernel-uuid",
  "name": "python3",
  "last_activity": "2025-07-24T16:30:00.000Z",
  "execution_state": "starting",
  "connections": 0
}
```

###### Get Kernel Status
```http
GET /api/kernels/{kernel_id}
```
**Response:**
```json
{
  "id": "kernel-uuid",
  "name": "python3",
  "last_activity": "2025-07-24T16:30:00.000Z",
  "execution_state": "idle",
  "connections": 1
}
```

###### Execute Code
```http
POST /api/kernels/{kernel_id}/execute
Content-Type: application/json

{
  "code": "print('Hello, DADMS!')",
  "silent": false,
  "store_history": true,
  "user_expressions": {},
  "allow_stdin": false
}
```
**Response:**
```json
{
  "id": "msg-uuid",
  "header": {
    "msg_id": "msg-uuid",
    "msg_type": "execute_reply",
    "username": "jovyan",
    "session": "session-uuid",
    "date": "2025-07-24T16:30:00.000Z",
    "version": "5.3"
  },
  "parent_header": {
    "msg_id": "parent-msg-uuid",
    "msg_type": "execute_request"
  },
  "metadata": {},
  "content": {
    "status": "ok",
    "execution_count": 1,
    "payload": [],
    "user_expressions": {}
  }
}
```

###### Restart Kernel
```http
POST /api/kernels/{kernel_id}/restart
```

###### Stop Kernel
```http
DELETE /api/kernels/{kernel_id}
```

##### 3. Notebook Management

###### List Notebooks
```http
GET /api/contents
```
**Response:**
```json
[
  {
    "name": "analysis.ipynb",
    "path": "analysis.ipynb",
    "type": "notebook",
    "created": "2025-07-24T16:00:00.000Z",
    "last_modified": "2025-07-24T16:30:00.000Z",
    "content": null,
    "format": null,
    "mimetype": null,
    "size": 1024
  }
]
```

###### Get Notebook Content
```http
GET /api/contents/{path}
```
**Response:**
```json
{
  "name": "analysis.ipynb",
  "path": "analysis.ipynb",
  "type": "notebook",
  "created": "2025-07-24T16:00:00.000Z",
  "last_modified": "2025-07-24T16:30:00.000Z",
  "content": {
    "cells": [
      {
        "cell_type": "code",
        "execution_count": 1,
        "metadata": {},
        "outputs": [
          {
            "name": "stdout",
            "output_type": "stream",
            "text": "Hello, DADMS!\n"
          }
        ],
        "source": ["print('Hello, DADMS!')"]
      }
    ],
    "metadata": {
      "kernelspec": {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3"
      },
      "language_info": {
        "codemirror_mode": {
          "name": "ipython",
          "version": 3
        },
        "file_extension": ".py",
        "mimetype": "text/x-python",
        "name": "python",
        "nbconvert_exporter": "python",
        "pygments_lexer": "ipython3",
        "version": "3.11.0"
      }
    },
    "nbformat": 4,
    "nbformat_minor": 4
  },
  "format": "json",
  "mimetype": "application/x-ipynb+json",
  "size": 1024
}
```

###### Create Notebook
```http
POST /api/contents
Content-Type: application/json

{
  "type": "notebook",
  "path": "new_analysis.ipynb"
}
```

###### Update Notebook
```http
PUT /api/contents/{path}
Content-Type: application/json

{
  "content": {
    "cells": [...],
    "metadata": {...},
    "nbformat": 4,
    "nbformat_minor": 4
  },
  "type": "notebook"
}
```

###### Delete Notebook
```http
DELETE /api/contents/{path}
```

## DADMS Integration API

### Project Service Extensions

#### Jupyter Lab Session Management

##### Create Jupyter Session
```http
POST /api/projects/{project_id}/jupyter/sessions
Content-Type: application/json

{
  "name": "Data Analysis Session",
  "description": "Interactive analysis for project data",
  "kernel_type": "python3",
  "notebook_name": "analysis.ipynb"
}
```

##### List Project Sessions
```http
GET /api/projects/{project_id}/jupyter/sessions
```

##### Get Session Details
```http
GET /api/projects/{project_id}/jupyter/sessions/{session_id}
```

##### Execute Analysis
```http
POST /api/projects/{project_id}/jupyter/sessions/{session_id}/execute
Content-Type: application/json

{
  "code": "import pandas as pd\n# Analysis code here",
  "context": {
    "data_sources": ["project_data.csv"],
    "variables": ["target_column"],
    "parameters": {}
  }
}
```

##### Get Execution Results
```http
GET /api/projects/{project_id}/jupyter/sessions/{session_id}/results
```

## Data Flow

### 1. Session Initialization
```
User → DADMS UI → Project Service → Jupyter Lab API → Kernel Creation
```

### 2. Code Execution
```
User → DADMS UI → Jupyter Lab API → Kernel → Execution → Results → DADMS UI
```

### 3. Data Integration
```
DADMS Data Manager → Jupyter Lab → Analysis → Results → DADMS Storage
```

## Security Considerations

### Authentication
- Token-based authentication for all Jupyter Lab API calls
- Session management through DADMS Project Service
- Secure token generation and rotation

### Data Access
- Project-scoped data access
- Read-only access to production data
- Sandboxed execution environment

### Network Security
- Internal Docker network communication
- CORS configuration for UI integration
- Rate limiting on API endpoints

## Error Handling

### Common Error Scenarios

1. **Kernel Startup Failures**
   - Resource constraints
   - Configuration issues
   - Network connectivity

2. **Execution Timeouts**
   - Long-running computations
   - Infinite loops
   - Resource exhaustion

3. **Authentication Failures**
   - Invalid tokens
   - Expired sessions
   - Permission denied

### Error Response Format
```json
{
  "error": {
    "code": "KERNEL_STARTUP_FAILED",
    "message": "Failed to start kernel due to resource constraints",
    "details": {
      "kernel_id": "kernel-uuid",
      "reason": "memory_limit_exceeded"
    },
    "timestamp": "2025-07-24T16:30:00.000Z"
  }
}
```

## Performance Requirements

### Response Times
- Kernel startup: < 30 seconds
- Code execution: < 10 seconds (simple operations)
- Notebook loading: < 5 seconds
- API status check: < 1 second

### Resource Limits
- Maximum kernels per project: 5
- Memory limit per kernel: 2GB
- CPU limit per kernel: 2 cores
- Storage limit per project: 10GB

### Scalability
- Support for concurrent users
- Kernel pooling for efficiency
- Resource monitoring and cleanup

## Monitoring and Logging

### Metrics to Track
- Kernel startup success rate
- Execution time distribution
- Resource utilization
- Error rates by type
- User session duration

### Logging Requirements
- All API requests and responses
- Kernel lifecycle events
- Error conditions with context
- Performance metrics
- Security events

## Future Enhancements

### Phase 2 Features
- Real-time collaboration
- Advanced data visualization
- Model training integration
- Automated analysis workflows
- Result caching and optimization

### Integration Opportunities
- LLM Service integration for code generation
- Knowledge Service for documentation
- Event Manager for workflow automation
- Analysis Manager for result processing

## Implementation Checklist

### Infrastructure
- [x] Docker Compose configuration
- [x] Jupyter Lab service setup
- [x] Network configuration
- [x] Volume mounting

### API Integration
- [x] REST API client implementation
- [x] Authentication handling
- [x] Error handling
- [x] Response parsing

### UI Components
- [x] Kernel management interface
- [x] Notebook editor
- [x] Code execution
- [x] Result display

### Testing
- [ ] Unit tests for API client
- [ ] Integration tests for kernel management
- [ ] End-to-end workflow tests
- [ ] Performance testing

### Documentation
- [x] API specification
- [x] Integration guide
- [ ] User documentation
- [ ] Troubleshooting guide 