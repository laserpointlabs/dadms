# DADMS DataManager Service Specification

## 1. Purpose & Responsibilities

The `DataManager` serves as the central data gateway and processing hub for DADMS's Event-Driven System (EDS), enabling seamless integration of diverse data sources with intelligent transformation, validation, and real-time streaming capabilities.

### Core Responsibilities

- **Data Source Integration**: Connect to and ingest from diverse data streams (databases, APIs, files, message queues)
- **Schema Validation & Normalization**: Validate incoming data against schemas and normalize to consistent formats
- **Metadata Enrichment**: Apply comprehensive tagging, lineage tracking, and ontological mappings
- **Real-time & Batch Processing**: Support both streaming ingestion and batch ETL/ELT patterns
- **Data Quality Monitoring**: Detect anomalies, drift, and quality issues with automated alerting
- **Units Management**: Comprehensive unit definitions, validation, conversion, and dimensional analysis
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

## 3. Units Management & Dimensional Analysis

The Data Manager includes comprehensive units management capabilities to ensure data semantic correctness, enable automated unit conversions, and provide dimensional analysis for scientific and engineering data.

### 3.1 Unit Definition Framework

#### Unit Registry
```typescript
interface UnitDefinition {
  id: string;                     // Unique unit identifier (e.g., "meter", "kilogram")
  symbol: string;                 // Standard symbol (e.g., "m", "kg")
  name: string;                   // Full name
  aliases: string[];              // Alternative names/symbols (e.g., ["metre"])
  unit_system: UnitSystem;        // SI, Imperial, CGS, etc.
  base_unit: string;              // Base unit for this dimension
  conversion_factor: number;      // Factor to convert to base unit
  conversion_offset?: number;     // Offset for affine conversions (e.g., temperature)
  dimension: Dimension;           // Physical dimension
  category: UnitCategory;         // Grouping category
  is_base_unit: boolean;          // Whether this is a base unit
  is_derived: boolean;            // Whether derived from other units
  derived_from?: DerivedUnitDef;  // Definition if derived
  standards_compliance: string[]; // ISO, NIST, etc. compliance
  description?: string;           // Unit description
  created_at: Date;
  updated_at: Date;
}

enum UnitSystem {
  SI = "si",                      // International System of Units
  IMPERIAL = "imperial",          // Imperial units
  US_CUSTOMARY = "us_customary",  // US customary units
  CGS = "cgs",                    // Centimeter-gram-second
  ATOMIC = "atomic",              // Atomic units
  NATURAL = "natural",            // Natural units
  PLANCK = "planck",              // Planck units
  CUSTOM = "custom"               // Custom unit system
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

interface DerivedUnitDef {
  base_units: {[unitId: string]: number}; // Base units with exponents
  formula: string;                // Mathematical formula
  scale_factor: number;           // Additional scaling factor
}
```

#### Standard Unit Collections
```typescript
interface UnitCollection {
  id: string;                     // Collection identifier
  name: string;                   // Collection name
  description: string;            // Collection description
  unit_system: UnitSystem;        // Primary unit system
  units: string[];                // Unit IDs in collection
  is_complete: boolean;           // Whether collection covers all dimensions
  is_coherent: boolean;           // Whether units form coherent system
  authority: string;              // Standards authority (ISO, NIST, etc.)
  version: string;                // Collection version
  effective_date: Date;           // When collection became effective
}

// Built-in unit collections
const STANDARD_COLLECTIONS = {
  SI_BASE: "si_base_units",
  SI_DERIVED: "si_derived_units", 
  IMPERIAL: "imperial_units",
  US_CUSTOMARY: "us_customary_units",
  AVIATION: "aviation_units",
  MARINE: "marine_units",
  ENGINEERING: "engineering_units"
};
```

### 3.2 Unit Metadata & Schema Integration

