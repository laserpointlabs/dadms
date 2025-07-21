# DataManager Service – API Endpoint Specification

This document details the API endpoints for the DataManager Service in DADMS 2.0, which serves as the central data gateway and processing hub for diverse data sources with intelligent transformation, validation, and real-time streaming capabilities.

---

## Service Overview

**Purpose**: Central data gateway for DADMS, enabling seamless integration of diverse data sources with intelligent transformation, validation, and real-time streaming capabilities
**Port**: 3009 (next available port after Thread Manager)
**Key Features**: Multi-source data ingestion, schema validation, metadata enrichment, real-time streaming, ontology tagging, data quality monitoring, and event-driven integration

---

## Endpoints Summary

| Method | Path                                    | Description                               | Request Body / Params           | Response Body                    | Auth? |
|--------|----------------------------------------|-------------------------------------------|---------------------------------|----------------------------------|-------|
| POST   | `/data/ingest`                         | Ingest single data record                 | DataIngestRequest (JSON)        | DataRecord (JSON)                | Yes   |
| POST   | `/data/ingest/batch`                   | Ingest multiple data records              | BatchIngestRequest (JSON)       | BatchIngestResult (JSON)         | Yes   |
| GET    | `/data/query`                          | Query data records with filtering        | Query parameters                | DataQueryResult (JSON)          | Yes   |
| GET    | `/data/stream`                         | Real-time data streaming (WebSocket)     | WebSocket upgrade headers       | WebSocket connection             | Yes   |
| POST   | `/sources`                             | Register new data source                  | DataSourceConfig (JSON)         | DataSource (JSON)                | Yes   |
| GET    | `/sources`                             | List all data sources                     | Query parameters                | DataSource[] (JSON)             | Yes   |
| GET    | `/sources/{id}`                        | Get specific data source                  | Path parameter: source ID       | DataSource (JSON)                | Yes   |
| PUT    | `/sources/{id}`                        | Update data source configuration          | DataSourceConfig (JSON)         | DataSource (JSON)                | Yes   |
| DELETE | `/sources/{id}`                        | Delete data source                        | Path parameter: source ID       | Success message                  | Yes   |
| POST   | `/sources/{id}/test`                   | Test data source connection               | Path parameter: source ID       | HealthStatus (JSON)              | Yes   |
| POST   | `/sources/{id}/discover`               | Discover schema from data source          | Path parameter: source ID       | SchemaInferenceResult (JSON)     | Yes   |
| POST   | `/schemas`                             | Register data schema                      | SchemaDefinition (JSON)         | SchemaVersion (JSON)             | Yes   |
| GET    | `/schemas`                             | List registered schemas                   | Query parameters                | SchemaDefinition[] (JSON)       | Yes   |
| POST   | `/data/{id}/validate`                  | Validate data record against schema       | ValidationRequest (JSON)        | ValidationResult (JSON)          | Yes   |
| GET    | `/data/{id}/lineage`                   | Get data lineage for record               | Path parameter: record ID       | DataLineage (JSON)               | Yes   |
| PUT    | `/data/{id}/metadata`                  | Update data record metadata               | MetadataUpdate (JSON)           | DataRecord (JSON)                | Yes   |
| POST   | `/data/{id}/tags`                      | Apply ontology tags to data record        | TaggingRequest (JSON)           | TaggingResult (JSON)             | Yes   |
| GET    | `/data/{id}/quality`                   | Assess data quality for record            | Path parameter: record ID       | QualityReport (JSON)             | Yes   |
| GET    | `/sources/{id}/anomalies`              | Detect anomalies in data source           | Path parameter: source ID       | AnomalyReport (JSON)             | Yes   |
| POST   | `/transformations`                     | Create data transformation pipeline       | TransformationConfig (JSON)     | Transformation (JSON)            | Yes   |
| GET    | `/transformations`                     | List transformation pipelines             | None                            | Transformation[] (JSON)          | Yes   |
| POST   | `/data/{id}/transform`                 | Apply transformation to data record       | TransformationRequest (JSON)    | TransformedData (JSON)           | Yes   |
| POST   | `/external/webhooks/{source_id}`       | External webhook endpoint                 | External data payload           | Webhook response                 | No*   |
| GET    | `/stewards/pending`                    | Get data pending steward review           | Query parameters                | DataRecord[] (JSON)             | Yes   |
| POST   | `/stewards/approve/{record_id}`        | Approve data steward tags                 | Path parameter: record ID       | Success message                  | Yes   |
| GET    | `/health`                              | Service health check                      | None                            | HealthStatus (JSON)              | No    |
| GET    | `/metrics`                             | Service performance metrics               | None                            | DataManagerMetrics (JSON)       | Yes   |

