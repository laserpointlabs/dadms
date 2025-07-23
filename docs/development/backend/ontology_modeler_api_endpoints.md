# DADMS 2.0 - Ontology Modeler Component API Endpoints

## Overview

The Ontology Modeler is a visual component within the **Ontology Workspace Service (Port 3016)** that provides an interactive, web-based interface for building, editing, and managing ontologies. This document provides human-readable documentation for all Ontology Modeler component API endpoints.

**Base URL**: `http://localhost:3016` (Development) | `https://api.dadms.example.com/ontology-workspace` (Production)

**Authentication**: Bearer Token (JWT)

**Component Context**: All modeler endpoints operate within the workspace service context and require valid workspace and ontology identifiers.

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Modeler Canvas** | GET | `/workspaces/{workspaceId}/modeler/canvas` | Get modeler canvas state |
| | PUT | `/workspaces/{workspaceId}/modeler/canvas` | Update modeler canvas state |
| | POST | `/workspaces/{workspaceId}/modeler/canvas/reset` | Reset canvas layout |
| **Dual-View Editor** | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/dual-view` | Get dual-view state |
| | PUT | `/workspaces/{workspaceId}/ontologies/{ontologyId}/dual-view/mode` | Switch view mode |
| | GET | `/workspaces/{workspaceId}/ontologies/{ontologyId}/owl-text` | Get OWL text representation |
| | PUT | `/workspaces/{workspaceId}/ontologies/{ontologyId}/owl-text` | Update via OWL text |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/sync/diagram-to-owl` | Sync diagram to OWL |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/sync/owl-to-diagram` | Sync OWL to diagram |
| **AAS Integration** | POST | `/workspaces/{workspaceId}/modeler/generate` | Generate ontology via AAS |
| | PUT | `/workspaces/{workspaceId}/ontologies/{ontologyId}/aas-refine` | Refine ontology via AAS |
| | POST | `/workspaces/{workspaceId}/modeler/inject-aas` | Inject AAS-generated ontology |
| | GET | `/workspaces/{workspaceId}/modeler/aas-suggestions` | Get AAS suggestions |
| **Import/Reference** | GET | `/workspaces/{workspaceId}/modeler/external/search` | Search external ontologies |
| | POST | `/workspaces/{workspaceId}/modeler/import/reference` | Add ontology reference |
| | POST | `/workspaces/{workspaceId}/modeler/import/selective` | Selective element import |
| | POST | `/workspaces/{workspaceId}/modeler/import/preview` | Preview import impact |
| | DELETE | `/workspaces/{workspaceId}/modeler/references/{referenceId}` | Remove reference |
| **Example Library** | GET | `/workspaces/{workspaceId}/modeler/examples/search` | Search example library |
| | POST | `/workspaces/{workspaceId}/modeler/examples/semantic-search` | Semantic search examples |
| | GET | `/workspaces/{workspaceId}/modeler/examples/domains` | Get domain categories |
| | GET | `/workspaces/{workspaceId}/modeler/examples/patterns/{domain}` | Get domain patterns |
| | POST | `/workspaces/{workspaceId}/modeler/examples/apply` | Apply example template |
| **Validation** | POST | `/workspaces/{workspaceId}/modeler/validate` | Validate modeler state |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/validate/consistency` | Check consistency |
| | POST | `/workspaces/{workspaceId}/ontologies/{ontologyId}/validate/owl` | Validate OWL syntax |
| **Collaboration** | WebSocket | `/ws/workspaces/{workspaceId}/modeler` | Real-time collaboration |
| | GET | `/workspaces/{workspaceId}/modeler/collaborators` | Get active collaborators |
| | POST | `/workspaces/{workspaceId}/modeler/cursor-update` | Update cursor position |
| **Analytics** | GET | `/workspaces/{workspaceId}/modeler/analytics` | Get modeler analytics |
| | GET | `/workspaces/{workspaceId}/modeler/usage-patterns` | Get usage patterns |

---

## Modeler Canvas Management

### Get Modeler Canvas State

**GET** `/workspaces/{workspaceId}/modeler/canvas`

Retrieve the current state of the modeler canvas including node positions, layout, and visual settings.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Query Parameters:**
- `ontologyId` (optional): Filter canvas for specific ontology
- `include_layout` (optional): Include layout metadata (default: true)
- `include_styling` (optional): Include visual styling data (default: true)