#### Enhanced Data Metadata with Units
```typescript
interface DataMetadata {
  projectId?: string;
  userId?: string;
  tags: string[];
  domain: string;
  source_config: SourceConfig;
  lineage: DataLineage;
  quality_score?: number;
  sensitivity_level: string;
  retention_policy?: string;
  
  // Units metadata
  unit_metadata: UnitMetadata;    // Unit information for data fields
}

interface UnitMetadata {
  field_units: {[fieldPath: string]: FieldUnitInfo}; // Units for each field
  unit_consistency_score: number; // Unit consistency assessment
  unit_validation_status: UnitValidationStatus; // Validation status
  detected_unit_conflicts: UnitConflict[]; // Detected unit issues
  unit_conversion_applied: UnitConversion[]; // Applied conversions
  dimensional_analysis: DimensionalAnalysis; // Dimensional compatibility
}

interface FieldUnitInfo {
  unit_id: string;                // Primary unit identifier
  unit_symbol: string;            // Unit symbol
  confidence: number;             // Confidence in unit detection
  detection_method: UnitDetectionMethod; // How unit was determined
  alternative_units?: string[];   // Possible alternative interpretations
  unit_source: UnitSource;        // Where unit information came from
  validation_status: FieldUnitValidationStatus; // Field validation status
  conversion_target?: string;     // Target unit for normalization
}

enum UnitDetectionMethod {
  EXPLICIT = "explicit",          // Explicitly provided in data
  SCHEMA_DEFINED = "schema_defined", // Defined in schema
  COLUMN_NAME = "column_name",    // Inferred from column name
  PATTERN_MATCHING = "pattern_matching", // Pattern-based detection
  ML_INFERENCE = "ml_inference",  // Machine learning inference
  USER_SPECIFIED = "user_specified", // User override
  DEFAULT_ASSUMED = "default_assumed" // Default assumption
}

enum UnitSource {
  DATA_HEADER = "data_header",
  SCHEMA_DEFINITION = "schema_definition", 
  METADATA_ANNOTATION = "metadata_annotation",
  FILENAME_PATTERN = "filename_pattern",
  SOURCE_CONFIGURATION = "source_configuration",
  HEURISTIC_DETECTION = "heuristic_detection",
  USER_INPUT = "user_input"
}

enum UnitValidationStatus {
  VALID = "valid",
  INVALID = "invalid", 
  WARNING = "warning",
  MISSING = "missing",
  CONFLICTED = "conflicted",
  PENDING = "pending"
}

enum FieldUnitValidationStatus {
  VALID = "valid",
  INVALID_UNIT = "invalid_unit",
  DIMENSION_MISMATCH = "dimension_mismatch",
  UNIT_NOT_FOUND = "unit_not_found",
  AMBIGUOUS_UNIT = "ambiguous_unit",
  MISSING_UNIT = "missing_unit"
}
```

#### Unit-Aware Schema Definition
```typescript
interface UnitAwareSchema extends JSONSchema {
  properties: {
    [field: string]: PropertySchema & {
      unit?: UnitConstraint;      // Unit constraints for field
    }
  };
  unit_requirements: UnitRequirement[]; // Global unit requirements
  dimensional_constraints: DimensionalConstraint[]; // Dimensional analysis rules
}

interface UnitConstraint {
  required_unit?: string;         // Specific required unit
  allowed_units?: string[];       // List of allowed units
  dimension?: Dimension;          // Required physical dimension
  unit_system?: UnitSystem;       // Required unit system
  conversion_target?: string;     // Target unit for normalization
  validation_level: UnitValidationLevel; // Strictness level
}

enum UnitValidationLevel {
  STRICT = "strict",              // Must match exactly
  DIMENSIONAL = "dimensional",    // Must have compatible dimensions
  CONVERTIBLE = "convertible",    // Must be convertible to target
  FLEXIBLE = "flexible",          // Accept any valid unit
  OPTIONAL = "optional"           // Unit not required
}

interface UnitRequirement {
  field_pattern: string;          // Field pattern (regex or path)
  required_dimension: Dimension;  // Required dimension
  preferred_units: string[];      // Preferred units in order
  auto_convert: boolean;          // Whether to auto-convert
  validation_level: UnitValidationLevel;
}

interface DimensionalConstraint {
  constraint_id: string;
  description: string;
  fields: string[];               // Fields involved in constraint
  constraint_type: DimensionalConstraintType;
  constraint_formula: string;     // Mathematical relationship
  tolerance?: number;             // Allowed deviation
}

enum DimensionalConstraintType {
  EQUALITY = "equality",          // Fields must have same dimension
  RATIO = "ratio",                // Specific dimensional ratio
  PRODUCT = "product",            // Product relationship
  QUOTIENT = "quotient",          // Division relationship
  CUSTOM = "custom"               // Custom formula
}
```

### 3.3 Unit Validation & Conversion Engine

