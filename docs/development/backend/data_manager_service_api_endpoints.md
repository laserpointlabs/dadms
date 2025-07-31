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
| **Domain Integration & Mapping** |
| GET    | `/domains`                             | List registered domains                   | Query parameters                | Domain[] (JSON)                 | Yes   |
| POST   | `/domains`                             | Register new domain                       | DomainConfig (JSON)             | Domain (JSON)                    | Yes   |
| GET    | `/domains/{domainId}`                  | Get domain details                        | Path parameter: domain ID       | Domain (JSON)                    | Yes   |
| PUT    | `/domains/{domainId}`                  | Update domain configuration               | DomainConfig (JSON)             | Domain (JSON)                    | Yes   |
| DELETE | `/domains/{domainId}`                  | Delete domain                             | Path parameter: domain ID       | Success message                  | Yes   |
| POST   | `/domains/discover`                    | Discover external domains                 | DiscoveryConfig (JSON)          | DiscoveredDomain[] (JSON)        | Yes   |
| GET    | `/mappings`                            | List domain mappings                      | Query parameters                | DomainMapping[] (JSON)           | Yes   |
| POST   | `/mappings`                            | Create domain mapping                     | MappingConfig (JSON)            | DomainMapping (JSON)             | Yes   |
| GET    | `/mappings/{mappingId}`                | Get mapping details                       | Path parameter: mapping ID      | DomainMapping (JSON)             | Yes   |
| PUT    | `/mappings/{mappingId}`                | Update domain mapping                     | MappingConfig (JSON)            | DomainMapping (JSON)             | Yes   |
| DELETE | `/mappings/{mappingId}`                | Delete domain mapping                     | Path parameter: mapping ID      | Success message                  | Yes   |
| POST   | `/mappings/{mappingId}/execute`        | Execute domain mapping                    | MappingExecutionRequest (JSON)  | MappingResult (JSON)             | Yes   |
| POST   | `/mappings/{mappingId}/validate`       | Validate domain mapping                   | Path parameter: mapping ID      | ValidationResult (JSON)          | Yes   |
| GET    | `/mappings/suggest`                    | Suggest domain mappings                   | Query parameters                | MappingSuggestion[] (JSON)       | Yes   |
| **Visual Data Management** |
| GET    | `/visualizations/lineage/{projectId}` | Get data lineage visualization            | Path parameter: project ID      | ReactFlowDiagram (JSON)          | Yes   |
| PUT    | `/visualizations/lineage/{projectId}` | Update lineage visualization              | ReactFlowDiagram (JSON)         | Success message                  | Yes   |
| GET    | `/visualizations/mapping/{mappingId}` | Get mapping canvas visualization          | Path parameter: mapping ID      | ReactFlowDiagram (JSON)          | Yes   |
| PUT    | `/visualizations/mapping/{mappingId}` | Update mapping canvas                     | ReactFlowDiagram (JSON)         | Success message                  | Yes   |
| GET    | `/visualizations/topology/{projectId}`| Get data source topology                  | Path parameter: project ID      | ReactFlowDiagram (JSON)          | Yes   |
| PUT    | `/visualizations/topology/{projectId}`| Update topology visualization             | ReactFlowDiagram (JSON)         | Success message                  | Yes   |
| POST   | `/visualizations/export`               | Export visualization                      | ExportRequest (JSON)            | Yes   |
| **Enhanced Ontology Integration** |
| POST   | `/ontology/link`                       | Link domain to ontology                   | OntologyLinkRequest (JSON)      | OntologyLink (JSON)              | Yes   |
| POST   | `/ontology/validate`                   | Validate domain against ontology          | OntologyValidationRequest       | OntologyValidationResult (JSON)  | Yes   |
| POST   | `/ontology/generate`                   | Generate ontology from domain             | OntologyGenerationRequest       | GeneratedOntology (JSON)         | Yes   |
| POST   | `/ontology/sync`                       | Sync with ontology workspace              | OntologySyncRequest (JSON)      | SyncResult (JSON)                | Yes   |
| GET    | `/ontology/patterns`                   | Discover data patterns using ontology     | Query parameters                | DiscoveredPattern[] (JSON)       | Yes   |
| **DAS Enhanced Operations** |
| GET    | `/das/opportunities/external`          | Get DAS discovered external data          | Query parameters                | DiscoveredDataOpportunity[]      | Yes   |
| GET    | `/das/opportunities/synthetic`         | Get synthetic truth opportunities         | Query parameters                | SyntheticTruthOpportunity[]      | Yes   |
| POST   | `/das/synthetic/create`                | Create DAS synthetic dataset              | SyntheticDatasetRequest (JSON)  | SyntheticDataSet (JSON)          | Yes   |
| GET    | `/das/patterns/emergent`               | Get DAS discovered emergent patterns      | Query parameters                | EmergentPattern[] (JSON)         | Yes   |
| GET    | `/das/recommendations/data`            | Get DAS data recommendations              | Query parameters                | DataRecommendation[] (JSON)      | Yes   |
| **Data Versioning** |
| POST   | `/data/{recordId}/versions`            | Create new data record version            | VersionMetadata (JSON)          | DataRecordVersion (JSON)         | Yes   |
| GET    | `/data/{recordId}/versions`            | Get data record version history           | Query parameters                | DataRecordVersion[] (JSON)       | Yes   |
| GET    | `/data/{recordId}/versions/{versionId}`| Get specific data record version          | Path parameters                 | VersionedDataRecord (JSON)       | Yes   |
| POST   | `/data/{recordId}/versions/compare`    | Compare data record versions              | VersionComparisonRequest (JSON) | VersionComparison (JSON)         | Yes   |
| POST   | `/data/{recordId}/versions/rollback`   | Rollback to previous version              | RollbackRequest (JSON)          | RollbackResult (JSON)            | Yes   |
| **Dataset Versioning** |
| POST   | `/datasets/{datasetId}/versions`       | Create new dataset version                | DatasetVersionMetadata (JSON)   | DatasetVersion (JSON)            | Yes   |
| GET    | `/datasets/{datasetId}/versions`       | Get dataset version history               | Query parameters                | DatasetVersion[] (JSON)          | Yes   |
| POST   | `/datasets/{datasetId}/versions/compare` | Compare dataset versions               | DatasetComparisonRequest (JSON) | DatasetVersionComparison (JSON)  | Yes   |
| POST   | `/datasets/{datasetId}/versions/promote` | Promote dataset version               | PromotionRequest (JSON)         | PromotionResult (JSON)           | Yes   |
| **Synthetic Data Versioning** |
| POST   | `/synthetic/{syntheticId}/regenerate`  | Regenerate synthetic dataset              | RegenerationRequest (JSON)      | SyntheticRegenerationResult      | Yes   |
| GET    | `/synthetic/{syntheticId}/versions`    | Get synthetic dataset versions            | Query parameters                | SyntheticVersionInfo[] (JSON)    | Yes   |
| GET    | `/synthetic/{syntheticId}/dependencies`| Get synthetic data dependencies           | Path parameter: synthetic ID    | DependencyGraph (JSON)           | Yes   |
| **Mapping Versioning** |
| POST   | `/mappings/{mappingId}/versions`       | Create new mapping version                | MappingVersionRequest (JSON)    | MappingVersionInfo (JSON)        | Yes   |
| GET    | `/mappings/{mappingId}/versions`       | Get mapping version history               | Query parameters                | MappingVersionInfo[] (JSON)      | Yes   |
| POST   | `/mappings/{mappingId}/migrate`        | Migrate mapping usage                     | MigrationRequest (JSON)         | MigrationResult (JSON)           | Yes   |
| POST   | `/mappings/{mappingId}/impact`         | Analyze mapping change impact             | ImpactAnalysisRequest (JSON)    | MappingImpactAnalysis (JSON)     | Yes   |
| **Version Management** |
| POST   | `/versions/branches`                   | Create version branch                     | BranchRequest (JSON)            | VersionBranch (JSON)             | Yes   |
| POST   | `/versions/branches/{branchId}/merge`  | Merge version branch                      | MergeRequest (JSON)             | MergeResult (JSON)               | Yes   |
| POST   | `/versions/impact/analyze`             | Analyze cross-version impact              | ImpactAnalysisRequest (JSON)    | ImpactAnalysis (JSON)            | Yes   |
| GET    | `/versions/dependencies/{artifactId}` | Get version dependencies                  | Path parameter: artifact ID     | VersionDependency[] (JSON)       | Yes   |
| **DAS Version Intelligence** |
| GET    | `/das/versioning/recommend`            | Get DAS versioning recommendations        | Query parameters                | VersioningRecommendation (JSON)  | Yes   |
| POST   | `/das/versioning/detect-changes`       | Detect semantic changes with DAS         | ChangeDetectionRequest (JSON)   | SemanticChangeAnalysis (JSON)    | Yes   |
| POST   | `/das/versioning/rollback-recommend`   | Get DAS rollback recommendations          | RollbackAnalysisRequest (JSON)  | RollbackRecommendation (JSON)    | Yes   |
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