**Response Example:**
```json
{
  "canvas_state": {
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1.0
    },
    "nodes": [
      {
        "id": "node-1",
        "type": "decision_entity",
        "position": { "x": 100, "y": 200 },
        "data": {
          "label": "Mission Planning Decision",
          "entity_type": "Decision",
          "properties": {
            "priority": "critical",
            "stakeholders": ["commander", "analyst"]
          }
        },
        "style": {
          "background": "#e3f2fd",
          "border": "2px solid #1976d2"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "type": "influences",
        "style": {
          "stroke": "#1976d2",
          "strokeWidth": 2
        }
      }
    ],
    "layout_metadata": {
      "algorithm": "hierarchical",
      "auto_layout_enabled": true,
      "last_layout_update": "2024-01-20T14:30:00Z"
    }
  },
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "last_updated": "2024-01-20T14:30:00Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3016/workspaces/123e4567-e89b-12d3-a456-426614174000/modeler/canvas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Modeler Canvas State

**PUT** `/workspaces/{workspaceId}/modeler/canvas`

Update the modeler canvas state with new node positions, connections, or visual settings.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "canvas_update": {
    "nodes": [
      {
        "id": "node-1",
        "position": { "x": 150, "y": 250 },
        "data": {
          "label": "Updated Mission Planning",
          "properties": {
            "priority": "high",
            "timeline": "2024-Q1"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-2",
        "source": "node-1",
        "target": "node-3",
        "type": "requires"
      }
    ],
    "viewport": {
      "x": -50,
      "y": 0,
      "zoom": 1.2
    }
  },
  "update_type": "incremental"
}
```

**Response Example:**
```json
{
  "success": true,
  "canvas_id": "canvas-456",
  "updated_elements": {
    "nodes_updated": 1,
    "edges_updated": 1,
    "viewport_updated": true
  },
  "last_updated": "2024-01-20T14:35:00Z"
}
```

---

## Dual-View Editor Management

### Get Dual-View State

**GET** `/workspaces/{workspaceId}/ontologies/{ontologyId}/dual-view`

Retrieve the current dual-view editor state including active mode and synchronization status.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Response Example:**
```json
{
  "dual_view_state": {
    "active_mode": "diagram",
    "available_modes": ["diagram", "owl_text"],
    "sync_status": "synchronized",
    "last_sync": "2024-01-20T14:30:00Z",
    "owl_format": "turtle",
    "available_formats": ["turtle", "rdf_xml", "owl_xml", "n3", "json_ld"]
  },
  "diagram_state": {
    "node_count": 15,
    "edge_count": 22,
    "validation_status": "valid"
  },
  "owl_text_state": {
    "line_count": 156,
    "syntax_errors": [],
    "warnings": []
  }
}
```

### Switch View Mode

**PUT** `/workspaces/{workspaceId}/ontologies/{ontologyId}/dual-view/mode`

Switch between diagram and OWL text editing modes.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Request Body:**
```json
{
  "target_mode": "owl_text",
  "owl_format": "turtle",
  "preserve_layout": true,
  "auto_sync": true
}
```

**Response Example:**
```json
{
  "success": true,
  "active_mode": "owl_text",
  "sync_performed": true,
  "owl_content": "@prefix : <http://example.org/ontology#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n...",
  "validation_result": {
    "is_valid": true,
    "warnings": [],
    "suggestions": []
  }
}
```

### Get OWL Text Representation

**GET** `/workspaces/{workspaceId}/ontologies/{ontologyId}/owl-text`

Retrieve the OWL text representation of the ontology in the specified format.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Query Parameters:**
- `format` (optional): OWL format (turtle, rdf_xml, owl_xml, n3, json_ld) [default: turtle]
- `include_imports` (optional): Include imported ontologies (default: false)
- `include_annotations` (optional): Include annotations (default: true)

**Response Example:**
```json
{
  "owl_content": "@prefix : <http://dadms.example.com/ontology/mission-planning#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n\n:Mission rdf:type owl:Class ;\n    rdfs:label \"Mission\" ;\n    rdfs:comment \"A military mission or operation\" .\n\n:hasPriority rdf:type owl:DataProperty ;\n    rdfs:domain :Mission ;\n    rdfs:range xsd:string .",
  "format": "turtle",
  "metadata": {
    "line_count": 156,
    "namespace_count": 8,
    "class_count": 12,
    "property_count": 18,
    "individual_count": 5
  },
  "validation_status": "valid",
  "last_generated": "2024-01-20T14:30:00Z"
}
```

### Update via OWL Text

**PUT** `/workspaces/{workspaceId}/ontologies/{ontologyId}/owl-text`

