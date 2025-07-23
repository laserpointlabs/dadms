import { Edge, Node } from 'reactflow';

// Simplified Ontology Entity Types
export type DADMSEntityType =
    | 'entity'
    | 'object_property'
    | 'data_property';

export type DADMSRelationshipType =
    | 'subclass_of'
    | 'instance_of'
    | 'relates_to'
    | 'has_property'
    | 'equivalent_to';

// Node Data Structure
export interface OntologyNodeData {
    label: string;
    entityType: string;
    properties: Record<string, any>;
    description?: string;
    isExternal?: boolean;
    externalSource?: string;
    confidence?: number;
}

// Edge Data Structure  
export interface OntologyEdgeData {
    relationshipType: DADMSRelationshipType;
    properties?: Record<string, any>;
    strength?: number;
    isInferred?: boolean;
}

// React Flow Types
export type OntologyNode = Node<OntologyNodeData>;
export type OntologyEdge = Edge<OntologyEdgeData>;

// Workspace State
export interface WorkspaceState {
    workspaceId: string;
    projectId: string;
    ontologies: OntologyState[];
    activeOntologyId?: string;
    collaborators: Collaborator[];
    isReadOnly: boolean;
}

export interface OntologyState {
    id: string;
    name: string;
    description?: string;
    nodes: OntologyNode[];
    edges: OntologyEdge[];
    viewport: { x: number; y: number; zoom: number };
    lastModified: string;
    version: string;
}

// Dual View Types
export type ViewMode = 'diagram' | 'owl_text';

export interface DualViewState {
    activeMode: ViewMode;
    isSync: boolean;
    owlContent: string;
    owlFormat: 'turtle' | 'rdf_xml' | 'owl_xml' | 'n3' | 'json_ld';
}

// Collaboration Types
export interface Collaborator {
    userId: string;
    username: string;
    displayName: string;
    role: 'viewer' | 'contributor' | 'ontology_architect';
    status: 'active' | 'idle' | 'away';
    cursor?: { x: number; y: number };
    currentElement?: string;
}

// External Reference Types
export interface ExternalOntologyReference {
    id: string;
    name: string;
    description: string;
    source: 'dadms_registry' | 'web_repositories' | 'standard_ontologies';
    uri: string;
    isLoaded: boolean;
    isVisible: boolean;
    namespacePrefix: string;
}

// Properties Panel Types
export interface PropertyDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'reference';
    required: boolean;
    defaultValue?: any;
    enumValues?: string[];
    description?: string;
}

// Validation Types
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
}

export interface ValidationError {
    type: string;
    element: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
    type: string;
    element: string;
    message: string;
    severity: 'warning' | 'info';
    suggestion?: string;
}

export interface ValidationSuggestion {
    type: string;
    message: string;
    action?: () => void;
}

// Example Library Types
export interface ExampleOntology {
    id: string;
    name: string;
    description: string;
    domain: string;
    complexity: 'basic' | 'intermediate' | 'advanced';
    previewData: {
        nodeCount: number;
        edgeCount: number;
        keyEntities: string[];
    };
    template: {
        nodes: OntologyNode[];
        edges: OntologyEdge[];
    };
}

// AAS Integration Types (Scaffolding)
export interface AASGenerationRequest {
    prompt: string;
    domain: string;
    complexity: 'basic' | 'intermediate' | 'advanced';
    context?: Record<string, any>;
}

export interface AASGenerationResponse {
    generationId: string;
    status: 'completed' | 'failed' | 'in_progress';
    generatedOntology?: {
        nodes: OntologyNode[];
        edges: OntologyEdge[];
        owlContent: string;
    };
    suggestions?: string[];
} 