# Parameter Manager Service API Endpoints

**Service**: Parameter Manager  
**Purpose**: Centralized management of decision model parameters across the DADMS Event-Driven System  
**Port**: 3013  
**Key Features**: Parameter lifecycle management, immutable versioning, advanced validation, template system, usage tracking, and comprehensive audit trails

## Overview

The Parameter Manager service provides comprehensive parameter management capabilities for DADMS, enabling:

- **Centralized Parameter Storage**: Single source of truth for all decision model parameters
- **Version Control**: Immutable versioning with fork-based collaboration
- **Advanced Validation**: Type checking, constraint validation, and cross-parameter rules
- **Template System**: Reusable parameter set templates with inheritance
- **Usage Tracking**: Complete lineage and audit trails for parameter usage
- **Schema Framework**: Structured parameter definitions with validation
- **Search & Discovery**: Intelligent parameter search and similarity matching

## Quick Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **Parameter Set Management** |
| POST   | `/parameter-sets` | Create new parameter set | Yes |
| GET    | `/parameter-sets` | List parameter sets with filtering | Yes |
| GET    | `/parameter-sets/{id}` | Get specific parameter set | Yes |
| PUT    | `/parameter-sets/{id}` | Update parameter set | Yes |
| DELETE | `/parameter-sets/{id}` | Delete parameter set | Yes |
| POST   | `/parameter-sets/{id}/fork` | Fork parameter set | Yes |
| POST   | `/parameter-sets/{id}/lock` | Lock parameter set (make immutable) | Yes |
| POST   | `/parameter-sets/{id}/archive` | Archive parameter set | Yes |
| GET    | `/parameter-sets/{id}/compare` | Compare two parameter sets | Yes |
| **Parameter Management** |
| POST   | `/parameter-sets/{setId}/parameters` | Add parameter to set | Yes |
| PUT    | `/parameter-sets/{setId}/parameters/{paramName}` | Update parameter | Yes |
| DELETE | `/parameter-sets/{setId}/parameters/{paramName}` | Remove parameter | Yes |
| POST   | `/parameter-sets/{setId}/parameters/{paramName}/validate` | Validate parameter | Yes |
| **Validation & Quality** |
| POST   | `/parameter-sets/{id}/validate` | Validate entire parameter set | Yes |
| POST   | `/parameter-sets/{id}/validate-values` | Validate parameter values | Yes |
| POST   | `/parameter-sets/{id}/suggest-values` | Get intelligent value suggestions | Yes |
| **Schema Management** |
| POST   | `/schemas` | Register parameter schema | Yes |
| GET    | `/schemas` | List parameter schemas | Yes |
| GET    | `/schemas/{schemaId}` | Get specific schema | Yes |
| POST   | `/parameter-sets/{id}/validate-schema` | Validate against schema | Yes |
| **Templates** |
| POST   | `/templates` | Create parameter template | Yes |
| GET    | `/templates` | List parameter templates | Yes |
| GET    | `/templates/{templateId}` | Get specific template | Yes |
| POST   | `/templates/{templateId}/instantiate` | Create set from template | Yes |
| **Version Management** |
| GET    | `/parameter-sets/{id}/versions` | Get version history | Yes |
| POST   | `/parameter-sets/{id}/versions` | Create new version | Yes |
| GET    | `/parameter-sets/{id}/versions/{versionId}` | Get specific version | Yes |
| POST   | `/parameter-sets/{id}/rollback` | Rollback to previous version | Yes |
| **Usage & Lineage** |
| GET    | `/parameter-sets/{id}/usage` | Get usage history | Yes |
| GET    | `/parameter-sets/{id}/parameters/{paramName}/lineage` | Get parameter lineage | Yes |
| GET    | `/decisions/{decisionId}/parameters` | Find parameters used in decision | Yes |
| **Search & Discovery** |
| GET    | `/search/parameters` | Search parameters | Yes |
| GET    | `/parameters/by-tags` | Get parameters by tags | Yes |
| GET    | `/parameter-sets/{id}/similar` | Find similar parameter sets | Yes |
| **Import & Export** |
| GET    | `/parameter-sets/{id}/export` | Export parameter set | Yes |
| POST   | `/parameter-sets/import` | Import parameter set | Yes |
| **Health & Monitoring** |
| GET    | `/health` | Service health check | No |
| GET    | `/metrics` | Service performance metrics | Yes |

---

## 1. Parameter Set Management

### POST `/parameter-sets`
**Description**: Create a new parameter set with validation