Update the ontology by providing OWL text content directly.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Request Body:**
```json
{
  "owl_content": "@prefix : <http://dadms.example.com/ontology/mission-planning#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n:Mission rdf:type owl:Class ;\n    rdfs:label \"Enhanced Mission\" ;\n    rdfs:comment \"An updated military mission definition\" .",
  "format": "turtle",
  "validation_options": {
    "strict_mode": true,
    "check_consistency": true,
    "validate_imports": false
  },
  "update_diagram": true,
  "preserve_layout": true
}
```

**Response Example:**
```json
{
  "success": true,
  "validation_result": {
    "is_valid": true,
    "errors": [],
    "warnings": [
      {
        "line": 5,
        "message": "Consider adding domain specification for property",
        "severity": "warning"
      }
    ],
    "suggestions": []
  },
  "diagram_updated": true,
  "changes_summary": {
    "classes_added": 0,
    "classes_modified": 1,
    "classes_removed": 0,
    "properties_added": 0,
    "properties_modified": 0,
    "properties_removed": 0
  },
  "last_updated": "2024-01-20T14:35:00Z"
}
```

---

## AAS Integration (AI-Assisted Generation)

### Generate Ontology via AAS

**POST** `/workspaces/{workspaceId}/modeler/generate`

Request AADS to generate an ontology from a natural language description.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "prompt": "Create an ontology for military supply chain management including logistics, resources, suppliers, and delivery tracking",
  "domain": "defense",
  "complexity_level": "intermediate",
  "include_examples": true,
  "target_format": "turtle",
  "validation_level": "strict",
  "context": {
    "project_type": "supply_chain",
    "stakeholders": ["logistics_officer", "supply_manager", "commander"],
    "constraints": ["real_time_tracking", "security_clearance"]
  }
}
```

**Response Example:**
```json
{
  "generation_id": "gen-789",
  "status": "completed",
  "generated_ontology": {
    "owl_content": "@prefix : <http://dadms.example.com/ontology/supply-chain#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n:SupplyChain rdf:type owl:Class ;\n    rdfs:label \"Supply Chain\" .",
    "format": "turtle",
    "metadata": {
      "classes": 18,
      "properties": 25,
      "individuals": 8
    }
  },
  "context_used": {
    "examples_referenced": 3,
    "domain_patterns": ["supply_chain_basic", "military_logistics"],
    "similarity_scores": [0.87, 0.82, 0.79]
  },
  "validation_result": {
    "is_valid": true,
    "quality_score": 0.91,
    "completeness_score": 0.88
  },
  "generation_time_ms": 2847,
  "suggestions": [
    {
      "type": "enhancement",
      "message": "Consider adding temporal properties for delivery tracking"
    }
  ]
}
```

### Refine Ontology via AAS

**PUT** `/workspaces/{workspaceId}/ontologies/{ontologyId}/aas-refine`

Request AAS to refine an existing ontology based on user feedback.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier
- `ontologyId` (required): Ontology identifier

**Request Body:**
```json
{
  "refinement_request": "Add more detailed properties for tracking delivery status and include security classifications for sensitive materials",
  "focus_areas": ["delivery_tracking", "security_classification"],
  "preserve_existing": true,
  "refinement_level": "detailed",
  "validation_level": "strict"
}
```

**Response Example:**
```json
{
  "refinement_id": "ref-456",
  "status": "completed",
  "changes_applied": {
    "classes_added": 3,
    "properties_added": 7,
    "relationships_added": 4,
    "annotations_added": 12
  },
  "refined_sections": [
    {
      "section": "delivery_tracking",
      "changes": "Added DeliveryStatus, TrackingEvent, and StatusUpdate classes with temporal properties"
    },
    {
      "section": "security_classification",
      "changes": "Added SecurityLevel enumeration and classification properties"
    }
  ],
  "validation_result": {
    "is_valid": true,
    "quality_improvement": 0.07,
    "consistency_maintained": true
  },
  "refinement_time_ms": 1924
}
```

---

## Import and Reference Management

### Search External Ontologies

**GET** `/workspaces/{workspaceId}/modeler/external/search`

Search for external ontologies available for import or reference.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Query Parameters:**
- `query` (required): Search query string
- `domain` (optional): Domain filter (defense, business, healthcare, etc.)
- `source` (optional): Source filter (dadms_registry, web_repositories, standard_ontologies)
- `limit` (optional): Maximum results to return (default: 20, max: 100)
- `include_preview` (optional): Include ontology preview data (default: false)

**Response Example:**
```json
{
  "search_results": [
    {
      "id": "ext-ont-123",
      "name": "Defense Logistics Ontology",
      "description": "Comprehensive ontology for military logistics and supply chain management",
      "domain": "defense",
      "source": "dadms_registry",
      "version": "2.1.0",
      "last_updated": "2024-01-15T10:00:00Z",
      "metadata": {
        "classes": 45,
        "properties": 67,
        "complexity": "high",
        "quality_score": 0.94
      },
      "compatibility": {
        "dadms_compatible": true,
        "import_difficulty": "low",
        "namespace_conflicts": []
      },
      "preview": {
        "key_classes": ["LogisticsOperation", "MilitaryAsset", "SupplyRoute"],
        "key_properties": ["hasDeploymentLocation", "requiresSecurityClearance"]
      }
    }
  ],
  "total_results": 1,
  "search_metadata": {
    "query_time_ms": 156,
    "sources_searched": ["dadms_registry", "web_repositories"],
    "filters_applied": {
      "domain": "defense"
    }
  }
}
```

### Add Ontology Reference

**POST** `/workspaces/{workspaceId}/modeler/import/reference`

Add an external ontology as a reference (non-importing) to the modeler.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "external_ontology_id": "ext-ont-123",
  "reference_type": "visual_only",
  "namespace_prefix": "def_log",
  "display_options": {
    "show_in_palette": true,
    "visual_style": "dashed_border",
    "color_scheme": "referenced"
  },
  "access_level": "read_only"
}
```

