# Knowledge Manager Service – Comprehensive API Reference

**Service**: DADMS Knowledge Manager Service  
**Port**: 3003  
**Status**: 📋 **SPECIFICATION** - Ready for implementation with UI components available  
**Version**: 1.0.0

## Overview

The Knowledge Manager Service is the intelligent document management and retrieval engine for DADMS 2.0. It provides comprehensive document lifecycle management, semantic search, Retrieval-Augmented Generation (RAG) operations, and advanced analytics for decision intelligence workflows.

### Core Capabilities
- **Multi-Format Document Processing**: PDF, DOCX, TXT, Markdown, and more
- **Intelligent Chunking**: Context-aware document segmentation for optimal retrieval
- **Semantic Search**: Vector-based similarity search using state-of-the-art embeddings  
- **RAG Operations**: Context-aware retrieval for LLM integration
- **Domain Organization**: Hierarchical knowledge organization system
- **Tag Management**: Flexible document categorization and filtering
- **Advanced Analytics**: Usage insights and knowledge utilization metrics

---

## Health & Status Endpoints

### GET `/health`
**Purpose**: Service health check with dependency status  
**Authentication**: None required  
**Rate Limit**: None

**Response Example**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "dependencies": {
    "postgresql": "healthy",
    "qdrant": "healthy", 
    "minio": "healthy",
    "neo4j": "healthy",
    "redis": "healthy",
    "event_manager": "healthy"
  },
  "metrics": {
    "total_documents": 1247,
    "total_chunks": 15823,
    "processing_queue_length": 3,
    "cache_hit_rate": 0.89,
    "avg_search_time_ms": 127.3,
    "storage_used_gb": 45.7
  },
  "current_config": {
    "default_embedding_model": "text-embedding-ada-002",
    "default_chunk_size": 500,
    "max_file_size_mb": 100,
    "supported_file_types": ["pdf", "docx", "txt", "md", "html"]
  }
}
```

### GET `/api`
**Purpose**: Service information and capabilities  
**Authentication**: None required

**Response Example**:
```json
{
  "service": "DADMS Knowledge Manager Service",
  "version": "1.0.0",
  "port": 3003,
  "status": "operational",
  "capabilities": [
    "document_management",
    "semantic_search", 
    "rag_operations",
    "domain_organization",
    "analytics"
  ]
}
```

---

## Document Management

### GET `/documents` - Search & List Documents
**Purpose**: Search documents using text, semantic, or hybrid search with advanced filtering  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Search query text |
| `search_type` | enum | `hybrid` | `text`, `semantic`, `hybrid` |
| `domain_ids` | array | - | Filter by domain UUIDs |
| `tag_ids` | array | - | Filter by tag UUIDs |
| `file_types` | array | - | Filter by file types (`pdf`, `docx`, etc.) |
| `date_from` | date | - | Filter documents from date |
| `date_to` | date | - | Filter documents to date |
| `similarity_threshold` | float | 0.7 | Minimum similarity score (0-1) |
| `limit` | integer | 20 | Results per page (1-100) |
| `offset` | integer | 0 | Pagination offset |
| `include_chunks` | boolean | false | Include document chunks |
| `include_highlights` | boolean | true | Include text highlights |
| `sort_by` | enum | `relevance` | `relevance`, `created_at`, `updated_at`, `name`, `size` |
| `sort_order` | enum | `desc` | `asc`, `desc` |

#### Example Request
```bash
GET /documents?query=UAV%20risk%20assessment&search_type=hybrid&domain_ids=550e8400-e29b-41d4-a716-446655440000&limit=10&include_highlights=true

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Example Response
```json
{
  "results": [
    {
      "document": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "UAV Safety Risk Assessment Framework.pdf",
        "description": "Comprehensive framework for evaluating UAV operational risks",
        "domain_id": "550e8400-e29b-41d4-a716-446655440000",
        "tags": [
          {
            "id": "tag_001",
            "name": "Risk Assessment",
            "color": "#e74c3c"
          },
          {
            "id": "tag_002", 
            "name": "UAV Operations",
            "color": "#3498db"
          }
        ],
        "url": "https://minio.dadms.com/documents/123e4567-e89b-12d3-a456-426614174000.pdf",
        "content_type": "application/pdf",
        "size": 2458624,
        "embedding_status": "completed",
        "chunk_count": 47,
        "word_count": 8932,
        "page_count": 24,
        "language": "en",
        "created_at": "2024-01-10T09:15:00Z",
        "updated_at": "2024-01-10T09:18:23Z"
      },
      "score": 0.92,
      "match_type": "content",
      "highlights": [
        "...UAV <mark>risk assessment</mark> methodology must consider weather conditions...",
        "...operational <mark>safety</mark> protocols for unmanned aerial vehicles..."
      ],
      "search_terms_found": ["UAV", "risk", "assessment"],
      "context_snippet": "The UAV risk assessment framework provides a systematic approach to evaluating potential hazards in unmanned aerial vehicle operations."
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0,
  "search_time_ms": 143,
  "query_interpretation": "Hybrid search combining semantic similarity and keyword matching for UAV risk assessment",
  "suggestions": [
    "UAV safety protocols",
    "drone risk management", 
    "aviation risk assessment"
  ],
  "filters_applied": {
    "domain_ids": ["550e8400-e29b-41d4-a716-446655440000"],
    "search_type": "hybrid"
  },
  "embedding_model": "text-embedding-ada-002"
}
```

