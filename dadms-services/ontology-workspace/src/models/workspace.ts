export interface OntologyWorkspace {
    id: string;
    name: string;
    description?: string;
    project_id: string;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    settings: WorkspaceSettings;
    metadata?: Record<string, any>;
}

export interface WorkspaceSettings {
    auto_save_enabled: boolean;
    auto_layout_enabled: boolean;
    validation_on_save: boolean;
    default_reasoner: 'hermit' | 'pellet' | 'elk';
    color_scheme: 'light' | 'dark' | 'auto';
    grid_enabled: boolean;
    snap_to_grid: boolean;
}

export interface OntologyDocument {
    id: string;
    workspace_id: string;
    name: string;
    description?: string;
    iri?: string;
    format: OntologyFormat;
    content: Record<string, any>;
    version: string;
    status: OntologyStatus;
    visual_layout?: VisualLayout;
    metadata?: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}

export type OntologyFormat =
    | 'owl_xml'
    | 'owl'        // Add plain owl format
    | 'turtle'
    | 'rdf_xml'
    | 'rdf'        // Add plain rdf format
    | 'json_ld'
    | 'jsonld'     // Add alternative jsonld format
    | 'n_triples'
    | 'n_quads'
    | 'robot';

export type OntologyStatus =
    | 'draft'
    | 'validating'
    | 'valid'
    | 'invalid'
    | 'publishing'
    | 'published';

export interface VisualLayout {
    elements: VisualElement[];
    layout_algorithm: 'manual' | 'hierarchical' | 'force_directed' | 'circular' | 'grid';
    viewport?: Viewport;
    groups?: ElementGroup[];
    // Add support for draw.io layouts
    type?: 'drawio' | 'mxgraph' | 'onto4all';
    data?: string; // Raw draw.io XML or other format data
    auto_layout?: boolean;
}

export interface VisualElement {
    id: string;
    type: 'class' | 'object_property' | 'data_property' | 'individual' | 'annotation';
    position: Position;
    size: Size;
    style?: ElementStyle;
    label?: string;
    connections?: Connection[];
}

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface ElementStyle {
    fill_color?: string;
    border_color?: string;
    border_width?: number;
    opacity?: number;
    font_size?: number;
    font_family?: string;
    shape?: 'rectangle' | 'ellipse' | 'diamond' | 'hexagon';
}

export interface Connection {
    target_id: string;
    type: 'subclass_of' | 'instance_of' | 'object_property' | 'data_property' | 'equivalent' | 'disjoint';
    style?: ConnectionStyle;
    label?: string;
}

export interface ConnectionStyle {
    color?: string;
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    arrow_type?: 'none' | 'arrow' | 'diamond' | 'circle';
}

export interface Viewport {
    zoom: number;
    center: Position;
}

export interface ElementGroup {
    id: string;
    name: string;
    elements: string[];
    style?: GroupStyle;
}

export interface GroupStyle {
    background_color?: string;
    border_color?: string;
    border_style?: 'solid' | 'dashed' | 'dotted';
}

// Request/Response models
export interface CreateWorkspaceRequest {
    name: string;
    description?: string;
    project_id: string;
    settings?: Partial<WorkspaceSettings>;
}

export interface UpdateWorkspaceRequest {
    name?: string;
    description?: string;
    settings?: Partial<WorkspaceSettings>;
}

export interface AddOntologyRequest {
    name: string;
    description?: string;
    action: 'create_new' | 'import_existing';
    iri?: string;
    format?: OntologyFormat;
    content?: string;
    collection_id?: string;
    // Add support for visual layout in requests
    visual_layout?: Partial<VisualLayout>;
}

export interface ImportFromDrawIORequest {
    interpretation_mode: 'strict_owl' | 'flexible_mapping' | 'custom_rules';
    generate_iris: boolean;
}

export interface CementoSyncRequest {
    cemento_project_id: string;
    direction: 'import_from_cemento' | 'export_to_cemento' | 'bidirectional';
    options: {
        preserve_layout: boolean;
        merge_conflicts: 'overwrite_local' | 'overwrite_remote' | 'manual_resolution';
    };
    // Add missing properties used in controller
    operation?: 'validate' | 'convert';
    sourceFormat?: string;
    targetFormat?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
} 