**Request Body**:
```json
{
  "name": "Aircraft Dynamics Model v1.0",
  "description": "Parameter set for aircraft dynamics simulation",
  "domain": "aviation",
  "category": "simulation",
  "parameters": {
    "gravity": {
      "name": "gravity",
      "description": "Gravitational acceleration",
      "type": "number",
      "value": 9.81,
      "unit": "meter_per_second_squared",
      "parameter_class": "constant",
      "source_type": "default",
      "constraints": {
        "min_value": 9.0,
        "max_value": 10.0
      },
      "is_required": true,
      "is_configurable": false,
      "sensitivity_level": "public",
      "validation_status": "valid"
    },
    "air_density": {
      "name": "air_density",
      "description": "Air density at sea level",
      "type": "number",
      "value": 1.225,
      "unit": "kilogram_per_cubic_meter",
      "parameter_class": "independent",
      "source_type": "environmental",
      "constraints": {
        "min_value": 0.5,
        "max_value": 2.0
      },
      "is_required": true,
      "is_configurable": true,
      "sensitivity_level": "public",
      "validation_status": "valid"
    }
  },
  "tags": ["aviation", "physics", "simulation"],
  "usage_context": ["flight_simulation", "aerodynamics"]
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parameter_set": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Aircraft Dynamics Model v1.0",
    "description": "Parameter set for aircraft dynamics simulation",
    "version": "1.0.0",
    "domain": "aviation",
    "category": "simulation",
    "status": "active",
    "is_immutable": false,
    "author": "user123",
    "created_at": "2025-01-15T14:35:12Z",
    "updated_at": "2025-01-15T14:35:12Z"
  },
  "validation_result": {
    "is_valid": true,
    "overall_score": 0.95,
    "validation_summary": {
      "total_parameters": 2,
      "valid_parameters": 2,
      "invalid_parameters": 0,
      "warning_parameters": 0,
      "error_count": 0,
      "warning_count": 0
    }
  },
  "created_at": "2025-01-15T14:35:12Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3013/parameter-sets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Aircraft Dynamics Model v1.0",
    "description": "Parameter set for aircraft dynamics simulation",
    "domain": "aviation",
    "category": "simulation",
    "parameters": {
      "gravity": {
        "name": "gravity",
        "description": "Gravitational acceleration",
        "type": "number",
        "value": 9.81,
        "unit": "meter_per_second_squared",
        "parameter_class": "constant",
        "source_type": "default",
        "constraints": {"min_value": 9.0, "max_value": 10.0},
        "is_required": true,
        "is_configurable": false,
        "sensitivity_level": "public",
        "validation_status": "valid"
      }
    }
  }'
```

**Python SDK Example**:
```python
import requests
import json

def create_parameter_set(api_base, token, parameter_set_data):
    """Create a new parameter set"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        f"{api_base}/parameter-sets",
        headers=headers,
        json=parameter_set_data
    )
    
    if response.status_code == 201:
        return response.json()
    else:
        response.raise_for_status()

# Usage
parameter_set_data = {
    "name": "Aircraft Dynamics Model v1.0",
    "description": "Parameter set for aircraft dynamics simulation",
    "domain": "aviation",
    "category": "simulation",
    "parameters": {
        "gravity": {
            "name": "gravity",
            "description": "Gravitational acceleration",
            "type": "number",
            "value": 9.81,
            "unit": "meter_per_second_squared",
            "parameter_class": "constant",
            "source_type": "default",
            "constraints": {"min_value": 9.0, "max_value": 10.0},
            "is_required": True,
            "is_configurable": False,
            "sensitivity_level": "public",
            "validation_status": "valid"
        }
    },
    "tags": ["aviation", "physics", "simulation"],
    "usage_context": ["flight_simulation", "aerodynamics"]
}

result = create_parameter_set("http://localhost:3013", "your_jwt_token", parameter_set_data)
print(f"Created parameter set: {result['id']}")
```

