# DADMS 2.0 - Memory Manager Service API Endpoints

## Overview

The Memory Manager service provides sophisticated, categorized memory management capabilities for the DADMS ecosystem. This document provides human-readable examples and usage patterns for all available API endpoints.

**Base URL**: `http://localhost:3015` (development) | `https://api.dadms.example.com/memory` (production)

**Authentication**: Bearer Token (JWT) or API Key

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Core Operations** | POST | `/memories` | Store new memory entry |
| | GET | `/memories` | Retrieve memories with filters |
| | POST | `/memories/batch` | Store multiple memories |
| | GET | `/memories/{id}` | Get specific memory |
| | PUT | `/memories/{id}` | Update memory entry |
| | DELETE | `/memories/{id}` | Delete memory entry |
| **Search** | POST | `/memories/search` | Advanced memory search |
| | POST | `/memories/search/semantic` | Semantic similarity search |
| | POST | `/memories/search/temporal` | Time-based memory query |
| **Relationships** | GET | `/memories/{id}/relationships` | Get memory relationships |
| | POST | `/memories/{id}/relationships` | Create memory relationship |
| | DELETE | `/memories/{id}/relationships/{targetId}` | Remove relationship |
| | GET | `/memories/{id}/similar` | Find similar memories |
| **Clusters** | GET | `/clusters` | List memory clusters |
| | POST | `/clusters` | Create memory cluster |
| | GET | `/clusters/{id}` | Get cluster details |
| | PUT | `/clusters/{id}` | Update cluster |
| | DELETE | `/clusters/{id}` | Delete cluster |
| | GET | `/clusters/{id}/memories` | Get cluster memories |
| | POST | `/clusters/{id}/memories` | Add memories to cluster |
| | DELETE | `/clusters/{id}/memories` | Remove memories from cluster |
| **Lifecycle** | POST | `/memories/{id}/promote` | Promote memory importance |
| | POST | `/memories/{id}/demote` | Demote memory importance |
| | POST | `/memories/{id}/archive` | Archive memory |
| | POST | `/memories/{id}/restore` | Restore archived memory |
| | POST | `/memories/{id}/refresh-ttl` | Refresh memory TTL |
| **Analytics** | GET | `/analytics/stats` | Get memory statistics |
| | GET | `/analytics/usage` | Get usage analytics |
| | GET | `/analytics/health` | Get memory health report |
| **Monitoring** | GET | `/health` | Service health check |
| | GET | `/metrics` | Service performance metrics |

---

## 1. Core Memory Operations

### Store New Memory

#### POST `/memories`
**Description**: Creates a new memory entry with specified scope and content

**Request Body**:
```json
{
  "scope": {
    "type": "decision_context",
    "entity_id": "user-alice-001",
    "entity_type": "human_user",
    "context_id": "decision-context-abc123",
    "project_id": "project-aviation-safety"
  },
  "content": {
    "primary_content": "The team identified three critical safety requirements for the new aircraft navigation system: GPS redundancy, backup navigation sensors, and fail-safe altitude controls.",
    "content_type": "text",
    "structured_data": {
      "requirements": [
        "GPS redundancy",
        "Backup navigation sensors", 
        "Fail-safe altitude controls"
      ],
      "domain": "aviation_safety",
      "decision_phase": "requirements_gathering"
    },
    "language": "en"
  },
  "metadata": {
    "source": {
      "type": "human_input",
      "identifier": "user-alice-001",
      "timestamp": "2025-01-15T14:30:00Z",
      "reliability_score": 0.95
    },
    "confidence": 0.9,
    "importance": "high",
    "tags": ["aviation", "safety", "requirements", "navigation"],
    "categories": ["system_requirements", "safety_critical"],
    "quality_score": 0.85
  },
  "security_context": {
    "access_level": "project",
    "visibility_scope": [
      {
        "scope_type": "project",
        "scope_id": "project-aviation-safety",
        "permissions": ["read", "write"]
      }
    ],
    "privacy_tags": ["internal"],
    "audit_settings": {
      "audit_enabled": true,
      "audit_level": "standard",
      "retention_period": "P7Y",
      "include_content": true
    }
  },
  "expires_at": "2026-01-15T14:30:00Z"
}
```