*External webhooks use source-specific authentication (webhook secrets, API keys)

---

## Data Models

### DataRecord Structure
```typescript
interface DataRecord {
    id: string;                     // Unique record identifier (UUID)
    source_id: string;              // Data source identifier
    external_id?: string;           // Original external identifier
    data_type: DataType;            // structured, unstructured, time_series, etc.
    content: Record<string, any>;   // Actual data content
    metadata: DataMetadata;         // Rich metadata and lineage
    schema_version: string;         // Data schema version
    ingestion_timestamp: Date;      // When data was ingested
    source_timestamp?: Date;        // Original timestamp from source
    hash: string;                   // Content hash for deduplication
    status: DataStatus;             // Processing status
}

enum DataType {
    STRUCTURED = "structured",
    UNSTRUCTURED = "unstructured", 
    TIME_SERIES = "time_series",
    GRAPH = "graph",
    DOCUMENT = "document",
    MEDIA = "media"
}

enum DataStatus {
    INGESTING = "ingesting",
    VALIDATED = "validated",
    TRANSFORMED = "transformed",
    INDEXED = "indexed",
    FAILED = "failed",
    ARCHIVED = "archived"
}
```

### DataMetadata Structure
```typescript
interface DataMetadata {
    projectId?: string;             // Linked DADMS project
    userId?: string;                // User who ingested data
    tags: string[];                 // Ontological and custom tags
    domain: string;                 // Knowledge domain
    source_config: SourceConfig;    // Source configuration
    lineage: DataLineage;           // Data lineage tracking
    quality_score?: number;         // Data quality assessment (0-1)
    sensitivity_level: string;      // public, internal, confidential, restricted
    retention_policy?: string;      // Retention policy identifier
}
```

### DataSource Configuration
```typescript
interface DataSource {
    id: string;                     // Unique source identifier
    name: string;                   // Human-readable name
    type: DataSourceType;           // Source type
    connection_config: ConnectionConfig; // Connection details
    schema_config: SchemaConfig;    // Expected schema
    ingestion_config: IngestionConfig; // Ingestion settings
    metadata_mapping: MetadataMapping; // Metadata extraction rules
    enabled: boolean;               // Source activation status
    health_status: HealthStatus;    // Connection health
    created_at: Date;
    updated_at: Date;
}

enum DataSourceType {
    DATABASE = "database",          // PostgreSQL, MySQL, MongoDB
    REST_API = "rest_api",          // HTTP REST endpoints
    WEBHOOK = "webhook",            // Incoming webhook data
    FILE_SYSTEM = "file_system",    // File uploads/monitoring
    MESSAGE_QUEUE = "message_queue", // Kafka, RabbitMQ, Redis
    STREAMING = "streaming",        // Real-time data streams
    THIRD_PARTY_API = "third_party_api" // External SaaS APIs
}
```

---

## Detailed Endpoint Documentation

### 1. Data Ingestion Endpoints

#### POST `/data/ingest`
**Description**: Ingest a single data record from any source

**Request Body**:
```json
{
    "source_id": "external-db-prod",
    "external_id": "customer-12345",
    "data_type": "structured",
    "content": {
        "customer_id": "12345",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "status": "active"
    },
    "metadata": {
        "projectId": "proj-uuid",
        "domain": "customer_management",
        "tags": ["customer", "crm"],
        "sensitivity_level": "internal"
    },
    "source_timestamp": "2025-01-15T10:30:00Z"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "rec-uuid",
        "source_id": "external-db-prod",
        "external_id": "customer-12345",
        "data_type": "structured",
        "content": { /* original content */ },
        "metadata": { /* enriched metadata */ },
        "schema_version": "1.0",
        "ingestion_timestamp": "2025-01-15T14:35:12Z",
        "source_timestamp": "2025-01-15T10:30:00Z",
        "hash": "sha256-hash",
        "status": "validated"
    }
}
```