**Node.js SDK Example**:
```javascript
const axios = require('axios');

async function createParameterSet(apiBase, token, parameterSetData) {
    try {
        const response = await axios.post(`${apiBase}/parameter-sets`, parameterSetData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error creating parameter set:', error.response?.data || error.message);
        throw error;
    }
}

// Usage
const parameterSetData = {
    name: "Aircraft Dynamics Model v1.0",
    description: "Parameter set for aircraft dynamics simulation",
    domain: "aviation",
    category: "simulation",
    parameters: {
        gravity: {
            name: "gravity",
            description: "Gravitational acceleration",
            type: "number",
            value: 9.81,
            unit: "meter_per_second_squared",
            parameter_class: "constant",
            source_type: "default",
            constraints: { min_value: 9.0, max_value: 10.0 },
            is_required: true,
            is_configurable: false,
            sensitivity_level: "public",
            validation_status: "valid"
        }
    },
    tags: ["aviation", "physics", "simulation"],
    usage_context: ["flight_simulation", "aerodynamics"]
};

createParameterSet("http://localhost:3013", "your_jwt_token", parameterSetData)
    .then(result => console.log(`Created parameter set: ${result.id}`))
    .catch(error => console.error('Failed to create parameter set:', error));
```

---

### GET `/parameter-sets`
**Description**: List parameter sets with optional filtering

