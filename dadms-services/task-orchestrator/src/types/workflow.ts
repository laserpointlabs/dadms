/**
 * DADMS Task Orchestrator - Core Types
 * Blue Force COP Demonstration Workflow Management
 */

export type WorkflowStatus = 'PENDING' | 'INITIALIZING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
export type PersonaType = 'STANDARDS_ANALYST' | 'DATA_PIPELINE_ENGINEER' | 'DATA_MODELER' | 'UIUX_PROTOTYPER';
export type PersonaStatus = 'IDLE' | 'WORKING' | 'WAITING' | 'COMPLETED' | 'ERROR';
export type TaskType = 'DOCUMENT_ANALYSIS' | 'SCHEMA_EXTRACTION' | 'CODE_GENERATION' | 'VISUALIZATION_CREATION' | 'INTEGRATION_TESTING';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Core workflow definition for COP demonstration
 */
export interface Workflow {
  id: string;
  name: string;
  type: 'COP_DEMO';
  description: string;
  status: WorkflowStatus;
  progress: WorkflowProgress;
  personas: PersonaInstance[];
  tasks: Task[];
  artifacts: GeneratedArtifact[];
  config: WorkflowConfig;
  metadata: WorkflowMetadata;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

/**
 * Progress tracking for workflow execution
 */
export interface WorkflowProgress {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  current_phase: WorkflowPhase;
  estimated_completion?: Date;
  performance_metrics: PerformanceMetrics;
}

/**
 * Workflow execution phases for COP demo
 */
export type WorkflowPhase = 
  | 'INITIALIZATION'
  | 'STANDARDS_ANALYSIS' 
  | 'PIPELINE_DEVELOPMENT'
  | 'VISUALIZATION_DEVELOPMENT'
  | 'INTEGRATION_TESTING'
  | 'PM_REVIEW'
  | 'ITERATION'
  | 'COMPLETION';

/**
 * AI Persona instance within a workflow
 */
export interface PersonaInstance {
  id: string;
  workflow_id: string;
  persona_type: PersonaType;
  name: string;
  description: string;
  status: PersonaStatus;
  current_task_id?: string;
  completed_tasks: string[];
  context: PersonaContext;
  capabilities: PersonaCapability[];
  communication_log: PersonaMessage[];
  performance_metrics: PersonaMetrics;
  created_at: Date;
  updated_at: Date;
}

/**
 * Context and state for persona execution
 */
export interface PersonaContext {
  domain_knowledge: string[];
  current_focus: string;
  available_tools: string[];
  working_memory: Record<string, any>;
  collaboration_state: CollaborationState;
  execution_history: ExecutionHistoryEntry[];
}

/**
 * Persona capability definition
 */
export interface PersonaCapability {
  name: string;
  description: string;
  input_types: string[];
  output_types: string[];
  estimated_duration: number; // minutes
  dependencies: string[];
}

/**
 * Task definition and tracking
 */
export interface Task {
  id: string;
  workflow_id: string;
  assigned_persona_id?: string;
  type: TaskType;
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  input_data: TaskInput;
  output_data?: TaskOutput;
  dependencies: string[];
  estimated_duration: number;
  actual_duration?: number;
  error_message?: string;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

/**
 * Task input and output data structures
 */
export interface TaskInput {
  documents?: DocumentReference[];
  schemas?: SchemaDefinition[];
  requirements?: Requirement[];
  context?: Record<string, any>;
}

export interface TaskOutput {
  artifacts: GeneratedArtifact[];
  data: Record<string, any>;
  recommendations: string[];
  next_tasks: Partial<Task>[];
}

/**
 * Generated artifacts from persona work
 */
export interface GeneratedArtifact {
  id: string;
  workflow_id: string;
  persona_id: string;
  task_id: string;
  type: ArtifactType;
  name: string;
  description: string;
  content: ArtifactContent;
  metadata: ArtifactMetadata;
  quality_score?: number;
  validation_results?: ValidationResult[];
  created_at: Date;
}

export type ArtifactType = 
  | 'SCHEMA_DEFINITION'
  | 'PARSER_CODE'
  | 'VALIDATION_RULES'
  | 'PIPELINE_CONFIG'
  | 'VISUALIZATION_COMPONENT'
  | 'TECHNICAL_DOCUMENTATION'
  | 'TEST_SUITE'
  | 'COMPLIANCE_REPORT';

export interface ArtifactContent {
  format: 'JSON' | 'TYPESCRIPT' | 'JAVASCRIPT' | 'XML' | 'YAML' | 'MARKDOWN' | 'HTML';
  data: string | object;
  dependencies?: string[];
  entry_point?: string;
}

/**
 * Inter-persona communication
 */
export interface PersonaMessage {
  id: string;
  from_persona_id: string;
  to_persona_id?: string; // undefined for broadcast
  message_type: MessageType;
  content: MessageContent;
  timestamp: Date;
  acknowledged?: boolean;
}

export type MessageType = 
  | 'TASK_ASSIGNMENT'
  | 'PROGRESS_UPDATE'
  | 'REQUEST_ASSISTANCE'
  | 'SHARE_ARTIFACT'
  | 'COORDINATION_REQUEST'
  | 'STATUS_REPORT'
  | 'ERROR_NOTIFICATION';

export interface MessageContent {
  subject: string;
  body: string;
  attachments?: AttachmentReference[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

/**
 * Collaboration and coordination state
 */
export interface CollaborationState {
  active_collaborations: string[];
  pending_requests: CollaborationRequest[];
  shared_context: Record<string, any>;
  coordination_rules: CoordinationRule[];
}

export interface CollaborationRequest {
  id: string;
  requestor_id: string;
  target_persona_id: string;
  request_type: 'ASSISTANCE' | 'ARTIFACT_SHARE' | 'CONTEXT_SYNC' | 'TASK_HANDOFF';
  details: Record<string, any>;
  created_at: Date;
  response?: CollaborationResponse;
}

/**
 * Performance metrics and monitoring
 */
export interface PerformanceMetrics {
  total_execution_time: number; // minutes
  average_task_completion_time: number;
  error_rate: number;
  quality_scores: number[];
  resource_utilization: ResourceUtilization;
}

export interface PersonaMetrics {
  tasks_completed: number;
  average_completion_time: number;
  quality_score: number;
  collaboration_effectiveness: number;
  error_count: number;
  uptime_percentage: number;
}

export interface ResourceUtilization {
  cpu_usage_avg: number;
  memory_usage_avg: number;
  api_calls_count: number;
  storage_usage: number;
}

/**
 * Configuration and setup
 */
export interface WorkflowConfig {
  max_concurrent_personas: number;
  max_execution_time: number; // minutes
  quality_threshold: number;
  auto_retry_failed_tasks: boolean;
  enable_inter_persona_communication: boolean;
  pm_oversight_level: 'MINIMAL' | 'STANDARD' | 'DETAILED';
  notification_preferences: NotificationPreferences;
}

export interface WorkflowMetadata {
  created_by: string;
  project_id?: string;
  scenario_type: 'DEMO' | 'PRODUCTION' | 'TESTING';
  target_audience: string[];
  success_criteria: SuccessCriterion[];
  tags: string[];
}

/**
 * Success criteria and validation
 */
export interface SuccessCriterion {
  name: string;
  description: string;
  metric_name: string;
  target_value: number;
  operator: 'LESS_THAN' | 'GREATER_THAN' | 'EQUALS' | 'BETWEEN';
  actual_value?: number;
  achieved?: boolean;
}

export interface ValidationResult {
  validator: string;
  passed: boolean;
  score?: number;
  details: string;
  recommendations?: string[];
}

/**
 * Document and data references
 */
export interface DocumentReference {
  id: string;
  name: string;
  type: 'LINK_16' | 'VMF' | 'TECHNICAL_SPEC' | 'REQUIREMENTS' | 'OTHER';
  url?: string;
  content?: string;
  metadata: Record<string, any>;
}

export interface SchemaDefinition {
  name: string;
  version: string;
  fields: FieldDefinition[];
  constraints: SchemaConstraint[];
  relationships: SchemaRelationship[];
}

export interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  description: string;
  validation_rules: string[];
  example_values?: any[];
}

/**
 * Workflow events and notifications
 */
export interface WorkflowEvent {
  id: string;
  workflow_id: string;
  event_type: WorkflowEventType;
  timestamp: Date;
  source: EventSource;
  data: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export type WorkflowEventType = 
  | 'WORKFLOW_STARTED'
  | 'WORKFLOW_COMPLETED'
  | 'WORKFLOW_FAILED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'PERSONA_STATUS_CHANGED'
  | 'ARTIFACT_GENERATED'
  | 'ERROR_OCCURRED'
  | 'PM_FEEDBACK_RECEIVED';

export interface EventSource {
  type: 'ORCHESTRATOR' | 'PERSONA' | 'EXTERNAL_SERVICE' | 'USER';
  id: string;
  name: string;
}

/**
 * Program Manager interface types
 */
export interface PMFeedback {
  workflow_id: string;
  feedback_type: 'APPROVAL' | 'MODIFICATION_REQUEST' | 'PRIORITY_CHANGE' | 'ADDITIONAL_REQUIREMENTS';
  content: string;
  target_persona_id?: string;
  target_task_id?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: Date;
}

export interface WorkflowModification {
  type: 'ADD_TASK' | 'MODIFY_TASK' | 'CHANGE_PRIORITY' | 'ADD_REQUIREMENT' | 'ADJUST_TIMELINE';
  target_id: string;
  changes: Record<string, any>;
  reason: string;
}

/**
 * Ontology and Semantic Types
 */
export interface OntologyReference {
  id: string;
  name: string;
  version: string;
  domain: string;
  concepts: number;
  relationships: number;
  url?: string;
}

export interface SemanticConcept {
  id: string;
  name: string;
  description: string;
  ontology_id: string;
  super_concepts: string[];
  properties: SemanticProperty[];
  constraints: SemanticConstraint[];
}

export interface SemanticProperty {
  name: string;
  type: 'DATA_PROPERTY' | 'OBJECT_PROPERTY';
  domain: string;
  range: string;
  required: boolean;
  description: string;
}

export interface SemanticConstraint {
  type: 'CARDINALITY' | 'VALUE_RESTRICTION' | 'DOMAIN_RANGE' | 'DISJOINT';
  expression: string;
  description: string;
}

export interface ConceptMapping {
  source_concept_id: string;
  target_concept_id: string;
  mapping_type: 'EQUIVALENT' | 'BROADER' | 'NARROWER' | 'RELATED';
  confidence: number;
  justification: string;
}

export interface SemanticAlignment {
  id: string;
  source_ontology_id: string;
  target_ontology_id: string;
  mappings: ConceptMapping[];
  conflicts: SemanticConflict[];
  alignment_quality: number;
  created_at: Date;
}

export interface SemanticConflict {
  type: 'CONCEPT_OVERLAP' | 'PROPERTY_MISMATCH' | 'CONSTRAINT_VIOLATION' | 'INCONSISTENT_HIERARCHY';
  source_element: string;
  target_element: string;
  description: string;
  resolution_strategy: string;
  resolved: boolean;
}

export interface UnifiedOntology {
  id: string;
  name: string;
  base_ontology_id: string;
  integrated_ontologies: string[];
  concepts: SemanticConcept[];
  unified_mappings: ConceptMapping[];
  validation_results: OntologyValidationResult[];
  created_at: Date;
}

export interface OntologyValidationResult {
  validator: string;
  validation_type: 'CONSISTENCY' | 'COMPLETENESS' | 'COHERENCE' | 'EXPRESSIVENESS';
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  category: string;
  element: string;
  description: string;
  suggested_fix?: string;
}

/**
 * Supporting interfaces
 */
export interface AttachmentReference {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Requirement {
  id: string;
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'COMPLIANCE' | 'PERFORMANCE';
  description: string;
  priority: TaskPriority;
  acceptance_criteria: string[];
}

export interface SchemaConstraint {
  type: 'UNIQUE' | 'FOREIGN_KEY' | 'CHECK' | 'NOT_NULL';
  fields: string[];
  expression?: string;
}

export interface SchemaRelationship {
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  source_field: string;
  target_schema: string;
  target_field: string;
}

export interface CoordinationRule {
  name: string;
  condition: string;
  action: string;
  priority: number;
}

export interface CollaborationResponse {
  accepted: boolean;
  message?: string;
  proposed_alternative?: any;
  timestamp: Date;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  webhook_url?: string;
  notification_levels: string[];
  frequency: 'IMMEDIATE' | 'BATCHED' | 'DAILY_SUMMARY';
}

export interface ExecutionHistoryEntry {
  timestamp: Date;
  action: string;
  input: any;
  output: any;
  duration: number;
  success: boolean;
}

export interface ArtifactMetadata {
  file_size?: number;
  language?: string;
  framework?: string;
  dependencies?: string[];
  testing_status?: 'UNTESTED' | 'PASSING' | 'FAILING';
  documentation_level?: 'NONE' | 'BASIC' | 'COMPREHENSIVE';
}

/**
 * Stretch Goal: Probabilistic Extraction Types
 */
export interface QuestionTemplate {
  category: 'structural' | 'semantic' | 'constraint';
  domain: 'LINK_16' | 'VMF' | 'DEFENSE_GENERAL';
  questions: DomainQuestion[];
}

export interface DomainQuestion {
  id: string;
  text: string;
  category: string;
  focus_area: string;
  expected_concepts: string[];
  priority: number;
}

export interface QuestionSet {
  standard_type: 'LINK_16' | 'VMF';
  questions: DomainQuestion[];
  total_questions: number;
  coverage_areas: string[];
}

export interface QuestionFocus {
  iteration: number;
  selected_questions: DomainQuestion[];
  focus_strategy: 'broad' | 'targeted' | 'refinement';
  weight_distribution: Record<string, number>;
}

export interface ExtractionStrategy {
  approach: 'conservative' | 'aggressive' | 'balanced';
  confidence_threshold: number;
  relationship_depth: number;
  context_window: number;
  iteration_focus: string[];
}

export interface ExtractionResult {
  iteration: number;
  extraction_id: string;
  concepts: ExtractedConcept[];
  relationships: ExtractedRelationship[];
  confidence_metrics: ConfidenceMetrics;
  question_coverage: QuestionCoverage[];
  execution_time: number;
  strategy_used: ExtractionStrategy;
}

export interface ExtractedConcept {
  name: string;
  description: string;
  category: string;
  confidence: number;
  supporting_evidence: string[];
  extraction_context: string;
  question_source: string[];
}

export interface ExtractedRelationship {
  source_concept: string;
  target_concept: string;
  relationship_type: string;
  confidence: number;
  supporting_evidence: string[];
  extraction_context: string;
}

export interface ConfidenceMetrics {
  average_concept_confidence: number;
  average_relationship_confidence: number;
  extraction_completeness: number;
  evidence_strength: number;
  consistency_score: number;
}

export interface QuestionCoverage {
  question_id: string;
  question_text: string;
  coverage_score: number;
  extracted_concepts: string[];
  confidence: number;
}

export interface ConvergenceCriteria {
  max_iterations: number;
  min_iterations: number;
  concept_stability_threshold: number;
  relationship_stability_threshold: number;
  confidence_improvement_threshold: number;
  coverage_completeness_threshold: number;
}

export interface StabilityMetrics {
  concept_variance: number;
  relationship_stability: number;
  confidence_trend: number;
  coverage_completeness: number;
  iteration_range: number[];
}

export interface ProbabilisticExtractionJob {
  job_id: string;
  document_id: string;
  standard_type: 'LINK_16' | 'VMF';
  question_set: QuestionSet;
  convergence_criteria: ConvergenceCriteria;
  status: 'INITIALIZING' | 'RUNNING' | 'CONVERGED' | 'MAX_ITERATIONS' | 'FAILED';
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

export interface ExtractionProgress {
  current_iteration: number;
  total_iterations: number;
  convergence_progress: number;
  stability_metrics: StabilityMetrics;
  confidence_trend: number[];
  estimated_completion?: Date;
}

export interface ConvergenceAnalysis {
  converged: boolean;
  convergence_reason: string;
  final_stability: StabilityMetrics;
  quality_assessment: QualityAssessment;
  uncertainty_areas: UncertaintyArea[];
}

export interface QualityAssessment {
  conceptual_completeness: number;
  semantic_coherence: number;
  evidence_support: number;
  ontological_validity: number;
  overall_score: number;
}

export interface UncertaintyArea {
  area_description: string;
  concepts_affected: string[];
  uncertainty_level: number;
  recommended_action: string;
}

export interface ConvergedOntology {
  ontology_id: string;
  standard_type: 'LINK_16' | 'VMF';
  converged_concepts: ConceptConsensus[];
  converged_relationships: RelationshipConsensus[];
  extraction_metadata: ExtractionMetadata;
  quality_metrics: QualityAssessment;
  uncertainty_analysis: UncertaintyArea[];
}

export interface ConceptConsensus {
  concept_name: string;
  final_description: string;
  consensus_confidence: number;
  extraction_count: number;
  variance_score: number;
  supporting_iterations: number[];
}

export interface RelationshipConsensus {
  source_concept: string;
  target_concept: string;
  relationship_type: string;
  consensus_probability: number;
  extraction_frequency: number;
  consistency_score: number;
}

export interface ExtractionMetadata {
  total_iterations: number;
  convergence_iteration: number;
  total_execution_time: number;
  average_iteration_time: number;
  question_coverage_final: number;
  extraction_efficiency: number;
}