### Domain Integration Data Models

#### Domain Structure
```typescript
interface Domain {
    id: string;                     // Unique domain identifier
    name: string;                   // Domain name
    description: string;            // Domain description
    domain_type: DomainType;        // Domain classification
    primary_ontology_id: string;    // Primary ontology reference
    secondary_ontologies: string[]; // Additional ontologies
    domain_schema: DomainSchema;    // Schema structure
    vocabulary: DomainVocabulary;   // Domain vocabulary
    semantic_context: SemanticContext; // Semantic information
    data_patterns: DataPattern[];   // Recognized patterns
    integration_constraints: IntegrationConstraint[]; // Integration rules
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
```

#### Domain Mapping Structure
```typescript
interface DomainMapping {
    id: string;                     // Unique mapping identifier
    name: string;                   // Mapping name
    description: string;            // Mapping description
    source_domain: Domain;          // Source domain
    target_domain: Domain;          // Target domain
    ontology_bridge: OntologyBridge; // Semantic bridge
    mapping_rules: MappingRule[];   // Transformation rules
    transformation_pipeline: TransformationPipeline; // Processing pipeline
    validation_rules: ValidationRule[]; // Validation rules
    confidence_score: number;       // Mapping confidence (0-1)
    status: MappingStatus;          // Current status
    created_by: string;             // Creator
    approved_by?: string;           // Approver
    created_at: Date;
    updated_at: Date;
}

interface OntologyBridge {
    primary_ontology_id: string;
    source_concept_mappings: ConceptMapping[];
    target_concept_mappings: ConceptMapping[];
    semantic_alignment: SemanticAlignment;
    bridge_relationships: BridgeRelationship[];
    reasoning_path: ReasoningPath[];
}

interface MappingRule {
    rule_id: string;
    rule_type: MappingRuleType;
    source_path: string;
    target_path: string;
    transformation: Transformation;
    conditions: MappingCondition[];
    ontology_justification: OntologyJustification;
    confidence: number;
    priority: number;
}

enum MappingRuleType {
    DIRECT_MAPPING = "direct_mapping",
    TRANSFORMATION_MAPPING = "transformation_mapping",
    AGGREGATION_MAPPING = "aggregation_mapping",
    CONDITIONAL_MAPPING = "conditional_mapping",
    LOOKUP_MAPPING = "lookup_mapping",
    DERIVED_MAPPING = "derived_mapping",
    UNIT_CONVERSION_MAPPING = "unit_conversion_mapping"
}
```

