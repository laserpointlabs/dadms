# DADMS DataManager Service Specification

## 1. Purpose & Responsibilities

The `DataManager` serves as the central data gateway and processing hub for DADMS's Event-Driven System (EDS), enabling seamless integration of diverse data sources with intelligent transformation, validation, and real-time streaming capabilities.

### Core Responsibilities

- **Data Source Integration**: Connect to and ingest from diverse data streams (databases, APIs, files, message queues)
- **Schema Validation & Normalization**: Validate incoming data against schemas and normalize to consistent formats
- **Metadata Enrichment**: Apply comprehensive tagging, lineage tracking, and ontological mappings
- **Real-time & Batch Processing**: Support both streaming ingestion and batch ETL/ELT patterns
- **Data Quality Monitoring**: Detect anomalies, drift, and quality issues with automated alerting
- **Event-Driven Integration**: Publish data events to EventManager for downstream consumption
- **Access Control**: Provide secure, role-based access to data assets and transformations

## 2. Data Model & Schema

### Data Record Structure
```typescript
interface DataRecord {
  id: string;                     // Unique record identifier (UUID)
  source_id: string;              // Data source identifier
  external_id?: string;           // Original external identifier
  data_type: DataType;            // Structured, unstructured, time-series, etc.
  content: Record<string, any>;   // Actual data content
  metadata: DataMetadata;         // Rich metadata and lineage
  schema_version: string;         // Data schema version
  ingestion_timestamp: Date;      // When data was ingested
  source_timestamp?: Date;        // Original timestamp from source
  hash: string;                   // Content hash for deduplication
  status: DataStatus;             // Processing status
}

interface DataMetadata {
  projectId?: string;             // Linked DADMS project
  userId?: string;                // User who ingested data
  tags: string[];                 // Ontological and custom tags
  domain: string;                 // Knowledge domain
  source_config: SourceConfig;    // Source configuration
  lineage: DataLineage;           // Data lineage tracking
  quality_score?: number;         // Data quality assessment
  sensitivity_level: string;      // Data sensitivity classification
  retention_policy?: string;      // Retention policy identifier
}

interface DataLineage {
  source_path: string;            // Original data path/location
  transformations: Transformation[]; // Applied transformations
  parent_records?: string[];      // Parent record IDs if derived
  downstream_usage: string[];     // Services/processes using this data
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

### Data Source Configuration
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

## 3. API Specification

### Core DataManager Interface
```typescript
interface DataManager {
  // Data Ingestion
  ingest(data: any, metadata: DataMetadata): Promise<DataRecord>;
  batchIngest(records: DataRecord[]): Promise<BatchResult>;
  
  // Data Querying
  query(filters: QueryFilters): Promise<DataRecord[]>;
  queryStream(filters: QueryFilters): AsyncIterable<DataRecord>;
  
  // Real-time Streaming
  stream(topic: string, handler: DataHandler): Promise<StreamSubscription>;
  unsubscribe(subscription: StreamSubscription): Promise<void>;
  
  // Data Source Management
  registerDataSource(config: DataSourceConfig): Promise<DataSource>;
  updateDataSource(id: string, config: Partial<DataSourceConfig>): Promise<DataSource>;
  deleteDataSource(id: string): Promise<void>;
  testDataSource(id: string): Promise<HealthStatus>;
  
  // Schema & Validation
  registerSchema(schema: JSONSchema): Promise<SchemaVersion>;
  validateData(data: any, schemaId: string): Promise<ValidationResult>;
  
  // Metadata & Lineage
  getLineage(recordId: string): Promise<DataLineage>;
  updateMetadata(recordId: string, metadata: Partial<DataMetadata>): Promise<void>;
  
  // Data Quality
  assessQuality(recordId: string): Promise<QualityReport>;
  detectAnomalies(sourceId: string): Promise<AnomalyReport>;
}