**Response Example:**
```json
{
  "reference_id": "ref-789",
  "status": "referenced",
  "reference_details": {
    "external_ontology_id": "ext-ont-123",
    "namespace_prefix": "def_log",
    "reference_uri": "http://dadms.example.com/ontology/defense-logistics#",
    "access_level": "read_only"
  },
  "visual_integration": {
    "palette_items_added": 15,
    "visual_style_applied": true,
    "namespace_registered": true
  },
  "created_at": "2024-01-20T14:40:00Z"
}
```

### Selective Element Import

**POST** `/workspaces/{workspaceId}/modeler/import/selective`

Import specific elements from a referenced ontology with user confirmation.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "reference_id": "ref-789",
  "elements_to_import": [
    {
      "type": "class",
      "id": "def_log:LogisticsOperation",
      "include_properties": true,
      "include_relationships": ["subClassOf", "disjointWith"]
    },
    {
      "type": "property",
      "id": "def_log:hasDeploymentLocation",
      "include_domain": true,
      "include_range": true
    }
  ],
  "import_options": {
    "namespace_handling": "preserve_original",
    "conflict_resolution": "prompt_user",
    "validation_level": "strict"
  },
  "confirmation_required": true
}
```

**Response Example:**
```json
{
  "import_id": "imp-456",
  "status": "pending_confirmation",
  "import_preview": {
    "elements_to_import": 2,
    "dependencies_required": [
      {
        "element": "def_log:MilitaryAsset",
        "reason": "Domain of hasDeploymentLocation property"
      }
    ],
    "potential_conflicts": [],
    "estimated_changes": {
      "classes_added": 2,
      "properties_added": 1,
      "relationships_added": 3
    }
  },
  "impact_analysis": {
    "namespace_changes": 1,
    "existing_elements_affected": 0,
    "validation_impact": "none"
  },
  "confirmation_token": "conf-789",
  "expires_at": "2024-01-20T15:00:00Z"
}
```

### Preview Import Impact

**POST** `/workspaces/{workspaceId}/modeler/import/preview`

Preview the impact of importing elements before actual import.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "import_request": {
    "reference_id": "ref-789",
    "elements": ["def_log:LogisticsOperation", "def_log:hasDeploymentLocation"],
    "import_depth": "shallow"
  }
}
```

**Response Example:**
```json
{
  "preview_id": "prev-123",
  "impact_analysis": {
    "direct_imports": {
      "classes": 1,
      "properties": 1,
      "individuals": 0
    },
    "dependency_imports": {
      "classes": 1,
      "properties": 0,
      "individuals": 0
    },
    "total_changes": {
      "new_elements": 3,
      "modified_elements": 0,
      "namespace_additions": 1
    }
  },
  "conflict_analysis": {
    "naming_conflicts": [],
    "semantic_conflicts": [],
    "namespace_conflicts": []
  },
  "recommendations": [
    {
      "type": "suggestion",
      "message": "Consider importing MilitaryAsset class for better semantic completeness"
    }
  ],
  "preview_expires_at": "2024-01-20T15:30:00Z"
}
```

