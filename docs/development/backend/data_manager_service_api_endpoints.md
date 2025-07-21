# DataManager Service – API Endpoint Specification

This document details the API endpoints for the DataManager Service in DADMS 2.0, which serves as the central data gateway and processing hub for diverse data sources with intelligent transformation, validation, and real-time streaming capabilities.

---

## Service Overview

**Purpose**: Central data gateway for DADMS, enabling seamless integration of diverse data sources with intelligent transformation, validation, real-time streaming, and comprehensive units management capabilities
**Port**: 3009 (next available port after Thread Manager)  
**Key Features**: Multi-source data ingestion, schema validation, metadata enrichment, real-time streaming, ontology tagging, data quality monitoring, **comprehensive units management and dimensional analysis**, **automated unit detection and conversion**, **unit validation and consistency checking**, and event-driven integration

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
| **Units Management** |
| GET    | `/units`                               | List available units                      | Query parameters                | UnitDefinition[] (JSON)         | Yes   |
| POST   | `/units`                               | Register new unit                         | UnitDefinition (JSON)           | UnitDefinition (JSON)            | Yes   |
| GET    | `/units/{unitId}`                      | Get unit details                          | Path parameter: unit ID         | UnitDefinition (JSON)            | Yes   |
| PUT    | `/units/{unitId}`                      | Update unit definition                    | UnitDefinition (JSON)           | UnitDefinition (JSON)            | Yes   |
| DELETE | `/units/{unitId}`                      | Delete unit                               | Path parameter: unit ID         | Success message                  | Yes   |
| GET    | `/units/search`                        | Search units with fuzzy matching          | Query parameters                | UnitDefinition[] (JSON)         | Yes   |
| **Unit Collections** |
| GET    | `/units/collections`                   | List unit collections                     | None                            | UnitCollection[] (JSON)         | Yes   |
| POST   | `/units/collections`                   | Create unit collection                    | UnitCollection (JSON)           | UnitCollection (JSON)            | Yes   |
| GET    | `/units/collections/{collectionId}`    | Get unit collection details               | Path parameter: collection ID   | UnitCollection (JSON)            | Yes   |
| **Unit Validation & Conversion** |
| POST   | `/units/validate`                      | Validate data units against schema        | UnitValidationRequest (JSON)    | UnitValidationResult (JSON)     | Yes   |
| POST   | `/units/convert`                       | Convert unit values                       | UnitConversionRequest (JSON)    | ConversionResult (JSON)          | Yes   |
| POST   | `/units/convert/record`                | Convert units in data record              | RecordConversionRequest (JSON)  | ConvertedRecord (JSON)           | Yes   |
| **Dimensional Analysis** |
| POST   | `/units/analyze/dimensions`            | Analyze data dimensions and relationships | DimensionalAnalysisRequest      | DimensionalAnalysis (JSON)      | Yes   |
| POST   | `/units/analyze/consistency`           | Validate dimensional consistency          | ConsistencyCheckRequest (JSON)  | DimensionalValidationResult[]    | Yes   |
| **Unit Intelligence** |
| POST   | `/units/detect`                        | Detect units from data patterns           | UnitDetectionRequest (JSON)     | UnitDetectionResult (JSON)      | Yes   |
| GET    | `/units/suggest`                       | Get unit suggestions from context         | Query parameters                | UnitSuggestion[] (JSON)         | Yes   |
| POST   | `/units/feedback`                      | Provide unit detection feedback           | UnitFeedback (JSON)             | FeedbackResponse (JSON)          | Yes   |
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

### Units Management Data Models