**Query Parameters**:
- `domain`: Filter by domain (e.g., "aviation", "finance")
- `category`: Filter by category (simulation, analysis, scoring, etc.)
- `tags`: Filter by tags (comma-separated)
- `status`: Filter by status (active, draft, archived, locked)
- `author`: Filter by author
- `search_term`: Search in name and description
- `created_after`: Filter by creation date (ISO 8601)
- `created_before`: Filter by creation date (ISO 8601)
- `limit`: Maximum results (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

**Response** (200 OK):
```json
{
  "parameter_sets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Aircraft Dynamics Model v1.0",
      "description": "Parameter set for aircraft dynamics simulation",
      "version": "1.0.0",
      "domain": "aviation",
      "category": "simulation",
      "status": "active",
      "parameter_count": 15,
      "author": "user123",
      "tags": ["aviation", "physics", "simulation"],
      "created_at": "2025-01-15T14:35:12Z",
      "updated_at": "2025-01-15T14:35:12Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0,
  "has_more": false
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3013/parameter-sets?domain=aviation&category=simulation&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### POST `/parameter-sets/{id}/fork`
**Description**: Create a new parameter set based on an existing one

**Request Body**:
```json
{
  "name": "Aircraft Dynamics Model v1.1",
  "description": "Updated model with improved air resistance calculations",
  "reason": "Performance optimization for high-altitude scenarios",
  "modifications": {
    "air_density": {
      "value": 1.200
    },
    "drag_coefficient": {
      "value": 0.025
    }
  }
}
```

**Response** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "parameter_set": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Aircraft Dynamics Model v1.1",
    "description": "Updated model with improved air resistance calculations",
    "version": "1.0.0",
    "parent_set_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active"
  },
  "validation_result": {
    "is_valid": true,
    "overall_score": 0.96
  },
  "created_at": "2025-01-15T15:20:30Z"
}
```

---

## 2. Parameter Management

### POST `/parameter-sets/{setId}/parameters`
**Description**: Add a new parameter to an existing parameter set

**Request Body**:
```json
{
  "name": "wing_span",
  "description": "Aircraft wing span",
  "type": "number",
  "value": 35.8,
  "unit": "meter",
  "parameter_class": "independent",
  "source_type": "user_input",
  "constraints": {
    "min_value": 10.0,
    "max_value": 80.0,
    "precision": 1
  },
  "tags": ["geometry", "aircraft"],
  "is_required": true,
  "is_configurable": true,
  "sensitivity_level": "internal",
  "validation_status": "valid"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Parameter added successfully"
}
```

---

### PUT `/parameter-sets/{setId}/parameters/{paramName}`
**Description**: Update an existing parameter in a parameter set

**Request Body**:
```json
{
  "value": 36.5,
  "description": "Updated aircraft wing span with new measurements",
  "constraints": {
    "min_value": 10.0,
    "max_value": 85.0,
    "precision": 1
  },
  "tags": ["geometry", "aircraft", "updated"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Parameter updated successfully"
}
```

---

## 3. Validation & Quality

### POST `/parameter-sets/{id}/validate`
**Description**: Validate an entire parameter set including cross-parameter rules

**Response** (200 OK):
```json
{
  "is_valid": true,
  "overall_score": 0.92,
  "validation_summary": {
    "total_parameters": 15,
    "valid_parameters": 14,
    "invalid_parameters": 0,
    "warning_parameters": 1,
    "error_count": 0,
    "warning_count": 2
  },
  "parameter_results": {
    "gravity": {
      "parameter_name": "gravity",
      "is_valid": true,
      "validation_errors": [],
      "validation_warnings": [],
      "constraint_violations": [],
      "suggestions": []
    },
    "air_density": {
      "parameter_name": "air_density",
      "is_valid": true,
      "validation_errors": [],
      "validation_warnings": [
        {
          "warning_code": "PRECISION_SUGGESTION",
          "warning_message": "Consider using higher precision for better accuracy",
          "parameter_path": "air_density",
          "recommendation": "Increase precision to 4 decimal places"
        }
      ],
      "constraint_violations": [],
      "suggestions": ["Consider environmental variation factors"]
    }
  },
  "cross_validation_results": {
    "is_valid": true,
    "rule_results": [
      {
        "rule_id": "physics_consistency",
        "rule_description": "Physical constants must be within expected ranges",
        "is_satisfied": true,
        "affected_parameters": ["gravity", "air_density"]
      }
    ],
    "dependency_violations": []
  },
  "recommendations": [
    {
      "recommendation_id": "rec_001",
      "recommendation_type": "adjust_constraint",
      "description": "Consider tightening air density constraints for specific altitude ranges",
      "affected_parameters": ["air_density"],
      "auto_applicable": false,
      "priority": "medium"
    }
  ]
}
```

---

### POST `/parameter-sets/{id}/validate-values`
**Description**: Validate specific parameter values against the parameter set definition

**Request Body**:
```json
{
  "gravity": 9.81,
  "air_density": 1.225,
  "wing_span": 35.0,
  "max_altitude": 12000
}
```

**Response** (200 OK):
```json
{
  "is_valid": true,
  "overall_score": 0.98,
  "validation_summary": {
    "total_parameters": 4,
    "valid_parameters": 4,
    "invalid_parameters": 0,
    "warning_parameters": 0,
    "error_count": 0,
    "warning_count": 0
  },
  "parameter_results": {
    "gravity": {
      "parameter_name": "gravity",
      "is_valid": true,
      "validation_errors": [],
      "validation_warnings": [],
      "constraint_violations": [],
      "suggestions": []
    }
  }
}
```

---

### POST `/parameter-sets/{id}/suggest-values`
**Description**: Get intelligent suggestions for parameter values based on context

**Request Body** (optional):
```json
{
  "usage_context": "commercial_aviation",
  "target_domain": "flight_simulation",
  "performance_requirements": {
    "accuracy": "high",
    "speed": "medium"
  },
  "regulatory_requirements": ["FAA", "EASA"]
}
```

**Response** (200 OK):
```json
{
  "suggested_values": {
    "gravity": {
      "suggested_value": 9.80665,
      "confidence": 0.95,
      "reasoning": "Standard gravity value for aviation calculations",
      "source": "domain_knowledge"
    },
    "air_density": {
      "suggested_value": 1.225,
      "confidence": 0.90,
      "reasoning": "Sea level standard atmospheric density",
      "source": "historical_data"
    }
  },
  "confidence_scores": {
    "gravity": 0.95,
    "air_density": 0.90
  },
  "reasoning": {
    "gravity": "Recommended for commercial aviation compliance",
    "air_density": "Optimal for sea level operations"
  },
  "alternative_configurations": [
    {
      "configuration_name": "High Altitude Configuration",
      "parameter_values": {
        "air_density": 0.414,
        "gravity": 9.78
      },
      "expected_performance": "Optimized for 35,000 ft operations",
      "trade_offs": "Reduced accuracy at lower altitudes"
    }
  ]
}
```

---

## 4. Schema Management

### POST `/schemas`
**Description**: Register a new parameter schema definition

**Request Body**:
```json
{
  "name": "Physics Simulation Schema",
  "version": "1.0",
  "description": "Standard schema for physics-based simulations",
  "schema_type": "strict",
  "parameter_definitions": {
    "gravity": {
      "type": "number",
      "description": "Gravitational acceleration",
      "constraints": {
        "min_value": 8.0,
        "max_value": 12.0
      },
      "metadata": {
        "unit": "meter_per_second_squared",
        "category": "physical_constant"
      }
    },
    "air_density": {
      "type": "number",
      "description": "Air density",
      "constraints": {
        "min_value": 0.1,
        "max_value": 3.0
      },
      "metadata": {
        "unit": "kilogram_per_cubic_meter",
        "category": "environmental"
      }
    }
  },
  "required_parameters": ["gravity"],
  "domain": "physics",
  "category": "simulation"
}
```

**Response** (201 Created):
```json
{
  "schema_id": "770e8400-e29b-41d4-a716-446655440002",
  "schema": {
    "schema_id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Physics Simulation Schema",
    "version": "1.0",
    "status": "active"
  },
  "validation_result": {
    "is_valid": true,
    "overall_score": 1.0
  },
  "created_at": "2025-01-15T16:00:00Z"
}
```

---

## 5. Templates

### POST `/templates`
**Description**: Create a new parameter template for reuse

**Request Body**:
```json
{
  "name": "Aircraft Simulation Template",
  "description": "Standard template for aircraft simulation parameters",
  "category": "simulation",
  "parameter_definitions": [
    {
      "name": "gravity",
      "type": "number",
      "description": "Gravitational acceleration",
      "constraints": {
        "min_value": 9.0,
        "max_value": 10.0
      },
      "default_value": 9.81,
      "is_required": true,
      "group": "physics"
    },
    {
      "name": "air_density",
      "type": "number",
      "description": "Air density",
      "constraints": {
        "min_value": 0.5,
        "max_value": 2.0
      },
      "default_value": 1.225,
      "is_required": true,
      "group": "environmental"
    }
  ],
  "required_parameters": ["gravity", "air_density"],
  "optional_parameters": ["wind_speed", "temperature"],
  "usage_examples": [
    {
      "name": "Commercial Aviation",
      "description": "Parameters for commercial aircraft simulation",
      "use_case": "airline_operations",
      "parameter_values": {
        "gravity": 9.81,
        "air_density": 1.225,
        "wind_speed": 0
      }
    }
  ],
  "documentation": "Standard template for aircraft dynamics simulation with physics and environmental parameters",
  "is_active": true
}
```

**Response** (201 Created):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "template": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Aircraft Simulation Template",
    "description": "Standard template for aircraft simulation parameters",
    "category": "simulation",
    "is_active": true
  },
  "created_at": "2025-01-15T16:30:00Z"
}
```

---

### POST `/templates/{templateId}/instantiate`
**Description**: Create a parameter set from a template

**Request Body**:
```json
{
  "name": "My Aircraft Simulation",
  "description": "Custom aircraft simulation based on standard template",
  "overrides": {
    "air_density": 1.200,
    "wind_speed": 5.0
  }
}
```

**Response** (201 Created):
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "parameter_set": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "name": "My Aircraft Simulation",
    "description": "Custom aircraft simulation based on standard template",
    "version": "1.0.0",
    "status": "active"
  },
  "validation_result": {
    "is_valid": true,
    "overall_score": 0.97
  },
  "created_at": "2025-01-15T16:45:00Z"
}
```

