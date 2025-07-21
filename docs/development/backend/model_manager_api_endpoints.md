# Model Manager Service - API Endpoints

## Overview

The Model Manager Service provides a comprehensive REST API for managing computational models in the DADMS ecosystem. This document outlines all available endpoints, request/response formats, and usage examples.

**Base URL**: `http://localhost:3010/api/v1` (Development)  
**Authentication**: Bearer JWT Token  
**API Version**: 2.0.0

## Table of Contents

1. [Model Management](#model-management)
2. [Artifact Management](#artifact-management)
3. [Version Management](#version-management)
4. [Validation & Testing](#validation--testing)
5. [Analytics & Monitoring](#analytics--monitoring)
6. [Search & Discovery](#search--discovery)
7. [Integration & Execution](#integration--execution)
8. [Health & Monitoring](#health--monitoring)

---

## Model Management

### Register New Model

Register a new computational model with metadata and artifacts.

```http
POST /api/v1/models
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

**Request Body:**
- `metadata` (required): JSON metadata object
- `artifacts` (optional): Array of binary files

**Example Request:**
```bash
curl -X POST http://localhost:3010/api/v1/models \
  -H "Authorization: Bearer <token>" \
  -F 'metadata={
    "name": "UAV Performance Model",
    "version": "1.0.0",
    "model_type": "simulation",
    "description": "Physics-based UAV performance prediction model",
    "tags": ["uav", "performance", "simulation"],
    "input_schema": {...},
    "output_schema": {...}
  }' \
  -F 'artifacts=@model.py' \
  -F 'artifacts=@config.json'
```

**Response (201):**
```json
{
  "model_id": "model-uuid-123",
  "message": "Model registered successfully",
  "artifacts_uploaded": [
    {
      "name": "model.py",
      "type": "python_script",
      "size": 15680,
      "hash": "sha256:abc123..."
    }
  ]
}
```

### List Models

Retrieve a list of models with optional filtering and pagination.

```http
GET /api/v1/models?model_type=ml&stage=production&limit=20
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `model_type`: Filter by model type (`ml`, `simulation`, `physics`, etc.)
- `stage`: Filter by deployment stage (`development`, `testing`, `production`, etc.)
- `status`: Filter by status (`active`, `deprecated`, etc.)
- `tags`: Filter by tags (comma-separated)
- `created_after`: Filter by creation date (ISO 8601)
- `created_before`: Filter by creation date (ISO 8601)
- `created_by`: Filter by creator
- `search_term`: Search in name/description
- `sort_by`: Sort field (`name`, `created_at`, `updated_at`, `version`)
- `sort_order`: Sort direction (`asc`, `desc`)
- `limit`: Results per page (1-100, default: 20)
- `offset`: Results to skip (default: 0)

**Response (200):**
```json
{
  "models": [
    {
      "id": "model-uuid-123",
      "name": "UAV Performance Model",
      "version": "1.0.0",
      "model_type": "simulation",
      "stage": "production",
      "status": "active",
      "description": "Physics-based UAV performance prediction model",
      "tags": ["uav", "performance", "simulation"],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:20:00Z",
      "created_by": "john.doe@example.com"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

### Get Model Details

Retrieve detailed information about a specific model.

```http
GET /api/v1/models/{id}?version=1.0.0
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id`: Model ID or name

**Query Parameters:**
- `version`: Specific version (optional, defaults to latest)

**Response (200):**
```json
{
  "id": "model-uuid-123",
  "name": "UAV Performance Model",
  "version": "1.0.0",
  "model_type": "simulation",
  "description": "Physics-based UAV performance prediction model",
  "tags": ["uav", "performance", "simulation"],
  "stage": "production",
  "status": "active",
  "input_schema": {
    "type": "object",
    "properties": {
      "altitude": {"type": "number", "minimum": 0},
      "velocity": {"type": "number", "minimum": 0}
    }
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "thrust_required": {"type": "number"},
      "power_consumption": {"type": "number"}
    }
  },
  "dependencies": [...],
  "runtime_requirements": {...},
  "lineage": {...},
  "artifacts": [...],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:20:00Z",
  "created_by": "john.doe@example.com"
}
```

### Update Model Metadata

Update model metadata (does not change artifacts or version).

```http
PUT /api/v1/models/{id}
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "description": "Updated model description",
  "tags": ["uav", "performance", "simulation", "updated"],
  "metadata": {
    "updated_reason": "Performance improvements documented"
  }
}
```

**Response (200):**
```json
{
  "id": "model-uuid-123",
  "message": "Model updated successfully",
  "updated_at": "2024-01-21T09:15:00Z"
}
```

### Delete Model

Delete a model and all its artifacts.

```http
DELETE /api/v1/models/{id}?force=false
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `force`: Force deletion even if model is in use (default: false)

**Response (204):** No content

---

## Artifact Management

### Upload Model Artifacts

Upload new artifacts to an existing model.

```http
POST /api/v1/models/{id}/artifacts
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

**Request Body:**
```bash
curl -X POST http://localhost:3010/api/v1/models/model-123/artifacts \
  -H "Authorization: Bearer <token>" \
  -F 'artifacts=@weights.h5' \
  -F 'artifacts=@documentation.pdf'
```

**Response (201):**
```json
[
  {
    "id": "artifact-uuid-456",
    "name": "weights.h5",
    "type": "weights",
    "path": "/models/model-123/artifacts/weights.h5",
    "size": 52428800,
    "hash": "sha256:def456...",
    "mime_type": "application/octet-stream",
    "created_at": "2024-01-21T10:00:00Z"
  }
]
```

### List Model Artifacts

List all artifacts for a specific model.

```http
GET /api/v1/models/{id}/artifacts
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": "artifact-uuid-456",
    "name": "model.py",
    "type": "python_script",
    "path": "/models/model-123/artifacts/model.py",
    "size": 15680,
    "hash": "sha256:abc123...",
    "mime_type": "text/x-python",
    "description": "Main model implementation",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Download Model Artifact

Download a specific model artifact.

```http
GET /api/v1/models/{id}/artifacts/{name}
Authorization: Bearer <jwt_token>
```

**Response (200):** Binary file download

### Delete Model Artifact

Delete a specific model artifact.

```http
DELETE /api/v1/models/{id}/artifacts/{name}
Authorization: Bearer <jwt_token>
```

**Response (204):** No content

---

## Version Management

### Promote Model

Promote a model to a higher deployment stage.

```http
POST /api/v1/models/{id}/promote
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "target_stage": "production",
  "reason": "All validation tests passed successfully"
}
```

**Response (200):**
```json
{
  "model_id": "model-uuid-123",
  "from_stage": "staging",
  "to_stage": "production",
  "promoted_at": "2024-01-21T15:30:00Z",
  "promoted_by": "admin@example.com",
  "message": "Model promoted successfully to production"
}
```

### Get Version History

Get version history for a model.

```http
GET /api/v1/models/{id}/versions
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "version": "1.0.0",
    "stage": "production",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "promoted_at": "2024-01-21T15:30:00Z",
    "promoted_by": "admin@example.com",
    "changes": "Initial production release"
  },
  {
    "version": "0.9.0",
    "stage": "archived",
    "status": "deprecated",
    "created_at": "2024-01-10T14:20:00Z",
    "promoted_at": "2024-01-15T09:00:00Z",
    "promoted_by": "developer@example.com",
    "changes": "Beta release for testing"
  }
]
```

### Compare Models

Compare two models for metrics and performance differences.

```http
POST /api/v1/models/{id}/compare/{otherId}
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "model1_id": "model-uuid-123",
  "model2_id": "model-uuid-456",
  "comparison_date": "2024-01-21T16:00:00Z",
  "metrics_comparison": {
    "accuracy": {"model1": 0.95, "model2": 0.92, "difference": 0.03},
    "performance": {"model1": 120, "model2": 98, "difference": 22}
  },
  "differences": [
    {
      "field": "input_schema.properties.altitude.minimum",
      "model1_value": "0",
      "model2_value": "100"
    }
  ],
  "recommendation": "Model 1 is recommended due to higher accuracy and performance"
}
```

---

## Validation & Testing

### Run Model Validation

Execute validation tests on a model.

```http
POST /api/v1/models/{id}/validate
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "validation_type": "performance_test",
  "test_suite": "uav_performance_suite"
}
```

**Response (200):**
```json
{
  "id": "validation-uuid-789",
  "validation_type": "performance_test",
  "status": "pending",
  "test_suite": "uav_performance_suite",
  "executed_at": "2024-01-21T17:00:00Z",
  "executed_by": "tester@example.com",
  "details": "Validation started successfully"
}
```

### Get Validation History

Get validation history for a model.

```http
GET /api/v1/models/{id}/validations?validation_type=performance_test&status=passed
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `validation_type`: Filter by validation type
- `status`: Filter by validation status

**Response (200):**
```json
[
  {
    "id": "validation-uuid-789",
    "validation_type": "performance_test",
    "status": "passed",
    "metrics": {
      "execution_time": 0.045,
      "memory_usage": 128,
      "accuracy": 0.95
    },
    "test_suite": "uav_performance_suite",
    "executed_at": "2024-01-21T17:00:00Z",
    "executed_by": "tester@example.com",
    "details": "All performance tests passed successfully"
  }
]
```

### Execute Test Suite

Run a comprehensive test suite on a model.

```http
POST /api/v1/models/{id}/test
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "test_suite": "comprehensive_validation",
  "timeout": 300
}
```

**Response (200):**
```json
[
  {
    "id": "test-1",
    "validation_type": "unit_test",
    "status": "passed",
    "metrics": {"tests_passed": 24, "tests_failed": 0}
  },
  {
    "id": "test-2", 
    "validation_type": "integration_test",
    "status": "passed",
    "metrics": {"scenarios_passed": 12, "scenarios_failed": 0}
  }
]
```

---

## Analytics & Monitoring

### Get Model Lineage

Get complete lineage and provenance information for a model.

```http
GET /api/v1/models/{id}/lineage
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "training_datasets": [
    {
      "dataset_id": "dataset-123",
      "name": "UAV Flight Data 2024",
      "version": "1.2.0",
      "source": "flight_telemetry"
    }
  ],
  "parent_models": ["base-physics-model-456"],
  "derived_models": ["optimized-model-789"],
  "training_pipeline": {
    "pipeline_id": "pipeline-abc",
    "name": "ML Training Pipeline v2",
    "version": "2.1.0",
    "framework": "MLflow"
  },
  "experiments": [
    {
      "experiment_id": "exp-123",
      "name": "UAV Performance Optimization",
      "platform": "MLflow",
      "url": "https://mlflow.example.com/experiments/123"
    }
  ]
}
```

### Get Model Metrics

Get performance metrics for a model over time.

```http
GET /api/v1/models/{id}/metrics?start_time=2024-01-01T00:00:00Z&end_time=2024-01-31T23:59:59Z&metric_type=performance
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_time`: Start time for metrics (ISO 8601)
- `end_time`: End time for metrics (ISO 8601)
- `metric_type`: Type of metrics (`performance`, `usage`, `accuracy`, `resource`)

**Response (200):**
```json
{
  "model_id": "model-uuid-123",
  "time_range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "performance_metrics": {
    "accuracy": 0.95,
    "precision": 0.94,
    "recall": 0.96,
    "f1_score": 0.95
  },
  "usage_metrics": {
    "execution_count": 1248,
    "total_runtime": 18750.5,
    "average_response_time": 0.045,
    "error_rate": 0.002
  },
  "resource_metrics": {
    "cpu_usage": 65.2,
    "memory_usage": 512.8,
    "gpu_usage": 23.1
  }
}
```

### Get Model Usage Statistics

Get usage statistics and analytics for a model.

```http
GET /api/v1/models/{id}/usage
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "model_id": "model-uuid-123",
  "total_executions": 1248,
  "unique_users": 42,
  "average_execution_time": 0.045,
  "success_rate": 0.998,
  "last_executed": "2024-01-21T18:30:00Z",
  "popular_use_cases": [
    {
      "use_case": "UAV Performance Analysis",
      "count": 856
    },
    {
      "use_case": "Flight Planning Optimization",
      "count": 392
    }
  ]
}
```

---

## Search & Discovery

### Search Models

Search models using text query and filters.

```http
GET /api/v1/models/search?q=UAV+performance&model_type=simulation&tags=aerospace&limit=10
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `q`: Search query (required)
- `model_type`: Filter by model types
- `tags`: Filter by tags
- `stage`: Filter by deployment stages
- `limit`: Number of results (1-100, default: 20)

**Response (200):**
```json
[
  {
    "id": "model-uuid-123",
    "name": "UAV Performance Model",
    "version": "1.0.0",
    "model_type": "simulation",
    "stage": "production",
    "status": "active",
    "description": "Physics-based UAV performance prediction model",
    "tags": ["uav", "performance", "simulation"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:20:00Z",
    "created_by": "john.doe@example.com",
    "relevance_score": 0.95,
    "matched_fields": ["name", "description", "tags"]
  }
]
```

### Get Available Tags

Get list of all available model tags.

```http
GET /api/v1/models/tags
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  "aerospace",
  "ml",
  "performance",
  "physics",
  "simulation",
  "uav",
  "optimization"
]
```

### Get Supported Model Types

Get list of supported model types and their descriptions.

```http
GET /api/v1/models/types
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "type": "ml",
    "description": "Machine learning models (trained models)",
    "supported_formats": ["pkl", "h5", "onnx", "pt", "pb"]
  },
  {
    "type": "simulation",
    "description": "Simulation models (Simulink, MATLAB, etc.)",
    "supported_formats": ["slx", "mdl", "m", "py"]
  },
  {
    "type": "physics",
    "description": "Physics-based models and equations",
    "supported_formats": ["py", "m", "cpp", "f90"]
  }
]
```

---

## Integration & Execution

### Deploy Model

Deploy model to execution environment.

```http
POST /api/v1/models/{id}/deploy
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "environment": "production",
  "resources": {
    "cpu_cores": 4,
    "memory_gb": 8,
    "gpu_required": false
  },
  "scaling": {
    "min_instances": 1,
    "max_instances": 5,
    "target_cpu": 70
  },
  "environment_variables": {
    "LOG_LEVEL": "INFO",
    "CACHE_SIZE": "1000"
  }
}
```

**Response (200):**
```json
{
  "deployment_id": "deployment-uuid-456",
  "model_id": "model-uuid-123",
  "environment": "production",
  "status": "deploying",
  "endpoint_url": "https://api.example.com/models/model-uuid-123/execute",
  "deployed_at": "2024-01-21T19:00:00Z",
  "message": "Model deployment initiated successfully"
}
```

### Execute Model

Execute model with provided inputs.

```http
POST /api/v1/models/{id}/execute
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "inputs": {
    "altitude": 1000,
    "velocity": 50,
    "weight": 25.5,
    "wind_speed": 5
  },
  "execution_config": {
    "timeout": 30,
    "async": false
  },
  "metadata": {
    "execution_id": "exec-123",
    "user_id": "user-456",
    "session_id": "session-789"
  }
}
```

**Response (200):**
```json
{
  "outputs": {
    "thrust_required": 285.6,
    "power_consumption": 1420.8,
    "range_estimate": 45.2,
    "efficiency_ratio": 0.87
  },
  "execution_metadata": {
    "execution_id": "exec-123",
    "execution_time": 0.045,
    "resource_usage": {
      "cpu_usage_percent": 15.2,
      "memory_usage_mb": 128,
      "execution_time_ms": 45
    },
    "timestamp": "2024-01-21T19:30:00Z"
  },
  "status": "success"
}
```

### Get Deployment Status

Get current deployment status and history.

```http
GET /api/v1/models/{id}/deployments
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "deployment_id": "deployment-uuid-456",
    "model_id": "model-uuid-123",
    "environment": "production",
    "status": "deployed",
    "health": "healthy",
    "endpoint_url": "https://api.example.com/models/model-uuid-123/execute",
    "deployed_at": "2024-01-21T19:00:00Z",
    "last_health_check": "2024-01-21T19:45:00Z",
    "metrics": {
      "requests_per_minute": 12.5,
      "average_response_time": 0.045,
      "error_rate": 0.001
    }
  }
]
```

---

## Health & Monitoring

### Health Check

Service health check endpoint.

```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-21T20:00:00Z",
  "version": "2.0.0",
  "dependencies": {
    "database": "healthy",
    "object_storage": "healthy",
    "vector_store": "healthy",
    "graph_database": "healthy",
    "event_manager": "healthy"
  }
}
```

### Service Metrics

Prometheus-formatted service metrics.

```http
GET /metrics
```

**Response (200):**
```
# HELP model_manager_models_total Total number of registered models
# TYPE model_manager_models_total counter
model_manager_models_total 127

# HELP model_manager_requests_total Total number of API requests
# TYPE model_manager_requests_total counter
model_manager_requests_total{method="GET",endpoint="/api/v1/models"} 1549
model_manager_requests_total{method="POST",endpoint="/api/v1/models"} 89

# HELP model_manager_response_time_seconds API response time in seconds
# TYPE model_manager_response_time_seconds histogram
model_manager_response_time_seconds_bucket{le="0.1"} 1450
model_manager_response_time_seconds_bucket{le="0.5"} 1580
model_manager_response_time_seconds_bucket{le="1.0"} 1638
```

---

## Error Handling

### Standard Error Response

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "Model with ID 'model-123' not found",
    "details": {
      "model_id": "model-123",
      "timestamp": "2024-01-21T20:15:00Z"
    }
  }
}
```

### Common HTTP Status Codes

- **200 OK**: Successful operation
- **201 Created**: Resource created successfully
- **204 No Content**: Successful operation with no response body
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **413 Payload Too Large**: Artifact file too large
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Rate Limiting

API endpoints are rate-limited to ensure fair usage:
- **Anonymous**: 100 requests per hour
- **Authenticated**: 1000 requests per hour
- **Premium**: 10000 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642799400
```