#### UnitDefinition Structure
```typescript
interface UnitDefinition {
    id: string;                     // Unique unit identifier (e.g., "meter", "kilogram")
    symbol: string;                 // Standard symbol (e.g., "m", "kg")
    name: string;                   // Full name (e.g., "meter", "kilogram")
    aliases: string[];              // Alternative names/symbols
    unit_system: UnitSystem;        // Unit system classification
    base_unit?: string;             // Base unit for this dimension
    conversion_factor: number;      // Factor to convert to base unit
    conversion_offset?: number;     // Offset for affine conversions
    dimension: Dimension;           // Dimensional analysis vectors
    category: UnitCategory;         // Unit category
    is_base_unit: boolean;          // Whether this is a base unit
    is_derived: boolean;            // Whether derived from other units
    derived_from?: DerivedUnitDef;  // Derivation information
    standards_compliance: string[]; // ISO, NIST, etc. compliance
    description?: string;           // Unit description
    created_at: Date;
    updated_at: Date;
}

enum UnitSystem {
    SI = "si",                      // International System of Units
    IMPERIAL = "imperial",          // Imperial system
    US_CUSTOMARY = "us_customary",  // US customary units
    CGS = "cgs",                    // Centimeter-gram-second
    ATOMIC = "atomic",              // Atomic units
    NATURAL = "natural",            // Natural units
    PLANCK = "planck",              // Planck units
    CUSTOM = "custom"               // Custom unit systems
}

enum UnitCategory {
    LENGTH = "length",
    MASS = "mass",
    TIME = "time",
    ELECTRIC_CURRENT = "electric_current",
    TEMPERATURE = "temperature",
    AMOUNT_OF_SUBSTANCE = "amount_of_substance",
    LUMINOUS_INTENSITY = "luminous_intensity",
    AREA = "area",
    VOLUME = "volume",
    VELOCITY = "velocity",
    ACCELERATION = "acceleration",
    FORCE = "force",
    ENERGY = "energy",
    POWER = "power",
    PRESSURE = "pressure",
    FREQUENCY = "frequency",
    ANGLE = "angle",
    DIMENSIONLESS = "dimensionless"
}

interface Dimension {
    length: number;                 // Exponent for length dimension
    mass: number;                   // Exponent for mass dimension
    time: number;                   // Exponent for time dimension
    electric_current: number;       // Exponent for current dimension
    temperature: number;            // Exponent for temperature dimension
    amount_of_substance: number;    // Exponent for amount dimension
    luminous_intensity: number;     // Exponent for luminous intensity
}
```

#### UnitCollection Structure  
```typescript
interface UnitCollection {
    id: string;                     // Collection identifier
    name: string;                   // Collection name
    description?: string;           // Collection description
    unit_system: UnitSystem;        // Primary unit system
    units: string[];                // Unit IDs in collection
    is_complete: boolean;           // Whether covers all dimensions
    is_coherent: boolean;           // Whether units form coherent system
    authority?: string;             // Standards authority
    version?: string;               // Collection version
    effective_date?: Date;          // When collection became effective
}
```