interface QueryFilters {
  sourceIds?: string[];           // Filter by data sources
  projectId?: string;             // Filter by project
  dataTypes?: DataType[];         // Filter by data type
  tags?: string[];                // Filter by tags
  timeRange?: {                   // Time-based filtering
    start: Date;
    end: Date;
    field: "ingestion_timestamp" | "source_timestamp";
  };
  contentFilters?: {              // Content-based filtering
    field: string;
    operator: "eq" | "contains" | "gt" | "lt" | "regex";
    value: any;
  }[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type DataHandler = (record: DataRecord) => Promise<void>;
```

## 4. Functional Requirements

### Data Source Detection & Registration
- **Automatic Discovery**: Scan for new data sources using connection probes and service discovery
- **Manual Registration**: API-driven registration of external data sources
- **Schema Inference**: Automatically infer schemas from sample data
- **Health Monitoring**: Continuous monitoring of data source availability and performance

### Data Validation & Transformation
```typescript
interface ValidationPipeline {
  // Schema validation
  validateSchema(data: any, schema: JSONSchema): ValidationResult;
  
  // Content validation
  validateContent(data: any, rules: ValidationRule[]): ValidationResult;
  
  // Data enrichment
  enrichMetadata(data: any, source: DataSource): DataMetadata;
  
  // Transformation pipeline
  transform(data: any, transformations: Transformation[]): any;
}

interface Transformation {
  id: string;
  name: string;
  type: "filter" | "map" | "aggregate" | "join" | "normalize";
  config: Record<string, any>;
  order: number;
}
```

### Real-time Streaming & Batch Processing
```typescript
interface IngestionModes {
  // Real-time streaming
  streamingIngestion: {
    bufferSize: number;           // Internal buffer size
    flushInterval: number;        // Auto-flush interval (ms)
    batchSize: number;            // Records per batch
    backpressure_strategy: "drop" | "buffer" | "block";
  };
  
  // Batch processing
  batchIngestion: {
    schedule: string;             // Cron expression
    parallelism: number;          // Concurrent workers
    chunk_size: number;           // Records per chunk
    retry_policy: RetryPolicy;
  };
  
  // Hybrid mode
  hybridMode: {
    realtime_threshold: number;   // Switch to batch if exceeded
    priority_sources: string[];   // Always real-time sources
  };
}
```

## 5. Non-Functional Requirements

### Scalability
- **Horizontal Scaling**: Support distributed processing across multiple instances
- **Volume Handling**: Process 10,000+ records/second with sub-second latency
- **Concurrent Connections**: Handle 100+ simultaneous data source connections
- **Storage Efficiency**: Optimized storage with compression and deduplication

### Performance & Latency
- **Real-time Processing**: < 100ms latency for streaming data
- **Batch Processing**: Complete 1M+ record batches within 10 minutes
- **Query Performance**: < 5 seconds for complex multi-source queries
- **Schema Validation**: < 10ms per record validation

### Resilience & Reliability
- **Fault Tolerance**: Continue processing with partial data source failures
- **Data Integrity**: Guarantee no data loss with transaction-based ingestion
- **Retry Mechanisms**: Configurable retry policies with exponential backoff
- **Circuit Breakers**: Automatic failure detection and isolation

### Observability
```typescript
interface DataManagerMetrics {
  // Ingestion metrics
  records_ingested_total: Counter;
  ingestion_latency_seconds: Histogram;
  ingestion_errors_total: Counter;
  
  // Processing metrics
  validation_duration_seconds: Histogram;
  transformation_duration_seconds: Histogram;
  quality_score_distribution: Histogram;
  
  // Source metrics
  active_data_sources: Gauge;
  source_health_status: Gauge;
  source_connection_errors: Counter;
  
  // Storage metrics
  total_records_stored: Gauge;
  storage_size_bytes: Gauge;
  deduplication_ratio: Gauge;
}
```

## 6. Integration & Event-Driven Behavior

### EventManager Integration
The DataManager is both a consumer and producer of events within the DADMS ecosystem:

```typescript
// Events consumed by DataManager
interface ConsumedEvents {
  "project.created": ProjectCreatedEvent;        // Auto-link data to new projects
  "ontology.updated": OntologyUpdatedEvent;     // Update metadata mappings
  "user.permission.changed": PermissionEvent;   // Update access controls
}

// Events published by DataManager
interface PublishedEvents {
  "data.source.registered": DataSourceRegisteredEvent;
  "data.ingested": DataIngestedEvent;
  "data.validated": DataValidatedEvent;
  "data.transformed": DataTransformedEvent;
  "data.quality.alert": DataQualityAlertEvent;
  "data.anomaly.detected": DataAnomalyEvent;
  "data.lineage.updated": DataLineageUpdatedEvent;
}

// Example event publishing
class DataManagerEventPublisher {
  async publishDataIngested(record: DataRecord) {
    const event: DataIngestedEvent = {
      type: "data.ingested",
      source: "data-manager",
      topic: `data/ingested/${record.source_id}`,
      priority: EventPriority.NORMAL,
      payload: {
        record_id: record.id,
        source_id: record.source_id,
        data_type: record.data_type,
        record_count: 1,
        ingestion_timestamp: record.ingestion_timestamp
      },
      metadata: {
        projectId: record.metadata.projectId,
        tags: ["data-ingestion", record.metadata.domain, ...record.metadata.tags]
      }
    };
    
    await this.eventManager.publish(event);
  }
}
```

### Vector Store Integration
```typescript
interface VectorStoreIntegration {
  // Index structured data for semantic search
  indexForSearch(record: DataRecord): Promise<void>;
  
  // Link to context threads
  linkToThread(recordId: string, threadId: string): Promise<void>;
  
  // Semantic similarity search
  findSimilarData(query: string, filters?: QueryFilters): Promise<DataRecord[]>;
}
```

### Ontology Manager Integration
```typescript
interface OntologyIntegration {
  // Apply ontological tags automatically
  applyOntologyTags(data: any, domain: string): Promise<string[]>;
  
  // Validate against domain ontology
  validateAgainstOntology(data: any, ontologyId: string): Promise<ValidationResult>;
  
  // Extract entities and relationships
  extractSemanticEntities(data: any): Promise<SemanticEntity[]>;
}
```

## 7. Ontology Tagging Practices

### Metadata Registry
```typescript
interface MetadataRegistry {
  // Domain-specific metadata schemas
  domains: {
    [domain: string]: {
      required_tags: string[];
      optional_tags: string[];
      validation_rules: ValidationRule[];
      ontology_mapping: OntologyMapping;
    };
  };
  
  // Data steward assignments
  stewards: {
    userId: string;
    domains: string[];
    permissions: DataStewardPermission[];
  }[];
}

interface OntologyMapping {
  entity_extraction: {
    field_mappings: { [field: string]: string }; // field -> ontology concept
    entity_types: string[];                      // expected entity types
  };
  
  relationship_mapping: {
    source_field: string;
    target_field: string;
    relationship_type: string;
  }[];
  
  classification_rules: {
    if_condition: string;        // JSONPath expression
    then_tag: string;           // Tag to apply
    confidence: number;         // Confidence level
  }[];
}
```

### Data Steward Workflow
```typescript
interface DataStewardAPI {
  // Review pending data for tagging
  getPendingDataForReview(domain: string): Promise<DataRecord[]>;
  
  // Apply ontological tags
  applyTags(recordId: string, tags: OntologyTag[]): Promise<void>;
  
  // Approve automated tagging
  approveAutomatedTags(recordId: string): Promise<void>;
  
  // Create tagging rules
  createTaggingRule(rule: TaggingRule): Promise<void>;
}

interface OntologyTag {
  concept: string;              // Ontology concept URI
  confidence: number;           // Confidence score (0-1)
  applied_by: "system" | "human";
  timestamp: Date;
}
```

## 8. Security & Access Control

### Role-Based Access Control
```typescript
interface DataAccessControl {
  // Role definitions
  roles: {
    data_consumer: {
      permissions: ["read", "query"];
      scope: "project_data";
    };
    data_steward: {
      permissions: ["read", "write", "tag", "approve"];
      scope: "domain_data";
    };
    data_admin: {
      permissions: ["read", "write", "delete", "configure"];
      scope: "all_data";
    };
  };
  
  // Data sensitivity levels
  sensitivity_levels: {
    public: { access_requirements: [] };
    internal: { access_requirements: ["authenticated"] };
    confidential: { access_requirements: ["authorized", "logged"] };
    restricted: { access_requirements: ["authorized", "approved", "audited"] };
  };
}
```

### Data Privacy & Compliance
- **PII Detection**: Automatic detection and masking of personal information
- **Audit Logging**: Complete audit trail of data access and modifications
- **Data Retention**: Configurable retention policies with automatic cleanup
- **Encryption**: End-to-end encryption for sensitive data

## 9. Implementation Architecture

### Service Structure
```typescript
// Port assignment: 3009 (next available after Thread Manager on 3008)
interface DataManagerService {
  port: 3009;
  health_endpoint: "/health";
  metrics_endpoint: "/metrics";
  
  components: {
    ingestion_engine: IngestionEngine;
    validation_pipeline: ValidationPipeline;
    transformation_engine: TransformationEngine;
    metadata_manager: MetadataManager;
    query_engine: QueryEngine;
    stream_processor: StreamProcessor;
    event_publisher: EventPublisher;
  };
}
```

### Database Schema
```sql
-- Data sources configuration
CREATE TABLE data_sources (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    connection_config JSONB NOT NULL,
    schema_config JSONB,
    ingestion_config JSONB,
    metadata_mapping JSONB,
    enabled BOOLEAN DEFAULT true,
    health_status VARCHAR(20) DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Data records
CREATE TABLE data_records (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES data_sources(id),
    external_id VARCHAR(255),
    data_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB NOT NULL,
    schema_version VARCHAR(50),
    ingestion_timestamp TIMESTAMP DEFAULT NOW(),
    source_timestamp TIMESTAMP,
    hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) DEFAULT 'ingesting',
    quality_score DECIMAL(3,2),
    
    -- Indexes for performance
    INDEX idx_data_records_source_id (source_id),
    INDEX idx_data_records_type (data_type),
    INDEX idx_data_records_timestamp (ingestion_timestamp),
    INDEX idx_data_records_hash (hash),
    INDEX idx_data_records_metadata (metadata) USING GIN
);

-- Data lineage tracking
CREATE TABLE data_lineage (
    id UUID PRIMARY KEY,
    record_id UUID REFERENCES data_records(id),
    parent_record_id UUID REFERENCES data_records(id),
    transformation_id VARCHAR(255),
    lineage_type VARCHAR(50), -- 'derived', 'transformed', 'aggregated'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ontology tags
CREATE TABLE ontology_tags (
    id UUID PRIMARY KEY,
    record_id UUID REFERENCES data_records(id),
    concept_uri VARCHAR(500) NOT NULL,
    tag_value VARCHAR(255),
    confidence DECIMAL(3,2),
    applied_by VARCHAR(20), -- 'system' or 'human'
    applied_by_user_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_ontology_tags_record (record_id),
    INDEX idx_ontology_tags_concept (concept_uri)
);
```

## 10. Deployment & Monitoring

### Container Configuration
```dockerfile
# DataManager Service Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -f http://localhost:3009/health || exit 1

EXPOSE 3009

CMD ["node", "src/index.js"]
```

### Monitoring & Alerting
```typescript
interface MonitoringConfiguration {
  health_checks: {
    endpoint: "/health";
    interval: 30; // seconds
    timeout: 10;  // seconds
  };
  
  alerts: {
    high_ingestion_latency: {
      threshold: 5000; // ms
      severity: "warning";
    };
    data_source_failure: {
      threshold: 3; // consecutive failures
      severity: "critical";
    };
    low_data_quality: {
      threshold: 0.7; // quality score
      severity: "warning";
    };
  };
  
  log_levels: {
    production: "info";
    development: "debug";
  };
}
```

---

This specification provides a comprehensive foundation for implementing the DataManager service as a crucial component of DADMS's data ecosystem, enabling intelligent data integration, processing, and event-driven workflows.