#### POST `/data/ingest/batch`
**Description**: Ingest multiple data records in a single operation

**Request Body**:
```json
{
    "source_id": "external-api",
    "records": [
        {
            "external_id": "order-001",
            "data_type": "structured",
            "content": { "order_id": "001", "amount": 100.00 },
            "source_timestamp": "2025-01-15T10:00:00Z"
        },
        {
            "external_id": "order-002", 
            "data_type": "structured",
            "content": { "order_id": "002", "amount": 250.00 },
            "source_timestamp": "2025-01-15T10:01:00Z"
        }
    ],
    "metadata": {
        "projectId": "proj-uuid",
        "domain": "e_commerce",
        "tags": ["orders", "sales"]
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "total_records": 2,
        "successful": 2,
        "failed": 0,
        "results": [
            {
                "external_id": "order-001",
                "record_id": "rec-uuid-1",
                "status": "validated"
            },
            {
                "external_id": "order-002",
                "record_id": "rec-uuid-2", 
                "status": "validated"
            }
        ],
        "errors": []
    }
}
```

### 2. Data Querying Endpoints

#### GET `/data/query`
**Description**: Query data records with comprehensive filtering options

**Query Parameters**:
- `source_ids[]`: Filter by data source IDs
- `project_id`: Filter by DADMS project
- `data_types[]`: Filter by data types
- `tags[]`: Filter by metadata tags
- `start_time`: Start of time range (ISO 8601)
- `end_time`: End of time range (ISO 8601)
- `time_field`: Time field to filter on (`ingestion_timestamp` or `source_timestamp`)
- `content_filters`: JSON-encoded content filters
- `limit`: Maximum records to return (default: 100, max: 1000)
- `offset`: Number of records to skip
- `sort_by`: Field to sort by
- `sort_order`: Sort direction (`asc` or `desc`)

**Example Query**:
```
GET /data/query?source_ids[]=external-db&project_id=proj-123&data_types[]=structured&tags[]=customer&start_time=2025-01-15T00:00:00Z&limit=50&sort_by=ingestion_timestamp&sort_order=desc
```

**Response**:
```json
{
    "success": true,
    "data": {
        "records": [
            {
                "id": "rec-uuid",
                "source_id": "external-db",
                "data_type": "structured",
                "content": { /* data content */ },
                "metadata": { /* metadata */ },
                "ingestion_timestamp": "2025-01-15T14:35:12Z",
                "status": "indexed"
            }
        ],
        "pagination": {
            "total": 245,
            "limit": 50,
            "offset": 0,
            "has_more": true
        },
        "query_time_ms": 45
    }
}
```

### 3. Data Source Management Endpoints

#### POST `/sources`
**Description**: Register a new data source for ingestion

**Request Body**:
```json
{
    "name": "Production Customer Database",
    "type": "database",
    "connection_config": {
        "host": "db.example.com",
        "port": 5432,
        "database": "customers",
        "username": "readonly_user",
        "password": "encrypted_password",
        "ssl": true
    },
    "schema_config": {
        "expected_tables": ["customers", "orders"],
        "schema_validation": "strict"
    },
    "ingestion_config": {
        "mode": "realtime",
        "batch_size": 1000,
        "sync_frequency": "5m",
        "change_detection": "timestamp"
    },
    "metadata_mapping": {
        "domain": "customer_management",
        "default_tags": ["crm", "production"],
        "field_mappings": {
            "customer_id": "entity.customer.id",
            "email": "contact.email"
        }
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "src-uuid",
        "name": "Production Customer Database",
        "type": "database",
        "connection_config": { /* config without sensitive data */ },
        "schema_config": { /* schema config */ },
        "ingestion_config": { /* ingestion config */ },
        "metadata_mapping": { /* mapping config */ },
        "enabled": true,
        "health_status": "healthy",
        "created_at": "2025-01-15T14:35:12Z",
        "updated_at": "2025-01-15T14:35:12Z"
    }
}
```

#### POST `/sources/{id}/test`
**Description**: Test connection to a data source