---

## Example Library Integration

### Search Example Library

**GET** `/workspaces/{workspaceId}/modeler/examples/search`

Search the curated example ontology library for patterns and templates.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Query Parameters:**
- `query` (optional): Text search query
- `domain` (optional): Domain filter
- `complexity` (optional): Complexity level (basic, intermediate, advanced)
- `similarity_threshold` (optional): Minimum similarity score (0.0-1.0)
- `limit` (optional): Maximum results (default: 20, max: 50)

**Response Example:**
```json
{
  "examples": [
    {
      "id": "example-456",
      "name": "Stakeholder Analysis Framework",
      "description": "Comprehensive framework for modeling stakeholder relationships in decision-making",
      "domain": "decision_intelligence",
      "complexity": "intermediate",
      "metadata": {
        "classes": 12,
        "properties": 18,
        "relationships": 15,
        "quality_score": 0.92,
        "usage_count": 247
      },
      "similarity_score": 0.89,
      "tags": ["stakeholders", "decision_making", "influence_mapping"],
      "preview": {
        "key_concepts": ["Stakeholder", "Decision", "Influence", "Authority"],
        "sample_relationships": ["influences", "hasAuthority", "participatesIn"]
      },
      "created_at": "2024-01-10T08:00:00Z",
      "last_updated": "2024-01-18T12:00:00Z"
    }
  ],
  "total_results": 1,
  "search_metadata": {
    "query_time_ms": 245,
    "vector_search_used": true,
    "semantic_similarity": true
  }
}
```

### Semantic Search Examples

**POST** `/workspaces/{workspaceId}/modeler/examples/semantic-search`

Perform semantic search across the example library using vector similarity.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "semantic_query": {
    "description": "I need to model the relationships between military commanders, their decision-making authority, and the troops under their command",
    "context": "military_hierarchy",
    "desired_concepts": ["command_structure", "authority", "responsibility"]
  },
  "search_options": {
    "similarity_threshold": 0.75,
    "max_results": 10,
    "include_patterns": true,
    "domain_preference": "defense"
  }
}
```

**Response Example:**
```json
{
  "semantic_results": [
    {
      "id": "example-789",
      "name": "Military Command Structure Ontology",
      "semantic_similarity": 0.94,
      "concept_matches": [
        {
          "query_concept": "command_structure",
          "matched_concepts": ["CommandHierarchy", "ChainOfCommand"],
          "similarity": 0.96
        },
        {
          "query_concept": "authority",
          "matched_concepts": ["CommandAuthority", "DecisionMakingPower"],
          "similarity": 0.91
        }
      ],
      "pattern_analysis": {
        "structural_patterns": ["hierarchical_relationships", "authority_delegation"],
        "semantic_patterns": ["command_responsibility", "decision_authority"]
      },
      "applicability_score": 0.88,
      "adaptation_suggestions": [
        "Consider adding temporal aspects for mission-specific command structures"
      ]
    }
  ],
  "pattern_extraction": {
    "common_patterns": [
      {
        "pattern_name": "authority_hierarchy",
        "frequency": 0.73,
        "description": "Hierarchical authority and responsibility patterns"
      }
    ]
  }
}
```

### Get Domain Categories

**GET** `/workspaces/{workspaceId}/modeler/examples/domains`

Retrieve available domain categories in the example library.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Response Example:**
```json
{
  "domains": [
    {
      "id": "defense",
      "name": "Defense & Military",
      "description": "Military operations, command structures, logistics",
      "example_count": 45,
      "subcategories": [
        {
          "id": "command_control",
          "name": "Command & Control",
          "example_count": 12
        },
        {
          "id": "logistics",
          "name": "Military Logistics",
          "example_count": 18
        }
      ]
    },
    {
      "id": "decision_intelligence",
      "name": "Decision Intelligence",
      "description": "Decision-making frameworks and analysis",
      "example_count": 38,
      "subcategories": [
        {
          "id": "stakeholder_analysis",
          "name": "Stakeholder Analysis",
          "example_count": 15
        }
      ]
    }
  ],
  "total_domains": 2,
  "total_examples": 83
}
```

### Apply Example Template

**POST** `/workspaces/{workspaceId}/modeler/examples/apply`

Apply an example ontology template to the current modeler workspace.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "example_id": "example-456",
  "application_mode": "template",
  "customization": {
    "namespace_prefix": "mission_planning",
    "domain_adaptation": "defense",
    "scale_level": "project_specific"
  },
  "merge_options": {
    "merge_with_existing": true,
    "conflict_resolution": "prompt_user",
    "preserve_existing_layout": false
  }
}
```