---

## 6. Version Management

### GET `/parameter-sets/{id}/versions`
**Description**: Retrieve version history for a parameter set

**Response** (200 OK):
```json
{
  "versions": [
    {
      "version_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "version_number": "2.1.0",
      "change_type": "minor",
      "change_summary": "Added wind resistance parameter",
      "change_justification": "Improved accuracy for high-speed scenarios",
      "breaking_changes": [],
      "created_by": "user123",
      "created_at": "2025-01-15T17:00:00Z",
      "usage_count": 5,
      "last_used_at": "2025-01-15T18:30:00Z"
    },
    {
      "version_id": "bb0e8400-e29b-41d4-a716-446655440006",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "version_number": "2.0.0",
      "change_type": "major",
      "change_summary": "Restructured parameter organization",
      "change_justification": "Better alignment with new simulation engine",
      "breaking_changes": ["Changed gravity parameter name from 'g' to 'gravity'"],
      "created_by": "user456",
      "created_at": "2025-01-14T10:00:00Z",
      "usage_count": 12,
      "last_used_at": "2025-01-15T16:45:00Z"
    }
  ],
  "total": 2
}
```

---

### POST `/parameter-sets/{id}/versions`
**Description**: Create a new version of a parameter set

**Request Body**:
```json
{
  "change_type": "minor",
  "change_summary": "Updated air density constraints for better accuracy",
  "change_justification": "Based on recent atmospheric data analysis",
  "breaking_changes": [],
  "effective_date": "2025-01-16T00:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "version_id": "cc0e8400-e29b-41d4-a716-446655440007",
  "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
  "version_number": "2.2.0",
  "change_type": "minor",
  "change_summary": "Updated air density constraints for better accuracy",
  "created_by": "user123",
  "created_at": "2025-01-15T18:00:00Z"
}
```

---

## 7. Usage & Lineage

### GET `/parameter-sets/{id}/usage`
**Description**: Retrieve usage history for a parameter set

**Query Parameters**:
- `start_date`: Filter usage after date (ISO 8601)
- `end_date`: Filter usage before date (ISO 8601)
- `used_by_service`: Filter by service name
- `limit`: Maximum results (default: 50)