### POST `/documents` - Upload Document
**Purpose**: Upload and process a document with automatic chunking and embedding generation  
**Authentication**: Required (Bearer JWT)  
**Content-Type**: `multipart/form-data`

#### Form Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Document name (max 500 chars) |
| `description` | string | - | Document description (max 2000 chars) |
| `domain_id` | UUID | - | Target domain |
| `tag_ids` | array | - | Tag UUIDs to apply |
| `file` | binary | ✓ | Document file |
| `chunk_size` | integer | - | Tokens per chunk (100-2000, default 500) |
| `chunk_overlap` | integer | - | Overlap tokens (0-500, default 50) |
| `embedding_model` | string | - | Embedding model override |
| `custom_metadata` | object | - | Custom metadata JSON |

#### Example Request
```bash
curl -X POST http://localhost:3003/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "name=UAV Compliance Manual 2024" \
  -F "description=Updated compliance guidelines for UAV operations" \
  -F "domain_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "tag_ids=tag_001,tag_003" \
  -F "file=@/path/to/uav_compliance_manual.pdf" \
  -F "chunk_size=750" \
  -F "custom_metadata={\"author\":\"John Smith\",\"department\":\"Safety\"}"
```

#### Example Response
```json
{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "name": "UAV Compliance Manual 2024",
  "description": "Updated compliance guidelines for UAV operations",
  "domain_id": "550e8400-e29b-41d4-a716-446655440000",
  "tags": [
    {
      "id": "tag_001",
      "name": "Compliance",
      "color": "#f39c12"
    }
  ],
  "url": "https://minio.dadms.com/documents/789e0123-e89b-12d3-a456-426614174000.pdf",
  "content_type": "application/pdf",
  "size": 3256789,
  "checksum": "sha256:a1b2c3d4e5f6...",
  "embedding_status": "processing",
  "chunk_count": 0,
  "version": 1,
  "metadata": {
    "author": "John Smith",
    "department": "Safety",
    "chunk_size": 750,
    "chunk_overlap": 50,
    "embedding_model": "text-embedding-ada-002"
  },
  "created_at": "2024-01-15T14:22:00Z",
  "updated_at": "2024-01-15T14:22:00Z",
  "uploaded_by": "user_456"
}
```