**Response Example:**
```json
{
  "application_id": "app-789",
  "status": "completed",
  "applied_template": {
    "example_id": "example-456",
    "elements_applied": {
      "classes": 12,
      "properties": 18,
      "relationships": 15
    },
    "customizations_applied": {
      "namespace_updated": true,
      "domain_adapted": true,
      "scale_adjusted": true
    }
  },
  "canvas_updates": {
    "nodes_added": 12,
    "edges_added": 15,
    "layout_applied": "hierarchical"
  },
  "integration_result": {
    "conflicts_resolved": 0,
    "validation_passed": true,
    "quality_score": 0.89
  },
  "completion_time_ms": 1847
}
```

---

## Validation and Quality Assurance

### Validate Modeler State

**POST** `/workspaces/{workspaceId}/modeler/validate`

Validate the current state of the modeler including ontology consistency and visual layout.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Request Body:**
```json
{
  "validation_scope": "full",
  "validation_options": {
    "check_ontology_consistency": true,
    "check_visual_layout": true,
    "check_namespace_conflicts": true,
    "check_property_domains": true,
    "reasoning_level": "standard"
  }
}
```

**Response Example:**
```json
{
  "validation_id": "val-123",
  "overall_status": "valid_with_warnings",
  "validation_results": {
    "ontology_consistency": {
      "status": "valid",
      "checked_axioms": 156,
      "logical_errors": [],
      "consistency_score": 0.96
    },
    "visual_layout": {
      "status": "valid",
      "orphaned_nodes": 0,
      "disconnected_components": 0,
      "layout_quality_score": 0.87
    },
    "namespace_management": {
      "status": "valid",
      "namespace_conflicts": 0,
      "undefined_prefixes": [],
      "redundant_namespaces": 1
    },
    "property_validation": {
      "status": "warning",
      "domain_violations": 0,
      "range_violations": 0,
      "cardinality_warnings": 2
    }
  },
  "warnings": [
    {
      "type": "cardinality",
      "element": "hasCommandAuthority",
      "message": "Property lacks explicit cardinality constraints",
      "severity": "low",
      "suggestion": "Consider adding min/max cardinality restrictions"
    }
  ],
  "quality_metrics": {
    "overall_quality": 0.91,
    "completeness": 0.88,
    "consistency": 0.96,
    "usability": 0.89
  },
  "validation_time_ms": 2341
}
```

---

## Real-Time Collaboration

### WebSocket Connection

**WebSocket** `/ws/workspaces/{workspaceId}/modeler`

Establish real-time collaboration connection for the modeler component.

**Connection Parameters:**
- `workspaceId`: Workspace identifier
- `token`: JWT authentication token
- `user_id`: User identifier
- `session_id`: Unique session identifier

**Message Types:**

#### Cursor Update
```json
{
  "type": "cursor_update",
  "data": {
    "user_id": "user-123",
    "position": { "x": 250, "y": 180 },
    "element_id": "node-456",
    "timestamp": "2024-01-20T14:45:00Z"
  }
}
```

#### Node Update
```json
{
  "type": "node_update",
  "data": {
    "node_id": "node-456",
    "changes": {
      "position": { "x": 300, "y": 200 },
      "data": {
        "label": "Updated Decision Node"
      }
    },
    "user_id": "user-123",
    "timestamp": "2024-01-20T14:45:30Z"
  }
}
```

#### Edge Creation
```json
{
  "type": "edge_created",
  "data": {
    "edge_id": "edge-789",
    "source": "node-456",
    "target": "node-123",
    "type": "influences",
    "user_id": "user-123",
    "timestamp": "2024-01-20T14:46:00Z"
  }
}
```

#### User Presence
```json
{
  "type": "user_presence",
  "data": {
    "user_id": "user-123",
    "status": "active",
    "current_element": "node-456",
    "cursor_visible": true,
    "timestamp": "2024-01-20T14:46:15Z"
  }
}
```

### Get Active Collaborators

**GET** `/workspaces/{workspaceId}/modeler/collaborators`

