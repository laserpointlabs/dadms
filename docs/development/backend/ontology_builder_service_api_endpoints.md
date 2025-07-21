# Ontology Builder Service – API Endpoint Specification

This document details the API endpoints for the Ontology Builder Service in DADMS 2.0, including endpoint paths, HTTP methods, descriptions, and example request/response schemas for ontology management, extraction jobs, and statistical analysis.

---

## Endpoints Summary

### Ontology Management
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/ontologies`               | List all ontologies                | Query: domain, scope, pagination | Array of Ontology           | Yes   |
| POST   | `/ontologies`               | Create a new ontology              | OntologyCreate (JSON)         | Ontology                     | Yes   |
| GET    | `/ontologies/{id}`          | Get ontology by ID                 | Path: id                      | Ontology                     | Yes   |
| PUT    | `/ontologies/{id}`          | Update ontology                    | OntologyUpdate (JSON)         | Ontology                     | Yes   |
| DELETE | `/ontologies/{id}`          | Delete ontology                    | Path: id                      | Success/Error                | Yes   |
| GET    | `/ontologies/{id}/versions` | Get ontology version history       | Path: id                      | Array of OntologyVersion     | Yes   |
| POST   | `/ontologies/{id}/version`  | Create new ontology version        | VersionCreate (JSON)          | OntologyVersion              | Yes   |

### Extraction Jobs
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/extractions`              | List extraction jobs               | Query: status, pagination     | Array of ExtractionJob       | Yes   |
| POST   | `/extractions`              | Start new extraction job           | ExtractionJobCreate (JSON)    | ExtractionJob                | Yes   |
| GET    | `/extractions/{id}`         | Get extraction job status          | Path: id                      | ExtractionJob                | Yes   |
| POST   | `/extractions/{id}/stop`    | Stop running extraction            | Path: id                      | Success/Error                | Yes   |
| POST   | `/extractions/{id}/pause`   | Pause running extraction           | Path: id                      | Success/Error                | Yes   |
| POST   | `/extractions/{id}/resume`  | Resume paused extraction           | Path: id                      | Success/Error                | Yes   |
| DELETE | `/extractions/{id}`         | Delete extraction job              | Path: id                      | Success/Error                | Yes   |

### Extraction Results & Analysis
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/extractions/{id}/results` | Get extraction results             | Path: id                      | ExtractionResults            | Yes   |
| GET    | `/extractions/{id}/statistics` | Get extraction statistics       | Path: id                      | ExtractionStatistics         | Yes   |
| GET    | `/extractions/{id}/candidates` | Get candidate ontologies        | Path: id                      | Array of OntologyCandidate   | Yes   |
| POST   | `/extractions/{id}/select`  | Select final ontology              | CandidateSelection (JSON)     | Ontology                     | Yes   |
| POST   | `/extractions/{id}/merge`   | Merge multiple candidates          | CandidateMerge (JSON)         | Ontology                     | Yes   |

### Entity & Relationship Management
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/ontologies/{id}/entities` | Get ontology entities              | Path: id, Query: filters      | Array of Entity              | Yes   |
| POST   | `/ontologies/{id}/entities` | Add entity to ontology             | EntityCreate (JSON)           | Entity                       | Yes   |
| PUT    | `/ontologies/{id}/entities/{entityId}` | Update entity            | EntityUpdate (JSON)           | Entity                       | Yes   |
| DELETE | `/ontologies/{id}/entities/{entityId}` | Delete entity            | Path: id, entityId            | Success/Error                | Yes   |
| GET    | `/ontologies/{id}/relationships` | Get ontology relationships   | Path: id, Query: filters      | Array of Relationship        | Yes   |
| POST   | `/ontologies/{id}/relationships` | Add relationship to ontology | RelationshipCreate (JSON)     | Relationship                 | Yes   |
| PUT    | `/ontologies/{id}/relationships/{relId}` | Update relationship     | RelationshipUpdate (JSON)     | Relationship                 | Yes   |
| DELETE | `/ontologies/{id}/relationships/{relId}` | Delete relationship     | Path: id, relId               | Success/Error                | Yes   |

### Clustering & Merging
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/ontologies/{id}/cluster`  | Trigger entity clustering          | ClusterConfig (JSON)          | ClusterResults               | Yes   |
| GET    | `/ontologies/{id}/clusters` | Get cluster analysis               | Path: id                      | Array of EntityCluster       | Yes   |
| POST   | `/ontologies/{id}/merge-entities` | Merge similar entities       | EntityMerge (JSON)            | MergeResult                  | Yes   |
| GET    | `/ontologies/{id}/similarity` | Get entity similarity matrix     | Path: id, Query: threshold    | SimilarityMatrix             | Yes   |

### Question Management
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/questions`                | List extraction questions          | Query: domain, pagination     | Array of Question            | Yes   |
| POST   | `/questions`                | Create extraction question         | QuestionCreate (JSON)         | Question                     | Yes   |
| GET    | `/questions/{id}`           | Get question by ID                 | Path: id                      | Question                     | Yes   |
| PUT    | `/questions/{id}`           | Update question                    | QuestionUpdate (JSON)         | Question                     | Yes   |
| DELETE | `/questions/{id}`           | Delete question                    | Path: id                      | Success/Error                | Yes   |
| GET    | `/questions/templates`      | Get question templates             | Query: domain                 | Array of QuestionTemplate    | Yes   |