---

## Authentication

### JWT Token Format

All requests (except health check) require a JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required Claims

JWT tokens must include:
- `sub`: User ID
- `email`: User email
- `roles`: User roles array
- `exp`: Token expiration
- `iat`: Token issued at

### Permissions

Different operations require different permissions:
- `model:read`: View models and artifacts
- `model:write`: Create and update models
- `model:promote`: Promote models between stages
- `model:admin`: Full administrative access

---

## SDK & Code Examples

### Python SDK Example

```python
from dadms_client import ModelManagerClient

# Initialize client
client = ModelManagerClient(
    base_url="http://localhost:3010",
    token="your-jwt-token"
)

# Register a new model
model = client.models.register(
    name="UAV Performance Model",
    version="1.0.0",
    model_type="simulation",
    description="Physics-based UAV performance prediction",
    artifacts=["model.py", "config.json"]
)

# Execute model
result = client.models.execute(
    model_id=model.id,
    inputs={
        "altitude": 1000,
        "velocity": 50,
        "weight": 25.5
    }
)

print(f"Thrust required: {result.outputs['thrust_required']}")
```

### JavaScript SDK Example

```javascript
import { ModelManagerClient } from '@dadms/client';

// Initialize client
const client = new ModelManagerClient({
  baseUrl: 'http://localhost:3010',
  token: 'your-jwt-token'
});

// Search for models
const models = await client.models.search({
  query: 'UAV performance',
  modelType: ['simulation'],
  tags: ['aerospace']
});

// Deploy model
const deployment = await client.models.deploy(modelId, {
  environment: 'production',
  resources: {
    cpuCores: 4,
    memoryGb: 8
  }
});
```

---

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **YAML**: [model_manager_service_openapi.yaml](./model_manager_service_openapi.yaml)
- **Interactive Docs**: `http://localhost:3010/docs` (when service is running)
- **Postman Collection**: Generated from OpenAPI specification

---

*Last Updated: January 21, 2024*  
*API Version: 2.0.0*  
*Service Port: 3010* 