#### Unit Validation Framework
```typescript
interface UnitValidator {
  validateFieldUnits(data: any, schema: UnitAwareSchema): Promise<UnitValidationResult>;
  validateDimensionalConsistency(data: any, constraints: DimensionalConstraint[]): Promise<DimensionalValidationResult>;
  detectUnitConflicts(records: DataRecord[]): Promise<UnitConflictReport>;
  suggestUnitCorrections(validationResult: UnitValidationResult): Promise<UnitCorrectionSuggestion[]>;
}

interface UnitValidationResult {
  is_valid: boolean;
  validation_summary: ValidationSummary;
  field_validations: {[fieldPath: string]: FieldValidationResult};
  dimensional_validations: DimensionalValidationResult[];
  suggestions: UnitCorrectionSuggestion[];
  validation_metadata: ValidationMetadata;
}

interface FieldValidationResult {
  field_path: string;
  detected_unit: string;
  expected_unit?: string;
  validation_status: FieldUnitValidationStatus;
  error_message?: string;
  confidence: number;
  suggestions: string[];
}

interface DimensionalValidationResult {
  constraint_id: string;
  is_satisfied: boolean;
  involved_fields: string[];
  computed_dimensions: {[field: string]: Dimension};
  error_description?: string;
  suggested_corrections: string[];
}

interface UnitConflict {
  conflict_id: string;
  field_path: string;
  conflicting_units: string[];
  sources: UnitSource[];
  severity: ConflictSeverity;
  recommendation: string;
}

enum ConflictSeverity {
  CRITICAL = "critical",          // Incompatible dimensions
  HIGH = "high",                  // Different units, same dimension
  MEDIUM = "medium",              // Different systems
  LOW = "low",                    // Minor notation differences
  INFO = "info"                   // Information only
}
```

#### Unit Conversion Engine
```typescript
interface UnitConverter {
  convert(value: number, fromUnit: string, toUnit: string): Promise<ConversionResult>;
  convertArray(values: number[], fromUnit: string, toUnit: string): Promise<ConversionResult[]>;
  convertRecord(record: DataRecord, conversionMap: {[field: string]: string}): Promise<DataRecord>;
  getConversionFactor(fromUnit: string, toUnit: string): Promise<number>;
  isConvertible(fromUnit: string, toUnit: string): Promise<boolean>;
  suggestConversions(unit: string, targetSystem?: UnitSystem): Promise<string[]>;
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

interface ConversionMetadata {
  conversion_path: ConversionStep[];
  total_uncertainty: number;
  significant_figures: number;
  conversion_timestamp: Date;
  converter_version: string;
}

interface ConversionStep {
  from_unit: string;
  to_unit: string;
  operation: ConversionOperation;
  factor?: number;
  offset?: number;
  description: string;
}

enum ConversionOperation {
  MULTIPLY = "multiply",
  DIVIDE = "divide",
  ADD = "add",
  SUBTRACT = "subtract",
  FUNCTION = "function",
  LOOKUP = "lookup"
}

// Automatic conversion policies
interface ConversionPolicy {
  policy_id: string;
  name: string;
  description: string;
  target_unit_system: UnitSystem;
  field_patterns: string[];
  conversion_rules: ConversionRule[];
  auto_apply: boolean;
  preserve_original: boolean;
}

interface ConversionRule {
  rule_id: string;
  source_units: string[];
  target_unit: string;
  condition?: string;             // When to apply rule
  priority: number;
}
```

### 3.4 Dimensional Analysis Engine

#### Dimensional Analysis Framework
```typescript
interface DimensionalAnalyzer {
  analyzeDimensions(data: any, unitMetadata: UnitMetadata): Promise<DimensionalAnalysis>;
  checkDimensionalConsistency(fields: {[field: string]: string}): Promise<ConsistencyResult>;
  deriveUnitFromFormula(formula: string, inputUnits: {[variable: string]: string}): Promise<string>;
  validatePhysicalRelationships(data: any, relationships: PhysicalRelationship[]): Promise<ValidationResult>;
}

interface DimensionalAnalysis {
  analysis_id: string;
  field_dimensions: {[field: string]: AnalyzedDimension};
  dimensional_relationships: DimensionalRelationship[];
  consistency_score: number;
  identified_patterns: DimensionalPattern[];
  anomalies: DimensionalAnomaly[];
  suggestions: DimensionalSuggestion[];
}

interface AnalyzedDimension {
  field_path: string;
  detected_dimension: Dimension;
  confidence: number;
  supporting_evidence: string[];
  alternative_interpretations: Dimension[];
}

interface DimensionalRelationship {
  relationship_id: string;
  involved_fields: string[];
  relationship_type: RelationshipType;
  mathematical_expression: string;
  confidence: number;
  validation_status: string;
}

enum RelationshipType {
  PRODUCT = "product",
  QUOTIENT = "quotient", 
  SUM = "sum",
  DIFFERENCE = "difference",
  POWER = "power",
  ROOT = "root",
  LOGARITHMIC = "logarithmic",
  EXPONENTIAL = "exponential",
  TRIGONOMETRIC = "trigonometric"
}

interface PhysicalRelationship {
  relationship_id: string;
  name: string;
  description: string;
  formula: string;
  variables: {[variable: string]: VariableInfo};
  domain_constraints: DomainConstraint[];
  reference: string;              // Scientific reference
}

interface VariableInfo {
  description: string;
  expected_dimension: Dimension;
  typical_range?: {min: number, max: number};
  typical_units: string[];
}

interface DomainConstraint {
  constraint_type: string;
  description: string;
  validation_formula: string;
}
```