### GET `/documents/{id}` - Get Document Details
**Purpose**: Retrieve detailed document metadata and processing status  
**Authentication**: Required (Bearer JWT)

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Document identifier |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_chunks` | boolean | false | Include document chunks |
| `include_analytics` | boolean | false | Include usage analytics |

#### Example Request
```bash
GET /documents/789e0123-e89b-12d3-a456-426614174000?include_chunks=true&include_analytics=true

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Example Response
```json
{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "name": "UAV Compliance Manual 2024",
  "description": "Updated compliance guidelines for UAV operations",
  "domain_id": "550e8400-e29b-41d4-a716-446655440000",
  "tags": [
    {
      "id": "tag_001",
      "name": "Compliance",
      "color": "#f39c12"
    }
  ],
  "url": "https://minio.dadms.com/documents/789e0123-e89b-12d3-a456-426614174000.pdf",
  "content_type": "application/pdf",
  "size": 3256789,
  "embedding_status": "completed",
  "chunk_count": 62,
  "word_count": 12847,
  "page_count": 45,
  "language": "en",
  "created_at": "2024-01-15T14:22:00Z",
  "updated_at": "2024-01-15T14:25:33Z",
  "chunks": [
    {
      "id": "chunk_001",
      "chunk_index": 0,
      "text": "UAV Compliance Manual 2024\n\nSection 1: Introduction\n\nThis manual provides comprehensive guidelines for Unmanned Aerial Vehicle (UAV) operations in compliance with current regulations...",
      "title": "Introduction",
      "start_char": 0,
      "end_char": 487,
      "page_number": 1,
      "embedding_model": "text-embedding-ada-002",
      "confidence_score": 0.95,
      "entities": ["UAV", "Compliance Manual", "regulations"],
      "keywords": ["compliance", "guidelines", "regulations", "unmanned aerial vehicle"],
      "section_type": "title",
      "created_at": "2024-01-15T14:23:15Z"
    }
  ],
  "analytics": {
    "total_views": 23,
    "unique_viewers": 8,
    "last_accessed": "2024-01-15T16:45:12Z",
    "search_appearances": 15,
    "avg_relevance_score": 0.87
  }
}
```

### PUT `/documents/{id}` - Update Document Metadata
**Purpose**: Update document name, description, domain, or tags  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
PUT /documents/789e0123-e89b-12d3-a456-426614174000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "UAV Compliance Manual 2024 - Updated",
  "description": "Latest compliance guidelines with Q1 2024 amendments",
  "tag_ids": ["tag_001", "tag_003", "tag_005"],
  "custom_metadata": {
    "author": "John Smith",
    "department": "Safety",
    "revision": "1.1",
    "reviewed_by": "Jane Doe"
  }
}
```

### DELETE `/documents/{id}` - Delete Document
**Purpose**: Delete document and all associated chunks and embeddings  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `force` | boolean | false | Force delete even if referenced |

#### Example Request
```bash
DELETE /documents/789e0123-e89b-12d3-a456-426614174000?force=false

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### GET `/documents/{id}/download` - Download Document File
**Purpose**: Download the original document file  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `disposition` | enum | `attachment` | `attachment`, `inline` |

#### Example Request
```bash
GET /documents/789e0123-e89b-12d3-a456-426614174000/download?disposition=attachment

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**: Binary file with appropriate headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="UAV Compliance Manual 2024.pdf"
Content-Length: 3256789
```

### GET `/documents/{id}/chunks` - Get Document Chunks
**Purpose**: Retrieve document chunks with metadata  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_embeddings` | boolean | false | Include vector embeddings (large response) |
| `chunk_range` | string | - | Range like "0-10" to limit chunks |

#### Example Request
```bash
GET /documents/789e0123-e89b-12d3-a456-426614174000/chunks?chunk_range=0-5

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### POST `/documents/{id}/reprocess` - Reprocess Document
**Purpose**: Re-chunk and re-embed document with new parameters  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
POST /documents/789e0123-e89b-12d3-a456-426614174000/reprocess
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "chunk_size": 1000,
  "chunk_overlap": 100,
  "embedding_model": "text-embedding-3-large",
  "extract_entities": true,
  "generate_summary": true
}
```

#### Example Response
```json
{
  "message": "Document reprocessing started",
  "job_id": "job_789e0123-e89b-12d3-a456-426614174000",
  "estimated_time_seconds": 180
}
```

### GET `/documents/{id}/similar` - Find Similar Documents
**Purpose**: Find documents similar to the specified document  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
GET /documents/789e0123-e89b-12d3-a456-426614174000/similar?limit=5&similarity_threshold=0.8

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Domain Management

### GET `/domains` - List All Domains
**Purpose**: Get domain hierarchy with document counts  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_empty` | boolean | true | Include domains with no documents |
| `max_depth` | integer | 10 | Maximum hierarchy depth |