Retrieve list of users currently active in the modeler.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Response Example:**
```json
{
  "active_collaborators": [
    {
      "user_id": "user-123",
      "username": "analyst_smith",
      "display_name": "Sarah Smith",
      "role": "ontology_architect",
      "status": "active",
      "current_element": "node-456",
      "cursor_position": { "x": 250, "y": 180 },
      "session_started": "2024-01-20T14:30:00Z",
      "last_activity": "2024-01-20T14:45:30Z"
    },
    {
      "user_id": "user-456",
      "username": "commander_jones",
      "display_name": "Col. Michael Jones",
      "role": "contributor",
      "status": "active",
      "current_element": null,
      "cursor_position": { "x": 400, "y": 300 },
      "session_started": "2024-01-20T14:35:00Z",
      "last_activity": "2024-01-20T14:44:00Z"
    }
  ],
  "total_collaborators": 2,
  "collaboration_metadata": {
    "session_id": "collab-789",
    "workspace_lock_status": "unlocked",
    "active_conflicts": 0
  }
}
```

---

## Analytics and Monitoring

### Get Modeler Analytics

**GET** `/workspaces/{workspaceId}/modeler/analytics`

Retrieve analytics data for modeler usage and performance.

**Path Parameters:**
- `workspaceId` (required): Workspace identifier

**Query Parameters:**
- `time_range` (optional): Time range for analytics (1h, 24h, 7d, 30d) [default: 24h]
- `metrics` (optional): Comma-separated list of specific metrics

**Response Example:**
```json
{
  "analytics_period": {
    "start_time": "2024-01-19T14:50:00Z",
    "end_time": "2024-01-20T14:50:00Z",
    "duration_hours": 24
  },
  "usage_metrics": {
    "total_sessions": 15,
    "unique_users": 8,
    "total_session_time_minutes": 247,
    "average_session_duration_minutes": 16.5,
    "peak_concurrent_users": 4
  },
  "modeling_activity": {
    "nodes_created": 23,
    "nodes_modified": 41,
    "nodes_deleted": 3,
    "edges_created": 18,
    "edges_modified": 12,
    "edges_deleted": 2,
    "layout_changes": 7
  },
  "feature_usage": {
    "dual_view_switches": 34,
    "aas_generation_requests": 5,
    "import_operations": 3,
    "validation_runs": 12,
    "example_library_searches": 8
  },
  "performance_metrics": {
    "average_response_time_ms": 235,
    "canvas_render_time_ms": 45,
    "validation_time_ms": 1240,
    "sync_operations": 156
  },
  "quality_indicators": {
    "validation_success_rate": 0.94,
    "user_satisfaction_score": 0.87,
    "error_rate": 0.03
  }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid modeler request parameters",
    "details": {
      "field": "canvas_update.nodes",
      "issue": "Node ID must be unique within workspace"
    },
    "request_id": "req-789"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "code": "WORKSPACE_NOT_FOUND",
    "message": "Specified workspace does not exist or is not accessible",
    "details": {
      "workspace_id": "123e4567-e89b-12d3-a456-426614174000"
    },
    "request_id": "req-790"
  }
}
```

**409 Conflict**
```json
{
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "Canvas was modified by another user during this operation",
    "details": {
      "conflicting_user": "user-456",
      "conflict_timestamp": "2024-01-20T14:45:30Z",
      "conflicting_elements": ["node-123", "edge-456"]
    },
    "request_id": "req-791"
  }
}
```

**422 Unprocessable Entity**
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Ontology validation failed",
    "details": {
      "validation_errors": [
        {
          "type": "consistency",
          "element": "Mission",
          "message": "Class has conflicting superclass definitions"
        }
      ]
    },
    "request_id": "req-792"
  }
}
```

---

## SDK Examples

### Python SDK Example

```python
import requests
import json
from websocket import create_connection