**Response** (200 OK):
```json
{
  "usage_records": [
    {
      "usage_id": "dd0e8400-e29b-41d4-a716-446655440008",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "version_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "used_by_service": "simulation-manager",
      "used_by_component": "physics-engine",
      "usage_context": "aircraft_dynamics_simulation",
      "parameters_accessed": ["gravity", "air_density", "wing_span"],
      "decision_id": "decision_789",
      "simulation_id": "sim_12345",
      "used_at": "2025-01-15T18:30:00Z"
    },
    {
      "usage_id": "ee0e8400-e29b-41d4-a716-446655440009",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "version_id": "aa0e8400-e29b-41d4-a716-446655440005",
      "used_by_service": "analysis-manager",
      "used_by_component": "sensitivity-analyzer",
      "usage_context": "parameter_sensitivity_analysis",
      "parameters_accessed": ["gravity", "air_density"],
      "analysis_id": "analysis_67890",
      "used_at": "2025-01-15T17:45:00Z"
    }
  ],
  "total": 2
}
```

---

### GET `/parameter-sets/{id}/parameters/{paramName}/lineage`
**Description**: Get lineage information for a specific parameter

**Response** (200 OK):
```json
{
  "parameter_name": "air_density",
  "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
  "origin": {
    "source_type": "environmental",
    "source_details": "NOAA atmospheric data",
    "original_value": 1.225,
    "created_by": "user123",
    "created_at": "2025-01-15T14:35:12Z",
    "source_metadata": {
      "data_source": "NOAA",
      "measurement_location": "sea_level",
      "temperature": "15°C"
    }
  },
  "derivation_chain": [
    {
      "step_order": 1,
      "operation": "altitude_adjustment",
      "input_parameters": ["air_density", "altitude"],
      "transformation_function": "barometric_formula",
      "intermediate_value": 1.112,
      "performed_by": "atmospheric_calculator",
      "performed_at": "2025-01-15T15:00:00Z"
    }
  ],
  "usage_history": [
    {
      "usage_id": "dd0e8400-e29b-41d4-a716-446655440008",
      "used_by_service": "simulation-manager",
      "usage_context": "aircraft_dynamics_simulation",
      "used_at": "2025-01-15T18:30:00Z"
    }
  ],
  "related_parameters": [
    {
      "parameter_name": "temperature",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "relationship_type": "influences",
      "relationship_strength": 0.85,
      "description": "Temperature affects air density calculation"
    },
    {
      "parameter_name": "altitude",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "relationship_type": "influences",
      "relationship_strength": 0.92,
      "description": "Altitude significantly affects air density"
    }
  ],
  "impact_analysis": {
    "downstream_parameters": ["lift_coefficient", "drag_coefficient"],
    "affected_decisions": ["flight_path_optimization", "fuel_consumption_calculation"],
    "sensitivity_score": 0.78,
    "change_propagation": [
      {
        "target_parameter": "lift_coefficient",
        "propagation_type": "automatic",
        "estimated_impact": "medium",
        "requires_validation": true
      }
    ]
  }
}
```

---

## 8. Search & Discovery

### GET `/search/parameters`
**Description**: Search for parameters across all parameter sets

**Query Parameters**:
- `q`: Search query (required)
- `type`: Filter by parameter type (number, string, boolean, etc.)
- `domain`: Filter by domain
- `tags`: Filter by tags (comma-separated)
- `limit`: Maximum results (default: 20)
- `offset`: Number of results to skip (default: 0)