#### Example Response
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Engineering",
    "description": "Engineering documentation and specifications",
    "color": "#3498db",
    "parent_domain_id": null,
    "level": 0,
    "path": "Engineering",
    "document_count": 127,
    "total_document_count": 245,
    "child_domains": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Software",
        "description": "Software development and architecture",
        "color": "#2ecc71",
        "parent_domain_id": "550e8400-e29b-41d4-a716-446655440000",
        "level": 1,
        "path": "Engineering/Software",
        "document_count": 89,
        "total_document_count": 89,
        "child_domains": []
      }
    ],
    "default_chunk_size": 500,
    "default_embedding_model": "text-embedding-ada-002",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-10T15:30:00Z"
  }
]
```

### POST `/domains` - Create New Domain
**Purpose**: Create a new knowledge domain  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
POST /domains
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Safety Protocols",
  "description": "Safety procedures and compliance documentation",
  "color": "#e74c3c",
  "parent_domain_id": "550e8400-e29b-41d4-a716-446655440000",
  "default_chunk_size": 750,
  "default_embedding_model": "text-embedding-ada-002"
}
```

### GET `/domains/{id}` - Get Domain Details
**Purpose**: Get detailed domain information with statistics  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_children` | boolean | true | Include child domains |
| `include_statistics` | boolean | true | Include usage statistics |

#### Example Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Engineering",
  "description": "Engineering documentation and specifications",
  "color": "#3498db",
  "document_count": 127,
  "total_document_count": 245,
  "child_domains": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Software",
      "document_count": 89
    }
  ],
  "statistics": {
    "recent_uploads": 12,
    "total_searches": 1847,
    "avg_search_relevance": 0.84,
    "most_used_tags": [
      {
        "tag_name": "Architecture",
        "usage_count": 45
      },
      {
        "tag_name": "Design",
        "usage_count": 38
      }
    ]
  }
}
```

### GET `/domains/{id}/documents` - Get Domain Documents
**Purpose**: List documents in a domain with pagination  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include_subdomain_documents` | boolean | false | Include documents from child domains |
| `limit` | integer | 20 | Results per page |
| `offset` | integer | 0 | Pagination offset |
| `sort_by` | enum | `created_at` | `name`, `created_at`, `updated_at`, `size` |
| `sort_order` | enum | `desc` | `asc`, `desc` |

---

## Tag Management

### GET `/tags` - List All Tags
**Purpose**: Get tags with usage statistics  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain_id` | UUID | - | Filter by domain |
| `category` | string | - | Filter by category |
| `include_unused` | boolean | true | Include tags with zero usage |
| `sort_by` | enum | `name` | `name`, `usage_count`, `created_at` |

#### Example Response
```json
[
  {
    "id": "tag_001",
    "name": "Risk Assessment",
    "description": "Documents related to risk evaluation and assessment procedures",
    "color": "#e74c3c",
    "domain_id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "Safety",
    "usage_count": 23,
    "last_used": "2024-01-15T09:30:00Z",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T09:30:00Z"
  }
]
```

### POST `/tags` - Create New Tag
**Purpose**: Create a new tag  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
POST /tags
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Drone Operations",
  "description": "Documentation related to drone and UAV operations",
  "color": "#9b59b6",
  "domain_id": "550e8400-e29b-41d4-a716-446655440000",
  "category": "Operations"
}
```

### GET `/tags/{id}/documents` - Get Tagged Documents
**Purpose**: List all documents with this tag  
**Authentication**: Required (Bearer JWT)

---

## RAG Operations

### POST `/rag/query` - RAG Query
**Purpose**: Perform Retrieval-Augmented Generation query for LLM context  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
POST /rag/query
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "query": "What are the safety considerations for UAV operations in urban environments?",
  "domain_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "tag_ids": ["tag_001", "tag_002"],
  "max_chunks": 5,
  "similarity_threshold": 0.7,
  "context_window": 4000,
  "include_metadata": true,
  "diversify_sources": true,
  "rank_by_relevance": true
}
```

