# DADMS 2.0 - Ontology Workspace Service API Endpoints

## Overview

The Ontology Workspace Service provides a visual, collaborative environment for authoring, editing, and validating ontologies. This document provides human-readable documentation for all API endpoints.

**Base URL**: `http://localhost:3016` (Development) | `https://api.dadms.example.com/ontology-workspace` (Production)

**Authentication**: Bearer Token (JWT)

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Workspaces** | GET | `/workspaces` | List ontology workspaces |
| | POST | `/workspaces` | Create new workspace |
| | GET | `/workspaces/{workspaceId}` | Get workspace details |
| | PUT | `/workspaces/{workspaceId}` | Update workspace |
| | DELETE | `/workspaces/{workspaceId}` | Delete workspace |
| **Ontologies** | GET | `/workspaces/{workspaceId}/ontologies` | List ontologies in workspace |
| | POST | `/workspaces/{workspaceId}/ontologies` | Add ontology to workspace |
| | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}` | Get ontology details |
| | PUT | `/workspaces/{workspaceId}/ontologies/{ontologyId}` | Update ontology |
| | DELETE | `/workspaces/{workspaceId}/ontologies/{ontologyId}` | Remove ontology |
| **Visual Editing** | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/visual-layout` | Get visual layout |
| | PUT | `/workspaces/{workspaceId}/ontologies/{ontologyId}/visual-layout` | Update visual layout |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/auto-layout` | Apply auto-layout |
| **Validation** | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/validate` | Validate ontology |
| | POST | `/workspaces/{workspaceId}/validate` | Validate workspace |
| **Collaboration** | GET | `/workspaces/{workspaceId}/comments` | Get comments |
| | POST | `/workspaces/{workspaceId}/comments` | Add comment |
| | GET | `/workspaces/{workspaceId}/discussions` | Get discussions |
| | POST | `/workspaces/{workspaceId}/discussions` | Create discussion |
| **Import/Export** | POST | `/workspaces/{workspaceId}/import` | Import ontology |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/export` | Export ontology |
| **Publishing** | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/publish` | Publish ontology |
| | POST | `/workspaces/{workspaceId}/publish` | Publish workspace |
| **Integration** | POST | `/workspaces/{workspaceId}/integrations/cemento` | Sync with Cemento |
| | POST | `/workspaces/{workspaceId}/integrations/drawio` | Import from draw.io |
| **Analytics** | GET | `/workspaces/{workspaceId}/analytics` | Get workspace analytics |
| | GET | `/analytics/usage` | Get usage analytics |
| **Health** | GET | `/health` | Health check |

---

## Workspace Management

### List Ontology Workspaces

**GET** `/workspaces`

Retrieve a list of ontology workspaces with optional filtering.

**Parameters:**
- `project_id` (query, optional): Filter by project ID
- `name_contains` (query, optional): Filter by workspace name (partial match)  
- `limit` (query, optional): Maximum number of workspaces to return (1-100, default: 20)
- `offset` (query, optional): Number of workspaces to skip (default: 0)

**Response Example:**
```json
{
  "workspaces": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Aircraft Systems Ontology Workspace",
      "description": "Collaborative workspace for aircraft systems ontology development",
      "project_id": "456e7890-e12b-34d5-a678-901234567000",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z",
      "ontology_count": 5,
      "status": "active"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3016/workspaces?project_id=456e7890-e12b-34d5-a678-901234567000&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**SDK Examples:**

*Python:*
```python
import requests

response = requests.get(
    "http://localhost:3016/workspaces",
    headers={"Authorization": "Bearer YOUR_JWT_TOKEN"},
    params={"project_id": "456e7890-e12b-34d5-a678-901234567000", "limit": 10}
)
workspaces = response.json()
```

*Node.js:*
```javascript
const axios = require('axios');

const response = await axios.get('http://localhost:3016/workspaces', {
  headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' },
  params: { project_id: '456e7890-e12b-34d5-a678-901234567000', limit: 10 }
});
const workspaces = response.data;
```

### Create New Workspace

**POST** `/workspaces`

Create a new ontology workspace for collaborative editing.

**Request Body:**
```json
{
  "name": "Aerospace Systems Ontology",
  "description": "Comprehensive ontology for aerospace systems",
  "project_id": "456e7890-e12b-34d5-a678-901234567000",
  "settings": {
    "auto_save_enabled": true,
    "auto_layout_enabled": false,
    "validation_on_save": true,
    "default_reasoner": "hermit",
    "color_scheme": "light",
    "grid_enabled": true,
    "snap_to_grid": false
  }
}
```

**Response Example:**
```json
{
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Workspace created successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3016/workspaces" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aerospace Systems Ontology",
    "description": "Comprehensive ontology for aerospace systems",
    "project_id": "456e7890-e12b-34d5-a678-901234567000"
  }'