### 3.5 Unit Intelligence & Machine Learning

#### Unit Detection & Learning
```typescript
interface UnitIntelligence {
  detectUnitsFromData(data: any, context?: DetectionContext): Promise<UnitDetectionResult>;
  learnUnitsFromPatterns(historicalData: DataRecord[]): Promise<UnitLearningResult>;
  suggestUnitsFromContext(fieldName: string, dataType: string, domain: string): Promise<UnitSuggestion[]>;
  improveDetectionAccuracy(feedbackData: UnitFeedback[]): Promise<void>;
}

interface DetectionContext {
  source_type: string;
  domain: string;
  file_extension?: string;
  column_names?: string[];
  data_patterns?: string[];
  previous_detections?: UnitDetectionResult[];
}

interface UnitDetectionResult {
  detection_id: string;
  field_detections: {[field: string]: FieldUnitDetection};
  overall_confidence: number;
  detection_metadata: DetectionMetadata;
  improvement_suggestions: string[];
}

interface FieldUnitDetection {
  field_path: string;
  detected_units: UnitCandidate[];
  recommended_unit: string;
  confidence: number;
  detection_method: UnitDetectionMethod;
  supporting_evidence: Evidence[];
}

interface UnitCandidate {
  unit_id: string;
  unit_symbol: string;
  confidence: number;
  evidence_score: number;
  likelihood_factors: string[];
}

interface Evidence {
  evidence_type: EvidenceType;
  description: string;
  confidence_contribution: number;
  source: string;
}

enum EvidenceType {
  COLUMN_NAME_MATCH = "column_name_match",
  VALUE_RANGE_MATCH = "value_range_match",
  PATTERN_MATCH = "pattern_match",
  CONTEXT_CLUE = "context_clue",
  SIMILAR_DATA_HISTORY = "similar_data_history",
  DOMAIN_KNOWLEDGE = "domain_knowledge",
  UNIT_SYMBOL_PRESENT = "unit_symbol_present"
}

// Unit learning and feedback
interface UnitLearningResult {
  learned_patterns: LearnedPattern[];
  improved_rules: DetectionRule[];
  confidence_improvements: {[field: string]: number};
  new_unit_discoveries: string[];
}

interface LearnedPattern {
  pattern_id: string;
  pattern_type: string;
  description: string;
  applicability_score: number;
  training_data_size: number;
}

interface UnitFeedback {
  detection_id: string;
  field_path: string;
  correct_unit: string;
  incorrect_detection: string;
  feedback_type: FeedbackType;
  confidence: number;
  user_id: string;
  timestamp: Date;
}

enum FeedbackType {
  CORRECTION = "correction",
  CONFIRMATION = "confirmation",
  REFINEMENT = "refinement",
  REJECTION = "rejection"
}
```