class DADMSOntologyModeler:
    def __init__(self, base_url, auth_token):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {auth_token}"}
    
    def get_canvas_state(self, workspace_id):
        """Get current modeler canvas state"""
        response = requests.get(
            f"{self.base_url}/workspaces/{workspace_id}/modeler/canvas",
            headers=self.headers
        )
        return response.json()
    
    def generate_ontology_aas(self, workspace_id, prompt, domain="general"):
        """Generate ontology using AAS"""
        payload = {
            "prompt": prompt,
            "domain": domain,
            "complexity_level": "intermediate",
            "include_examples": True
        }
        response = requests.post(
            f"{self.base_url}/workspaces/{workspace_id}/modeler/generate",
            headers=self.headers,
            json=payload
        )
        return response.json()
    
    def search_examples(self, workspace_id, query, domain=None):
        """Search example ontology library"""
        params = {"query": query}
        if domain:
            params["domain"] = domain
        
        response = requests.get(
            f"{self.base_url}/workspaces/{workspace_id}/modeler/examples/search",
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def connect_collaboration(self, workspace_id, user_id):
        """Connect to real-time collaboration WebSocket"""
        ws_url = f"ws://localhost:3016/ws/workspaces/{workspace_id}/modeler"
        ws = create_connection(ws_url, header=[f"Authorization: Bearer {self.headers['Authorization'].split(' ')[1]}"])
        
        # Send user presence
        presence_msg = {
            "type": "user_presence",
            "data": {
                "user_id": user_id,
                "status": "active"
            }
        }
        ws.send(json.dumps(presence_msg))
        return ws

# Usage example
modeler = DADMSOntologyModeler("http://localhost:3016", "your_jwt_token")

# Get canvas state
canvas = modeler.get_canvas_state("workspace-123")
print(f"Canvas has {len(canvas['canvas_state']['nodes'])} nodes")

# Generate ontology via AAS
result = modeler.generate_ontology_aas(
    "workspace-123",
    "Create an ontology for military mission planning with stakeholders and decision points",
    domain="defense"
)
print(f"Generated ontology with {result['generated_ontology']['metadata']['classes']} classes")

# Search examples
examples = modeler.search_examples("workspace-123", "stakeholder analysis", "decision_intelligence")
print(f"Found {len(examples['examples'])} relevant examples")
```

### JavaScript SDK Example

```javascript
class DADMSOntologyModeler {
    constructor(baseUrl, authToken) {
        this.baseUrl = baseUrl;
        this.headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };
    }

    async getCanvasState(workspaceId) {
        const response = await fetch(
            `${this.baseUrl}/workspaces/${workspaceId}/modeler/canvas`,
            { headers: this.headers }
        );
        return response.json();
    }

    async switchDualViewMode(workspaceId, ontologyId, targetMode) {
        const response = await fetch(
            `${this.baseUrl}/workspaces/${workspaceId}/ontologies/${ontologyId}/dual-view/mode`,
            {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({
                    target_mode: targetMode,
                    owl_format: 'turtle',
                    auto_sync: true
                })
            }
        );
        return response.json();
    }

    async generateOntologyAAS(workspaceId, prompt, options = {}) {
        const payload = {
            prompt,
            domain: options.domain || 'general',
            complexity_level: options.complexity || 'intermediate',
            include_examples: options.includeExamples !== false,
            target_format: 'turtle'
        };

        const response = await fetch(
            `${this.baseUrl}/workspaces/${workspaceId}/modeler/generate`,
            {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            }
        );
        return response.json();
    }

    connectCollaboration(workspaceId, userId) {
        const wsUrl = `ws://localhost:3016/ws/workspaces/${workspaceId}/modeler`;
        const ws = new WebSocket(wsUrl, [], {
            headers: this.headers
        });

        ws.onopen = () => {
            // Send user presence
            ws.send(JSON.stringify({
                type: 'user_presence',
                data: {
                    user_id: userId,
                    status: 'active'
                }
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleCollaborationMessage(message);
        };

        return ws;
    }

    handleCollaborationMessage(message) {
        switch (message.type) {
            case 'cursor_update':
                this.updateUserCursor(message.data);
                break;
            case 'node_update':
                this.updateNode(message.data);
                break;
            case 'edge_created':
                this.addEdge(message.data);
                break;
            case 'user_presence':
                this.updateUserPresence(message.data);
                break;
        }
    }
}

// Usage example
const modeler = new DADMSOntologyModeler('http://localhost:3016', 'your_jwt_token');

// Switch to OWL text mode
modeler.switchDualViewMode('workspace-123', 'ontology-456', 'owl_text')
    .then(result => {
        console.log('Switched to OWL text mode:', result.active_mode);
        console.log('OWL content preview:', result.owl_content.substring(0, 200));
    });

// Generate ontology
modeler.generateOntologyAAS(
    'workspace-123',
    'Create a supply chain ontology for military logistics',
    { domain: 'defense', complexity: 'advanced' }
).then(result => {
    console.log(`Generated ontology in ${result.generation_time_ms}ms`);
    console.log(`Quality score: ${result.validation_result.quality_score}`);
});

// Connect to collaboration
const ws = modeler.connectCollaboration('workspace-123', 'user-789');
```

---

**This documentation provides comprehensive coverage of all Ontology Modeler component API endpoints within the DADMS Ontology Workspace Service, with detailed examples, error handling, and SDK implementations for both Python and JavaScript.** 