```

### Get Workspace Details

**GET** `/workspaces/{workspaceId}`

Retrieve detailed information about a specific workspace.

**Response Example:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Aircraft Systems Ontology Workspace",
  "description": "Collaborative workspace for aircraft systems ontology development",
  "project_id": "456e7890-e12b-34d5-a678-901234567000",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "created_by": "user123",
  "settings": {
    "auto_save_enabled": true,
    "default_reasoner": "hermit",
    "color_scheme": "light"
  },
  "ontologies": [
    {
      "id": "ontology-1",
      "name": "Aircraft Components",
      "ontologies": []
    }
  ],
  "collaboration": {
    "active_users": [],
    "permissions": {},
    "change_history": []
  }
}
```

### Update Workspace

**PUT** `/workspaces/{workspaceId}`

Update workspace configuration and settings.

**Request Body:**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description",
  "settings": {
    "auto_save_enabled": false,
    "default_reasoner": "pellet"
  }
}
```

### Delete Workspace

**DELETE** `/workspaces/{workspaceId}`

Delete an ontology workspace and all its contents.

**Response:** `204 No Content`

---

## Ontology Management

### List Ontologies in Workspace

**GET** `/workspaces/{workspaceId}/ontologies`

Retrieve all ontologies within a specific workspace.

**Response Example:**
```json
{
  "ontologies": [
    {
      "id": "789e0123-e45f-67g8-h901-234567890123",
      "name": "Aircraft Components Ontology",
      "description": "Ontology defining aircraft components and their relationships",
      "iri": "http://example.com/aircraft-components",
      "format": "owl_xml",
      "content": {},
      "version": "1.0.0",
      "status": "valid",
      "classes": [],
      "object_properties": [],
      "data_properties": [],
      "individuals": [],
      "visual_layout": {
        "elements": [],
        "layout_algorithm": "hierarchical"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    }
  ]
}
```

### Add Ontology to Workspace

**POST** `/workspaces/{workspaceId}/ontologies`

Add a new ontology to the workspace or import existing ontology.

**Request Body:**
```json
{
  "name": "Navigation Systems Ontology",
  "description": "Ontology for aircraft navigation systems",
  "action": "create_new",
  "iri": "http://example.com/navigation-systems",
  "format": "owl_xml",
  "collection_id": "collection-123"
}
```

**Response Example:**
```json
{
  "ontology_id": "789e0123-e45f-67g8-h901-234567890123",
  "message": "Ontology added successfully"
}
```

### Get Ontology Details

**GET** `/workspaces/{workspaceId}/ontologies/{ontologyId}`

Retrieve detailed information about a specific ontology.

**Response Example:**
```json
{
  "id": "789e0123-e45f-67g8-h901-234567890123",
  "name": "Aircraft Components Ontology",
  "description": "Comprehensive ontology for aircraft components",
  "iri": "http://example.com/aircraft-components",
  "format": "owl_xml",
  "content": {
    "classes": {},
    "properties": {},
    "individuals": {}
  },
  "version": "1.0.0",
  "status": "valid",
  "classes": [
    {
      "iri": "http://example.com/aircraft-components#Engine",
      "label": "Engine",
      "description": "Aircraft propulsion system",
      "super_classes": ["http://example.com/aircraft-components#Component"],
      "equivalent_classes": [],
      "disjoint_classes": [],
      "restrictions": []
    }
  ],
  "visual_layout": {
    "elements": [],
    "layout_algorithm": "hierarchical"
  }
}
```

### Update Ontology

**PUT** `/workspaces/{workspaceId}/ontologies/{ontologyId}`

Update ontology content, metadata, or visual layout.

**Request Body:**
```json
{
  "name": "Updated Ontology Name",
  "description": "Updated description",
  "content": {
    "classes": {},
    "properties": {}
  },
  "visual_layout": {
    "elements": [],
    "layout_algorithm": "force_directed"
  }
}
```

### Remove Ontology

**DELETE** `/workspaces/{workspaceId}/ontologies/{ontologyId}`

Remove an ontology from the workspace.

**Response:** `204 No Content`

---

## Visual Editing

### Get Visual Layout

**GET** `/workspaces/{workspaceId}/ontologies/{ontologyId}/visual-layout`

Retrieve the visual layout configuration for an ontology.

**Response Example:**
```json
{
  "elements": [
    {
      "id": "http://example.com/aircraft-components#Engine",
      "type": "class",
      "position": {"x": 100, "y": 200},
      "size": {"width": 120, "height": 60},
      "style": {
        "fill_color": "#E8F4FD",
        "border_color": "#1976D2",
        "border_width": 2,
        "font_size": 12,
        "shape": "rectangle"
      },
      "label": "Engine",
      "connections": [
        {
          "target_id": "http://example.com/aircraft-components#Component",
          "type": "subclass_of",
          "style": {
            "color": "#666666",
            "width": 2,
            "style": "solid",
            "arrow_type": "arrow"
          }
        }
      ]
    }
  ],
  "layout_algorithm": "hierarchical",
  "viewport": {
    "zoom": 1.0,
    "center": {"x": 400, "y": 300}
  },
  "groups": []
}
```

### Update Visual Layout

**PUT** `/workspaces/{workspaceId}/ontologies/{ontologyId}/visual-layout`

Update the visual layout configuration for an ontology.

**Request Body:**
```json
{
  "elements": [
    {
      "id": "http://example.com/aircraft-components#Engine",
      "type": "class",
      "position": {"x": 150, "y": 250},
      "size": {"width": 140, "height": 70},
      "style": {
        "fill_color": "#FFF3E0",
        "border_color": "#F57C00"
      }
    }
  ],
  "layout_algorithm": "force_directed",
  "viewport": {
    "zoom": 1.2,
    "center": {"x": 500, "y": 350}
  }
}
```

### Apply Auto-Layout

**POST** `/workspaces/{workspaceId}/ontologies/{ontologyId}/auto-layout`

Apply automatic layout algorithm to organize ontology elements.

**Request Body:**
```json
{
  "algorithm": "hierarchical",
  "options": {
    "spacing": 50,
    "direction": "top_to_bottom",
    "preserve_groups": true
  }
}
```

**Response Example:**
```json
{
  "elements": [
    {
      "id": "http://example.com/aircraft-components#Component",
      "position": {"x": 400, "y": 100}
    },
    {
      "id": "http://example.com/aircraft-components#Engine",
      "position": {"x": 300, "y": 200}
    }
  ],
  "layout_algorithm": "hierarchical"
}
```

---

## Validation

### Validate Ontology

**POST** `/workspaces/{workspaceId}/ontologies/{ontologyId}/validate`

Perform validation on an ontology using specified reasoner.

**Request Body:**
```json
{
  "reasoner": "hermit",
  "profile": "owl_dl",
  "include_quality_metrics": true
}
```

**Response Example:**
```json
{
  "is_valid": true,
  "reasoner_used": "hermit",
  "timestamp": "2024-01-20T15:30:00Z",
  "consistency_check": {
    "is_consistent": true,
    "inconsistent_classes": [],
    "explanation": null
  },
  "satisfiability_check": {
    "all_satisfiable": true,
    "unsatisfiable_classes": []
  },
  "profile_compliance": {
    "profile": "owl_dl",
    "is_compliant": true,
    "violations": []
  },
  "quality_metrics": {
    "class_count": 25,
    "property_count": 18,
    "individual_count": 5,
    "axiom_count": 87,
    "depth": 4,
    "breadth": 6,
    "tangledness": 0.15
  },
  "errors": [],
  "warnings": []
}
```

### Validate Workspace

**POST** `/workspaces/{workspaceId}/validate`

Perform validation on all ontologies in the workspace.

**Request Body:**
```json
{
  "reasoner": "hermit",
  "include_quality_metrics": true
}
```

**Response Example:**
```json
{
  "overall_valid": true,
  "results": [
    {
      "ontology_id": "789e0123-e45f-67g8-h901-234567890123",
      "validation_result": {
        "is_valid": true,
        "reasoner_used": "hermit",
        "timestamp": "2024-01-20T15:30:00Z"
      }
    }
  ]
}
```

---

## Collaboration

### Get Comments

**GET** `/workspaces/{workspaceId}/comments`

Retrieve comments for workspace or specific ontology elements.

**Parameters:**
- `element_iri` (query, optional): Filter comments by specific element IRI
- `limit` (query, optional): Maximum number of comments (default: 50)

**Response Example:**
```json
{
  "comments": [
    {
      "id": "comment-123",
      "user_id": "user456",
      "user_name": "Dr. Jane Smith",
      "content": "This class definition needs refinement",
      "element_iri": "http://example.com/aircraft-components#Engine",
      "created_at": "2024-01-20T14:30:00Z",
      "updated_at": "2024-01-20T14:30:00Z",
      "replies": []
    }
  ]
}
```

### Add Comment

**POST** `/workspaces/{workspaceId}/comments`

Add a comment to workspace or specific ontology element.

**Request Body:**
```json
{
  "content": "Consider adding more specific subclasses for different engine types",
  "element_iri": "http://example.com/aircraft-components#Engine",
  "parent_comment_id": null
}
```

**Response Example:**
```json
{
  "comment_id": "comment-456",
  "message": "Comment added successfully"
}
```

### Get Discussions

**GET** `/workspaces/{workspaceId}/discussions`

Retrieve discussions within the workspace.

**Response Example:**
```json
{
  "discussions": [
    {
      "id": "discussion-789",
      "title": "Engine Classification Discussion",
      "description": "How should we classify different types of aircraft engines?",
      "created_by": "user123",
      "created_at": "2024-01-19T10:00:00Z",
      "status": "open",
      "participants": ["user123", "user456"],
      "comments": []
    }
  ]
}
```

### Create Discussion

**POST** `/workspaces/{workspaceId}/discussions`

Create a new discussion within the workspace.

**Request Body:**
```json
{
  "title": "Navigation System Ontology Structure",
  "description": "Discussion about the best way to structure the navigation system ontology",
  "element_iri": "http://example.com/aircraft-components#NavigationSystem"
}
```

---

## Import/Export

### Import Ontology

**POST** `/workspaces/{workspaceId}/import`

Import ontology from various sources and formats.

**Form Data:**
- `file`: Binary file content
- `format`: Ontology format (owl_xml, turtle, rdf_xml, etc.)
- `options`: JSON string with import options

**Alternative JSON Request:**
```json
{
  "url": "http://example.com/ontology.owl",
  "format": "owl_xml",
  "options": {
    "merge_with_existing": false,
    "preserve_namespaces": true,
    "auto_generate_layout": true,
    "validate_on_import": true
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Import completed successfully",
  "ontology_id": "imported-ontology-123",
  "warnings": [],
  "errors": []
}
```

### Export Ontology

**POST** `/workspaces/{workspaceId}/ontologies/{ontologyId}/export`

Export ontology in specified format.

**Request Body:**
```json
{
  "format": "turtle",
  "options": {
    "include_visual_layout": false,
    "include_comments": false,
    "minify": false,
    "namespace_prefix_mapping": {
      "ac": "http://example.com/aircraft-components#"
    }
  }
}
```

**Response:** Binary file content or text format based on requested format.

---

## Publishing

### Publish Ontology

**POST** `/workspaces/{workspaceId}/ontologies/{ontologyId}/publish`

Publish ontology to Fuseki triple store or web platform.

**Request Body:**
```json
{
  "targets": [
    {
      "type": "fuseki",
      "config": {
        "server_url": "http://localhost:3030",
        "dataset_name": "aircraft-ontology"
      }
    },
    {
      "type": "web_documentation",
      "config": {
        "base_url": "https://ontology.example.com",
        "template": "default"
      }
    }
  ],
  "options": {
    "include_version": true,
    "generate_documentation": true,
    "notify_subscribers": true
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "results": [
    {
      "target_type": "fuseki",
      "success": true,
      "url": "http://localhost:3030/aircraft-ontology",
      "message": "Published to Fuseki successfully",
      "errors": []
    }
  ]
}
```

### Publish Workspace

**POST** `/workspaces/{workspaceId}/publish`

Publish all ontologies in workspace to specified targets.

**Request Body:**
```json
{
  "targets": [
    {
      "type": "fuseki",
      "config": {
        "server_url": "http://localhost:3030"
      }
    }
  ],
  "options": {
    "include_version": true,
    "generate_documentation": true
  },
  "filter": {
    "status": ["valid"],
    "exclude_drafts": true
  }
}
```

---

## Integration

### Sync with Cemento

**POST** `/workspaces/{workspaceId}/integrations/cemento`

Synchronize workspace with Cemento ontology editor.

**Request Body:**
```json
{
  "cemento_project_id": "cemento-project-123",
  "direction": "bidirectional",
  "options": {
    "preserve_layout": true,
    "merge_conflicts": "manual_resolution"
  }
}
```

### Import from draw.io

**POST** `/workspaces/{workspaceId}/integrations/drawio`

Import ontology diagram from draw.io.

**Form Data:**
- `file`: draw.io file (.drawio or .xml)
- `options`: JSON with interpretation options

**Options Example:**
```json
{
  "interpretation_mode": "flexible_mapping",
  "generate_iris": true
}
```

---

## Analytics

### Get Workspace Analytics

**GET** `/workspaces/{workspaceId}/analytics`

Retrieve analytics and metrics for the workspace.

**Response Example:**
```json
{
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "ontology_count": 5,
  "total_classes": 125,
  "total_properties": 87,
  "total_individuals": 23,
  "user_activity": [
    {
      "user_id": "user123",
      "user_name": "Dr. Jane Smith",
      "actions_count": 45,
      "last_active": "2024-01-20T15:30:00Z",
      "most_edited_ontology": "789e0123-e45f-67g8-h901-234567890123"
    }
  ],
  "validation_history": [
    {
      "timestamp": "2024-01-20T15:30:00Z",
      "ontology_id": "789e0123-e45f-67g8-h901-234567890123",
      "is_valid": true,
      "error_count": 0,
      "warning_count": 2
    }
  ],
  "collaboration_metrics": {
    "active_sessions": 3,
    "comments_count": 15,
    "discussions_count": 4,
    "average_resolution_time": 24.5
  }
}
```

### Get Usage Analytics

**GET** `/analytics/usage`

Retrieve overall service usage analytics.

**Response Example:**
```json
{
  "total_workspaces": 12,
  "total_ontologies": 48,
  "active_users": 8,
  "most_used_formats": [
    {
      "format": "owl_xml",
      "usage_count": 25
    },
    {
      "format": "turtle",
      "usage_count": 15
    }
  ],
  "validation_stats": {
    "total_validations": 156,
    "success_rate": 0.87,
    "most_common_errors": [
      {
        "error_code": "INCONSISTENT_CLASS",
        "count": 12
      }
    ]
  }
}
```

---

## Health & Monitoring

### Health Check

**GET** `/health`

Check service health status.

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time_ms": 15.2,
      "last_check": "2024-01-20T15:30:00Z"
    },
    "fuseki": {
      "status": "healthy",
      "response_time_ms": 45.8,
      "last_check": "2024-01-20T15:30:00Z"
    },
    "ontology_manager": {
      "status": "healthy",
      "response_time_ms": 23.1,
      "last_check": "2024-01-20T15:30:00Z"
    },
    "event_manager": {
      "status": "healthy",
      "response_time_ms": 12.5,
      "last_check": "2024-01-20T15:30:00Z"
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3016/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

- **200 OK**: Successful operation
- **201 Created**: Resource created successfully
- **204 No Content**: Successful operation with no response body
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate name)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

**Error Response Format:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Ontology validation failed",
  "details": {
    "field": "content",
    "reason": "Invalid OWL syntax"
  },
  "timestamp": "2024-01-20T15:30:00Z"
}
```

---

## Authentication

All API endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Tokens are obtained through the DADMS authentication service and include user permissions and workspace access rights.

---

## Rate Limits

- **Standard operations**: 1000 requests per hour per user
- **Import/Export operations**: 50 requests per hour per user  
- **Publishing operations**: 20 requests per hour per user
- **Validation operations**: 100 requests per hour per user

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when current window resets

---

## WebSocket Events

The Ontology Workspace service supports real-time collaboration through WebSocket connections:

**Connection URL**: `ws://localhost:3016/workspaces/{workspaceId}/ws`

**Event Types:**
- `user_joined`: User joined workspace
- `user_left`: User left workspace  
- `element_updated`: Ontology element modified
- `layout_changed`: Visual layout updated
- `comment_added`: New comment added
- `validation_completed`: Validation finished

**Example Event:**
```json
{
  "type": "element_updated",
  "data": {
    "element_id": "http://example.com/aircraft-components#Engine",
    "changes": {
      "label": "Jet Engine"
    },
    "user_id": "user123",
    "timestamp": "2024-01-20T15:30:00Z"
  }
}
``` 