## 4. API Specification

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
  
  // Units Management
  registerUnit(unitDef: UnitDefinition): Promise<UnitDefinition>;
  updateUnit(unitId: string, updates: Partial<UnitDefinition>): Promise<UnitDefinition>;
  deleteUnit(unitId: string): Promise<void>;
  getUnit(unitId: string): Promise<UnitDefinition>;
  listUnits(filters?: UnitFilters): Promise<UnitDefinition[]>;
  searchUnits(query: string): Promise<UnitDefinition[]>;
  
  // Unit Collections
  createUnitCollection(collection: UnitCollection): Promise<UnitCollection>;
  getUnitCollection(collectionId: string): Promise<UnitCollection>;
  listUnitCollections(): Promise<UnitCollection[]>;
  
  // Unit Validation & Conversion
  validateUnits(data: any, schema: UnitAwareSchema): Promise<UnitValidationResult>;
  convertUnits(value: number, fromUnit: string, toUnit: string): Promise<ConversionResult>;
  convertRecord(record: DataRecord, conversionMap: {[field: string]: string}): Promise<DataRecord>;
  suggestUnitCorrections(validationResult: UnitValidationResult): Promise<UnitCorrectionSuggestion[]>;
  
  // Dimensional Analysis
  analyzeDimensions(data: any, unitMetadata: UnitMetadata): Promise<DimensionalAnalysis>;
  validateDimensionalConsistency(data: any, constraints: DimensionalConstraint[]): Promise<DimensionalValidationResult>;
  deriveUnitFromFormula(formula: string, inputUnits: {[variable: string]: string}): Promise<string>;
  
  // Unit Intelligence
  detectUnitsFromData(data: any, context?: DetectionContext): Promise<UnitDetectionResult>;
  provideFeedback(feedback: UnitFeedback): Promise<void>;
  suggestUnitsFromContext(fieldName: string, dataType: string, domain: string): Promise<UnitSuggestion[]>;
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
  "das.external.data.discovered": DASDataDiscoveryEvent; // DAS found external data
  "das.synthetic.truth.opportunity": DASSyntheticTruthEvent; // DAS identified data fusion opportunity
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
  
  // Domain Integration Events
  "domain.mapping.created": DomainMappingCreatedEvent;
  "domain.integration.completed": DomainIntegrationCompletedEvent;
  "semantic.alignment.detected": SemanticAlignmentEvent;
  
  // DAS Enhanced Events
  "das.data.discovered.external": DASDataDiscoveryEvent;
  "das.fusion.opportunity": DASFusionOpportunityEvent;
  "das.change.predicted": DASChangePredictionEvent;
  "das.pattern.emerged": DASPatternEmergenceEvent;
  "das.quality.optimization": DASQualityOptimizationEvent;
  "das.stewardship.action": DASDataStewardshipEvent;
  "das.synthetic.truth.generated": DASSyntheticTruthEvent;
  "das.context.evolved": DASContextEvolutionEvent;
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

## 10. Enhanced Ontology Integration

### 10.1 Deep Ontology Workspace Service Integration
```typescript
interface OntologyWorkspaceIntegration {
  // Real-time ontology synchronization
  syncWithOntologyWorkspace(workspaceId: string): Promise<SyncResult>;
  subscribeToOntologyChanges(workspaceId: string): AsyncIterable<OntologyChangeEvent>;
  
  // Ontology-driven data modeling
  generateDataModelFromOntology(ontologyId: string, requirements: DataRequirements): Promise<GeneratedDataModel>;
  validateDataModelAgainstOntology(modelId: string, ontologyId: string): Promise<ValidationReport>;
  
  // Semantic data discovery
  discoverDataPatterns(ontologyId: string): Promise<DiscoveredPattern[]>;
  suggestDataSourcesFromOntology(ontologyId: string): Promise<DataSourceSuggestion[]>;
}

interface OntologyEnrichedMetadata extends DataMetadata {
  ontological_grounding: {
    primary_concepts: OntologicalConcept[];
    inferred_relationships: InferredRelationship[];
    semantic_consistency_score: number;
    domain_alignment: DomainAlignment;
    concept_coverage: ConceptCoverage;
  };
  
  // Integration with Ontology Workspace Service
  ontology_workspace_id?: string;
  ontology_version: string;
  last_ontology_sync: Date;
}
```

## 11. ReactFlow Visual Data Management