**Response**:
```json
{
    "success": true,
    "data": {
        "source_id": "src-uuid",
        "connection_status": "healthy",
        "response_time_ms": 145,
        "test_results": {
            "connectivity": "pass",
            "authentication": "pass",
            "permissions": "pass",
            "schema_access": "pass"
        },
        "tested_at": "2025-01-15T14:35:12Z"
    }
}
```

### 4. Schema Management Endpoints

#### POST `/schemas`
**Description**: Register a data schema for validation

**Request Body**:
```json
{
    "name": "Customer Schema v1",
    "domain": "customer_management",
    "schema": {
        "type": "object",
        "properties": {
            "customer_id": { "type": "string", "pattern": "^[0-9]+$" },
            "name": { "type": "string", "minLength": 1 },
            "email": { "type": "string", "format": "email" },
            "status": { "type": "string", "enum": ["active", "inactive"] }
        },
        "required": ["customer_id", "name", "email"],
        "additionalProperties": false
    },
    "version": "1.0"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "schema-uuid",
        "name": "Customer Schema v1",
        "domain": "customer_management",
        "version": "1.0",
        "schema": { /* JSON schema */ },
        "created_at": "2025-01-15T14:35:12Z"
    }
}
```

### 5. Data Quality & Lineage Endpoints

#### GET `/data/{id}/lineage`
**Description**: Get complete data lineage for a record

**Response**:
```json
{
    "success": true,
    "data": {
        "record_id": "rec-uuid",
        "lineage": {
            "source_path": "postgres://db.example.com/customers/table/customers",
            "transformations": [
                {
                    "id": "transform-uuid",
                    "name": "PII Masking",
                    "type": "filter",
                    "applied_at": "2025-01-15T14:35:12Z"
                }
            ],
            "parent_records": ["rec-parent-uuid"],
            "downstream_usage": [
                "vector-store-index",
                "analytics-dashboard"
            ]
        }
    }
}
```

#### GET `/data/{id}/quality`
**Description**: Assess data quality for a record

**Response**:
```json
{
    "success": true,
    "data": {
        "record_id": "rec-uuid",
        "quality_score": 0.92,
        "assessment": {
            "completeness": 0.95,
            "accuracy": 0.88,
            "consistency": 0.93,
            "timeliness": 0.92
        },
        "issues": [
            {
                "type": "missing_field",
                "field": "phone_number",
                "severity": "low"
            }
        ],
        "assessed_at": "2025-01-15T14:35:12Z"
    }
}
```

### 6. Ontology & Tagging Endpoints

#### POST `/data/{id}/tags`
**Description**: Apply ontology tags to a data record

**Request Body**:
```json
{
    "tags": [
        {
            "concept": "http://ontology.dadms.com/customer/entity",
            "confidence": 0.95
        },
        {
            "concept": "http://ontology.dadms.com/contact/email",
            "confidence": 0.88
        }
    ],
    "applied_by": "system",
    "auto_approve": false
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "record_id": "rec-uuid",
        "tags_applied": 2,
        "pending_approval": 2,
        "tags": [
            {
                "id": "tag-uuid-1",
                "concept": "http://ontology.dadms.com/customer/entity",
                "confidence": 0.95,
                "status": "pending_approval"
            },
            {
                "id": "tag-uuid-2",
                "concept": "http://ontology.dadms.com/contact/email", 
                "confidence": 0.88,
                "status": "pending_approval"
            }
        ]
    }
}
```

### 7. External Integration Endpoints

#### POST `/external/webhooks/{source_id}`
**Description**: External webhook endpoint for receiving data from external systems

**Authentication**: Webhook secret validation or API key

**Request Body**: Variable format depending on external system

**Example** (external database change):
```json
{
    "event_type": "record_updated",
    "table": "customers",
    "record_id": "12345",
    "timestamp": "2025-01-15T10:30:00Z",
    "changes": {
        "status": {
            "from": "active", 
            "to": "inactive"
        }
    }
}
```

**Response**:
```json
{
    "success": true,
    "message": "Event received and queued for processing",
    "event_id": "evt-uuid"
}
```

### 8. Real-time Streaming

#### GET `/data/stream`
**Description**: WebSocket endpoint for real-time data streaming

