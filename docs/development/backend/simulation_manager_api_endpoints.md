# DADMS Simulation Manager Service - API Endpoints

## Overview

The **Simulation Manager Service** provides a comprehensive REST API for orchestrating computational simulations across diverse computing resources. It serves as the execution hub for registered models from the Model Manager, offering scalable, observable, and resilient simulation execution capabilities.

- **Base URL**: `http://localhost:3011` (Development) | `https://api.dadms.com/simulation-manager` (Production)
- **Authentication**: Bearer JWT tokens required
- **API Version**: v1
- **Content-Type**: `application/json`
- **Port**: 3011

## Table of Contents

1. [Simulation Management](#1-simulation-management)
2. [Batch Processing](#2-batch-processing)
3. [Status & Monitoring](#3-status--monitoring)
4. [Results & Analytics](#4-results--analytics)
5. [Resource Management](#5-resource-management)
6. [Search & Discovery](#6-search--discovery)
7. [Health & Monitoring](#7-health--monitoring)
8. [Error Handling](#8-error-handling)
9. [Authentication](#9-authentication)
10. [SDK & Code Examples](#10-sdk--code-examples)

---

## 1. Simulation Management

### 1.1 Run New Simulation

Execute a simulation for a registered model with specified parameters.

**Endpoint**: `POST /api/v1/simulations`

**Request Body**:
```json
{
  "model_id": "model-uuid-123",
  "name": "UAV Performance Analysis",
  "description": "Monte Carlo analysis of UAV performance under varying conditions",
  "parameters": {
    "inputs": {
      "altitude": 1000,
      "velocity": 50,
      "weight": 25.5,
      "wind_speed": 10
    },
    "monte_carlo_runs": 1000,
    "random_seed": 42
  },
  "configuration": {
    "execution_mode": "cloud_batch",
    "timeout_minutes": 60,
    "priority": "HIGH",
    "compute_target": {
      "provider": "aws_batch",
      "instance_type": "c5.xlarge",
      "region": "us-east-1"
    }
  },
  "tags": ["uav", "performance", "monte-carlo"],
  "project_id": "project-uuid-456"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3011/api/v1/simulations" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "model-uuid-123",
    "name": "UAV Performance Analysis",
    "parameters": {
      "inputs": {
        "altitude": 1000,
        "velocity": 50,
        "weight": 25.5
      },
      "monte_carlo_runs": 1000
    },
    "configuration": {
      "execution_mode": "cloud_batch",
      "timeout_minutes": 60
    }
  }'
```

**Response** (201 Created):
```json
{
  "id": "sim-uuid-789",
  "name": "UAV Performance Analysis",
  "model_id": "model-uuid-123",
  "model_version": "1.2.0",
  "simulation_type": "monte_carlo",
  "status": "queued",
  "parameters": {
    "inputs": {
      "altitude": 1000,
      "velocity": 50,
      "weight": 25.5
    },
    "monte_carlo_runs": 1000,
    "random_seed": 42
  },
  "configuration": {
    "execution_mode": "cloud_batch",
    "timeout_minutes": 60,
    "priority": "HIGH"
  },
  "progress_percent": 0,
  "created_by": "user@dadms.com",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "retry_count": 0,
  "tags": ["uav", "performance", "monte-carlo"]
}
```

### 1.2 List Simulations

Retrieve a list of simulations with filtering and pagination.

**Endpoint**: `GET /api/v1/simulations`

**Query Parameters**:
- `status` (array): Filter by simulation status (`queued`, `running`, `completed`, `failed`)
- `model_id` (string): Filter by model ID
- `created_by` (string): Filter by creator
- `project_id` (string): Filter by project
- `simulation_type` (string): Filter by simulation type
- `tags` (array): Filter by tags
- `created_after` (date-time): Filter simulations created after date
- `created_before` (date-time): Filter simulations created before date
- `sort_by` (string): Sort field (`created_at`, `updated_at`, `duration`, `name`)
- `sort_order` (string): Sort order (`asc`, `desc`)
- `limit` (integer): Number of results per page (1-100, default: 20)
- `offset` (integer): Number of results to skip (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations?status=completed&model_id=model-uuid-123&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "simulations": [
    {
      "id": "sim-uuid-789",
      "name": "UAV Performance Analysis",
      "model_id": "model-uuid-123",
      "simulation_type": "monte_carlo",
      "status": "completed",
      "progress_percent": 100,
      "duration_seconds": 1800,
      "created_by": "user@dadms.com",
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T11:00:00Z",
      "tags": ["uav", "performance", "monte-carlo"]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### 1.3 Get Simulation Details

Retrieve detailed information about a specific simulation.

**Endpoint**: `GET /api/v1/simulations/{id}`

**Path Parameters**:
- `id` (string, required): Simulation ID

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "id": "sim-uuid-789",
  "name": "UAV Performance Analysis",
  "model_id": "model-uuid-123",
  "model_version": "1.2.0",
  "simulation_type": "monte_carlo",
  "status": "completed",
  "parameters": {
    "inputs": {
      "altitude": 1000,
      "velocity": 50,
      "weight": 25.5
    },
    "monte_carlo_runs": 1000,
    "random_seed": 42
  },
  "results": {
    "outputs": {
      "max_range": 15420.5,
      "fuel_consumption": 8.2,
      "mission_success_rate": 0.94
    },
    "summary_statistics": {
      "mean": {
        "max_range": 15420.5,
        "fuel_consumption": 8.2
      },
      "std_dev": {
        "max_range": 234.8,
        "fuel_consumption": 0.3
      }
    }
  },
  "metrics": {
    "resource_usage": {
      "peak_cpu_percent": 85.2,
      "average_cpu_percent": 72.1,
      "peak_memory_gb": 4.2,
      "average_memory_gb": 3.8
    },
    "performance_metrics": {
      "throughput": 125.5,
      "latency_ms": 8.2
    },
    "cost_metrics": {
      "compute_cost_usd": 12.45,
      "total_cost_usd": 12.45
    }
  },
  "duration_seconds": 1800,
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T11:00:00Z"
}
```

### 1.4 Cancel Simulation

Cancel a running simulation.

**Endpoint**: `DELETE /api/v1/simulations/{id}`

**cURL Example**:
```bash
curl -X DELETE "http://localhost:3011/api/v1/simulations/sim-uuid-789" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (204 No Content)

### 1.5 Retry Simulation

Retry a failed simulation.

**Endpoint**: `POST /api/v1/simulations/{id}/retry`

**cURL Example**:
```bash
curl -X POST "http://localhost:3011/api/v1/simulations/sim-uuid-789/retry" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "id": "sim-uuid-789",
  "status": "queued",
  "retry_count": 1,
  "updated_at": "2024-01-15T12:00:00Z"
}
```

---

## 2. Batch Processing

### 2.1 Run Batch Simulations

Execute multiple simulations with parameter variations.

**Endpoint**: `POST /api/v1/simulations/batch`

**Request Body**:
```json
{
  "base_request": {
    "model_id": "model-uuid-123",
    "name": "Parameter Sweep Analysis",
    "parameters": {
      "inputs": {
        "altitude": 1000,
        "velocity": 50
      }
    },
    "configuration": {
      "execution_mode": "parallel",
      "timeout_minutes": 30
    }
  },
  "parameter_variations": [
    {
      "set_id": "set-1",
      "parameters": {
        "weight": 20.0,
        "wind_speed": 5
      },
      "description": "Light weight, low wind"
    },
    {
      "set_id": "set-2",
      "parameters": {
        "weight": 25.0,
        "wind_speed": 10
      },
      "description": "Medium weight, medium wind"
    },
    {
      "set_id": "set-3",
      "parameters": {
        "weight": 30.0,
        "wind_speed": 15
      },
      "description": "Heavy weight, high wind"
    }
  ],
  "execution_mode": "parallel",
  "max_concurrent_runs": 10
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3011/api/v1/simulations/batch" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_request": {
      "model_id": "model-uuid-123",
      "name": "Parameter Sweep Analysis",
      "parameters": {
        "inputs": {
          "altitude": 1000,
          "velocity": 50
        }
      }
    },
    "parameter_variations": [
      {
        "set_id": "set-1",
        "parameters": {
          "weight": 20.0,
          "wind_speed": 5
        }
      }
    ],
    "execution_mode": "parallel"
  }'
```

**Response** (201 Created):
```json
{
  "batch_id": "batch-uuid-456",
  "total_simulations": 3,
  "simulation_ids": [
    "sim-uuid-101",
    "sim-uuid-102",
    "sim-uuid-103"
  ],
  "status": "queued",
  "created_at": "2024-01-15T14:00:00Z"
}
```

---

## 3. Status & Monitoring

### 3.1 Get Simulation Status

Get current status and progress of a simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/status`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/status" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "simulation_id": "sim-uuid-789",
  "status": "running",
  "progress_percent": 65,
  "current_phase": "monte_carlo_execution",
  "estimated_completion": "2024-01-15T11:15:00Z",
  "started_at": "2024-01-15T10:30:00Z",
  "elapsed_seconds": 1350
}
```

### 3.2 Get Simulation Progress

Get detailed progress information for a running simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/progress`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/progress" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "simulation_id": "sim-uuid-789",
  "progress_percent": 65,
  "current_phase": "monte_carlo_execution",
  "estimated_completion": "2024-01-15T11:15:00Z",
  "resource_usage": {
    "peak_cpu_percent": 78.5,
    "average_cpu_percent": 72.1,
    "peak_memory_gb": 3.8,
    "average_memory_gb": 3.2
  },
  "phases_completed": [
    "initialization",
    "parameter_validation",
    "model_loading"
  ],
  "current_iteration": 650,
  "total_iterations": 1000,
  "last_updated": "2024-01-15T10:52:30Z"
}
```

### 3.3 Get Simulation Logs

Retrieve execution logs for a simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/logs`

**Query Parameters**:
- `level` (string): Filter by log level (`DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`)
- `component` (string): Filter by component
- `limit` (integer): Number of log entries (1-1000, default: 100)

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/logs?level=INFO&limit=50" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "log-uuid-1",
    "simulation_id": "sim-uuid-789",
    "timestamp": "2024-01-15T10:30:15Z",
    "level": "INFO",
    "message": "Simulation started successfully",
    "component": "execution_engine",
    "metadata": {
      "model_id": "model-uuid-123",
      "instance_type": "c5.xlarge"
    }
  },
  {
    "id": "log-uuid-2",
    "simulation_id": "sim-uuid-789",
    "timestamp": "2024-01-15T10:45:22Z",
    "level": "INFO",
    "message": "Monte Carlo iteration 500 completed",
    "component": "monte_carlo_engine",
    "metadata": {
      "iteration": 500,
      "progress": 50.0
    }
  }
]
```

### 3.4 Get Simulation Metrics

Get performance and resource metrics for a simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/metrics`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/metrics" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "resource_usage": {
    "peak_cpu_percent": 85.2,
    "average_cpu_percent": 72.1,
    "peak_memory_gb": 4.2,
    "average_memory_gb": 3.8,
    "gpu_utilization_percent": 0,
    "network_io_gb": 0.15,
    "disk_io_gb": 2.3
  },
  "performance_metrics": {
    "throughput": 125.5,
    "latency_ms": 8.2,
    "convergence_rate": 0.95,
    "numerical_stability": 0.98
  },
  "cost_metrics": {
    "compute_cost_usd": 12.45,
    "storage_cost_usd": 0.23,
    "network_cost_usd": 0.05,
    "total_cost_usd": 12.73,
    "cost_per_simulation": 12.73
  },
  "environmental_metrics": {
    "carbon_footprint_kg": 0.025,
    "energy_consumption_kwh": 0.85,
    "efficiency_score": 0.88
  }
}
```

---

## 4. Results & Analytics

### 4.1 Get Simulation Results

Retrieve results and outputs from a completed simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/results`

**Query Parameters**:
- `format` (string): Result format (`json`, `csv`, `xlsx`)

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/results?format=json" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "outputs": {
    "max_range": 15420.5,
    "fuel_consumption": 8.2,
    "mission_success_rate": 0.94,
    "optimal_altitude": 1050,
    "optimal_velocity": 52.3
  },
  "summary_statistics": {
    "mean": {
      "max_range": 15420.5,
      "fuel_consumption": 8.2,
      "mission_success_rate": 0.94
    },
    "std_dev": {
      "max_range": 234.8,
      "fuel_consumption": 0.3,
      "mission_success_rate": 0.05
    },
    "min": {
      "max_range": 14850.2,
      "fuel_consumption": 7.1,
      "mission_success_rate": 0.78
    },
    "max": {
      "max_range": 16120.8,
      "fuel_consumption": 9.4,
      "mission_success_rate": 0.99
    },
    "percentiles": {
      "max_range": {
        "50": 15415.2,
        "95": 15890.4,
        "99": 16050.1
      }
    }
  },
  "convergence_metrics": {
    "convergence_achieved": true,
    "convergence_iterations": 850,
    "convergence_rate": 0.95,
    "final_error": 0.0001
  },
  "time_series": [
    {
      "variable_name": "altitude",
      "timestamps": ["2024-01-15T10:30:00Z", "2024-01-15T10:30:01Z"],
      "values": [1000, 1005]
    }
  ]
}
```

### 4.2 List Simulation Artifacts

List all output artifacts from a simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/artifacts`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/artifacts" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "artifact-uuid-1",
    "name": "results.json",
    "type": "results",
    "path": "/simulations/sim-uuid-789/outputs/results.json",
    "size": 15680,
    "hash": "sha256:abc123...",
    "mime_type": "application/json",
    "description": "Primary simulation results",
    "created_at": "2024-01-15T11:00:00Z"
  },
  {
    "id": "artifact-uuid-2",
    "name": "performance_plot.png",
    "type": "visualization",
    "path": "/simulations/sim-uuid-789/outputs/plots/performance_plot.png",
    "size": 245120,
    "hash": "sha256:def456...",
    "mime_type": "image/png",
    "description": "Performance analysis visualization",
    "created_at": "2024-01-15T11:00:05Z"
  }
]
```

### 4.3 Download Simulation Artifact

Download a specific output artifact from a simulation.

**Endpoint**: `GET /api/v1/simulations/{id}/artifacts/{name}`

**Path Parameters**:
- `id` (string, required): Simulation ID
- `name` (string, required): Artifact name

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/sim-uuid-789/artifacts/results.json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o results.json
```

**Response** (200 OK): Binary file download

### 4.4 Compare Simulations

Compare results from multiple simulations.

**Endpoint**: `POST /api/v1/simulations/compare`

**Request Body**:
```json
{
  "simulation_ids": [
    "sim-uuid-789",
    "sim-uuid-790",
    "sim-uuid-791"
  ],
  "comparison_metrics": [
    "max_range",
    "fuel_consumption",
    "mission_success_rate"
  ]
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:3011/api/v1/simulations/compare" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "simulation_ids": ["sim-uuid-789", "sim-uuid-790"],
    "comparison_metrics": ["max_range", "fuel_consumption"]
  }'
```

**Response** (200 OK):
```json
{
  "simulation_ids": ["sim-uuid-789", "sim-uuid-790"],
  "comparison_date": "2024-01-15T15:00:00Z",
  "metrics_comparison": {
    "max_range": {
      "sim-uuid-789": 15420.5,
      "sim-uuid-790": 14980.2,
      "difference": 440.3,
      "percent_change": 2.95
    },
    "fuel_consumption": {
      "sim-uuid-789": 8.2,
      "sim-uuid-790": 8.7,
      "difference": -0.5,
      "percent_change": -5.75
    }
  },
  "performance_comparison": {
    "execution_time": {
      "sim-uuid-789": 1800,
      "sim-uuid-790": 1650
    },
    "cost": {
      "sim-uuid-789": 12.73,
      "sim-uuid-790": 11.45
    }
  },
  "recommendation": "Simulation sim-uuid-789 achieved better performance metrics but at higher computational cost"
}
```

### 4.5 Get Result Summary

Get statistical summary across multiple simulations.

**Endpoint**: `POST /api/v1/simulations/summary`

**Request Body**:
```json
{
  "simulation_ids": [
    "sim-uuid-789",
    "sim-uuid-790",
    "sim-uuid-791"
  ],
  "summary_type": "statistical"
}
```

**Response** (200 OK):
```json
{
  "simulation_count": 3,
  "summary_type": "statistical",
  "statistical_summary": {
    "aggregated_statistics": {
      "mean": {
        "max_range": 15200.3,
        "fuel_consumption": 8.4
      },
      "std_dev": {
        "max_range": 220.1,
        "fuel_consumption": 0.25
      },
      "coefficient_of_variation": {
        "max_range": 0.014,
        "fuel_consumption": 0.030
      }
    },
    "trend_analysis": {
      "max_range": "increasing",
      "fuel_consumption": "stable"
    }
  },
  "performance_summary": {
    "average_execution_time": 1733.3,
    "success_rate": 1.0,
    "resource_efficiency": 0.88
  },
  "generated_at": "2024-01-15T15:30:00Z"
}
```

---

## 5. Resource Management

### 5.1 Get Resource Usage

Get current resource utilization across compute nodes.

**Endpoint**: `GET /api/v1/resources/usage`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/resources/usage" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "timestamp": "2024-01-15T16:00:00Z",
  "total_capacity": {
    "cpu_cores": 128,
    "memory_gb": 512,
    "gpu_count": 8,
    "storage_gb": 10240
  },
  "current_usage": {
    "peak_cpu_percent": 72.5,
    "average_cpu_percent": 68.2,
    "peak_memory_gb": 380.5,
    "average_memory_gb": 340.2,
    "gpu_utilization_percent": 45.0
  },
  "utilization_percent": 68.2,
  "active_simulations": 12,
  "queued_simulations": 5
}
```

### 5.2 Get Queue Status

Get current job queue status and statistics.

**Endpoint**: `GET /api/v1/queue/status`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/queue/status" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
{
  "queued_jobs": 5,
  "running_jobs": 12,
  "completed_jobs_today": 87,
  "failed_jobs_today": 3,
  "average_queue_time_minutes": 8.5,
  "average_execution_time_minutes": 32.7,
  "next_available_slot": "2024-01-15T16:15:00Z"
}
```

### 5.3 Estimate Execution Cost

Estimate cost and resource requirements for a simulation.

**Endpoint**: `POST /api/v1/simulations/estimate`

**Request Body**:
```json
{
  "model_id": "model-uuid-123",
  "parameters": {
    "inputs": {
      "altitude": 1000,
      "velocity": 50,
      "weight": 25.0
    },
    "monte_carlo_runs": 1000
  },
  "configuration": {
    "execution_mode": "cloud_batch",
    "compute_target": {
      "provider": "aws_batch",
      "instance_type": "c5.xlarge"
    }
  }
}
```

**Response** (200 OK):
```json
{
  "estimated_cost_usd": 12.50,
  "cost_breakdown": {
    "compute_cost_usd": 11.80,
    "storage_cost_usd": 0.45,
    "network_cost_usd": 0.25,
    "total_cost_usd": 12.50
  },
  "estimated_duration_minutes": 35,
  "confidence_level": 0.85,
  "based_on_simulations": 15
}
```

### 5.4 Get Compute Targets

Get available compute targets and their capabilities.

**Endpoint**: `GET /api/v1/compute-targets`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/compute-targets" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "local-1",
    "name": "Local Development",
    "provider": "local",
    "instance_type": "local",
    "capabilities": {
      "max_cpu_cores": 8,
      "max_memory_gb": 32,
      "gpu_count": 0,
      "supports_containers": true
    },
    "status": "available"
  },
  {
    "id": "aws-batch-1",
    "name": "AWS Batch Compute",
    "provider": "aws_batch",
    "instance_type": "c5.xlarge",
    "region": "us-east-1",
    "capabilities": {
      "max_cpu_cores": 4,
      "max_memory_gb": 8,
      "gpu_count": 0,
      "supports_containers": true,
      "auto_scaling": true
    },
    "status": "available"
  }
]
```

---

## 6. Search & Discovery

### 6.1 Search Simulations

Search simulations using text query and filters.

**Endpoint**: `GET /api/v1/simulations/search`

**Query Parameters**:
- `q` (string, required): Search query
- `model_type` (array): Filter by model types
- `simulation_type` (array): Filter by simulation types
- `status` (array): Filter by status
- `limit` (integer): Number of results (1-100, default: 20)

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/simulations/search?q=UAV%20performance&simulation_type=monte_carlo&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "sim-uuid-789",
    "name": "UAV Performance Analysis",
    "model_id": "model-uuid-123",
    "simulation_type": "monte_carlo",
    "status": "completed",
    "progress_percent": 100,
    "duration_seconds": 1800,
    "created_by": "user@dadms.com",
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T11:00:00Z",
    "tags": ["uav", "performance", "monte-carlo"],
    "relevance_score": 0.95,
    "matched_fields": ["name", "tags", "description"]
  }
]
```

### 6.2 Get Model Simulation History

Get all simulations run for a specific model.

**Endpoint**: `GET /api/v1/models/{id}/simulations`

**Path Parameters**:
- `id` (string, required): Model ID

**Query Parameters**:
- `limit` (integer): Number of results (1-100, default: 20)
- `offset` (integer): Number of results to skip (default: 0)

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/api/v1/models/model-uuid-123/simulations?limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Response** (200 OK):
```json
[
  {
    "id": "sim-uuid-789",
    "name": "UAV Performance Analysis",
    "model_id": "model-uuid-123",
    "simulation_type": "monte_carlo",
    "status": "completed",
    "progress_percent": 100,
    "duration_seconds": 1800,
    "created_by": "user@dadms.com",
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T11:00:00Z",
    "tags": ["uav", "performance", "monte-carlo"]
  }
]
```

---

## 7. Health & Monitoring

### 7.1 Health Check

Service health check endpoint.

**Endpoint**: `GET /health`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/health"
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T16:00:00Z",
  "version": "2.0.0",
  "dependencies": {
    "database": "healthy",
    "job_queue": "healthy",
    "object_storage": "healthy",
    "model_manager": "healthy",
    "event_manager": "healthy"
  },
  "queue_status": {
    "queued_jobs": 5,
    "running_jobs": 12,
    "next_available_slot": "2024-01-15T16:15:00Z"
  },
  "resource_status": {
    "utilization_percent": 68.2,
    "active_simulations": 12,
    "available_capacity": "high"
  }
}
```

### 7.2 Service Metrics

Prometheus-formatted service metrics.

**Endpoint**: `GET /metrics`

**cURL Example**:
```bash
curl -X GET "http://localhost:3011/metrics"
```

**Response** (200 OK):
```
# HELP simulation_total Total number of simulations
# TYPE simulation_total counter
simulation_total{status="completed"} 87
simulation_total{status="failed"} 3
simulation_total{status="running"} 12

# HELP simulation_duration_seconds Simulation execution duration
# TYPE simulation_duration_seconds histogram
simulation_duration_seconds_bucket{le="300"} 15
simulation_duration_seconds_bucket{le="1800"} 65
simulation_duration_seconds_bucket{le="3600"} 85
simulation_duration_seconds_bucket{le="+Inf"} 87

# HELP resource_utilization_percent Current resource utilization
# TYPE resource_utilization_percent gauge
resource_utilization_percent{resource="cpu"} 68.2
resource_utilization_percent{resource="memory"} 66.4
resource_utilization_percent{resource="gpu"} 45.0
```

---

## 8. Error Handling

### Standard Error Response

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "SIMULATION_NOT_FOUND",
    "message": "Simulation with ID 'sim-uuid-789' not found",
    "details": {
      "simulation_id": "sim-uuid-789",
      "timestamp": "2024-01-15T16:00:00Z",
      "trace_id": "trace-uuid-123"
    }
  }
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return
- **400 Bad Request**: Invalid request parameters or body
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the requested operation
- **404 Not Found**: Requested resource not found
- **409 Conflict**: Resource already exists or conflict with current state
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Common Error Codes

- `SIMULATION_NOT_FOUND`: Simulation ID not found
- `MODEL_NOT_FOUND`: Referenced model not found
- `INVALID_PARAMETERS`: Invalid simulation parameters
- `EXECUTION_FAILED`: Simulation execution failed
- `INSUFFICIENT_RESOURCES`: Not enough compute resources available
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_REQUIRED`: Valid JWT token required
- `PERMISSION_DENIED`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Rate Limiting

The API implements rate limiting with the following headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642276800
```

**Rate Limits by User Type:**
- **Free Tier**: 100 requests/hour, 10 concurrent simulations
- **Premium**: 1,000 requests/hour, 50 concurrent simulations
- **Enterprise**: 10,000 requests/hour, 500 concurrent simulations

---

## 9. Authentication

### JWT Token Format

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Required JWT Claims

```json
{
  "sub": "user@dadms.com",
  "iat": 1642273200,
  "exp": 1642276800,
  "aud": "dadms-simulation-manager",
  "iss": "dadms-auth",
  "permissions": [
    "simulation:read",
    "simulation:write",
    "simulation:execute",
    "resource:read"
  ],
  "projects": ["project-uuid-456"],
  "user_type": "premium"
}
```

### Permission Levels

- **simulation:read**: View simulations and results
- **simulation:write**: Create and modify simulations
- **simulation:execute**: Execute and cancel simulations
- **simulation:delete**: Delete simulations and artifacts
- **resource:read**: View resource usage and queue status
- **resource:manage**: Manage compute targets and scaling
- **admin**: Full administrative access

---

## 10. SDK & Code Examples

### Python SDK Example

```python
import requests
import json
from typing import Dict, List, Optional

class SimulationManagerClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def run_simulation(self, model_id: str, parameters: Dict, 
                      configuration: Optional[Dict] = None, 
                      name: Optional[str] = None) -> Dict:
        """Run a new simulation"""
        payload = {
            "model_id": model_id,
            "parameters": parameters
        }
        if configuration:
            payload["configuration"] = configuration
        if name:
            payload["name"] = name
            
        response = requests.post(
            f"{self.base_url}/api/v1/simulations",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def get_simulation(self, simulation_id: str) -> Dict:
        """Get simulation details"""
        response = requests.get(
            f"{self.base_url}/api/v1/simulations/{simulation_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_simulation_results(self, simulation_id: str, 
                             format: str = "json") -> Dict:
        """Get simulation results"""
        response = requests.get(
            f"{self.base_url}/api/v1/simulations/{simulation_id}/results",
            headers=self.headers,
            params={"format": format}
        )
        response.raise_for_status()
        return response.json()
    
    def list_simulations(self, filters: Optional[Dict] = None) -> Dict:
        """List simulations with optional filters"""
        params = filters or {}
        response = requests.get(
            f"{self.base_url}/api/v1/simulations",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

# Usage Example
client = SimulationManagerClient("http://localhost:3011", "your-jwt-token")

# Run a Monte Carlo simulation
simulation = client.run_simulation(
    model_id="model-uuid-123",
    parameters={
        "inputs": {
            "altitude": 1000,
            "velocity": 50,
            "weight": 25.0
        },
        "monte_carlo_runs": 1000
    },
    configuration={
        "execution_mode": "cloud_batch",
        "timeout_minutes": 60
    },
    name="UAV Performance Analysis"
)

print(f"Simulation started: {simulation['id']}")

# Monitor progress
import time
while True:
    status = client.get_simulation(simulation['id'])
    print(f"Status: {status['status']}, Progress: {status['progress_percent']}%")
    
    if status['status'] in ['completed', 'failed', 'cancelled']:
        break
    
    time.sleep(10)

# Get results if completed
if status['status'] == 'completed':
    results = client.get_simulation_results(simulation['id'])
    print(f"Results: {results['outputs']}")
```

### JavaScript/Node.js SDK Example

```javascript
const axios = require('axios');

class SimulationManagerClient {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async runSimulation(modelId, parameters, configuration = null, name = null) {
        const payload = {
            model_id: modelId,
            parameters: parameters
        };
        
        if (configuration) payload.configuration = configuration;
        if (name) payload.name = name;

        const response = await this.client.post('/api/v1/simulations', payload);
        return response.data;
    }

    async getSimulation(simulationId) {
        const response = await this.client.get(`/api/v1/simulations/${simulationId}`);
        return response.data;
    }

    async getSimulationResults(simulationId, format = 'json') {
        const response = await this.client.get(
            `/api/v1/simulations/${simulationId}/results`,
            { params: { format } }
        );
        return response.data;
    }

    async listSimulations(filters = {}) {
        const response = await this.client.get('/api/v1/simulations', { params: filters });
        return response.data;
    }

    async compareSimulations(simulationIds, metrics) {
        const response = await this.client.post('/api/v1/simulations/compare', {
            simulation_ids: simulationIds,
            comparison_metrics: metrics
        });
        return response.data;
    }
}

// Usage Example
const client = new SimulationManagerClient('http://localhost:3011', 'your-jwt-token');

(async () => {
    try {
        // Run simulation
        const simulation = await client.runSimulation(
            'model-uuid-123',
            {
                inputs: {
                    altitude: 1000,
                    velocity: 50,
                    weight: 25.0
                },
                monte_carlo_runs: 1000
            },
            {
                execution_mode: 'cloud_batch',
                timeout_minutes: 60
            },
            'UAV Performance Analysis'
        );

        console.log(`Simulation started: ${simulation.id}`);

        // Poll for completion
        let status;
        do {
            status = await client.getSimulation(simulation.id);
            console.log(`Status: ${status.status}, Progress: ${status.progress_percent}%`);
            
            if (status.status === 'running') {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        } while (!['completed', 'failed', 'cancelled'].includes(status.status));

        // Get results if completed
        if (status.status === 'completed') {
            const results = await client.getSimulationResults(simulation.id);
            console.log('Results:', results.outputs);
        }

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
})();
```

---

## Related Documentation

- **[OpenAPI Specification](simulation_manager_service_openapi.yaml)**: Machine-readable API specification
- **[Service Architecture](../architecture/simulation_manager_specification.md)**: Complete technical specification
- **[Interactive Documentation](http://localhost:3011/docs)**: Swagger UI for testing endpoints
- **[Model Manager API](model_manager_api_endpoints.md)**: Related model management endpoints
- **[EventManager Integration](../architecture/event_manager_specification.md)**: Event-driven integration patterns

---

*This documentation is automatically generated from the OpenAPI specification. For the most up-to-date information, refer to the interactive documentation at `/docs` or the OpenAPI YAML file.* 