### 11.1 Data Visualization Architecture
```typescript
interface DataVisualizationComponents {
  // Data Lineage Visualization
  DataLineageCanvas: React.FC<{
    dataRecords: DataRecord[];
    transformations: Transformation[];
    onNodeClick: (recordId: string) => void;
  }>;
  
  // Data Source Topology
  DataSourceTopology: React.FC<{
    dataSources: DataSource[];
    connections: DataConnection[];
    onConnectionCreate: (source: string, target: string) => void;
  }>;
  
  // Transformation Pipeline Designer
  TransformationDesigner: React.FC<{
    pipeline: TransformationPipeline;
    onPipelineUpdate: (pipeline: TransformationPipeline) => void;
  }>;
  
  // Schema Relationship Viewer
  SchemaRelationshipViewer: React.FC<{
    schemas: Schema[];
    relationships: SchemaRelationship[];
    onRelationshipEdit: (relationshipId: string) => void;
  }>;
}

// Custom ReactFlow node types for data management
const dataManagerNodeTypes = {
  dataSource: DataSourceNode,
  dataRecord: DataRecordNode,
  transformation: TransformationNode,
  schema: SchemaNode,
  ontologyConcept: OntologyConceptNode,
  unitDefinition: UnitDefinitionNode,
  validationRule: ValidationRuleNode,
  qualityMetric: QualityMetricNode
};

const dataManagerEdgeTypes = {
  dataFlow: DataFlowEdge,
  transformation: TransformationEdge,
  schemaRelationship: SchemaRelationshipEdge,
  ontologyMapping: OntologyMappingEdge,
  unitConversion: UnitConversionEdge,
  lineage: LineageEdge
};
```

## 12. Domain Integration Data Mapper

### 12.1 Ontology-Guided Semantic Integration
```typescript
interface DomainIntegrationMapper {
  // Core mapping engine
  mapperEngine: SemanticMappingEngine;
  ontologyBridge: OntologyBridge;
  domainAligner: DomainAligner;
  mappingValidator: MappingValidator;
  
  // Visual mapping interface
  mappingCanvas: ReactFlowMappingCanvas;
  mappingLibrary: MappingTemplateLibrary;
  
  // Integration orchestration
  integrationOrchestrator: DomainIntegrationOrchestrator;
}

interface SemanticMappingEngine {
  // Ontology-guided mapping creation
  createSemanticMapping(sourceDomain: Domain, targetDomain: Domain, ontologyId: string): Promise<DomainMapping>;
  generateMappingRules(sourceSchema: Schema, targetSchema: Schema, ontologyContext: OntologyContext): Promise<MappingRule[]>;
  
  // Intelligent field mapping
  mapFieldsUsingOntology(sourceFields: Field[], targetFields: Field[], ontology: Ontology): Promise<FieldMapping[]>;
  suggestTransformations(sourceField: Field, targetField: Field, ontologyPath: OntologyPath): Promise<TransformationSuggestion[]>;
  
  // Semantic relationship detection
  detectSemanticRelationships(sourceData: any, targetDomain: string, ontologyId: string): Promise<SemanticRelationship[]>;
  validateSemanticConsistency(mapping: DomainMapping): Promise<ConsistencyReport>;
}

interface Domain {
  id: string;
  name: string;
  description: string;
  domain_type: DomainType;
  primary_ontology_id: string;
  secondary_ontologies: string[];
  domain_schema: DomainSchema;
  vocabulary: DomainVocabulary;
  semantic_context: SemanticContext;
  data_patterns: DataPattern[];
  integration_constraints: IntegrationConstraint[];
  created_at: Date;
  updated_at: Date;
}

enum DomainType {
  ENGINEERING = "engineering",
  FINANCE = "finance", 
  HEALTHCARE = "healthcare",
  MANUFACTURING = "manufacturing",
  AEROSPACE = "aerospace",
  DEFENSE = "defense",
  RESEARCH = "research",
  BUSINESS = "business",
  SCIENTIFIC = "scientific",
  REGULATORY = "regulatory",
  CUSTOM = "custom"
}

interface DomainMapping {
  id: string;
  name: string;
  description: string;
  source_domain: Domain;
  target_domain: Domain;
  ontology_bridge: OntologyBridge;
  mapping_rules: MappingRule[];
  transformation_pipeline: TransformationPipeline;
  validation_rules: ValidationRule[];
  mapping_metadata: MappingMetadata;
  confidence_score: number;
  status: MappingStatus;
  created_by: string;
  approved_by?: string;
  created_at: Date;
  updated_at: Date;
}
```

### 12.2 Visual Domain Mapping Canvas
```typescript
// ReactFlow Integration for Domain Mapping
interface DomainMappingCanvas {
  // Visual mapping components
  SourceDomainPanel: React.FC<{domain: Domain, onFieldSelect: (field: Field) => void}>;
  TargetDomainPanel: React.FC<{domain: Domain, onFieldSelect: (field: Field) => void}>;
  OntologyBridgeVisualizer: React.FC<{ontologyBridge: OntologyBridge}>;
  MappingRuleDesigner: React.FC<{onRuleCreate: (rule: MappingRule) => void}>;
}

// Custom ReactFlow node types for domain mapping
const domainMappingNodeTypes = {
  domainField: DomainFieldNode,
  ontologyConcept: OntologyConceptNode,
  mappingRule: MappingRuleNode,
  transformation: TransformationNode,
  validationPoint: ValidationPointNode,
  semanticBridge: SemanticBridgeNode,
  domainEntity: DomainEntityNode,
  businessRule: BusinessRuleNode
};
```