#### Example Response
```json
{
  "query": "What are the safety considerations for UAV operations in urban environments?",
  "chunks": [
    {
      "chunk_id": "chunk_001",
      "document_id": "789e0123-e89b-12d3-a456-426614174000",
      "document_name": "UAV Compliance Manual 2024",
      "text": "Urban UAV operations require heightened safety considerations due to increased population density, complex airspace, and infrastructure constraints. Key safety factors include: 1) Maintaining visual line of sight with the aircraft, 2) Ensuring adequate emergency landing zones, 3) Coordinating with local air traffic control...",
      "title": "Urban Operations Safety",
      "similarity_score": 0.94,
      "rank": 1,
      "page_number": 15,
      "tags": ["Safety", "Urban Operations"],
      "metadata": {
        "section_type": "subsection",
        "author": "Safety Committee"
      },
      "relevance_explanation": "Direct match for urban UAV safety considerations with specific operational guidelines"
    },
    {
      "chunk_id": "chunk_015",
      "document_id": "abc123-def456-ghi789",
      "document_name": "Urban Aviation Risk Assessment Framework",
      "text": "Risk assessment protocols for urban aerial operations must account for dynamic environmental factors including weather patterns, building density, pedestrian traffic, and electromagnetic interference from urban infrastructure...",
      "similarity_score": 0.89,
      "rank": 2,
      "page_number": 8,
      "tags": ["Risk Assessment", "Urban"],
      "relevance_explanation": "Comprehensive risk factors for urban aviation operations"
    }
  ],
  "total_chunks_found": 12,
  "search_time_ms": 245,
  "embedding_model": "text-embedding-ada-002",
  "context_length_tokens": 1847,
  "query_id": "q_789e0123-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-15T16:45:30Z"
}
```

### POST `/rag/similar` - Find Similar Chunks
**Purpose**: Find chunks semantically similar to provided text  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
POST /rag/similar
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "text": "risk assessment methodology for UAV systems",
  "max_results": 10,
  "similarity_threshold": 0.75,
  "domain_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "include_context": true
}
```

---

## Analytics

### GET `/analytics/search` - Search Analytics
**Purpose**: Get search usage patterns and performance metrics  
**Authentication**: Required (Bearer JWT)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start_date` | date | - | Analytics period start |
| `end_date` | date | - | Analytics period end |
| `domain_id` | UUID | - | Filter by domain |
| `user_id` | UUID | - | Filter by user (admin only) |
| `granularity` | enum | `day` | `hour`, `day`, `week`, `month` |

#### Example Response
```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-15"
  },
  "summary": {
    "total_searches": 1247,
    "unique_users": 89,
    "average_response_time_ms": 156.7,
    "average_relevance_score": 0.82,
    "most_searched_terms": [
      {
        "term": "UAV safety",
        "count": 67,
        "avg_relevance": 0.89
      },
      {
        "term": "risk assessment",
        "count": 54,
        "avg_relevance": 0.85
      }
    ]
  },
  "by_domain": [
    {
      "domain_id": "550e8400-e29b-41d4-a716-446655440000",
      "domain_name": "Engineering",
      "search_count": 456,
      "avg_relevance": 0.84
    }
  ],
  "trends": {
    "daily_searches": [
      {
        "date": "2024-01-01",
        "count": 78
      },
      {
        "date": "2024-01-02", 
        "count": 92
      }
    ]
  }
}
```

### GET `/analytics/usage` - Usage Metrics
**Purpose**: Overall service usage metrics and trends  
**Authentication**: Required (Bearer JWT)

#### Example Response
```json
{
  "period": "month",
  "metrics": {
    "total_documents": 1247,
    "total_domains": 12,
    "total_tags": 89,
    "total_chunks": 15823,
    "active_users": 67,
    "searches_per_day": 82.4,
    "uploads_per_day": 6.7,
    "storage_used_gb": 45.7,
    "avg_processing_time_ms": 2340.5
  },
  "growth": {
    "document_growth_rate": 0.15,
    "search_growth_rate": 0.23,
    "user_growth_rate": 0.08
  }
}
```

---

## Bulk Operations

### POST `/bulk/documents` - Bulk Upload
**Purpose**: Upload multiple documents in a single operation  
**Authentication**: Required (Bearer JWT)  
**Content-Type**: `multipart/form-data`

#### Example Request
```bash
curl -X POST http://localhost:3003/bulk/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "files=@/path/to/doc1.pdf" \
  -F "files=@/path/to/doc2.docx" \
  -F "files=@/path/to/doc3.txt" \
  -F 'config={"domain_id": "550e8400-e29b-41d4-a716-446655440000", "default_tags": ["tag_001", "tag_002"]}'
```

