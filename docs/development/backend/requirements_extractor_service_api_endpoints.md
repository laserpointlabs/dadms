# Requirements Extractor & Conceptualizer Service API Endpoints

**Service**: Requirements Extractor & Conceptualizer  
**Purpose**: Intelligent automation for transforming unstructured knowledge artifacts into actionable requirements and conceptual system models  
**Port**: 3014  
**Key Features**: Document processing, requirements extraction, semantic tagging, conceptual modeling, visualization, and comprehensive traceability

## Overview

The Requirements Extractor & Conceptualizer service provides comprehensive capabilities for:

- **Automated Requirements Discovery**: Extract candidate requirements from diverse document formats
- **Semantic Enrichment**: Align extracted requirements with domain ontologies for consistency
- **Conceptual Model Generation**: Bootstrap initial system architectures from requirement sets
- **Traceability Maintenance**: Preserve bidirectional links between artifacts and source materials
- **Human-AI Collaboration**: Enable refined workflows with expert validation and correction
- **Multi-Format Export**: Generate outputs compatible with downstream DADMS services

## Quick Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **Document Processing** |
| POST   | `/documents/{docId}/process` | Process document for requirement extraction | Yes |
| GET    | `/processing-jobs/{jobId}` | Get processing job status | Yes |
| **Requirements Extraction** |
| POST   | `/documents/{docId}/requirements` | Extract requirements from document | Yes |
| GET    | `/documents/{docId}/requirements` | Get extracted requirements for document | Yes |
| **Requirements Management** |
| GET    | `/requirements` | List requirements with filtering | Yes |
| POST   | `/requirements` | Create new requirement manually | Yes |
| GET    | `/requirements/{requirementId}` | Get specific requirement | Yes |
| PUT    | `/requirements/{requirementId}` | Update requirement | Yes |
| DELETE | `/requirements/{requirementId}` | Delete requirement | Yes |
| **Semantic Tagging** |
| POST   | `/requirements/{requirementId}/tags` | Add semantic tags to requirement | Yes |
| GET    | `/requirements/{requirementId}/tags` | Get semantic tags for requirement | Yes |
| **Conceptual Modeling** |
| POST   | `/conceptual-models` | Generate conceptual model from requirements | Yes |
| GET    | `/conceptual-models` | List conceptual models | Yes |
| GET    | `/conceptual-models/{modelId}` | Get specific conceptual model | Yes |
| PUT    | `/conceptual-models/{modelId}` | Update conceptual model | Yes |
| DELETE | `/conceptual-models/{modelId}` | Delete conceptual model | Yes |
| **Model Analysis** |
| GET    | `/conceptual-models/{modelId}/coverage` | Analyze requirement coverage | Yes |
| GET    | `/conceptual-models/{modelId}/gaps` | Identify gaps in model | Yes |
| **Visualization** |
| POST   | `/conceptual-models/{modelId}/visualizations` | Generate model visualization | Yes |
| GET    | `/conceptual-models/{modelId}/visualizations` | List model visualizations | Yes |
| **Export & Import** |
| GET    | `/conceptual-models/{modelId}/export` | Export conceptual model | Yes |
| GET    | `/requirements/export` | Export requirements | Yes |
| **Search & Discovery** |
| GET    | `/search/requirements` | Search requirements | Yes |
| GET    | `/search/models` | Search conceptual models | Yes |
| GET    | `/requirements/{requirementId}/similar` | Find similar requirements | Yes |
| **Traceability** |
| GET    | `/requirements/{requirementId}/lineage` | Get requirement lineage | Yes |
| GET    | `/conceptual-models/{modelId}/traceability` | Get model traceability matrix | Yes |
| **Validation & Quality** |
| POST   | `/requirements/{requirementId}/validate` | Validate requirement | Yes |
| GET    | `/documents/{docId}/extraction-quality` | Get extraction quality report | Yes |
| **Health & Monitoring** |
| GET    | `/health` | Service health check | No |
| GET    | `/metrics` | Service performance metrics | Yes |
| **Enhanced Intelligence Capabilities** |
| **LLM Review & Suggestions** |
| POST   | `/requirements/{requirementId}/review` | Review requirement with LLM | Yes |
| GET    | `/requirements/{requirementId}/suggestions` | Get improvement suggestions | Yes |
| **Constraint Management** |
| POST   | `/requirements/{requirementId}/constraints` | Extract constraints from requirement | Yes |
| GET    | `/constraints` | List constraints with filtering | Yes |
| **Concept Clustering** |
| POST   | `/concepts/cluster` | Cluster concepts with master concept identification | Yes |
| GET    | `/concepts/clusters` | List concept clusters | Yes |
| **Similarity Analysis** |
| POST   | `/requirements/{requirementId}/similarity` | Analyze requirement similarity across domains | Yes |
| **Iterative Extraction** |
| POST   | `/documents/{docId}/extraction/start` | Start iterative extraction with convergence | Yes |
| POST   | `/extraction-sessions/{sessionId}/continue` | Continue extraction iteration | Yes |
| **Enhanced Traceability** |
| GET    | `/requirements/{requirementId}/full-trace` | Get comprehensive traceability | Yes |
| GET    | `/requirements/{requirementId}/impact` | Analyze requirement impact | Yes |
| **Graph & Vector Integration** |
| POST   | `/requirements/sync/graph` | Sync requirements to GraphDB | Yes |
| GET    | `/requirements/{requirementId}/semantic-neighbors` | Get semantic neighbors from vector store | Yes |
| **Ontology Constraints** |
| POST   | `/ontology-constraints` | Create ontology constraint for conceptualization | Yes |
| POST   | `/concepts/{conceptId}/validate-ontology` | Validate concept against ontology constraints | Yes |
| POST   | `/conceptual-models/{modelId}/generate-with-ontology` | Generate model with ontology constraints | Yes |

---

## 1. Document Processing

### POST `/documents/{docId}/process`
**Description**: Initiate processing of a document to extract requirements

**Path Parameters**:
- `docId` (string, UUID, required): Document ID from Knowledge Service

**Request Body**:
```json
{
  "extraction_methods": ["nlp_analysis", "pattern_matching", "llm_extraction"],
  "confidence_threshold": 0.7,
  "language": "en",
  "sections_to_include": ["requirements", "specifications", "functional"],
  "sections_to_exclude": ["appendix", "references"],
  "enable_human_validation": true,
  "include_context": true,
  "preserve_formatting": false,
  "generate_summaries": true,
  "requirement_patterns": [
    {
      "pattern": "The system SHALL",
      "type": "functional",
      "priority": "high"
    },
    {
      "pattern": "The system MUST",
      "type": "functional", 
      "priority": "critical"
    }
  ]
}
```