**Response** (200 OK):
```json
{
  "results": [
    {
      "parameter_name": "air_density",
      "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
      "parameter_set_name": "Aircraft Dynamics Model v1.0",
      "description": "Air density at sea level",
      "type": "number",
      "domain": "aviation",
      "tags": ["physics", "environmental", "atmosphere"],
      "relevance_score": 0.95,
      "matched_fields": ["name", "description", "tags"],
      "usage_frequency": 25
    },
    {
      "parameter_name": "fluid_density",
      "parameter_set_id": "ff0e8400-e29b-41d4-a716-446655440010",
      "parameter_set_name": "Fluid Dynamics Model",
      "description": "Density of fluid medium",
      "type": "number",
      "domain": "fluid_dynamics",
      "tags": ["physics", "fluid", "density"],
      "relevance_score": 0.87,
      "matched_fields": ["description", "tags"],
      "usage_frequency": 12
    }
  ],
  "total": 2,
  "query_time_ms": 45
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3013/search/parameters?q=density&domain=aviation&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### GET `/parameters/by-tags`
**Description**: Find parameters that match specific tags

**Query Parameters**:
- `tags`: Tags to search for (required, comma-separated)
- `match_all`: Whether to match all tags (AND) or any tag (OR) (default: false)
- `limit`: Maximum results (default: 20)

**Response** (200 OK):
```json
[
  {
    "parameter_name": "gravity",
    "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
    "parameter_set_name": "Aircraft Dynamics Model v1.0",
    "type": "number",
    "description": "Gravitational acceleration",
    "tags": ["physics", "constant", "gravity"],
    "last_used": "2025-01-15T18:30:00Z"
  },
  {
    "parameter_name": "air_density",
    "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
    "parameter_set_name": "Aircraft Dynamics Model v1.0",
    "type": "number",
    "description": "Air density at sea level",
    "tags": ["physics", "environmental", "density"],
    "last_used": "2025-01-15T18:30:00Z"
  }
]
```

---

## 9. Import & Export

### GET `/parameter-sets/{id}/export`
**Description**: Export a parameter set in various formats

**Query Parameters**:
- `format`: Export format (json, yaml, csv, excel, xml) (required)
- `include_metadata`: Include metadata in export (default: true)
- `include_history`: Include version history (default: false)

**Response** (200 OK):
```json
{
  "format": "json",
  "content": "{\"name\":\"Aircraft Dynamics Model v1.0\",\"description\":\"Parameter set for aircraft dynamics simulation\",\"parameters\":{...}}",
  "metadata": {
    "export_timestamp": "2025-01-15T19:00:00Z",
    "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": "2.2.0",
    "include_metadata": true,
    "include_history": false
  },
  "download_url": "http://localhost:3013/downloads/parameter-sets/550e8400-e29b-41d4-a716-446655440000.json"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3013/parameter-sets/550e8400-e29b-41d4-a716-446655440000/export?format=yaml&include_metadata=true" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### POST `/parameter-sets/import`
**Description**: Import a parameter set from external format

**Request Body**:
```json
{
  "format": "json",
  "content": "{\"name\":\"Imported Aircraft Model\",\"description\":\"Parameter set imported from external source\",\"parameters\":{...}}",
  "name": "Imported Aircraft Model",
  "description": "Parameter set imported from external source",
  "domain": "aviation",
  "merge_strategy": "add_only",
  "validation_level": "strict"
}
```

**Response** (201 Created):
```json
{
  "id": "110e8400-e29b-41d4-a716-446655440011",
  "parameter_set": {
    "id": "110e8400-e29b-41d4-a716-446655440011",
    "name": "Imported Aircraft Model",
    "description": "Parameter set imported from external source",
    "version": "1.0.0",
    "status": "active"
  },
  "validation_result": {
    "is_valid": true,
    "overall_score": 0.93
  },
  "created_at": "2025-01-15T19:30:00Z"
}
```

---

## 10. Health & Monitoring

### GET `/health`
**Description**: Get service health status

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T20:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "components": {
    "database": "healthy",
    "cache": "healthy",
    "validation_engine": "healthy",
    "event_publisher": "healthy"
  }
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3013/health
```

---

### GET `/metrics`
**Description**: Get service performance metrics

**Response** (200 OK):
```json
{
  "parameter_sets": {
    "total_count": 150,
    "active_count": 120,
    "locked_count": 25,
    "archived_count": 5,
    "created_last_24h": 8,
    "updated_last_24h": 12
  },
  "parameters": {
    "total_count": 2250,
    "by_type": {
      "number": 1200,
      "string": 450,
      "boolean": 300,
      "enum": 200,
      "array": 100
    },
    "validation_success_rate": 0.97
  },
  "validation": {
    "validations_last_24h": 156,
    "success_rate": 0.94,
    "average_validation_time_ms": 45,
    "constraint_violations_last_24h": 8
  },
  "usage": {
    "parameter_accesses_last_24h": 1250,
    "unique_services_using": 6,
    "most_used_parameter_sets": [
      {
        "parameter_set_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Aircraft Dynamics Model v1.0",
        "usage_count": 45
      },
      {
        "parameter_set_id": "ff0e8400-e29b-41d4-a716-446655440010",
        "name": "Fluid Dynamics Model",
        "usage_count": 32
      }
    ]
  },
  "performance": {
    "avg_response_time_ms": 125,
    "p95_response_time_ms": 280,
    "requests_per_second": 15.7,
    "cache_hit_rate": 0.85
  },
  "collected_at": "2025-01-15T20:00:00Z"
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "error": "BAD_REQUEST",
  "message": "Invalid request parameters",
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Parameter set not found",
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**422 Validation Error**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Parameter validation failed",
  "validation_errors": [
    {
      "error_code": "CONSTRAINT_VIOLATION",
      "error_message": "Value exceeds maximum allowed",
      "parameter_path": "gravity",
      "current_value": 15.0,
      "expected_constraint": "max_value: 10.0",
      "severity": "high"
    }
  ],
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "timestamp": "2025-01-15T14:35:12Z"
}
```

---

## Parameter Categories

The Parameter Manager supports the following parameter categories:

- **simulation**: Parameters for simulation models
- **analysis**: Analysis configuration parameters
- **scoring**: Scoring weights and thresholds
- **physics**: Physical constants and models
- **economic**: Economic model parameters
- **statistical**: Statistical analysis parameters
- **ontology**: Ontological mappings and definitions
- **workflow**: Process and workflow parameters
- **custom**: User-defined categories

---

## Parameter Types

Supported parameter types include:

- **number**: Numeric values (floating point)
- **integer**: Whole numbers
- **float**: Explicit floating point numbers
- **string**: Text values
- **boolean**: True/false values
- **enum**: Enumerated values from a predefined list
- **array**: Arrays of values
- **object**: Complex nested objects
- **date**: Date values (ISO 8601)
- **duration**: Time duration values
- **unit_value**: Values with associated units

---

## Security & Access Control

The Parameter Manager implements comprehensive security controls:

- **Authentication**: JWT-based authentication required for all operations
- **Authorization**: Role-based access control for parameter sets
- **Sensitivity Levels**: 
  - `public`: No restrictions
  - `internal`: Internal use only
  - `confidential`: Restricted access
  - `classified`: Highest security level
- **Audit Trails**: Complete audit logs for all parameter operations
- **Data Encryption**: Sensitive parameters encrypted at rest
- **Access Policies**: Fine-grained access control policies

---

## Event-Driven Integration

The Parameter Manager publishes events to the EventManager for real-time integration:

### Events Published

```typescript
// Parameter Set Events
"parameter.set.created"     -> New parameter set created
"parameter.set.updated"     -> Parameter set modified
"parameter.set.locked"      -> Parameter set made immutable
"parameter.set.archived"    -> Parameter set archived
"parameter.set.forked"      -> Parameter set forked

// Parameter Events  
"parameter.added"           -> New parameter added to set
"parameter.updated"         -> Parameter value/definition changed
"parameter.removed"         -> Parameter removed from set
"parameter.validated"       -> Parameter validation completed

// Usage Events
"parameter.set.used"        -> Parameter set accessed by service
"parameter.accessed"        -> Individual parameter accessed
"parameter.value.changed"   -> Parameter value updated

// Validation Events
"parameter.validation.failed"        -> Validation failed
"parameter.constraint.violated"      -> Constraint violation detected
"parameter.schema.mismatch"         -> Schema validation failed

// Version Events
"parameter.version.created"         -> New version created
"parameter.rollback.performed"      -> Rollback operation completed
```

### Events Consumed

The Parameter Manager subscribes to relevant events from other services for automatic parameter updates and validation triggers.

---

## Best Practices

### Parameter Set Design
1. **Logical Grouping**: Group related parameters together
2. **Clear Naming**: Use descriptive parameter names
3. **Comprehensive Documentation**: Provide detailed descriptions
4. **Appropriate Constraints**: Set realistic validation constraints
5. **Semantic Tagging**: Use meaningful tags for discovery

### Version Management
1. **Semantic Versioning**: Follow semantic versioning principles
2. **Change Documentation**: Document all changes thoroughly
3. **Breaking Change Identification**: Clearly mark breaking changes
4. **Gradual Migration**: Plan migration paths for breaking changes

### Validation Strategy
1. **Layered Validation**: Implement multiple validation levels
2. **Cross-Parameter Rules**: Define relationships between parameters
3. **Context-Aware Validation**: Consider usage context in validation
4. **Performance Optimization**: Cache validation results when appropriate

### Security Considerations
1. **Principle of Least Privilege**: Grant minimal necessary access
2. **Sensitive Data Handling**: Properly classify and protect sensitive parameters
3. **Audit Everything**: Maintain comprehensive audit trails
4. **Regular Security Reviews**: Periodically review access policies

---

This documentation provides comprehensive coverage of the Parameter Manager Service API. For additional information, refer to the OpenAPI specification and service architecture documentation. 