#### Example Response
```json
{
  "uploaded": [
    {
      "id": "doc1_uuid",
      "name": "doc1.pdf",
      "status": "processing"
    }
  ],
  "skipped": [
    {
      "filename": "doc2.docx",
      "reason": "File already exists with same content hash",
      "original_path": "/path/to/doc2.docx"
    }
  ],
  "failed": [
    {
      "filename": "doc3.txt",
      "error": "Unsupported file format",
      "original_path": "/path/to/doc3.txt"
    }
  ],
  "total_files": 3,
  "successful": 1,
  "skipped_count": 1,
  "failed_count": 1,
  "processing_time_ms": 4567
}
```

### POST `/bulk/tags` - Bulk Tag Operations
**Purpose**: Apply or remove tags from multiple documents  
**Authentication**: Required (Bearer JWT)

#### Example Request
```bash
POST /bulk/tags
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "document_ids": [
    "789e0123-e89b-12d3-a456-426614174000",
    "abc123-def456-ghi789",
    "xyz789-uvw456-rst123"
  ],
  "tag_ids": ["tag_001", "tag_005"],
  "operation": "add"
}
```

#### Example Response
```json
{
  "updated_documents": 2,
  "skipped_documents": 1,
  "errors": [
    {
      "document_id": "xyz789-uvw456-rst123",
      "error": "Document not found"
    }
  ]
}
```

---

## Processing Status

### GET `/processing/status` - Queue Status
**Purpose**: Check document processing queue status  
**Authentication**: Required (Bearer JWT)

#### Example Response
```json
{
  "queue_length": 5,
  "active_jobs": 2,
  "completed_today": 67,
  "failed_today": 3,
  "average_processing_time_ms": 2340.5,
  "current_embedding_model": "text-embedding-ada-002"
}
```

### GET `/processing/jobs/{jobId}` - Job Status
**Purpose**: Check status of a specific processing job  
**Authentication**: Required (Bearer JWT)

#### Example Response
```json
{
  "job_id": "job_789e0123-e89b-12d3-a456-426614174000",
  "document_id": "789e0123-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress_percent": 65,
  "started_at": "2024-01-15T16:30:00Z",
  "completed_at": null,
  "error_message": null
}
```

---

## Error Handling

### Standard Error Response Format
All error responses follow this consistent format:

```json
{
  "error": "INVALID_REQUEST",
  "message": "The provided document ID is invalid",
  "details": "Document ID must be a valid UUID format",
  "timestamp": "2024-01-15T16:45:30Z",
  "request_id": "req_789e0123-e89b-12d3-a456-426614174000"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `INVALID_REQUEST` | Invalid request parameters or body |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate name) |
| 413 | `FILE_TOO_LARGE` | File exceeds size limit |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Unsupported file format |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## Authentication & Security

### Authentication
All endpoints except `/health` and `/api` require authentication via JWT Bearer token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limits
- **Search operations**: 100 requests/minute per user
- **Upload operations**: 20 requests/minute per user
- **Bulk operations**: 5 requests/minute per user
- **Analytics**: 50 requests/minute per user

### Security Headers
All responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## Performance Guidelines

### Search Optimization
- Use `hybrid` search for best results (combines semantic + keyword)
- Include specific `domain_ids` to improve relevance and speed
- Set appropriate `similarity_threshold` (0.7-0.8 for most cases)
- Limit `max_chunks` in RAG queries (5-10 typically sufficient)

### Upload Best Practices
- Documents under 10MB process fastest
- PDF and DOCX formats are optimized
- Use appropriate `chunk_size` for document type:
  - Technical docs: 750-1000 tokens
  - General docs: 500-750 tokens
  - Reference material: 1000+ tokens

### Caching
- Document metadata is cached for 1 hour
- Search results are cached for 15 minutes
- Domain/tag lists are cached for 30 minutes
- Include `Cache-Control: no-cache` header to bypass cache

---

**This comprehensive API reference provides practical examples and guidance for integrating with the Knowledge Manager Service. All endpoints support standard HTTP status codes and JSON responses for consistent client integration.** 