#### Visualization Data Models
```typescript
interface ReactFlowDiagram {
    diagram_id: string;
    diagram_type: DiagramType;
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
    viewport: Viewport;
    metadata: DiagramMetadata;
    created_at: Date;
    updated_at: Date;
}

enum DiagramType {
    DATA_LINEAGE = "data_lineage",
    DOMAIN_MAPPING = "domain_mapping",
    SOURCE_TOPOLOGY = "source_topology",
    TRANSFORMATION_PIPELINE = "transformation_pipeline",
    SCHEMA_RELATIONSHIPS = "schema_relationships"
}

interface ReactFlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    style?: Record<string, any>;
    className?: string;
}

interface ReactFlowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: Record<string, any>;
    style?: Record<string, any>;
    className?: string;
}
```

#### DAS Enhanced Data Models
```typescript
interface DiscoveredDataOpportunity {
    opportunity_id: string;
    discovered_source: ExternalDataSource;
    relevance_to_project: RelevanceAssessment;
    potential_value: ValueAssessment;
    integration_complexity: ComplexityAssessment;
    das_confidence: number;
    discovery_reasoning: DASReasoning;
    suggested_actions: SuggestedAction[];
    discovered_at: Date;
}

interface SyntheticTruthOpportunity {
    opportunity_id: string;
    candidate_datasets: DataSet[];
    fusion_strategy: FusionStrategy;
    expected_benefits: ExpectedBenefit[];
    complexity_assessment: ComplexityAssessment;
    das_confidence: number;
    identified_at: Date;
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
    created_at: Date;
    updated_at: Date;
}

interface DASReasoning {
    discovery_triggers: string[];           // What led DAS to find this
    context_analysis: ContextAnalysis;      // How DAS analyzed the context
    pattern_matching: PatternMatch[];       // Patterns DAS recognized
    predictive_insights: PredictiveInsight[]; // What DAS predicts about value
}
```