**WebSocket Upgrade Headers**:
```
GET /data/stream HTTP/1.1
Host: data-manager:3009
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Authorization: Bearer <token>
```

**Query Parameters**:
- `source_ids[]`: Filter by data sources
- `data_types[]`: Filter by data types
- `tags[]`: Filter by tags
- `projects[]`: Filter by projects

**WebSocket Messages**:
```json
// Data record message
{
    "type": "data_record",
    "timestamp": "2025-01-15T14:35:12Z",
    "data": {
        "id": "rec-uuid",
        "source_id": "external-db",
        "content": { /* record content */ }
    }
}

// Status message
{
    "type": "status",
    "message": "Connected to data stream",
    "active_filters": {
        "source_ids": ["external-db"],
        "data_types": ["structured"]
    }
}

// Error message
{
    "type": "error",
    "error": "Filter validation failed",
    "details": "Invalid source_id: non-existent-source"
}
```

---

## Event-Driven Integration Patterns

### EventManager Integration

The DataManager both consumes and publishes events through the EventManager:

#### Events Published by DataManager
```typescript
// Data ingestion events
"data.source.registered"     -> New data source added
"data.ingested"              -> Single record ingested
"data.batch.ingested"        -> Batch ingestion completed
"data.validated"             -> Data validation completed
"data.transformed"           -> Data transformation applied
"data.quality.assessed"      -> Quality assessment completed
"data.anomaly.detected"      -> Data anomaly found
"data.lineage.updated"       -> Lineage information updated
"data.tags.applied"          -> Ontology tags applied
"data.source.health.changed" -> Data source health status changed
```

#### Events Consumed by DataManager
```typescript
"project.created"            -> Auto-link data sources to new projects
"ontology.updated"           -> Update metadata mappings
"user.permission.changed"    -> Update data access controls
"process.data.requested"     -> Process specific data request
```

### Example Event Publishing
```json
// Published when new data is ingested
{
    "type": "data.ingested",
    "source": "data-manager",
    "topic": "data/ingested/external-db/customers",
    "priority": "NORMAL",
    "payload": {
        "record_id": "rec-uuid",
        "source_id": "external-db",
        "data_type": "structured",
        "record_count": 1,
        "quality_score": 0.92
    },
    "metadata": {
        "projectId": "proj-uuid",
        "tags": ["data-ingestion", "customer", "crm"]
    }
}
```

---

## Performance & Reliability Features

### Performance Optimizations
- **Parallel Processing**: Multi-threaded data ingestion and transformation
- **Caching**: Redis-based caching for frequently accessed data and schemas
- **Connection Pooling**: Efficient database connection management
- **Batch Operations**: Optimized batch processing for high-volume ingestion

### Reliability Features
- **Idempotent Operations**: Hash-based deduplication prevents duplicate ingestion
- **Retry Logic**: Configurable retry policies with exponential backoff
- **Circuit Breakers**: Automatic failure detection and source isolation
- **Dead Letter Queue**: Failed operations routed to DLQ for manual review

### Monitoring & Observability
- **Health Checks**: Comprehensive health monitoring for all components
- **Metrics**: Detailed performance and operational metrics
- **Distributed Tracing**: Request tracing across service boundaries
- **Audit Logging**: Complete audit trail of all data operations

---

## Security Considerations

### Authentication & Authorization
- **Service Authentication**: JWT tokens for DADMS service-to-service communication
- **User Authentication**: Integration with DADMS user authentication system
- **Role-Based Access**: Granular permissions based on user roles and data sensitivity

### Data Security
- **Encryption in Transit**: TLS 1.3 for all API communications
- **Encryption at Rest**: Database encryption for sensitive data
- **PII Detection**: Automatic detection and handling of personal information
- **Audit Trails**: Complete logging of data access and modifications

### External Integration Security
- **Webhook Secrets**: HMAC signature validation for external webhooks
- **API Key Management**: Secure storage and rotation of external API keys
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Input Validation**: Comprehensive validation of all external inputs

---

The DataManager Service provides a robust, scalable foundation for all data operations within DADMS, enabling intelligent data integration, processing, and real-time event-driven workflows while maintaining the highest standards of security, reliability, and performance.