## 13. Digital Assistance System (DAS) Pervasive Intelligence

### 13.1 DAS Ambient Data Intelligence
```typescript
// DAS as Ethereal Data Intelligence - not separate APIs but enhanced behaviors
interface DASDataIntelligence {
  // Ambient data discovery
  ambientDataDiscovery: AmbientDataDiscovery;
  
  // Intelligent dataset orchestration  
  syntheticTruthGeneration: SyntheticTruthGeneration;
  
  // Continuous change monitoring
  adaptiveChangeDetection: AdaptiveChangeDetection;
  
  // Contextual data stewardship
  contextualDataStewardship: ContextualDataStewardship;
  
  // Emergent data patterns
  emergentPatternRecognition: EmergentPatternRecognition;
}

// DAS-Enhanced Data Operations (not separate APIs, but enhanced behaviors)
interface DASEnhancedDataManager extends DataManager {
  // Every operation is DAS-enhanced - these show the DAS influence
  
  // Standard ingest becomes DAS-aware ingest
  ingest(data: any, metadata: DataMetadata): Promise<DASEnhancedDataRecord>;
  
  // Standard query becomes DAS-contextual query
  query(filters: QueryFilters): Promise<DASContextualizedResults>;
  
  // Standard validation becomes DAS-intelligent validation
  validateData(data: any, schemaId: string): Promise<DASIntelligentValidationResult>;
}
```

### 13.2 DAS Ambient Data Discovery
```typescript
interface AmbientDataDiscovery {
  // DAS operates in the background, constantly discovering
  continuousExternalDataScanning: {
    // DAS monitors project context and proactively finds relevant data
    monitorProjectContext(projectId: string): AsyncIterable<DiscoveredDataOpportunity>;
    
    // DAS learns user patterns and suggests complementary data sources
    suggestComplementaryDataSources(currentDataSets: string[]): Promise<DataSourceSuggestion[]>;
    
    // DAS identifies data gaps and finds sources to fill them
    identifyAndFillDataGaps(projectContext: ProjectContext): Promise<DataGapFillStrategy>;
    
    // DAS discovers emerging data sources relevant to ongoing work
    emergingDataSourceDiscovery(domainContext: DomainContext): AsyncIterable<EmergingDataSource>;
  };
}

interface DiscoveredDataOpportunity {
  opportunity_id: string;
  discovered_source: ExternalDataSource;
  relevance_to_project: RelevanceAssessment;
  potential_value: ValueAssessment;
  integration_complexity: ComplexityAssessment;
  das_confidence: number;
  discovery_reasoning: DASReasoning;
  suggested_actions: SuggestedAction[];
}

interface DASReasoning {
  discovery_triggers: string[];           // What led DAS to find this
  context_analysis: ContextAnalysis;      // How DAS analyzed the context
  pattern_matching: PatternMatch[];       // Patterns DAS recognized
  predictive_insights: PredictiveInsight[]; // What DAS predicts about value
}
```

### 13.3 DAS Synthetic Truth Generation
```typescript
interface SyntheticTruthGeneration {
  // DAS automatically identifies datasets that should be combined
  automaticDatasetGrouping: {
    // DAS recognizes natural groupings in data
    identifyComplementaryDataSets(projectId: string): Promise<DataSetGroup[]>;
    
    // DAS suggests synthetic truth creation opportunities
    suggestSyntheticTruthOpportunities(dataSets: DataSet[]): Promise<SyntheticTruthOpportunity[]>;
    
    // DAS orchestrates the creation of synthetic datasets
    orchestrateSyntheticDatasetCreation(groupingPlan: DataSetGroupingPlan): Promise<SyntheticDataSet>;
    
    // DAS maintains coherence across combined datasets
    maintainSyntheticDatasetCoherence(syntheticDataSetId: string): AsyncIterable<CoherenceUpdate>;
  };
}

interface SyntheticDataSet {
  id: string;
  name: string;
  description: string;
  source_datasets: SourceDataSetInfo[];
  fusion_methodology: FusionMethodology;
  das_orchestration_log: DASOrchestrationLog;
  coherence_metrics: CoherenceMetrics;
  truth_confidence: TruthConfidence;
  synthetic_metadata: SyntheticMetadata;
  update_strategy: UpdateStrategy;
  quality_assurance: QualityAssurance;
}
```