#### Data Versioning Models
```typescript
interface DataRecordVersion {
    version_id: string;                 // Unique version identifier
    version_number: string;             // Semantic version (e.g., "1.2.3")
    version_type: VersionType;          // Major, minor, patch, snapshot
    record_id: string;                  // Parent record ID
    created_at: Date;
    created_by: string;
    change_summary: string;
    change_reason: string;
    parent_version_id?: string;
    is_current: boolean;
    is_published: boolean;
    content_hash: string;
    tags: VersionTag[];
}

enum VersionType {
    MAJOR = "major",                    // Breaking changes
    MINOR = "minor",                    // New features, backward compatible
    PATCH = "patch",                    // Bug fixes, corrections
    SNAPSHOT = "snapshot",              // Work in progress
    BRANCH = "branch",                  // Experimental branch
    MERGE = "merge"                     // Merged from branch
}

interface DatasetVersion {
    version_id: string;
    version_number: string;
    dataset_id: string;
    record_count: number;
    record_versions: RecordVersionReference[];
    schema_version: string;
    created_at: Date;
    created_by: string;
    change_summary: string;
    compatibility: CompatibilityInfo;
    data_signature: DatasetSignature;
}

interface SyntheticVersionInfo {
    synthetic_version_id: string;
    version_number: string;
    generation_timestamp: Date;
    fusion_algorithm_version: string;
    source_data_fingerprint: string;   // Hash of all source data versions
    quality_metrics: SyntheticQualityMetrics;
    validation_results: SyntheticValidationResults;
    regeneration_triggers: RegenerationTrigger[];
}

interface MappingVersionInfo {
    mapping_version_id: string;
    version_number: string;
    mapping_id: string;
    source_domain_version: string;
    target_domain_version: string;
    ontology_version: string;
    backward_compatible: boolean;
    breaking_changes: BreakingChange[];
    migration_required: boolean;
    deprecation_info?: DeprecationInfo;
}

interface VersionComparison {
    from_version: string;
    to_version: string;
    changes: ChangeDetail[];
    change_summary: ChangeSummary;
    impact_assessment: ImpactAssessment;
    migration_recommendations: string[];
}

interface ChangeDetail {
    change_type: ChangeType;
    field_path: string;
    old_value: any;
    new_value: any;
    impact_level: ImpactLevel;
    description: string;
}

enum ChangeType {
    ADDED = "added",
    MODIFIED = "modified",
    DELETED = "deleted",
    MOVED = "moved",
    RENAMED = "renamed",
    TYPE_CHANGED = "type_changed"
}

enum ImpactLevel {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    BREAKING = "breaking"
}

interface VersioningRecommendation {
    recommended_strategy: DatasetVersioningType;
    reasoning: string[];
    expected_benefits: string[];
    estimated_storage_impact: StorageImpact;
    implementation_complexity: ComplexityAssessment;
    das_confidence: number;
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

### 14. Domain Integration Endpoints

#### POST `/domains`
**Description**: Register a new domain for semantic integration

**Request Body**:
```json
{
    "name": "Aerospace Engineering Domain",
    "description": "Domain for aerospace engineering data and processes",
    "domain_type": "aerospace",
    "primary_ontology_id": "aerospace-ontology-v1",
    "secondary_ontologies": ["units-ontology", "materials-ontology"],
    "domain_schema": {
        "entities": [
            {
                "name": "aircraft",
                "properties": ["registration", "model", "manufacturer"]
            }
        ]
    },
    "vocabulary": {
        "preferred_terms": {
            "altitude": "flight_level",
            "speed": "airspeed"
        }
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "domain-aerospace-uuid",
        "name": "Aerospace Engineering Domain",
        "domain_type": "aerospace",
        "primary_ontology_id": "aerospace-ontology-v1",
        "created_at": "2025-01-15T14:35:12Z",
        "updated_at": "2025-01-15T14:35:12Z"
    }
}
```

#### POST `/mappings`
**Description**: Create a semantic mapping between two domains

**Request Body**:
```json
{
    "name": "Aerospace to Manufacturing Mapping",
    "description": "Semantic mapping for aerospace manufacturing data",
    "source_domain_id": "domain-aerospace-uuid",
    "target_domain_id": "domain-manufacturing-uuid",
    "ontology_bridge": {
        "primary_ontology_id": "industrial-bridge-ontology",
        "source_concept_mappings": [
            {
                "domain_concept": "aircraft_part",
                "ontology_concept_uri": "http://ontology.example.com/manufactured_component",
                "mapping_type": "close_match",
                "confidence": 0.92
            }
        ]
    },
    "mapping_rules": [
        {
            "rule_type": "direct_mapping",
            "source_path": "part.material",
            "target_path": "component.material_specification",
            "confidence": 0.95
        }
    ]
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "mapping-aero-mfg-uuid",
        "name": "Aerospace to Manufacturing Mapping",
        "source_domain": { /* domain details */ },
        "target_domain": { /* domain details */ },
        "confidence_score": 0.89,
        "status": "draft",
        "created_at": "2025-01-15T14:35:12Z"
    }
}
```

#### POST `/mappings/{mappingId}/execute`
**Description**: Execute a domain mapping on actual data

**Request Body**:
```json
{
    "source_data": {
        "aircraft_parts": [
            {
                "part_number": "AP-12345",
                "material": "aluminum_alloy_6061",
                "weight_lbs": 15.5,
                "dimensions": {
                    "length_in": 12.0,
                    "width_in": 8.0
                }
            }
        ]
    },
    "execution_options": {
        "validate_mapping": true,
        "preserve_original": true,
        "apply_unit_conversions": true
    }
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "mapping_execution_id": "exec-uuid",
        "mapped_data": {
            "manufactured_components": [
                {
                    "component_id": "AP-12345",
                    "material_specification": "aluminum_alloy_6061",
                    "mass_kg": 7.03,
                    "dimensions_mm": {
                        "length": 304.8,
                        "width": 203.2
                    }
                }
            ]
        },
        "mapping_statistics": {
            "fields_mapped": 5,
            "unit_conversions_applied": 3,
            "validation_passed": true,
            "confidence_score": 0.94
        },
        "execution_time_ms": 245
    }
}
```

### 15. Visual Data Management Endpoints

#### GET `/visualizations/lineage/{projectId}`
**Description**: Get data lineage visualization for a project

**Response**:
```json
{
    "success": true,
    "data": {
        "diagram_id": "lineage-proj-uuid",
        "diagram_type": "data_lineage",
        "nodes": [
            {
                "id": "source-customer-db",
                "type": "dataSource",
                "position": { "x": 100, "y": 100 },
                "data": {
                    "label": "Customer Database",
                    "sourceType": "database",
                    "recordCount": 150000,
                    "healthStatus": "healthy"
                }
            },
            {
                "id": "transform-cleansing",
                "type": "transformation",
                "position": { "x": 300, "y": 100 },
                "data": {
                    "label": "Data Cleansing",
                    "transformationType": "filter",
                    "rulesApplied": 12
                }
            }
        ],
        "edges": [
            {
                "id": "edge-source-transform",
                "source": "source-customer-db",
                "target": "transform-cleansing",
                "type": "dataFlow",
                "data": {
                    "recordsProcessed": 148500,
                    "lastUpdate": "2025-01-15T14:30:00Z"
                }
            }
        ],
        "viewport": {
            "x": 0,
            "y": 0,
            "zoom": 1.0
        }
    }
}
```

#### GET `/visualizations/mapping/{mappingId}`
**Description**: Get domain mapping canvas visualization

**Response**:
```json
{
    "success": true,
    "data": {
        "diagram_id": "mapping-canvas-uuid",
        "diagram_type": "domain_mapping",
        "nodes": [
            {
                "id": "source-field-altitude",
                "type": "domainField",
                "position": { "x": 50, "y": 100 },
                "data": {
                    "fieldName": "altitude_ft",
                    "fieldType": "number",
                    "unit": "foot",
                    "domain": "aerospace"
                }
            },
            {
                "id": "ontology-concept-height",
                "type": "ontologyConcept",
                "position": { "x": 250, "y": 100 },
                "data": {
                    "conceptUri": "http://ontology.example.com/physical/height",
                    "conceptLabel": "Height Above Reference",
                    "dimension": "length"
                }
            },
            {
                "id": "target-field-elevation",
                "type": "domainField",
                "position": { "x": 450, "y": 100 },
                "data": {
                    "fieldName": "elevation_m",
                    "fieldType": "number",
                    "unit": "meter",
                    "domain": "manufacturing"
                }
            }
        ],
        "edges": [
            {
                "id": "mapping-altitude-height",
                "source": "source-field-altitude",
                "target": "ontology-concept-height",
                "type": "ontologyAlignment",
                "data": {
                    "confidence": 0.95,
                    "mappingType": "semantic_match"
                }
            },
            {
                "id": "mapping-height-elevation",
                "source": "ontology-concept-height",
                "target": "target-field-elevation",
                "type": "ontologyAlignment",
                "data": {
                    "confidence": 0.88,
                    "unitConversion": "foot_to_meter"
                }
            }
        ]
    }
}
```

### 16. Enhanced Ontology Integration Endpoints

#### POST `/ontology/link`
**Description**: Link a domain to an ontology workspace

**Request Body**:
```json
{
    "domain_id": "domain-aerospace-uuid",
    "ontology_workspace_id": "workspace-aero-ont-uuid",
    "ontology_id": "aerospace-ontology-v2",
    "link_type": "primary",
    "auto_sync": true,
    "sync_frequency": "daily"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "link_id": "ont-link-uuid",
        "domain_id": "domain-aerospace-uuid",
        "ontology_workspace_id": "workspace-aero-ont-uuid",
        "ontology_id": "aerospace-ontology-v2",
        "link_status": "active",
        "last_sync": "2025-01-15T14:35:12Z",
        "next_sync": "2025-01-16T14:35:12Z",
        "created_at": "2025-01-15T14:35:12Z"
    }
}
```

### 17. DAS Enhanced Operations Endpoints

#### GET `/das/opportunities/external`
**Description**: Get external data opportunities discovered by DAS

**Query Parameters**:
- `project_id`: Filter by project
- `domain`: Filter by domain
- `confidence_min`: Minimum DAS confidence score
- `limit`: Maximum results to return

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "opportunity_id": "das-opp-ext-001",
            "discovered_source": {
                "name": "FAA Aircraft Registry",
                "type": "rest_api",
                "url": "https://registry.faa.gov/api/v2",
                "description": "Official FAA aircraft registration database"
            },
            "relevance_to_project": {
                "score": 0.92,
                "reasoning": "Project involves aircraft tracking and this provides official registration data",
                "matching_entities": ["aircraft", "registration", "ownership"]
            },
            "potential_value": {
                "score": 0.87,
                "estimated_records": 380000,
                "data_freshness": "real_time",
                "coverage": "comprehensive"
            },
            "integration_complexity": {
                "score": 0.34,
                "estimated_effort_hours": 16,
                "technical_challenges": ["rate_limiting", "api_key_required"]
            },
            "das_confidence": 0.91,
            "discovery_reasoning": {
                "discovery_triggers": ["project_context_analysis", "entity_matching"],
                "pattern_matching": [
                    {
                        "pattern": "aircraft_data_needs",
                        "confidence": 0.88
                    }
                ]
            },
            "suggested_actions": [
                {
                    "action": "request_api_access",
                    "priority": "high",
                    "description": "Apply for FAA API access credentials"
                },
                {
                    "action": "create_integration_mapping",
                    "priority": "medium",
                    "description": "Map FAA schema to project data model"
                }
            ],
            "discovered_at": "2025-01-15T14:35:12Z"
        }
    ]
}
```