### Quality Assurance & Validation
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/ontologies/{id}/validate` | Validate ontology consistency      | Path: id                      | ValidationReport             | Yes   |
| GET    | `/ontologies/{id}/quality`  | Get quality assessment             | Path: id                      | QualityMetrics               | Yes   |
| POST   | `/ontologies/{id}/review`   | Submit ontology for review         | ReviewSubmission (JSON)       | ReviewProcess                | Yes   |
| GET    | `/ontologies/{id}/reviews`  | Get ontology reviews               | Path: id                      | Array of Review              | Yes   |

### Export & Integration
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| POST   | `/ontologies/{id}/export/rdf` | Export ontology to RDF           | ExportConfig (JSON)           | RDFExport                    | Yes   |
| POST   | `/ontologies/{id}/export/fuseki` | Push ontology to Fuseki        | FusekiConfig (JSON)           | FusekiResult                 | Yes   |
| POST   | `/ontologies/{id}/export/owl` | Export ontology to OWL           | ExportConfig (JSON)           | OWLExport                    | Yes   |
| GET    | `/ontologies/{id}/schema`   | Generate domain schema             | Path: id                      | DomainSchema                 | Yes   |
| POST   | `/ontologies/{id}/enforce`  | Enforce schema on data             | SchemaEnforcement (JSON)      | EnforcementResult            | Yes   |

### Health & System
| Method | Path                        | Description                        | Request Body / Params         | Response Body                | Auth? |
|--------|-----------------------------|------------------------------------|-------------------------------|------------------------------|-------|
| GET    | `/ontology/health`          | Service health check               | None                          | HealthStatus (JSON)          | No    |
| GET    | `/ontology/metrics`         | Get service metrics                | None                          | ServiceMetrics (JSON)        | Yes   |
| GET    | `/ontology/config`          | Get service configuration          | None                          | ServiceConfig (JSON)         | Yes   |

---

## Example Schemas

### Ontology (Response)
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "version": "string",
  "domain": "string",
  "scope": "general|domain|project",
  "entities": [
    {
      "id": "string",
      "name": "string",
      "label": "string",
      "description": "string",
      "type": "string",
      "properties": [],
      "confidence": 0.95,
      "sources": [],
      "aliases": ["string"]
    }
  ],
  "relationships": [
    {
      "id": "string",
      "name": "string",
      "label": "string",
      "sourceEntity": "string",
      "targetEntity": "string",
      "type": "hasA|isA|partOf|relatedTo",
      "confidence": 0.92,
      "sources": []
    }
  ],
  "metadata": {
    "extractionJob": "string",
    "qualityScore": 0.88,
    "completeness": 0.85,
    "consistency": 0.90
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### ExtractionJob (Response)
```json
{
  "id": "string",
  "name": "string",
  "status": "pending|running|completed|failed|paused",
  "progress": 75,
  "configuration": {
    "dataSources": ["string"],
    "llmTeam": {
      "id": "string",
      "name": "string",
      "members": []
    },
    "questions": ["string"],
    "runs": 10,
    "convergenceCriteria": {
      "threshold": 0.05,
      "minRuns": 5,
      "maxRuns": 20
    }
  },
  "results": {
    "completedRuns": 8,
    "entityCount": 150,
    "relationshipCount": 85,
    "candidateCount": 3
  },
  "statistics": {
    "convergenceReached": true,
    "confidenceDistribution": {},
    "qualityMetrics": {},
    "clusterStatistics": {}
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "startedAt": "2025-01-15T10:05:00Z",
  "completedAt": "2025-01-15T11:30:00Z"
}
```

### ExtractionJobCreate (Request)
```json
{
  "name": "string",
  "description": "string",
  "configuration": {
    "dataSources": ["document-id-1", "document-id-2"],
    "llmTeamId": "team-123",
    "questionIds": ["question-1", "question-2"],
    "runs": 10,
    "convergenceCriteria": {
      "threshold": 0.05,
      "minRuns": 5,
      "maxRuns": 20
    },
    "scope": "domain",
    "domain": "aerospace"
  }
}
```

### ExtractionStatistics (Response)
```json
{
  "totalRuns": 10,
  "completedRuns": 10,
  "convergenceReached": true,
  "convergenceRun": 8,
  "entityCount": 150,
  "relationshipCount": 85,
  "confidenceDistribution": {
    "high": 120,
    "medium": 85,
    "low": 30
  },
  "qualityMetrics": {
    "completeness": 0.85,
    "consistency": 0.90,
    "coherence": 0.88,
    "coverage": 0.92
  },
  "clusterStatistics": {
    "totalClusters": 12,
    "mergedEntities": 25,
    "averageClusterSize": 3.2,
    "clusterQuality": 0.87
  },
  "performanceMetrics": {
    "totalDuration": "1h 25m",
    "averageRunTime": "8m 30s",
    "tokensUsed": 125000,
    "cost": 15.75
  }
}
```

### Entity (Response)
```json
{
  "id": "string",
  "name": "string",
  "label": "string", 
  "description": "string",
  "type": "concept|individual|property",
  "properties": [
    {
      "name": "string",
      "value": "string",
      "dataType": "string|number|boolean|date",
      "confidence": 0.95
    }
  ],
  "confidence": 0.95,
  "sources": [
    {
      "documentId": "string",
      "chunk": "string",
      "context": "string"
    }
  ],
  "aliases": ["Aircraft", "Airplane", "AirVehicle"],
  "metadata": {
    "extractionRun": 5,
    "clusterId": "cluster-123",
    "validatedBy": "human|llm|automatic"
  }
}
```

### Relationship (Response)
```json
{
  "id": "string",
  "name": "string",
  "label": "string",
  "sourceEntity": "entity-id-1",
  "targetEntity": "entity-id-2", 
  "type": "hasA|isA|partOf|relatedTo|dependsOn|causes",
  "properties": [
    {
      "name": "strength",
      "value": "strong",
      "confidence": 0.88
    }
  ],
  "confidence": 0.92,
  "sources": [
    {
      "documentId": "string",
      "chunk": "string", 
      "context": "string"
    }
  ],
  "metadata": {
    "extractionRun": 5,
    "validatedBy": "human|llm|automatic"
  }
}
```

### Question (Response)
```json
{
  "id": "string",
  "text": "What are the main components of this system?",
  "category": "entity|relationship|property",
  "domain": "aerospace",
  "purpose": "Identify system components and their relationships",
  "examples": ["Engine", "Wing", "Fuselage"],
  "isTemplate": false,
  "usageCount": 15,
  "effectivenessScore": 0.87,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### ClusterResults (Response)
```json
{
  "clusters": [
    {
      "id": "cluster-1",
      "entities": ["entity-1", "entity-2", "entity-3"],
      "centerEntity": "entity-1",
      "similarityScore": 0.92,
      "recommendedMerge": true,
      "mergeStrategy": "primary_name_with_aliases"
    }
  ],
  "statistics": {
    "totalClusters": 12,
    "entitiesProcessed": 150,
    "mergeRecommendations": 8,
    "averageSimilarity": 0.85
  },
  "parameters": {
    "algorithm": "semantic_similarity",
    "threshold": 0.8,
    "maxClusterSize": 5
  }
}
```

### ValidationReport (Response)
```json
{
  "valid": true,
  "score": 0.88,
  "issues": [
    {
      "type": "warning",
      "category": "consistency",
      "message": "Entity 'Vehicle' appears in multiple hierarchies",
      "entityId": "entity-123",
      "severity": "medium",
      "suggestion": "Consider creating more specific entity types"
    }
  ],
  "metrics": {
    "completeness": 0.85,
    "consistency": 0.90,
    "coherence": 0.88,
    "coverage": 0.92
  },
  "recommendations": [
    "Add more specific relationship types",
    "Consider merging similar entities: ['Aircraft', 'Airplane']"
  ]
}
```

### QualityMetrics (Response)
```json
{
  "overall": 0.88,
  "completeness": 0.85,
  "consistency": 0.90,
  "coherence": 0.88,
  "coverage": 0.92,
  "precision": 0.87,
  "recall": 0.83,
  "f1Score": 0.85,
  "details": {
    "entitiesWithProperties": 145,
    "entitiesWithDescriptions": 132,
    "relationshipsValidated": 78,
    "duplicateEntities": 3,
    "orphanEntities": 2,
    "inconsistentRelationships": 1
  },
  "trends": {
    "improvementOverVersions": 0.12,
    "stabilityScore": 0.95
  }
}
```

### HealthStatus (Response)
```json
{
  "status": "ok",
  "uptime": 123456,
  "version": "1.0.0",
  "dependencies": {
    "postgres": "connected",
    "vectordb": "connected", 
    "graphdb": "connected",
    "llmService": "connected",
    "knowledgeService": "connected"
  },
  "metrics": {
    "activeJobs": 3,
    "queuedJobs": 1,
    "totalOntologies": 47,
    "averageJobTime": "15m 30s"
  }
}
```

---

## Authentication

All endpoints marked with "Auth? Yes" require a valid JWT bearer token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid extraction configuration",
    "details": {
      "field": "llmTeamId",
      "reason": "Team ID does not exist"
    },
    "timestamp": "2025-01-15T10:00:00Z"
  }
}
```

## Pagination

List endpoints support pagination via query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc|desc, default: desc)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

This API specification provides comprehensive endpoints for managing the entire ontology extraction, analysis, and integration lifecycle in DADMS 2.0. 