### 13.4 DAS Enhanced API Interface
```typescript
// Enhanced DataManager API with all new capabilities
interface EnhancedDataManagerAPI extends DataManager {
  // Data Versioning
  createDataVersion(recordId: string, changes: any, metadata: VersionMetadata): Promise<DataRecordVersion>;
  getDataVersions(recordId: string, filters?: VersionFilters): Promise<DataRecordVersion[]>;
  compareVersions(recordId: string, fromVersion: string, toVersion: string): Promise<VersionComparison>;
  rollbackData(recordId: string, targetVersionId: string): Promise<RollbackResult>;
  
  // Dataset Versioning
  createDatasetVersion(datasetId: string, metadata: DatasetVersionMetadata): Promise<DatasetVersion>;
  getDatasetVersionHistory(datasetId: string): Promise<DatasetVersion[]>;
  promoteDatasetVersion(datasetId: string, versionId: string): Promise<PromotionResult>;
  
  // Synthetic Data Versioning
  regenerateSyntheticData(syntheticId: string, reason: RegenerationReason): Promise<SyntheticRegenerationResult>;
  trackSyntheticDependencies(syntheticId: string): Promise<DependencyGraph>;
  
  // Mapping Versioning
  versionDomainMapping(mappingId: string, changes: MappingChanges): Promise<MappingVersionInfo>;
  migrateMappingUsage(mappingId: string, fromVersion: string, toVersion: string): Promise<MigrationResult>;
  
  // Cross-Version Operations
  analyzeVersionImpact(changes: ProposedChange[]): Promise<ImpactAnalysis>;
  createVersionBranch(artifactId: string, branchName: string): Promise<VersionBranch>;
  mergeVersionBranch(artifactId: string, branchId: string): Promise<MergeResult>;
  
  // Enhanced Ontology Integration
  linkDomainToOntology(domainId: string, ontologyId: string): Promise<OntologyLink>;
  validateDomainAgainstOntology(domainId: string, ontologyId: string): Promise<OntologyValidationResult>;
  generateOntologyFromDomain(domainId: string): Promise<GeneratedOntology>;
  
  // Domain Integration Mapper
  registerDomain(domainConfig: DomainConfig): Promise<Domain>;
  createDomainMapping(mappingConfig: MappingConfig): Promise<DomainMapping>;
  executeDomainMapping(mappingId: string, sourceData: any): Promise<MappingResult>;
  suggestDomainMappings(sourceDomainId: string, targetDomainId: string, ontologyId: string): Promise<MappingSuggestion[]>;
  
  // Visual Mapping Interface
  getMappingCanvas(mappingId: string): Promise<ReactFlowDiagram>;
  updateMappingCanvas(mappingId: string, canvasData: ReactFlowDiagram): Promise<void>;
  exportMappingVisualization(mappingId: string, format: ExportFormat): Promise<ExportResult>;
  
  // Data Visualization
  getDataFlowDiagram(projectId: string): Promise<ReactFlowDiagram>;
  updateDataFlowDiagram(projectId: string, diagram: ReactFlowDiagram): Promise<void>;
  
  // DAS Integration (enhanced behaviors, not separate endpoints)
  // All existing endpoints are DAS-enhanced automatically
  
  // DAS Version Intelligence
  predictVersioningStrategy(datasetId: string): Promise<VersioningRecommendation>;
  detectSemanticChanges(recordId: string, newContent: any): Promise<SemanticChangeAnalysis>;
  recommendRollbackStrategy(artifactId: string, issue: string): Promise<RollbackRecommendation>;
}
```

This comprehensive specification provides the foundation for implementing the DataManager service as a sophisticated semantic data integration platform that:

1. **Uses Ontologies as Semantic Bridges** to translate between different domain vocabularies
2. **Provides Visual Data Management** using ReactFlow for intuitive data flow and mapping interfaces
3. **Offers Intelligent Domain Integration** with automated semantic mapping and transformation
4. **Embeds DAS Pervasive Intelligence** throughout all data operations for ambient assistance
5. **Maintains Semantic Integrity** throughout complex data integration workflows

The DAS enhancement transforms every data operation into an intelligent, context-aware experience where assistance is woven into the fabric of every interaction, process, and decision - making DADMS a truly living, learning data integration platform.