**Response** (202 Accepted):
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_type": "document_processing",
  "document_id": "doc-12345",
  "processing_status": "pending",
  "progress_percentage": 0,
  "started_by": "user123",
  "started_at": "2025-01-15T14:35:12Z",
  "estimated_completion": "2025-01-15T14:40:12Z",
  "processing_options": {
    "extraction_methods": ["nlp_analysis", "pattern_matching"],
    "confidence_threshold": 0.7,
    "language": "en"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3014/documents/doc-12345/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "extraction_methods": ["nlp_analysis", "pattern_matching"],
    "confidence_threshold": 0.7,
    "language": "en",
    "sections_to_include": ["requirements", "specifications"],
    "enable_human_validation": true
  }'
```

**Python SDK Example**:
```python
import requests

def process_document(api_base, token, doc_id, options=None):
    """Process document for requirement extraction"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    default_options = {
        "extraction_methods": ["nlp_analysis", "pattern_matching"],
        "confidence_threshold": 0.7,
        "language": "en",
        "enable_human_validation": True,
        "include_context": True
    }
    
    request_body = {**default_options, **(options or {})}
    
    response = requests.post(
        f"{api_base}/documents/{doc_id}/process",
        headers=headers,
        json=request_body
    )
    
    if response.status_code == 202:
        return response.json()
    else:
        response.raise_for_status()

# Usage
result = process_document(
    "http://localhost:3014", 
    "your_jwt_token", 
    "doc-12345",
    {"sections_to_include": ["requirements", "specifications"]}
)
print(f"Processing job started: {result['job_id']}")
```

**Node.js SDK Example**:
```javascript
const axios = require('axios');

async function processDocument(apiBase, token, docId, options = {}) {
    const defaultOptions = {
        extraction_methods: ["nlp_analysis", "pattern_matching"],
        confidence_threshold: 0.7,
        language: "en",
        enable_human_validation: true,
        include_context: true
    };

    const requestBody = { ...defaultOptions, ...options };

    try {
        const response = await axios.post(
            `${apiBase}/documents/${docId}/process`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error processing document:', error.response?.data || error.message);
        throw error;
    }
}

// Usage
processDocument("http://localhost:3014", "your_jwt_token", "doc-12345", {
    sections_to_include: ["requirements", "specifications"]
}).then(result => {
    console.log(`Processing job started: ${result.job_id}`);
}).catch(error => {
    console.error('Failed to process document:', error);
});
```

---

### GET `/processing-jobs/{jobId}`
**Description**: Get the status of a document processing job

**Response** (200 OK):
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "processing_status": "processing",
  "progress_percentage": 65,
  "current_stage": "semantic_tagging",
  "stages_completed": [
    "document_parsing",
    "text_extraction",
    "nlp_processing",
    "requirement_extraction"
  ],
  "results_preview": {
    "requirements_found": 23,
    "high_confidence": 18,
    "medium_confidence": 4,
    "low_confidence": 1
  },
  "started_at": "2025-01-15T14:35:12Z",
  "estimated_completion": "2025-01-15T14:40:12Z"
}
```

---

## 2. Requirements Extraction

### POST `/documents/{docId}/requirements`
**Description**: Extract requirements from a document

**Response** (201 Created):
```json
{
  "extraction_job_id": "660e8400-e29b-41d4-a716-446655440001",
  "requirements": [
    {
      "id": "req-001",
      "requirement_text": "The system SHALL authenticate users using multi-factor authentication",
      "normalized_text": "The system shall authenticate users using multi-factor authentication",
      "requirement_type": "security",
      "priority": "critical",
      "domain": "authentication",
      "category": "access_control",
      "confidence_score": 0.95,
      "validation_status": "unvalidated",
      "source_document": {
        "document_id": "doc-12345",
        "document_name": "Security Requirements.pdf",
        "section": "Authentication Requirements",
        "page_number": 3,
        "line_range": {"start": 45, "end": 47}
      },
      "extraction_context": {
        "surrounding_text": "...user access control. The system SHALL authenticate users using multi-factor authentication for all sensitive operations. This requirement ensures...",
        "section_heading": "3.2 Authentication Requirements",
        "extraction_method": "pattern_matching"
      },
      "extracted_by": "nlp_pattern_matcher",
      "extracted_at": "2025-01-15T14:35:12Z",
      "version": "1.0"
    },
    {
      "id": "req-002",
      "requirement_text": "The system MUST provide role-based access control with granular permissions",
      "normalized_text": "The system must provide role-based access control with granular permissions",
      "requirement_type": "functional",
      "priority": "high",
      "domain": "authorization",
      "category": "access_control",
      "confidence_score": 0.87,
      "validation_status": "unvalidated",
      "source_document": {
        "document_id": "doc-12345",
        "document_name": "Security Requirements.pdf",
        "section": "Authorization Requirements",
        "page_number": 4,
        "line_range": {"start": 12, "end": 14}
      },
      "extracted_by": "llm_extractor",
      "extracted_at": "2025-01-15T14:35:15Z",
      "version": "1.0"
    }
  ],
  "extraction_summary": {
    "total_extracted": 23,
    "by_type": {
      "functional": 12,
      "security": 6,
      "non_functional": 3,
      "business": 2
    },
    "by_priority": {
      "critical": 5,
      "high": 10,
      "medium": 7,
      "low": 1
    },
    "average_confidence": 0.84,
    "processing_time_ms": 15420
  }
}
```

---

## 3. Requirements Management

### GET `/requirements`
**Description**: List requirements with optional filtering

**Query Parameters**:
- `project_id`: Filter by project ID
- `requirement_type`: Filter by requirement type (functional, security, etc.)
- `priority`: Filter by priority (critical, high, medium, low)
- `validation_status`: Filter by validation status
- `domain`: Filter by domain
- `search_term`: Search in requirement text
- `limit`: Maximum results (default: 20)
- `offset`: Number of results to skip (default: 0)

**Response** (200 OK):
```json
{
  "requirements": [
    {
      "id": "req-001",
      "requirement_text": "The system SHALL authenticate users using multi-factor authentication",
      "requirement_type": "security",
      "priority": "critical",
      "validation_status": "validated",
      "confidence_score": 0.95,
      "extracted_at": "2025-01-15T14:35:12Z"
    },
    {
      "id": "req-002", 
      "requirement_text": "The system MUST provide role-based access control with granular permissions",
      "requirement_type": "functional",
      "priority": "high",
      "validation_status": "unvalidated",
      "confidence_score": 0.87,
      "extracted_at": "2025-01-15T14:35:15Z"
    }
  ],
  "total": 23,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3014/requirements?requirement_type=security&priority=critical&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### PUT `/requirements/{requirementId}`
**Description**: Update an existing requirement

**Request Body**:
```json
{
  "requirement_text": "The system SHALL authenticate users using multi-factor authentication with biometric verification",
  "requirement_type": "security",
  "priority": "critical",
  "domain": "authentication",
  "category": "biometric_access_control",
  "validation_status": "validated",
  "custom_attributes": {
    "compliance_standard": "NIST",
    "review_date": "2025-02-01",
    "reviewed_by": "security_team"
  }
}
```

**Response** (200 OK):
```json
{
  "id": "req-001",
  "requirement_text": "The system SHALL authenticate users using multi-factor authentication with biometric verification",
  "normalized_text": "The system shall authenticate users using multi-factor authentication with biometric verification",
  "requirement_type": "security",
  "priority": "critical",
  "domain": "authentication",
  "category": "biometric_access_control",
  "validation_status": "validated",
  "confidence_score": 0.95,
  "custom_attributes": {
    "compliance_standard": "NIST",
    "review_date": "2025-02-01",
    "reviewed_by": "security_team"
  },
  "last_updated_at": "2025-01-15T15:20:30Z",
  "version": "1.1"
}
```

---

## 4. Semantic Tagging

### POST `/requirements/{requirementId}/tags`
**Description**: Add semantic tags to a requirement using ontology references

**Request Body**:
```json
{
  "ontology_tags": [
    {
      "ontology_id": "security_ontology_v1",
      "class_uri": "http://security.ont/Authentication",
      "property_uri": "http://security.ont/requiresMultiFactor",
      "label": "Multi-Factor Authentication",
      "confidence": 0.92,
      "context": "authentication requirement",
      "tagged_by": "semantic_tagger_v2"
    },
    {
      "ontology_id": "system_ontology_v1",
      "class_uri": "http://system.ont/SecurityRequirement",
      "label": "Security Requirement",
      "confidence": 0.88,
      "context": "requirement classification",
      "tagged_by": "semantic_tagger_v2"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "added_tags": [
    {
      "ontology_id": "security_ontology_v1",
      "class_uri": "http://security.ont/Authentication",
      "property_uri": "http://security.ont/requiresMultiFactor",
      "label": "Multi-Factor Authentication",
      "confidence": 0.92,
      "context": "authentication requirement",
      "tagged_by": "semantic_tagger_v2",
      "tagged_at": "2025-01-15T15:30:45Z"
    },
    {
      "ontology_id": "system_ontology_v1",
      "class_uri": "http://system.ont/SecurityRequirement",
      "label": "Security Requirement",
      "confidence": 0.88,
      "context": "requirement classification", 
      "tagged_by": "semantic_tagger_v2",
      "tagged_at": "2025-01-15T15:30:45Z"
    }
  ]
}
```

---

## 5. Conceptual Modeling

### POST `/conceptual-models`
**Description**: Generate a conceptual model from a set of requirements

**Request Body**:
```json
{
  "requirements": [
    "req-001",
    "req-002", 
    "req-003",
    "req-004",
    "req-005"
  ],
  "model_name": "User Authentication System",
  "model_description": "Conceptual model for user authentication and authorization system based on security requirements",
  "modeling_options": {
    "modeling_methodology": "service_oriented",
    "abstraction_level": "logical",
    "decomposition_depth": 3,
    "component_granularity": "medium",
    "include_exception_flows": true,
    "generate_sequence_diagrams": false
  }
}
```

**Response** (201 Created):
```json
{
  "model_id": "model-001",
  "model_name": "User Authentication System",
  "model_description": "Conceptual model for user authentication and authorization system based on security requirements",
  "model_type": "security_system",
  "version": "1.0",
  "validation_status": "generated",
  "quality_score": 0.87,
  "source_requirements": [
    "req-001",
    "req-002",
    "req-003", 
    "req-004",
    "req-005"
  ],
  "system_components": [
    {
      "component_id": "comp-auth-001",
      "component_name": "Authentication Service",
      "component_description": "Core authentication service handling user credential verification",
      "component_type": "service",
      "responsibilities": [
        "User credential validation",
        "Multi-factor authentication",
        "Session management",
        "Authentication token generation"
      ],
      "allocated_functions": [
        "authenticate_user",
        "validate_mfa",
        "generate_session"
      ],
      "interfaces": [
        "intf-auth-api",
        "intf-user-db"
      ],
      "derived_from_requirements": [
        "req-001",
        "req-003"
      ]
    },
    {
      "component_id": "comp-authz-001",
      "component_name": "Authorization Service", 
      "component_description": "Role-based access control and permission management service",
      "component_type": "service",
      "responsibilities": [
        "Role-based access control",
        "Permission validation",
        "Resource access management",
        "Policy enforcement"
      ],
      "allocated_functions": [
        "validate_permissions",
        "enforce_rbac",
        "manage_roles"
      ],
      "interfaces": [
        "intf-authz-api",
        "intf-policy-db"
      ],
      "derived_from_requirements": [
        "req-002",
        "req-004"
      ]
    }
  ],
  "system_behaviors": [
    {
      "behavior_id": "behavior-login-001",
      "behavior_name": "User Login Process",
      "behavior_description": "Complete user authentication flow including MFA",
      "behavior_type": "normal_flow",
      "trigger_conditions": [
        "User provides credentials",
        "Authentication endpoint accessed"
      ],
      "behavior_steps": [
        {
          "step": 1,
          "action": "Validate user credentials",
          "component": "Authentication Service",
          "result": "Credentials validated or rejected"
        },
        {
          "step": 2,
          "action": "Request multi-factor authentication",
          "component": "Authentication Service", 
          "condition": "Credentials valid",
          "result": "MFA challenge sent"
        },
        {
          "step": 3,
          "action": "Validate MFA response",
          "component": "Authentication Service",
          "result": "MFA validated or failed"
        },
        {
          "step": 4,
          "action": "Generate authentication token",
          "component": "Authentication Service",
          "condition": "MFA validated",
          "result": "JWT token generated"
        }
      ],
      "participating_components": [
        "comp-auth-001"
      ],
      "derived_from_requirements": [
        "req-001"
      ]
    }
  ],
  "system_interfaces": [
    {
      "interface_id": "intf-auth-api",
      "interface_name": "Authentication API",
      "interface_description": "RESTful API for authentication operations",
      "interface_type": "api",
      "provider_component": "comp-auth-001",
      "consumer_components": [
        "web_ui",
        "mobile_app",
        "api_gateway"
      ],
      "operations": [
        {
          "operation_name": "authenticate",
          "method": "POST",
          "endpoint": "/auth/login",
          "parameters": ["username", "password"],
          "returns": "authentication_token"
        },
        {
          "operation_name": "validate_mfa",
          "method": "POST", 
          "endpoint": "/auth/mfa/validate",
          "parameters": ["token", "mfa_code"],
          "returns": "validation_result"
        }
      ],
      "derived_from_requirements": [
        "req-001"
      ]
    }
  ],
  "generated_by": "conceptual_modeler_v1",
  "generated_at": "2025-01-15T16:00:00Z",
  "last_updated_at": "2025-01-15T16:00:00Z"
}
```

---

## 6. Visualization

### POST `/conceptual-models/{modelId}/visualizations`
**Description**: Generate a visual representation of a conceptual model

**Request Body**:
```json
{
  "view_type": "component_diagram",
  "format": "svg",
  "options": {
    "show_interfaces": true,
    "show_data_flows": true,
    "highlight_critical_components": true,
    "layout": "hierarchical",
    "theme": "professional"
  }
}
```

**Response** (201 Created):
```json
{
  "visualization_id": "viz-001",
  "view_type": "component_diagram",
  "format": "svg",
  "content": "PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCI+...",
  "download_url": "http://localhost:3014/downloads/visualizations/viz-001.svg",
  "metadata": {
    "model_id": "model-001",
    "components_shown": 5,
    "interfaces_shown": 8,
    "layout_algorithm": "hierarchical",
    "generation_time_ms": 2340
  },
  "generated_at": "2025-01-15T16:15:30Z"
}
```

**Visualization Types**:
- `component_diagram`: System components and their relationships
- `behavior_diagram`: System behaviors and flows
- `interface_diagram`: Interface specifications and connections
- `system_overview`: High-level system overview
- `requirements_map`: Requirements to model element mapping
- `traceability_matrix`: Full traceability visualization

---

## 7. Export & Import

### GET `/conceptual-models/{modelId}/export`
**Description**: Export a conceptual model in various formats

**Query Parameters**:
- `format`: Export format (json, xml, bpmn, graphml, sysml)
- `include_requirements`: Include source requirements (default: true)
- `include_traceability`: Include traceability information (default: true)

**Response** (200 OK):
```json
{
  "export_id": "export-001",
  "format": "json",
  "content": "{\"model_id\":\"model-001\",\"model_name\":\"User Authentication System\",\"components\":[...]}",
  "download_url": "http://localhost:3014/downloads/exports/model-001.json",
  "metadata": {
    "model_id": "model-001",
    "export_format": "json",
    "file_size_bytes": 15420,
    "includes_requirements": true,
    "includes_traceability": true
  },
  "exported_at": "2025-01-15T16:30:00Z"
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3014/conceptual-models/model-001/export?format=bpmn&include_traceability=true" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -o "authentication_system.bpmn"
```

---

## 8. Search & Discovery

### GET `/search/requirements`
**Description**: Search requirements using text, semantic, or hybrid search

**Query Parameters**:
- `q`: Search query (required)
- `search_type`: Search type (text, semantic, hybrid) - default: hybrid
- `filters`: JSON-encoded filter object
- `limit`: Maximum results (default: 20)
- `offset`: Number of results to skip (default: 0)

**Response** (200 OK):
```json
{
  "results": [
    {
      "requirement_id": "req-001",
      "requirement_text": "The system SHALL authenticate users using multi-factor authentication",
      "requirement_type": "security",
      "priority": "critical",
      "domain": "authentication",
      "relevance_score": 0.95,
      "matched_fields": ["requirement_text", "domain", "ontology_tags"],
      "source_document": "Security Requirements.pdf"
    },
    {
      "requirement_id": "req-003",
      "requirement_text": "The authentication system MUST support biometric verification methods",
      "requirement_type": "security", 
      "priority": "high",
      "domain": "authentication",
      "relevance_score": 0.87,
      "matched_fields": ["requirement_text", "semantic_concepts"],
      "source_document": "Technical Specifications.docx"
    }
  ],
  "total": 2,
  "query_time_ms": 45
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:3014/search/requirements?q=authentication+security&search_type=hybrid&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### GET `/requirements/{requirementId}/similar`
**Description**: Find requirements similar to a specific requirement

**Query Parameters**:
- `similarity_threshold`: Minimum similarity score (0.0-1.0, default: 0.7)
- `limit`: Maximum results (default: 10)

**Response** (200 OK):
```json
[
  {
    "requirement_id": "req-003",
    "requirement_text": "The authentication system MUST support biometric verification methods",
    "similarity_score": 0.89,
    "similarity_reasons": [
      "Both requirements relate to authentication",
      "Both specify security measures",
      "Both use similar terminology (authentication, system)"
    ]
  },
  {
    "requirement_id": "req-015",
    "requirement_text": "The system SHALL implement secure user login with password policies",
    "similarity_score": 0.76,
    "similarity_reasons": [
      "Both requirements address user authentication",
      "Both specify system security requirements"
    ]
  }
]
```

---

## 9. Traceability

### GET `/requirements/{requirementId}/lineage`
**Description**: Get complete lineage information for a requirement

**Query Parameters**:
- `depth`: Lineage depth (default: 3, max: 10)

**Response** (200 OK):
```json
{
  "requirement_id": "req-001",
  "source_documents": [
    {
      "document_id": "doc-12345",
      "document_name": "Security Requirements.pdf",
      "section": "Authentication Requirements",
      "page_number": 3
    }
  ],
  "derived_requirements": [
    "req-003",
    "req-015"
  ],
  "implementing_components": [
    "comp-auth-001"
  ],
  "implementing_behaviors": [
    "behavior-login-001",
    "behavior-mfa-001"
  ],
  "related_models": [
    "model-001"
  ],
  "ontology_references": [
    {
      "ontology_id": "security_ontology_v1",
      "class_uri": "http://security.ont/Authentication",
      "label": "Multi-Factor Authentication"
    }
  ],
  "impact_analysis": {
    "downstream_components": ["comp-auth-001", "comp-session-001"],
    "affected_behaviors": ["behavior-login-001", "behavior-logout-001"],
    "related_interfaces": ["intf-auth-api"],
    "compliance_implications": ["NIST_Cybersecurity_Framework"]
  }
}
```

---

### GET `/conceptual-models/{modelId}/traceability`
**Description**: Get comprehensive traceability matrix for a conceptual model

**Response** (200 OK):
```json
{
  "model_id": "model-001",
  "requirements_to_components": {
    "req-001": ["comp-auth-001"],
    "req-002": ["comp-authz-001"],
    "req-003": ["comp-auth-001", "comp-biometric-001"],
    "req-004": ["comp-authz-001", "comp-policy-001"]
  },
  "components_to_behaviors": {
    "comp-auth-001": ["behavior-login-001", "behavior-mfa-001"],
    "comp-authz-001": ["behavior-authorize-001", "behavior-rbac-001"]
  },
  "requirements_to_behaviors": {
    "req-001": ["behavior-login-001", "behavior-mfa-001"],
    "req-002": ["behavior-authorize-001", "behavior-rbac-001"]
  },
  "interface_dependencies": {
    "intf-auth-api": ["comp-auth-001"],
    "intf-authz-api": ["comp-authz-001"]
  },
  "coverage_matrix": {
    "total_requirements": 5,
    "covered_requirements": 5,
    "coverage_percentage": 100,
    "component_coverage": {
      "comp-auth-001": ["req-001", "req-003"],
      "comp-authz-001": ["req-002", "req-004"]
    }
  }
}
```

---

## 10. Validation & Quality

### POST `/requirements/{requirementId}/validate`
**Description**: Validate a requirement for quality and consistency

**Request Body**:
```json
{
  "validation_rules": [
    "semantic_consistency",
    "completeness_check",
    "ambiguity_detection",
    "testability_assessment"
  ],
  "include_semantic_validation": true
}
```

**Response** (200 OK):
```json
{
  "is_valid": true,
  "validation_score": 0.89,
  "validation_errors": [],
  "validation_warnings": [
    {
      "warning_code": "AMBIGUOUS_TERM",
      "warning_message": "The term 'granular permissions' could be more specific",
      "severity": "medium"
    }
  ],
  "recommendations": [
    "Consider defining specific permission levels or examples",
    "Add acceptance criteria for testability",
    "Reference relevant security standards"
  ],
  "semantic_validation": {
    "ontology_consistency": true,
    "concept_alignment": 0.92,
    "domain_relevance": 0.87
  },
  "quality_metrics": {
    "completeness": 0.85,
    "clarity": 0.90,
    "testability": 0.75,
    "consistency": 0.95
  }
}
```

---

### GET `/documents/{docId}/extraction-quality`
**Description**: Get quality report for document extraction process

**Response** (200 OK):
```json
{
  "document_id": "doc-12345",
  "extraction_method": "hybrid",
  "requirements_extracted": 23,
  "quality_score": 0.84,
  "confidence_distribution": {
    "high_confidence": 18,
    "medium_confidence": 4,
    "low_confidence": 1
  },
  "extraction_issues": [
    {
      "issue_type": "low_confidence_extraction",
      "description": "One requirement has confidence below threshold",
      "recommendations": [
        "Review requirement req-023 manually",
        "Consider additional context for validation"
      ]
    },
    {
      "issue_type": "potential_duplicate",
      "description": "Two requirements appear similar",
      "recommendations": [
        "Compare req-015 and req-018 for potential duplication",
        "Consolidate if appropriate"
      ]
    }
  ],
  "processing_statistics": {
    "total_processing_time_ms": 15420,
    "text_extraction_time_ms": 2340,
    "nlp_processing_time_ms": 8960,
    "pattern_matching_time_ms": 1890,
    "semantic_tagging_time_ms": 2230
  },
  "recommendations": [
    "Review low-confidence requirements manually",
    "Validate potential duplicates",
    "Consider additional training data for domain-specific terms"
  ]
}
```

---

## 11. Health & Monitoring

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
    "nlp_engine": "healthy",
    "semantic_tagger": "healthy",
    "llm_service": "healthy",
    "document_processor": "healthy"
  },
  "resource_usage": {
    "memory_usage_percentage": 45,
    "cpu_usage_percentage": 23,
    "disk_usage_percentage": 12
  },
  "last_successful_extraction": "2025-01-15T19:45:30Z",
  "last_successful_modeling": "2025-01-15T19:30:15Z"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3014/health
```

---

### GET `/metrics`
**Description**: Get service performance metrics

**Response** (200 OK):
```json
{
  "documents_processed": {
    "total": 150,
    "last_24h": 12,
    "success_rate": 0.96,
    "average_processing_time_ms": 12500
  },
  "requirements_extracted": {
    "total": 2847,
    "last_24h": 156,
    "by_type": {
      "functional": 1200,
      "security": 450,
      "non_functional": 380,
      "business": 320,
      "technical": 297,
      "regulatory": 200
    },
    "average_confidence": 0.83
  },
  "models_generated": {
    "total": 45,
    "last_24h": 3,
    "average_quality_score": 0.85,
    "average_generation_time_ms": 25000
  },
  "semantic_tagging": {
    "tags_applied": 8456,
    "ontologies_used": 12,
    "average_tag_confidence": 0.79
  },
  "performance": {
    "avg_response_time_ms": 185,
    "p95_response_time_ms": 450,
    "requests_per_second": 12.5,
    "error_rate": 0.02,
    "cache_hit_rate": 0.67
  },
  "quality_metrics": {
    "extraction_accuracy": 0.84,
    "validation_pass_rate": 0.91,
    "human_approval_rate": 0.89
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
  "message": "Invalid extraction options provided",
  "details": {
    "invalid_fields": ["confidence_threshold"],
    "validation_errors": ["confidence_threshold must be between 0.0 and 1.0"]
  },
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Document not found",
  "details": {
    "resource_type": "document",
    "resource_id": "doc-12345"
  },
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**422 Processing Error**:
```json
{
  "success": false,
  "error": "PROCESSING_ERROR",
  "message": "Document processing failed",
  "details": {
    "processing_stage": "nlp_analysis",
    "error_reason": "Unsupported document format",
    "suggested_action": "Convert document to supported format (PDF, DOCX, MD, TXT)"
  },
  "timestamp": "2025-01-15T14:35:12Z"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "NLP processing service unavailable",
  "details": {
    "service": "nlp_engine",
    "retry_after_seconds": 30
  },
  "timestamp": "2025-01-15T14:35:12Z"
}
```

---

## Processing Pipeline

### Document Processing Stages

1. **Document Parsing**: Extract text content from various formats
2. **Text Preprocessing**: Clean and normalize text content
3. **NLP Analysis**: Perform linguistic analysis and entity recognition
4. **Pattern Matching**: Apply rule-based requirement identification
5. **LLM Extraction**: Use language models for intelligent extraction
6. **Semantic Tagging**: Apply ontology-based semantic annotations
7. **Validation**: Quality checks and consistency validation
8. **Result Compilation**: Compile and format final results

### Conceptual Modeling Pipeline

1. **Requirements Analysis**: Analyze input requirements for themes and patterns
2. **Functional Decomposition**: Break down system functions hierarchically
3. **Component Identification**: Identify system components and responsibilities
4. **Behavior Modeling**: Model system behaviors and interactions
5. **Interface Design**: Define component interfaces and protocols
6. **Constraint Identification**: Extract system constraints and limitations
7. **Traceability Generation**: Establish requirement-to-model mappings
8. **Quality Assessment**: Evaluate model completeness and consistency

---

## Integration Patterns

### Event-Driven Integration

The service publishes events for:
- Document processing completion
- Requirements extraction results
- Model generation completion
- Validation results
- Quality assessments

### Service Dependencies

- **Knowledge Service**: Document access and storage
- **Ontology Manager**: Semantic tagging and validation
- **LLM Service**: Language model processing
- **EventManager**: Event publishing and subscription
- **Data Manager**: Units and data validation

### Export Integration

- **Process Manager**: BPMN model export
- **Model Manager**: Model artifact storage
- **Analysis Manager**: Requirements for analysis

---

## 11. Enhanced Intelligence Capabilities

### LLM Review & Suggestions

#### POST `/requirements/{requirementId}/review`
**Description**: Generate intelligent review and improvement suggestions for a requirement using LLM analysis

**Path Parameters**:
- `requirementId` (string, UUID, required): Requirement ID to review

**Request Body**:
```json
{
  "review_depth": "comprehensive",
  "focus_areas": ["clarity", "completeness", "testability", "constraints"],
  "llm_model": "gpt-4",
  "include_suggestions": true,
  "include_alternatives": true
}
```

**Response**:
```json
{
  "review_id": "review-12345",
  "requirement_id": "req-67890",
  "review_timestamp": "2025-01-15T14:30:00Z",
  "reviewer_agent": "llm-reviewer-v1",
  "quality_score": {
    "overall_score": 0.72,
    "completeness_score": 0.68,
    "clarity_score": 0.85,
    "testability_score": 0.60,
    "consistency_score": 0.75,
    "scoring_rationale": "Requirement has good clarity but lacks specific testability criteria and measurable constraints.",
    "improvement_potential": 0.85
  },
  "suggestions": [
    {
      "suggestion_id": "sugg-1",
      "suggestion_type": "testability_enhancement",
      "priority": "high",
      "current_text": "The system shall provide fast response times",
      "suggested_text": "The system shall provide response times of less than 200ms for 95% of requests under normal load",
      "rationale": "Adding specific measurable criteria makes the requirement testable and verifiable"
    }
  ],
  "identified_constraints": [
    "Response time constraint: < 200ms",
    "Availability constraint: 95% uptime"
  ],
  "review_status": "completed"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3014/requirements/req-67890/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "review_depth": "comprehensive",
    "focus_areas": ["clarity", "completeness", "testability"]
  }'
```

**Python SDK**:
```python
def review_requirement(api_base, token, requirement_id, options=None):
    """Review requirement with LLM analysis"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    request_body = options or {
        "review_depth": "standard",
        "include_suggestions": True
    }
    
    response = requests.post(
        f"{api_base}/requirements/{requirement_id}/review",
        headers=headers,
        json=request_body
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        response.raise_for_status()

# Usage
review = review_requirement(
    "http://localhost:3014", 
    "your_jwt_token", 
    "req-67890",
    {"review_depth": "comprehensive", "focus_areas": ["testability"]}
)
print(f"Overall quality score: {review['quality_score']['overall_score']}")
```

### Constraint Management

#### POST `/requirements/{requirementId}/constraints`
**Description**: Extract and classify constraints from a requirement text

**Path Parameters**:
- `requirementId` (string, UUID, required): Requirement ID to analyze

**Response**:
```json
[
  {
    "constraint_id": "const-123",
    "constraint_text": "response time less than 200ms",
    "constraint_type": "performance",
    "constraint_category": "non_functional",
    "source_requirement_id": "req-67890",
    "confidence_score": 0.92,
    "formal_expression": "response_time < 200",
    "units": "milliseconds",
    "bounds": {
      "type": "maximum",
      "max_value": 200,
      "units": "ms"
    },
    "validation_status": "validated"
  }
]
```

### Concept Clustering

#### POST `/concepts/cluster`
**Description**: Group similar concepts into clusters with master concept identification

**Request Body**:
```json
{
  "concept_ids": ["concept-1", "concept-2", "concept-3"],
  "clustering_options": {
    "method": "semantic_similarity",
    "similarity_threshold": 0.8,
    "max_cluster_size": 5,
    "include_domain_context": true
  }
}
```

**Response**:
```json
{
  "cluster_id": "cluster-abc123",
  "master_concept": {
    "preferred_label": "aircraft",
    "definition": "A powered flying vehicle with fixed wings and engines",
    "concept_type": "entity",
    "domain": "aviation",
    "frequency_score": 0.85,
    "authority_score": 0.90,
    "clarity_score": 0.88
  },
  "variant_concepts": [
    {
      "variant_label": "airplane",
      "frequency": 45,
      "similarity_score": 0.95,
      "context_examples": ["The airplane shall have...", "airplane performance requirements"]
    },
    {
      "variant_label": "air vehicle",
      "frequency": 23,
      "similarity_score": 0.87,
      "context_examples": ["air vehicle navigation system", "unmanned air vehicle"]
    }
  ],
  "cluster_confidence": 0.89,
  "clustering_method": "semantic_similarity"
}
```

### Similarity Analysis

#### POST `/requirements/{requirementId}/similarity`
**Description**: Find similar requirements across domains with detailed analysis

**Request Body**:
```json
{
  "similarity_threshold": 0.7,
  "domain_scope": ["aviation", "automotive", "defense"],
  "include_cross_domain": true,
  "analysis_depth": "comprehensive",
  "max_results": 20
}
```

**Response**:
```json
{
  "analysis_id": "analysis-xyz789",
  "target_requirement_id": "req-67890",
  "similar_requirements": [
    {
      "requirement_id": "req-automotive-123",
      "requirement_text": "The vehicle control system shall respond to inputs within 150ms",
      "similarity_score": 0.83,
      "similarity_type": "functional",
      "source_domain": "automotive",
      "key_similarities": [
        "Response time constraint",
        "Real-time system requirement",
        "Control system context"
      ],
      "key_differences": [
        "Different time threshold (150ms vs 200ms)",
        "Vehicle vs aircraft domain"
      ],
      "reuse_potential": "high",
      "adaptation_effort": "low"
    }
  ],
  "highest_similarity_score": 0.83,
  "analysis_summary": "Found 5 similar requirements across 3 domains, primarily related to real-time response constraints"
}
```

### Iterative Extraction

#### POST `/documents/{docId}/extraction/start`
**Description**: Begin iterative requirement extraction with convergence tracking

**Request Body**:
```json
{
  "max_iterations": 10,
  "convergence_threshold": 0.95,
  "iteration_timeout_minutes": 30,
  "extraction_methods": ["nlp_analysis", "llm_extraction", "pattern_matching"],
  "focus_areas": ["functional_requirements", "constraints", "interfaces"]
}
```

**Response**:
```json
{
  "session_id": "session-iter123",
  "document_id": "doc-12345",
  "session_status": "active",
  "total_iterations": 0,
  "current_iteration": 1,
  "convergence_score": 0.0,
  "requirements_found": 0,
  "started_at": "2025-01-15T14:35:00Z"
}
```

#### POST `/extraction-sessions/{sessionId}/continue`
**Description**: Continue to next iteration in the extraction process

**Response**:
```json
{
  "iteration_id": "iter-456",
  "iteration_number": 2,
  "session_id": "session-iter123",
  "new_requirements": ["req-new1", "req-new2"],
  "modified_requirements": [
    {
      "requirement_id": "req-existing1",
      "modification_type": "confidence_update",
      "old_confidence": 0.75,
      "new_confidence": 0.82
    }
  ],
  "convergence_metrics": {
    "new_requirement_rate": 0.15,
    "modification_rate": 0.08,
    "novelty_score": 0.12,
    "convergence_threshold_met": false,
    "diminishing_returns": false
  },
  "continue_extraction": true,
  "processing_time_ms": 15430
}
```

### Enhanced Traceability

#### GET `/requirements/{requirementId}/full-trace`
**Description**: Retrieve complete traceability information for a requirement

**Response**:
```json
{
  "requirement_id": "req-67890",
  "source_lineage": {
    "original_documents": [
      {
        "document_id": "doc-12345",
        "document_name": "System_Requirements_v2.pdf",
        "section": "4.2 Performance Requirements",
        "page_number": 15,
        "line_range": {"start": 23, "end": 25}
      }
    ],
    "extraction_history": [
      {
        "extracted_at": "2025-01-15T10:00:00Z",
        "extracted_by": "nlp-extractor-v2",
        "extraction_method": "pattern_matching",
        "confidence_at_extraction": 0.78
      }
    ]
  },
  "downstream_impact": {
    "derived_requirements": ["req-67891", "req-67892"],
    "related_concepts": ["response_time", "performance_constraint"],
    "implementing_components": ["ResponseTimeMonitor", "PerformanceController"],
    "affected_models": ["model-perf001"]
  },
  "change_history": [
    {
      "change_id": "change-1",
      "change_type": "text_modification",
      "changed_by": "analyst-smith",
      "changed_at": "2025-01-15T12:00:00Z",
      "rationale": "Clarified response time measurement criteria",
      "impact_assessment": "Low - no architectural changes required"
    }
  ]
}
```

### Graph & Vector Integration

#### POST `/requirements/sync/graph`
**Description**: Synchronize requirements and relationships to GraphDB

**Request Body**:
```json
{
  "requirement_ids": ["req-67890", "req-67891", "req-67892"]
}
```

**Response**:
```json
{
  "sync_id": "sync-graph123",
  "synced_requirements": ["req-67890", "req-67891", "req-67892"],
  "nodes_created": 3,
  "relationships_created": 5,
  "sync_status": "success",
  "sync_timestamp": "2025-01-15T14:40:00Z"
}
```

#### GET `/requirements/{requirementId}/semantic-neighbors`
**Description**: Find semantically related requirements using vector embeddings

**Query Parameters**:
- `neighborhood_size` (integer, optional): Number of neighbors to return (default: 10, max: 100)

**Response**:
```json
[
  {
    "requirement_id": "req-neighbor1",
    "requirement_text": "The system shall maintain response times under load",
    "semantic_similarity": 0.89,
    "relationship_type": "functionally_related",
    "shared_concepts": ["response_time", "performance", "system_behavior"],
    "domain": "aviation",
    "project_context": "flight_control_system"
  },
  {
    "requirement_id": "req-neighbor2", 
    "requirement_text": "Real-time processing constraints for navigation data",
    "semantic_similarity": 0.76,
    "relationship_type": "conceptually_similar",
    "shared_concepts": ["real_time", "processing", "constraints"],
    "domain": "navigation",
    "project_context": "nav_system_v3"
  }
]
```

---

## 12. Ontology-Constrained Conceptualization

### Ontology Constraint Management

#### POST `/ontology-constraints`
**Description**: Create a new ontology constraint to govern conceptualization

**Request Body**:
```json
{
  "ontology_id": "aviation-ontology-v2.1",
  "ontology_version": "2.1.0",
  "constraint_type": "class_membership",
  "validation_mode": "strict",
  "fallback_strategy": "adapt",
  "constraint_scope": "all_concepts",
  "required_classes": [
    "http://aviation.onto/Aircraft",
    "http://aviation.onto/FlightSystem",
    "http://aviation.onto/NavigationSystem",
    "http://aviation.onto/ControlSurface"
  ],
  "forbidden_classes": [
    "http://automotive.onto/Vehicle",
    "http://maritime.onto/Vessel"
  ],
  "relationship_constraints": [
    {
      "source_class": "http://aviation.onto/Aircraft",
      "target_class": "http://aviation.onto/Engine",
      "relationship_property": "http://aviation.onto/hasPropulsion",
      "constraint_type": "must_exist",
      "is_required": true,
      "cardinality": {
        "min_cardinality": 1,
        "max_cardinality": 4
      }
    }
  ],
  "validation_settings": {
    "minimum_compliance_score": 0.85,
    "warning_compliance_threshold": 0.70,
    "allow_class_extension": false,
    "extension_approval_required": true
  }
}
```

**Response**:
```json
{
  "constraint_id": "constraint-aviation-001",
  "status": "created",
  "validation_summary": {
    "ontology_loaded": true,
    "classes_validated": 4,
    "relationships_validated": 1,
    "compliance_rules_created": 12
  },
  "created_at": "2025-01-15T15:00:00Z"
}
```

### Concept Validation

#### POST `/concepts/{conceptId}/validate-ontology`
**Description**: Validate an extracted concept against specified ontology constraints

**Path Parameters**:
- `conceptId` (string, UUID, required): Concept ID to validate

**Request Body**:
```json
{
  "ontology_id": "aviation-ontology-v2.1",
  "validation_mode": "comprehensive",
  "validation_options": {
    "check_class_hierarchy": true,
    "validate_properties": true,
    "check_relationships": true,
    "suggest_corrections": true
  }
}
```

**Response**:
```json
{
  "validation_id": "validation-abc123",
  "concept_id": "concept-aircraft-789",
  "ontology_id": "aviation-ontology-v2.1",
  "validation_results": {
    "is_valid": false,
    "validation_score": 0.72,
    "compliance_level": "partial_compliance"
  },
  "class_validation": {
    "is_class_valid": true,
    "matched_classes": [
      {
        "class_uri": "http://aviation.onto/Aircraft",
        "class_label": "Aircraft",
        "confidence_score": 0.95,
        "match_type": "exact_match"
      }
    ],
    "class_hierarchy_position": {
      "parent_classes": ["http://aviation.onto/Vehicle"],
      "ancestor_classes": ["http://aviation.onto/PhysicalObject"],
      "hierarchy_depth": 3
    }
  },
  "validation_issues": [
    {
      "issue_id": "issue-001",
      "issue_type": "property_violation",
      "severity": "medium",
      "description": "Missing required property 'hasMaxAltitude'",
      "affected_element": "concept-aircraft-789",
      "ontology_context": "http://aviation.onto/hasMaxAltitude",
      "suggested_fix": "Add maximum operational altitude property with numeric value in feet"
    },
    {
      "issue_id": "issue-002", 
      "issue_type": "relationship_violation",
      "severity": "high",
      "description": "Missing required relationship to engine concept",
      "affected_element": "concept-aircraft-789",
      "ontology_context": "http://aviation.onto/hasPropulsion",
      "suggested_fix": "Link aircraft concept to at least one engine or propulsion system concept"
    }
  ],
  "recommendations": [
    {
      "recommendation_id": "rec-001",
      "recommendation_type": "property_addition",
      "priority": "high",
      "description": "Add missing altitude property",
      "action_required": "Define maximum operational altitude property",
      "expected_outcome": "Full compliance with aircraft class definition",
      "implementation_effort": "minimal"
    }
  ],
  "ontology_suggestions": [
    {
      "suggestion_id": "suggest-001",
      "suggested_class": "http://aviation.onto/CommercialAircraft",
      "suggested_label": "Commercial Aircraft",
      "confidence_score": 0.88,
      "similarity_score": 0.92,
      "mapping_rationale": "Based on detected properties and intended use context",
      "semantic_justification": "Concept includes passenger capacity and commercial operation indicators"
    }
  ]
}
```

### Ontology-Constrained Model Generation

#### POST `/conceptual-models/{modelId}/generate-with-ontology`
**Description**: Generate conceptual model constrained by specified ontology

**Request Body**:
```json
{
  "requirement_ids": [
    "req-flight-control-001",
    "req-navigation-002", 
    "req-engine-control-003"
  ],
  "ontology_id": "aviation-ontology-v2.1",
  "modeling_options": {
    "ontology_binding": {
      "binding_mode": "guided",
      "constraint_scope": "all_concepts",
      "minimum_compliance_score": 0.80,
      "allow_class_extension": true,
      "extension_approval_required": false
    },
    "concept_mapping_strategy": "hybrid_approach",
    "validation_frequency": "real_time",
    "adaptation_preferences": {
      "prefer_specialization": true,
      "allow_approximation": true,
      "similarity_threshold": 0.75,
      "adaptation_methods": [
        "class_substitution",
        "property_addition",
        "semantic_mapping"
      ]
    },
    "quality_assurance": {
      "enable_compliance_monitoring": true,
      "generate_compliance_reports": true,
      "include_ontology_metadata": true
    }
  }
}
```

**Response**:
```json
{
  "model_id": "model-aviation-flight-system",
  "model_name": "Aviation Flight Control System",
  "ontology_compliance": {
    "overall_compliance_score": 0.89,
    "concept_compliance_rate": 0.92,
    "relationship_compliance_rate": 0.85,
    "property_compliance_rate": 0.88
  },
  "generated_components": [
    {
      "component_id": "comp-flight-controller",
      "component_name": "Flight Control System",
      "ontology_class": "http://aviation.onto/FlightControlSystem",
      "compliance_score": 0.95,
      "properties": [
        {
          "property_uri": "http://aviation.onto/hasAutopilotCapability",
          "value": true,
          "compliance_status": "compliant"
        },
        {
          "property_uri": "http://aviation.onto/hasManualOverride",
          "value": true,
          "compliance_status": "compliant"
        }
      ],
      "relationships": [
        {
          "target_component": "comp-navigation-system",
          "relationship_uri": "http://aviation.onto/controlsNavigation",
          "compliance_status": "compliant"
        }
      ]
    }
  ],
  "compliance_issues": [
    {
      "issue_type": "missing_property",
      "affected_component": "comp-engine-controller",
      "missing_property": "http://aviation.onto/hasRedundancy",
      "severity": "medium",
      "suggestion": "Add redundancy specification for engine control system"
    }
  ],
  "ontology_extensions_proposed": [
    {
      "extension_id": "ext-001",
      "extension_type": "new_subclass",
      "proposed_class": "http://aviation.onto/DigitalFlightControlSystem",
      "parent_class": "http://aviation.onto/FlightControlSystem",
      "justification": "Modern digital flight control systems have distinct properties not captured in parent class",
      "approval_status": "pending_review"
    }
  ],
  "generated_at": "2025-01-15T15:30:00Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3014/conceptual-models/model-123/generate-with-ontology \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "requirement_ids": ["req-flight-control-001", "req-navigation-002"],
    "ontology_id": "aviation-ontology-v2.1",
    "modeling_options": {
      "ontology_binding": {
        "binding_mode": "guided",
        "minimum_compliance_score": 0.80
      },
      "concept_mapping_strategy": "hybrid_approach"
    }
  }'
```

**Python SDK**:
```python
def generate_ontology_constrained_model(api_base, token, requirement_ids, ontology_id, options=None):
    """Generate conceptual model with ontology constraints"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    default_options = {
        "ontology_binding": {
            "binding_mode": "guided",
            "minimum_compliance_score": 0.80,
            "allow_class_extension": True
        },
        "concept_mapping_strategy": "hybrid_approach",
        "validation_frequency": "real_time"
    }
    
    request_body = {
        "requirement_ids": requirement_ids,
        "ontology_id": ontology_id,
        "modeling_options": {**default_options, **(options or {})}
    }
    
    response = requests.post(
        f"{api_base}/conceptual-models/new/generate-with-ontology",
        headers=headers,
        json=request_body
    )
    
    if response.status_code == 201:
        return response.json()
    else:
        response.raise_for_status()

# Usage
result = generate_ontology_constrained_model(
    "http://localhost:3014",
    "your_jwt_token",
    ["req-flight-001", "req-nav-002"],
    "aviation-ontology-v2.1",
    {
        "ontology_binding": {
            "binding_mode": "strict",
            "minimum_compliance_score": 0.90
        }
    }
)

print(f"Model compliance score: {result['ontology_compliance']['overall_compliance_score']}")
print(f"Components generated: {len(result['generated_components'])}")
print(f"Compliance issues: {len(result['compliance_issues'])}")
```

---

## Best Practices

### Requirements Extraction
1. **Multi-Method Approach**: Use combination of pattern matching, NLP, and LLM extraction
2. **Context Preservation**: Always maintain source document context
3. **Iterative Extraction**: Use iterative extraction for complex documents to achieve convergence
4. **LLM Review Integration**: Always review extracted requirements with LLM analysis for quality improvement

### Enhanced Intelligence Features
1. **Concept Clustering**: Run concept clustering regularly to maintain clean master concepts (airplane/aircraft/air vehicle → aircraft)
2. **Similarity Analysis**: Leverage cross-domain similarity to reuse proven requirements from other projects
3. **Constraint Extraction**: Extract constraints early for validation and evaluation frameworks
4. **Convergence Monitoring**: Monitor convergence metrics during iterative extraction to optimize stopping criteria
5. **Traceability Maintenance**: Use full traceability features for regulatory compliance and change impact analysis

### GraphDB & Vector Store Integration
1. **Regular Synchronization**: Sync requirements to GraphDB and Vector Store after major extraction sessions
2. **Semantic Neighborhood Analysis**: Use semantic neighbors to discover related requirements across projects
3. **Knowledge Graph Exploration**: Leverage knowledge graph views for comprehensive requirement understanding
3. **Confidence Scoring**: Provide confidence scores for all extractions
4. **Human Validation**: Enable human-in-the-loop validation workflows
5. **Iterative Refinement**: Support requirement refinement and improvement

### Conceptual Modeling
1. **Requirements Coverage**: Ensure all requirements are addressed in models
2. **Traceability**: Maintain complete requirement-to-model traceability
3. **Consistency**: Validate model consistency and completeness
4. **Abstraction Levels**: Support different levels of model abstraction
5. **Visualization**: Provide clear visual representations

### Quality Assurance
1. **Validation Rules**: Implement comprehensive validation rules
2. **Quality Metrics**: Track extraction and modeling quality metrics
3. **Continuous Improvement**: Learn from validation feedback
4. **Standard Compliance**: Ensure compliance with industry standards
5. **Audit Trails**: Maintain complete audit trails for all operations

---

This documentation provides comprehensive coverage of the Requirements Extractor & Conceptualizer Service API. For additional information, refer to the OpenAPI specification and service architecture documentation. 