#### GET `/das/opportunities/synthetic`
**Description**: Get synthetic truth creation opportunities identified by DAS

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "opportunity_id": "das-synth-001",
            "candidate_datasets": [
                {
                    "dataset_id": "aircraft-telemetry-2024",
                    "name": "Aircraft Telemetry Data 2024",
                    "record_count": 2400000,
                    "overlap_score": 0.78
                },
                {
                    "dataset_id": "maintenance-records-2024", 
                    "name": "Aircraft Maintenance Records 2024",
                    "record_count": 45000,
                    "overlap_score": 0.85
                }
            ],
            "fusion_strategy": {
                "method": "temporal_correlation",
                "key_fields": ["aircraft_id", "timestamp"],
                "confidence": 0.89,
                "expected_completeness": 0.92
            },
            "expected_benefits": [
                {
                    "benefit_type": "data_completeness",
                    "improvement": 0.34,
                    "description": "Fill gaps in telemetry with maintenance context"
                },
                {
                    "benefit_type": "analytical_depth",
                    "improvement": 0.67,
                    "description": "Enable predictive maintenance analysis"
                }
            ],
            "das_confidence": 0.86,
            "identified_at": "2025-01-15T14:35:12Z"
        }
    ]
}
```

---

The DataManager Service provides a robust, scalable foundation for all data operations within DADMS, enabling intelligent data integration, processing, and real-time event-driven workflows while maintaining the highest standards of security, reliability, and performance.

## **Key Enhancements Summary**:

### **1. Enhanced Ontology Integration**
- Deep integration with Ontology Workspace Service (Port 3016)
- Real-time ontology synchronization and validation
- Ontology-driven data modeling and semantic discovery

### **2. ReactFlow Visual Data Management**
- Interactive data lineage visualization
- Visual domain mapping canvas
- Data source topology diagrams
- Transformation pipeline designer

### **3. Domain Integration Data Mapper**
- Semantic mapping between different domains using ontologies as bridges
- Intelligent field mapping with confidence scoring
- Visual mapping rule designer
- Automated transformation suggestion

### **4. DAS Pervasive Intelligence**
- Ambient data discovery and external source identification
- Intelligent synthetic truth creation opportunities
- Continuous change monitoring and adaptation
- Emergent pattern recognition and recommendations

### **5. Comprehensive Data Versioning**
- **Immutable Record History**: Complete audit trail of all data changes
- **Semantic Version Management**: Intelligent versioning based on change impact
- **Branching & Merging**: Git-like operations for data collaboration
- **Dependency Tracking**: Understand impact across related datasets
- **Automated Regeneration**: Smart synthetic data updates when sources change

### **6. DAS Version Intelligence**
- **Predictive Versioning Strategy**: DAS recommends optimal versioning approaches
- **Semantic Change Detection**: Understands business meaning of changes
- **Intelligent Rollback**: Smart recommendations for issue resolution
- **Storage Optimization**: Automatic storage strategy optimization
- **Impact Prediction**: Anticipate downstream effects of changes

These enhancements transform the DataManager into a sophisticated semantic integration platform that understands the meaning of data across different domains, provides intelligent assistance throughout the entire data lifecycle, and maintains comprehensive versioning and change management capabilities that ensure data integrity and traceability at enterprise scale.