#### Unit Validation & Conversion Models
```typescript
interface UnitValidationResult {
    is_valid: boolean;
    validation_summary: ValidationSummary;
    field_validations: Record<string, FieldValidationResult>;
    dimensional_validations: DimensionalValidationResult[];
    suggestions: UnitCorrectionSuggestion[];
    validation_metadata: ValidationMetadata;
}

interface ConversionResult {
    original_value: number;
    converted_value: number;
    from_unit: string;
    to_unit: string;
    conversion_factor: number;
    conversion_offset?: number;
    precision_loss?: number;
    conversion_metadata: ConversionMetadata;
}

interface UnitDetectionResult {
    detection_id: string;
    field_detections: Record<string, FieldUnitDetection>;
    overall_confidence: number;
    detection_metadata: DetectionMetadata;
    improvement_suggestions: string[];
}

interface DimensionalAnalysis {
    analysis_id: string;
    field_dimensions: Record<string, AnalyzedDimension>;
    dimensional_relationships: DimensionalRelationship[];
    consistency_score: number;
    identified_patterns: DimensionalPattern[];
    anomalies: DimensionalAnomaly[];
    suggestions: DimensionalSuggestion[];
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

### 9. Units Management Endpoints

#### GET `/units`
**Description**: List available units with optional filtering

**Query Parameters**:
- `unit_system`: Filter by unit system (si, imperial, us_customary, etc.)
- `category`: Filter by unit category (length, mass, time, etc.)
- `search`: Search units by name, symbol, or alias
- `limit`: Number of results per page (default: 20, max: 100)
- `offset`: Number of results to skip

**Example Query**:
```
GET /units?unit_system=si&category=length&search=meter&limit=10
```

**Response**:
```json
{
    "units": [
        {
            "id": "meter",
            "symbol": "m", 
            "name": "meter",
            "aliases": ["metre"],
            "unit_system": "si",
            "conversion_factor": 1.0,
            "dimension": {
                "length": 1,
                "mass": 0,
                "time": 0,
                "electric_current": 0,
                "temperature": 0,
                "amount_of_substance": 0,
                "luminous_intensity": 0
            },
            "category": "length",
            "is_base_unit": true,
            "is_derived": false,
            "standards_compliance": ["ISO", "NIST"],
            "description": "The SI base unit of length"
        }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
}
```

#### POST `/units`
**Description**: Register a new unit definition

**Request Body**:
```json
{
    "id": "nautical_mile",
    "symbol": "nmi",
    "name": "Nautical Mile",
    "aliases": ["nm", "M"],
    "unit_system": "marine",
    "base_unit": "meter", 
    "conversion_factor": 1852.0,
    "dimension": {
        "length": 1,
        "mass": 0,
        "time": 0,
        "electric_current": 0,
        "temperature": 0,
        "amount_of_substance": 0,
        "luminous_intensity": 0
    },
    "category": "length",
    "is_base_unit": false,
    "is_derived": false,
    "standards_compliance": ["IHO", "IMO"],
    "description": "International nautical mile defined as exactly 1852 meters"
}
```

**Response**:
```json
{
    "id": "nautical_mile",
    "symbol": "nmi",
    "name": "Nautical Mile",
    "aliases": ["nm", "M"],
    "unit_system": "marine",
    "base_unit": "meter",
    "conversion_factor": 1852.0,
    "dimension": { /* dimension vector */ },
    "category": "length",
    "is_base_unit": false,
    "is_derived": false,
    "standards_compliance": ["IHO", "IMO"],
    "description": "International nautical mile defined as exactly 1852 meters",
    "created_at": "2025-01-15T14:35:12Z",
    "updated_at": "2025-01-15T14:35:12Z"
}
```

#### GET `/units/search`
**Description**: Search units using text query with fuzzy matching

**Query Parameters**:
- `q`: Search query (required)
- `include_aliases`: Include unit aliases in search (default: true)
- `limit`: Maximum number of results (default: 10, max: 50)

**Example Query**:
```
GET /units/search?q=temp&include_aliases=true&limit=5
```

**Response**:
```json
[
    {
        "id": "kelvin",
        "symbol": "K",
        "name": "kelvin",
        "aliases": [],
        "unit_system": "si",
        "category": "temperature",
        "relevance_score": 0.95,
        "matched_fields": ["name", "category"]
    },
    {
        "id": "celsius",
        "symbol": "°C",
        "name": "degree Celsius",
        "aliases": ["celsius", "centigrade"],
        "unit_system": "si",
        "category": "temperature",
        "relevance_score": 0.88,
        "matched_fields": ["aliases"]
    }
]
```

### 10. Unit Collections Endpoints

#### GET `/units/collections`
**Description**: Get all available unit collections

**Response**:
```json
[
    {
        "id": "si_base",
        "name": "SI Base Units",
        "description": "The seven SI base units",
        "unit_system": "si",
        "units": ["meter", "kilogram", "second", "ampere", "kelvin", "mole", "candela"],
        "is_complete": true,
        "is_coherent": true,
        "authority": "BIPM",
        "version": "2019",
        "effective_date": "2019-05-20T00:00:00Z"
    }
]
```

#### POST `/units/collections`
**Description**: Create a new unit collection

**Request Body**:
```json
{
    "id": "aerospace_units",
    "name": "Aerospace Engineering Units",
    "description": "Standard units used in aerospace engineering applications",
    "unit_system": "si",
    "units": ["meter", "kilogram", "second", "newton", "pascal", "kelvin"],
    "is_complete": false,
    "is_coherent": true,
    "authority": "AIAA",
    "version": "1.0"
}
```

**Response**:
```json
{
    "id": "aerospace_units",
    "name": "Aerospace Engineering Units",
    "description": "Standard units used in aerospace engineering applications",
    "unit_system": "si",
    "units": ["meter", "kilogram", "second", "newton", "pascal", "kelvin"],
    "is_complete": false,
    "is_coherent": true,
    "authority": "AIAA",
    "version": "1.0",
    "effective_date": "2025-01-15T14:35:12Z"
}
```

### 11. Unit Validation & Conversion Endpoints

#### POST `/units/validate`
**Description**: Validate units in data against schema requirements

**Request Body**:
```json
{
    "data": {
        "altitude": 10000,
        "speed": 250,
        "temperature": -40
    },
    "schema": {
        "properties": {
            "altitude": {
                "type": "number",
                "unit": {
                    "required_unit": "meter",
                    "validation_level": "strict"
                }
            },
            "speed": {
                "type": "number", 
                "unit": {
                    "allowed_units": ["meter_per_second", "knot", "kilometer_per_hour"],
                    "conversion_target": "meter_per_second",
                    "validation_level": "convertible"
                }
            },
            "temperature": {
                "type": "number",
                "unit": {
                    "dimension": {
                        "temperature": 1
                    },
                    "validation_level": "dimensional"
                }
            }
        }
    },
    "validation_level": "strict"
}
```

**Response**:
```json
{
    "is_valid": false,
    "validation_summary": {
        "total_fields": 3,
        "valid_fields": 1,
        "invalid_fields": 2,
        "warning_fields": 0,
        "missing_unit_fields": 2,
        "overall_score": 0.33
    },
    "field_validations": {
        "altitude": {
            "field_path": "altitude",
            "detected_unit": null,
            "expected_unit": "meter",
            "validation_status": "missing_unit",
            "error_message": "No unit detected for field requiring meter",
            "confidence": 0.0,
            "suggestions": ["meter", "foot", "kilometer"]
        },
        "speed": {
            "field_path": "speed",
            "detected_unit": null,
            "expected_unit": "meter_per_second",
            "validation_status": "missing_unit",
            "error_message": "No unit detected for speed field",
            "confidence": 0.0,
            "suggestions": ["meter_per_second", "knot", "kilometer_per_hour"]
        },
        "temperature": {
            "field_path": "temperature",
            "detected_unit": "celsius",
            "expected_unit": "kelvin",
            "validation_status": "valid",
            "confidence": 0.85
        }
    },
    "suggestions": [
        {
            "field_path": "altitude",
            "current_unit": null,
            "suggested_unit": "meter",
            "correction_type": "add_unit",
            "confidence": 0.9,
            "reasoning": "Field name 'altitude' commonly uses length units"
        }
    ]
}
```

#### POST `/units/convert`
**Description**: Convert numeric values between different units

**Request Body**:
```json
{
    "value": 100,
    "from_unit": "kilometer_per_hour",
    "to_unit": "meter_per_second",
    "precision": 2
}
```

**Response**:
```json
{
    "original_value": 100,
    "converted_value": 27.78,
    "from_unit": "kilometer_per_hour",
    "to_unit": "meter_per_second",
    "conversion_factor": 0.2778,
    "conversion_offset": 0,
    "precision_loss": 0.0000555,
    "conversion_metadata": {
        "conversion_path": [
            {
                "from_unit": "kilometer_per_hour",
                "to_unit": "meter_per_second",
                "operation": "divide",
                "factor": 3.6,
                "description": "Convert km/h to m/s by dividing by 3.6"
            }
        ],
        "total_uncertainty": 0.0001,
        "significant_figures": 4,
        "conversion_timestamp": "2025-01-15T14:35:12Z"
    }
}
```

#### POST `/units/convert/record`
**Description**: Convert units across multiple fields in a data record

**Request Body**:
```json
{
    "record": {
        "id": "flight-data-001",
        "content": {
            "altitude": 35000,
            "speed": 450,
            "temperature": -60
        }
    },
    "conversion_map": {
        "content.altitude": "meter",
        "content.speed": "meter_per_second", 
        "content.temperature": "kelvin"
    },
    "preserve_original": true
}
```

**Response**:
```json
{
    "converted_record": {
        "id": "flight-data-001",
        "content": {
            "altitude": 10668,
            "altitude_original": 35000,
            "altitude_original_unit": "foot",
            "speed": 225,
            "speed_original": 450,
            "speed_original_unit": "knot",
            "temperature": 213.15,
            "temperature_original": -60,
            "temperature_original_unit": "celsius"
        }
    },
    "conversion_summary": [
        {
            "original_value": 35000,
            "converted_value": 10668,
            "from_unit": "foot",
            "to_unit": "meter"
        }
    ],
    "validation_issues": []
}
```

### 12. Dimensional Analysis Endpoints

#### POST `/units/analyze/dimensions`
**Description**: Perform dimensional analysis on data to identify patterns and relationships

**Request Body**:
```json
{
    "data": {
        "distance": 100,
        "time": 10,
        "speed": 10,
        "force": 500,
        "mass": 50,
        "acceleration": 10
    },
    "unit_metadata": {
        "field_units": {
            "distance": {
                "unit_id": "meter",
                "unit_symbol": "m",
                "confidence": 1.0
            },
            "time": {
                "unit_id": "second",
                "unit_symbol": "s", 
                "confidence": 1.0
            },
            "speed": {
                "unit_id": "meter_per_second",
                "unit_symbol": "m/s",
                "confidence": 0.9
            }
        }
    },
    "analysis_options": {
        "detect_relationships": true,
        "identify_patterns": true,
        "check_consistency": true
    }
}
```

**Response**:
```json
{
    "analysis_id": "analysis-uuid",
    "field_dimensions": {
        "distance": {
            "field_path": "distance",
            "detected_dimension": {
                "length": 1,
                "mass": 0,
                "time": 0,
                "electric_current": 0,
                "temperature": 0,
                "amount_of_substance": 0,
                "luminous_intensity": 0
            },
            "confidence": 1.0,
            "supporting_evidence": ["unit_symbol_match", "field_name_pattern"]
        }
    },
    "dimensional_relationships": [
        {
            "relationship_id": "speed_distance_time",
            "involved_fields": ["speed", "distance", "time"],
            "relationship_type": "quotient",
            "mathematical_expression": "speed = distance / time",
            "confidence": 0.95,
            "validation_status": "valid"
        },
        {
            "relationship_id": "newton_second_law",
            "involved_fields": ["force", "mass", "acceleration"],
            "relationship_type": "product",
            "mathematical_expression": "force = mass * acceleration",
            "confidence": 0.98,
            "validation_status": "valid"
        }
    ],
    "consistency_score": 0.96,
    "identified_patterns": [
        {
            "pattern_id": "kinematic_pattern",
            "pattern_type": "physics_kinematics",
            "description": "Classical kinematics relationships detected",
            "confidence": 0.94,
            "affected_fields": ["distance", "time", "speed", "acceleration"]
        }
    ],
    "anomalies": [],
    "suggestions": [
        {
            "suggestion_id": "add_velocity_validation",
            "suggestion_type": "validation_rule",
            "description": "Add validation rule to ensure speed = distance/time",
            "recommended_action": "Create dimensional constraint",
            "confidence": 0.9
        }
    ]
}
```

#### POST `/units/analyze/consistency`
**Description**: Validate dimensional consistency across related fields

**Request Body**:
```json
{
    "data": {
        "force": 100,
        "mass": 10,
        "acceleration": 10
    },
    "constraints": [
        {
            "constraint_id": "newtons_second_law",
            "description": "Force equals mass times acceleration",
            "fields": ["force", "mass", "acceleration"],
            "constraint_type": "product",
            "constraint_formula": "force = mass * acceleration",
            "tolerance": 0.01
        }
    ]
}
```

**Response**:
```json
[
    {
        "constraint_id": "newtons_second_law",
        "is_satisfied": true,
        "involved_fields": ["force", "mass", "acceleration"],
        "computed_dimensions": {
            "force": {
                "length": 1,
                "mass": 1,
                "time": -2,
                "electric_current": 0,
                "temperature": 0,
                "amount_of_substance": 0,
                "luminous_intensity": 0
            }
        },
        "error_description": null,
        "suggested_corrections": []
    }
]
```

### 13. Unit Intelligence Endpoints

#### POST `/units/detect`
**Description**: Automatically detect units from data patterns and context

**Request Body**:
```json
{
    "data": {
        "flight_altitude_ft": 35000,
        "ground_speed_kts": 450,
        "outside_air_temp_f": -60,
        "fuel_remaining_lbs": 15000
    },
    "context": {
        "source_type": "aviation_data",
        "domain": "flight_operations",
        "file_extension": "csv",
        "column_names": ["flight_altitude_ft", "ground_speed_kts", "outside_air_temp_f"]
    },
    "detection_options": {
        "use_ml_inference": true,
        "confidence_threshold": 0.7,
        "max_candidates": 3
    }
}
```

**Response**:
```json
{
    "detection_id": "detection-uuid",
    "field_detections": {
        "flight_altitude_ft": {
            "field_path": "flight_altitude_ft",
            "detected_units": [
                {
                    "unit_id": "foot",
                    "unit_symbol": "ft",
                    "confidence": 0.98,
                    "evidence_score": 0.95,
                    "likelihood_factors": ["suffix_match_ft", "aviation_domain", "value_range_typical"]
                }
            ],
            "recommended_unit": "foot",
            "confidence": 0.98,
            "detection_method": "column_name",
            "supporting_evidence": [
                {
                    "evidence_type": "column_name_match",
                    "description": "Field name contains 'ft' suffix",
                    "confidence_contribution": 0.8,
                    "source": "field_name_pattern"
                },
                {
                    "evidence_type": "domain_knowledge",
                    "description": "Aviation domain commonly uses feet for altitude",
                    "confidence_contribution": 0.15,
                    "source": "domain_context"
                }
            ]
        },
        "ground_speed_kts": {
            "field_path": "ground_speed_kts",
            "detected_units": [
                {
                    "unit_id": "knot",
                    "unit_symbol": "kts",
                    "confidence": 0.96,
                    "evidence_score": 0.92
                }
            ],
            "recommended_unit": "knot",
            "confidence": 0.96,
            "detection_method": "column_name"
        }
    },
    "overall_confidence": 0.94,
    "improvement_suggestions": [
        "Consider standardizing field naming conventions",
        "Add explicit unit metadata to data schema"
    ]
}
```

#### GET `/units/suggest`
**Description**: Get unit suggestions based on field name, data type, and domain

**Query Parameters**:
- `field_name`: Field name to suggest units for (required)
- `data_type`: Data type (number, integer, float, string)
- `domain`: Domain context (aviation, automotive, medical, etc.)
- `limit`: Maximum number of suggestions (default: 5, max: 20)

**Example Query**:
```
GET /units/suggest?field_name=temperature&data_type=number&domain=aviation&limit=3
```

**Response**:
```json
[
    {
        "unit_id": "celsius",
        "unit_symbol": "°C",
        "unit_name": "degree Celsius",
        "confidence": 0.85,
        "reasoning": "Commonly used temperature unit in aviation outside US",
        "category": "temperature",
        "unit_system": "si"
    },
    {
        "unit_id": "kelvin",
        "unit_symbol": "K",
        "unit_name": "kelvin",
        "confidence": 0.75,
        "reasoning": "Scientific temperature scale used in atmospheric calculations",
        "category": "temperature",
        "unit_system": "si"
    },
    {
        "unit_id": "fahrenheit",
        "unit_symbol": "°F",
        "unit_name": "degree Fahrenheit",
        "confidence": 0.65,
        "reasoning": "US aviation standard for temperature",
        "category": "temperature",
        "unit_system": "imperial"
    }
]
```

#### POST `/units/feedback`
**Description**: Provide feedback to improve unit detection accuracy

**Request Body**:
```json
{
    "detection_id": "detection-uuid-123",
    "field_path": "altitude",
    "correct_unit": "meter",
    "incorrect_detection": "foot",
    "feedback_type": "correction",
    "confidence": 0.95,
    "user_id": "user@example.com",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response**:
```json
{
    "message": "Feedback recorded successfully",
    "feedback_id": "feedback-uuid"
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

// Units management events
"units.unit.registered"      -> New unit definition added
"units.unit.updated"         -> Unit definition modified
"units.unit.deleted"         -> Unit definition removed
"units.collection.created"   -> Unit collection created
"units.validation.completed" -> Unit validation performed
"units.conversion.performed" -> Unit conversion executed
"units.dimension.analyzed"   -> Dimensional analysis completed
"units.detection.completed"  -> Unit detection performed
"units.feedback.received"    -> Unit detection feedback provided
"units.conflict.detected"    -> Unit conflict identified
"units.inconsistency.found"  -> Dimensional inconsistency found
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

// Published when unit detection is completed
{
    "type": "units.detection.completed",
    "source": "data-manager",
    "topic": "units/detection/aviation/flight-data",
    "priority": "NORMAL",
    "payload": {
        "detection_id": "detection-uuid",
        "data_source": "aviation-sensors",
        "fields_analyzed": 8,
        "units_detected": 6,
        "overall_confidence": 0.94,
        "domain": "aviation",
        "anomalies_found": 0
    },
    "metadata": {
        "projectId": "proj-uuid",
        "tags": ["units-detection", "aviation", "sensors"]
    }
}

// Published when dimensional inconsistency is found
{
    "type": "units.inconsistency.found",
    "source": "data-manager",
    "topic": "units/inconsistency/physics-model",
    "priority": "HIGH",
    "payload": {
        "analysis_id": "analysis-uuid",
        "constraint_violations": [
            {
                "constraint_id": "newtons_second_law",
                "fields": ["force", "mass", "acceleration"],
                "severity": "critical"
            }
        ],
        "affected_records": 245,
        "consistency_score": 0.12
    },
    "metadata": {
        "projectId": "proj-uuid",
        "tags": ["units-validation", "physics", "constraint-violation"]
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