**Response**:
```json
{
  "memory_id": "memory-abc123-def456",
  "status": "created",
  "created_at": "2025-01-15T14:30:00Z",
  "warnings": []
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3015/memories \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @memory_request.json
```

### Retrieve Memories with Filters

#### GET `/memories`
**Description**: Query memories using various filters and search criteria

**Query Parameters**:
- `scopeType` - Filter by memory scope type
- `entityId` - Filter by entity ID
- `contextId` - Filter by context ID
- `importance` - Filter by importance level
- `createdAfter` - Filter memories created after date
- `createdBefore` - Filter memories created before date
- `limit` - Maximum results (default: 50)
- `offset` - Results offset (default: 0)

**Example Request**:
```
GET /memories?scopeType=decision_context&importance=high&limit=20&createdAfter=2025-01-01T00:00:00Z
```

**Response**:
```json
{
  "memories": [
    {
      "id": "memory-abc123-def456",
      "scope": {
        "type": "decision_context",
        "entity_id": "user-alice-001",
        "entity_type": "human_user",
        "context_id": "decision-context-abc123",
        "project_id": "project-aviation-safety"
      },
      "content": {
        "primary_content": "The team identified three critical safety requirements...",
        "content_type": "text"
      },
      "metadata": {
        "importance": "high",
        "tags": ["aviation", "safety", "requirements"],
        "confidence": 0.9
      },
      "created_at": "2025-01-15T14:30:00Z",
      "updated_at": "2025-01-15T14:30:00Z",
      "accessed_at": "2025-01-15T14:30:00Z"
    }
  ],
  "total_count": 1,
  "page_info": {
    "limit": 20,
    "offset": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

### Batch Store Memories

#### POST `/memories/batch`
**Description**: Creates multiple memory entries in a single operation

**Request Body**:
```json
{
  "memories": [
    {
      "scope": {
        "type": "persona_specific",
        "entity_id": "agent-safety-analyst",
        "entity_type": "ai_agent"
      },
      "content": {
        "primary_content": "Pattern detected: Higher risk during night operations",
        "content_type": "insight"
      }
    },
    {
      "scope": {
        "type": "team_specific",
        "entity_id": "team-aviation-safety",
        "entity_type": "team"
      },
      "content": {
        "primary_content": "Team decision: Implement dual-redundant navigation systems",
        "content_type": "decision_state"
      }
    }
  ]
}
```

**Response**:
```json
{
  "created_count": 2,
  "failed_count": 0,
  "memory_ids": [
    "memory-xyz789-abc123",
    "memory-def456-ghi789"
  ],
  "errors": []
}
```

### Get Specific Memory

#### GET `/memories/{memoryId}`
**Description**: Retrieve a specific memory entry by its unique identifier

**Response**:
```json
{
  "id": "memory-abc123-def456",
  "scope": {
    "type": "decision_context",
    "entity_id": "user-alice-001",
    "entity_type": "human_user",
    "context_id": "decision-context-abc123",
    "project_id": "project-aviation-safety"
  },
  "content": {
    "primary_content": "The team identified three critical safety requirements for the new aircraft navigation system...",
    "content_type": "text",
    "structured_data": {
      "requirements": ["GPS redundancy", "Backup navigation sensors", "Fail-safe altitude controls"],
      "domain": "aviation_safety"
    }
  },
  "metadata": {
    "source": {
      "type": "human_input",
      "identifier": "user-alice-001",
      "timestamp": "2025-01-15T14:30:00Z",
      "reliability_score": 0.95
    },
    "confidence": 0.9,
    "importance": "high",
    "tags": ["aviation", "safety", "requirements", "navigation"],
    "categories": ["system_requirements", "safety_critical"],
    "usage_stats": {
      "access_count": 15,
      "last_accessed": "2025-01-16T10:15:00Z",
      "access_frequency": 2.5,
      "modification_count": 1,
      "referral_count": 3,
      "search_hits": 8,
      "usage_trend": "increasing"
    }
  },
  "relationships": [
    {
      "id": "rel-001",
      "source_memory_id": "memory-abc123-def456",
      "target_memory_id": "memory-related-789",
      "relationship_type": "elaboration",
      "strength": 0.8,
      "confidence": 0.9
    }
  ],
  "lifecycle": {
    "stage": "active",
    "transitions": [
      {
        "from_stage": "active",
        "to_stage": "active",
        "timestamp": "2025-01-15T14:30:00Z",
        "reason": "created",
        "triggered_by": "human_user",
        "automatic": false
      }
    ]
  },
  "created_at": "2025-01-15T14:30:00Z",
  "updated_at": "2025-01-15T14:30:00Z",
  "accessed_at": "2025-01-16T10:15:00Z",
  "expires_at": "2026-01-15T14:30:00Z"
}
```

---

## 2. Memory Search Operations

### Advanced Memory Search

#### POST `/memories/search`
**Description**: Perform complex memory searches with multiple criteria

**Request Body**:
```json
{
  "scope_filters": {
    "scope_types": ["decision_context", "team_specific"],
    "project_ids": ["project-aviation-safety"]
  },
  "content_filters": {
    "content_types": ["text", "insight"],
    "text_search": {
      "query": "navigation safety requirements",
      "search_type": "full_text",
      "fuzzy_threshold": 0.8
    }
  },
  "temporal_filters": {
    "created_after": "2025-01-01T00:00:00Z",
    "created_before": "2025-01-31T23:59:59Z"
  },
  "metadata_filters": {
    "importance_levels": ["high", "critical"],
    "tags": ["aviation", "safety"],
    "confidence_min": 0.7
  },
  "search_options": {
    "search_mode": "comprehensive",
    "ranking_algorithm": "hybrid",
    "boost_factors": [
      {
        "factor_type": "recency",
        "multiplier": 1.2
      },
      {
        "factor_type": "importance",
        "multiplier": 1.5
      }
    ]
  },
  "result_options": {
    "limit": 25,
    "include_relationships": true,
    "sort_by": [
      {
        "field": "relevance",
        "direction": "desc"
      }
    ]
  }
}
```

**Response**:
```json
{
  "memories": [
    {
      "id": "memory-abc123-def456",
      "scope": {
        "type": "decision_context",
        "project_id": "project-aviation-safety"
      },
      "content": {
        "primary_content": "The team identified three critical safety requirements...",
        "content_type": "text"
      },
      "metadata": {
        "importance": "high",
        "confidence": 0.9,
        "tags": ["aviation", "safety", "requirements"]
      }
    }
  ],
  "total_count": 1,
  "search_metadata": {
    "query_time_ms": 45.2,
    "search_strategy": "comprehensive",
    "tiers_searched": ["hot", "warm"],
    "total_scanned": 1250
  },
  "suggestions": [
    {
      "type": "query_expansion",
      "suggestion": "Add 'navigation' to search terms",
      "reasoning": "Related memories contain navigation context"
    }
  ]
}
```

### Semantic Memory Search

#### POST `/memories/search/semantic`
**Description**: Search memories using semantic similarity

**Request Body**:
```json
{
  "query_text": "What are the key safety considerations for aircraft navigation systems?",
  "options": {
    "similarity_threshold": 0.75,
    "max_results": 10,
    "include_related": true,
    "boost_recent": true
  }
}
```

**Response**:
```json
{
  "memories": [
    {
      "id": "memory-abc123-def456",
      "content": {
        "primary_content": "The team identified three critical safety requirements for the new aircraft navigation system: GPS redundancy, backup navigation sensors, and fail-safe altitude controls."
      },
      "metadata": {
        "importance": "high",
        "tags": ["aviation", "safety", "navigation"]
      },
      "similarity_score": 0.92
    }
  ],
  "total_count": 1,
  "page_info": {
    "limit": 10,
    "offset": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

### Temporal Memory Query

#### POST `/memories/search/temporal`
**Description**: Query memories within specific time ranges

**Request Body**:
```json
{
  "time_range": {
    "start": "2025-01-15T00:00:00Z",
    "end": "2025-01-15T23:59:59Z",
    "timezone": "UTC"
  },
  "filters": {
    "scope_filters": {
      "scope_types": ["decision_context"],
      "project_ids": ["project-aviation-safety"]
    },
    "metadata_filters": {
      "importance_levels": ["high", "critical"]
    }
  }
}
```

**Response**: Same format as general memory search

---

## 3. Memory Relationships

### Get Memory Relationships

#### GET `/memories/{memoryId}/relationships`
**Description**: Retrieve all relationships for a specific memory

**Query Parameters**:
- `relationshipTypes` - Filter by relationship types (array)

**Example Request**:
```
GET /memories/memory-abc123-def456/relationships?relationshipTypes=elaboration,causal
```

**Response**:
```json
{
  "relationships": [
    {
      "id": "rel-001",
      "source_memory_id": "memory-abc123-def456",
      "target_memory_id": "memory-related-789",
      "relationship_type": "elaboration",
      "strength": 0.8,
      "confidence": 0.9,
      "context": "Provides additional detail on safety requirements",
      "created_at": "2025-01-15T15:00:00Z",
      "created_by": "user-alice-001",
      "creator_type": "human_user"
    },
    {
      "id": "rel-002",
      "source_memory_id": "memory-abc123-def456", 
      "target_memory_id": "memory-outcome-456",
      "relationship_type": "causal",
      "strength": 0.9,
      "confidence": 0.85,
      "context": "Requirements led to specific design decisions",
      "created_at": "2025-01-16T09:30:00Z",
      "created_by": "system",
      "creator_type": "system"
    }
  ],
  "total_count": 2
}
```

### Create Memory Relationship

#### POST `/memories/{memoryId}/relationships`
**Description**: Link two memories with a specific relationship

**Request Body**:
```json
{
  "target_memory_id": "memory-related-789",
  "relationship_type": "elaboration",
  "strength": 0.8,
  "confidence": 0.9,
  "context": "This memory provides additional detail on the safety requirements"
}
```

**Response**: `201 Created`

### Find Similar Memories

#### GET `/memories/{memoryId}/similar`
**Description**: Find memories similar to the specified memory

**Query Parameters**:
- `threshold` - Similarity threshold (0-1, default: 0.7)
- `limit` - Maximum results (1-100, default: 10)

**Example Request**:
```
GET /memories/memory-abc123-def456/similar?threshold=0.8&limit=5
```

**Response**:
```json
{
  "similar_memories": [
    {
      "id": "memory-similar-001",
      "content": {
        "primary_content": "Additional safety protocols for navigation system backup procedures..."
      },
      "metadata": {
        "tags": ["aviation", "safety", "protocols"]
      }
    }
  ],
  "similarity_scores": [0.85]
}
```

---

## 4. Memory Clusters

### List Memory Clusters

#### GET `/clusters`
**Description**: Retrieve all memory clusters with optional filtering

**Query Parameters**:
- `clusterType` - Filter by cluster type
- `limit` - Maximum results (default: 50)
- `offset` - Results offset (default: 0)

**Response**:
```json
{
  "clusters": [
    {
      "id": "cluster-safety-001",
      "name": "Aviation Safety Requirements",
      "description": "Collection of safety-related requirements and decisions",
      "cluster_type": "topical",
      "coherence_score": 0.89,
      "created_at": "2025-01-15T16:00:00Z",
      "updated_at": "2025-01-16T10:30:00Z"
    }
  ],
  "total_count": 1,
  "page_info": {
    "limit": 50,
    "offset": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

### Create Memory Cluster

#### POST `/clusters`
**Description**: Create a new memory cluster with specified memories

**Request Body**:
```json
{
  "name": "Aviation Safety Requirements",
  "description": "Collection of safety-related requirements and decisions for the aviation project",
  "memory_ids": [
    "memory-abc123-def456",
    "memory-xyz789-abc123",
    "memory-def456-ghi789"
  ],
  "cluster_type": "topical"
}
```

**Response**:
```json
{
  "cluster_id": "cluster-safety-001",
  "status": "created",
  "coherence_score": 0.89
}
```

### Add Memories to Cluster

#### POST `/clusters/{clusterId}/memories`
**Description**: Add one or more memories to an existing cluster

**Request Body**:
```json
{
  "memory_ids": [
    "memory-new-001",
    "memory-new-002"
  ]
}
```

**Response**: `204 No Content`

---

## 5. Memory Lifecycle Management

### Promote Memory Importance

#### POST `/memories/{memoryId}/promote`
**Description**: Increase the importance level of a memory

**Request Body**:
```json
{
  "new_importance": "critical",
  "reason": "Memory contains safety-critical information that impacts system design"
}
```

**Response**: `200 OK`

### Archive Memory

#### POST `/memories/{memoryId}/archive`
**Description**: Move memory to archived state

**Request Body**:
```json
{
  "reason": "Memory is no longer actively needed but should be preserved for historical reference",
  "compression_type": "gzip"
}
```

**Response**: `200 OK`

### Refresh Memory TTL

#### POST `/memories/{memoryId}/refresh-ttl`
**Description**: Update the time-to-live for a memory

**Request Body**:
```json
{
  "new_ttl": "P1Y",
  "reason": "Memory remains relevant for ongoing project work"
}
```

**Response**: `200 OK`

---

## 6. Analytics & Insights

### Get Memory Statistics

#### GET `/analytics/stats`
**Description**: Retrieve comprehensive memory statistics

**Query Parameters**:
- `scopeType` - Filter statistics by scope type
- `entityId` - Filter statistics by entity ID

**Response**:
```json
{
  "total_memories": 15847,
  "by_scope_type": {
    "decision_context": 3245,
    "team_specific": 2156,
    "persona_specific": 4892,
    "long_term": 3867,
    "short_term": 1687
  },
  "by_importance": {
    "critical": 234,
    "high": 1567,
    "medium": 8934,
    "low": 4231,
    "ephemeral": 881
  },
  "by_storage_tier": {
    "hot": 2345,
    "warm": 5678,
    "cold": 6234,
    "frozen": 1590
  },
  "average_age": "P45D",
  "total_size_bytes": 2457829376,
  "relationship_count": 8934,
  "cluster_count": 267
}
```

### Get Usage Analytics

#### GET `/analytics/usage`
**Description**: Retrieve memory usage analytics for a time range

**Query Parameters**:
- `startDate` - Start date for analytics period (required)
- `endDate` - End date for analytics period (required)

**Example Request**:
```
GET /analytics/usage?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z
```

**Response**:
```json
{
  "time_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "total_accesses": 45672,
  "unique_memories_accessed": 3456,
  "top_accessed_memories": [
    {
      "memory_id": "memory-abc123-def456",
      "access_count": 127,
      "last_accessed": "2025-01-31T15:30:00Z",
      "average_session_length": "PT5M30S"
    }
  ],
  "access_patterns": [
    {
      "pattern_name": "morning_briefing",
      "frequency": 23,
      "typical_times": ["09:00", "09:30"],
      "associated_contexts": ["team_meetings", "decision_reviews"]
    }
  ],
  "performance_metrics": {
    "average_retrieval_time_ms": 45.7,
    "cache_hit_rate": 0.82,
    "storage_efficiency": 0.76,
    "index_performance": 0.91
  }
}
```

### Get Memory Health Report

#### GET `/analytics/health`
**Description**: Retrieve comprehensive memory system health report

**Response**:
```json
{
  "overall_health_score": 0.87,
  "issues": [
    {
      "severity": "medium",
      "category": "performance",
      "description": "Average retrieval time has increased by 15% over the past week",
      "affected_count": 234,
      "suggested_action": "Consider optimizing indexes for frequently accessed memory types"
    },
    {
      "severity": "low",
      "category": "storage",
      "description": "Cold storage tier is at 78% capacity",
      "affected_count": 6234,
      "suggested_action": "Schedule archival cleanup for memories older than 2 years"
    }
  ],
  "recommendations": [
    {
      "priority": "medium",
      "action": "optimization",
      "description": "Optimize frequently accessed memory indexes",
      "expected_impact": "20% improvement in retrieval performance",
      "implementation_effort": "low"
    }
  ],
  "metrics": {
    "storage_utilization": 0.73,
    "index_efficiency": 0.91,
    "retrieval_performance": 0.85,
    "data_quality_score": 0.92,
    "security_compliance": 0.98
  }
}
```

---

## 7. Health & Monitoring

### Service Health Check

#### GET `/health`
**Description**: Check the health status of the Memory Manager service

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-16T14:30:00Z",
  "version": "1.0.0",
  "uptime": "P7DT14H30M",
  "dependencies": [
    {
      "name": "PostgreSQL",
      "status": "healthy",
      "response_time_ms": 12.3
    },
    {
      "name": "Redis",
      "status": "healthy",
      "response_time_ms": 3.1
    },
    {
      "name": "Qdrant",
      "status": "healthy",
      "response_time_ms": 8.7
    },
    {
      "name": "MinIO",
      "status": "healthy", 
      "response_time_ms": 15.2
    }
  ]
}
```

### Service Metrics

#### GET `/metrics`
**Description**: Retrieve service performance metrics

**Response**:
```json
{
  "request_count": 125847,
  "average_response_time_ms": 85.3,
  "error_rate": 0.002,
  "active_connections": 47,
  "memory_usage": {
    "current": 0.67,
    "peak": 0.89,
    "average": 0.72
  },
  "cpu_usage": {
    "current": 0.34,
    "peak": 0.78,
    "average": 0.42
  }
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes and error responses in the following format:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid memory scope type provided",
  "timestamp": "2025-01-16T14:30:00Z",
  "details": {
    "field": "scope.type",
    "provided_value": "invalid_type",
    "valid_values": ["short_term", "long_term", "cached", "human_entered", "persona_specific", "team_specific", "decision_context", "system_state", "feedback_derived", "learned_patterns"]
  },
  "trace_id": "req-abc123-def456"
}
```

## SDK Examples

### Python SDK

```python
import requests
from datetime import datetime, timedelta

class MemoryManagerClient:
    def __init__(self, base_url, auth_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def store_memory(self, scope, content, metadata=None):
        payload = {
            'scope': scope,
            'content': content
        }
        if metadata:
            payload['metadata'] = metadata
            
        response = requests.post(
            f'{self.base_url}/memories',
            json=payload,
            headers=self.headers
        )
        return response.json()
    
    def search_memories(self, query_filters):
        response = requests.post(
            f'{self.base_url}/memories/search',
            json=query_filters,
            headers=self.headers
        )
        return response.json()
    
    def semantic_search(self, query_text, threshold=0.7):
        payload = {
            'query_text': query_text,
            'options': {
                'similarity_threshold': threshold,
                'max_results': 10
            }
        }
        response = requests.post(
            f'{self.base_url}/memories/search/semantic',
            json=payload,
            headers=self.headers
        )
        return response.json()

# Usage example
client = MemoryManagerClient('http://localhost:3015', 'your-jwt-token')

# Store a memory
memory_scope = {
    'type': 'decision_context',
    'entity_id': 'user-001',
    'entity_type': 'human_user',
    'project_id': 'project-aviation'
}

memory_content = {
    'primary_content': 'Key decision: Implement redundant navigation systems',
    'content_type': 'decision_state'
}

result = client.store_memory(memory_scope, memory_content)
print(f"Stored memory: {result['memory_id']}")

# Semantic search
search_results = client.semantic_search(
    'What safety requirements were identified?',
    threshold=0.8
)
print(f"Found {len(search_results['memories'])} similar memories")
```

### Node.js SDK

```javascript
const axios = require('axios');

class MemoryManagerClient {
    constructor(baseUrl, authToken) {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async storeMemory(scope, content, metadata = null) {
        const payload = { scope, content };
        if (metadata) payload.metadata = metadata;

        const response = await this.client.post('/memories', payload);
        return response.data;
    }

    async searchMemories(queryFilters) {
        const response = await this.client.post('/memories/search', queryFilters);
        return response.data;
    }

    async semanticSearch(queryText, threshold = 0.7) {
        const payload = {
            query_text: queryText,
            options: {
                similarity_threshold: threshold,
                max_results: 10
            }
        };
        const response = await this.client.post('/memories/search/semantic', payload);
        return response.data;
    }

    async getMemoryStats(scopeType = null) {
        const params = scopeType ? { scopeType } : {};
        const response = await this.client.get('/analytics/stats', { params });
        return response.data;
    }
}

// Usage example
const client = new MemoryManagerClient('http://localhost:3015', 'your-jwt-token');

async function exampleUsage() {
    try {
        // Store a memory
        const memoryScope = {
            type: 'team_specific',
            entity_id: 'team-aviation-safety',
            entity_type: 'team',
            project_id: 'project-aviation'
        };

        const memoryContent = {
            primary_content: 'Team consensus on implementing dual-redundant systems',
            content_type: 'decision_state'
        };

        const result = await client.storeMemory(memoryScope, memoryContent);
        console.log(`Stored memory: ${result.memory_id}`);

        // Get memory statistics
        const stats = await client.getMemoryStats('team_specific');
        console.log(`Team memories: ${stats.by_scope_type.team_specific}`);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

exampleUsage();
```

This comprehensive API documentation provides developers with all the tools needed to integrate with the Memory Manager service effectively, enabling sophisticated memory management capabilities across the DADMS ecosystem. 