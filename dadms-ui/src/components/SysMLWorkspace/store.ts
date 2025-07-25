import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// SysML v2 Element Types
export type SysMLElementType =
    | 'package'
    | 'block'
    | 'part'
    | 'attribute'
    | 'connection'
    | 'activity'
    | 'state'
    | 'interface'
    | 'port'
    | 'constraint'
    | 'requirement'
    | 'note';

// SysML v2 Connection Types
export type SysMLConnectionType =
    | 'association'
    | 'composition'
    | 'aggregation'
    | 'generalization'
    | 'dependency'
    | 'realization'
    | 'flow'
    | 'transition'
    | 'constraint'
    | 'trace'
    | 'satisfy'
    | 'verify'
    | 'refine'
    | 'derive';

// SysML v2 Diagram Types
export type SysMLDiagramType =
    | 'block_definition'
    | 'internal_block'
    | 'activity'
    | 'state_machine'
    | 'sequence'
    | 'use_case'
    | 'requirement'
    | 'parametric';

// View Modes for Dual View Editor
export type ViewMode = 'diagram' | 'sysml_text';

// SysML Node Data
export interface SysMLNodeData {
    label: string;
    elementType: SysMLElementType;
    properties: Record<string, any>;
    description: string;
    stereotype?: string;
    visibility?: 'public' | 'private' | 'protected' | 'package';
    isAbstract?: boolean;
    isLeaf?: boolean;
    isRoot?: boolean;
    multiplicity?: string;
    type?: string;
    defaultValue?: string;
    isDerived?: boolean;
    isReadOnly?: boolean;
    isOrdered?: boolean;
    isUnique?: boolean;
    direction?: 'in' | 'out' | 'inout' | 'return';
    isBehavior?: boolean;
    isService?: boolean;
    isConjugated?: boolean;
    isFlow?: boolean;
    isAtomic?: boolean;
    isActive?: boolean;
    isReentrant?: boolean;
    guard?: string;
    effect?: string;
    trigger?: string;
    entry?: string;
    exit?: string;
    do?: string;
    invariant?: string;
    constraint?: string;
    requirement?: string;
    verification?: string;
    satisfaction?: string;
    derivation?: string;
    refinement?: string;
    trace?: string;
    noteContent?: string;
    noteType?: 'general' | 'requirement' | 'constraint' | 'rationale';
    noteAuthor?: string;
    noteCreated?: string;
    noteLastModified?: string;
}

// SysML Edge Data
export interface SysMLEdgeData {
    connectionType: SysMLConnectionType;
    properties: Record<string, any>;
    strength: number;
    isInferred: boolean;
    label?: string;
    stereotype?: string;
    visibility?: 'public' | 'private' | 'protected' | 'package';
    isDerived?: boolean;
    isReadOnly?: boolean;
    isOrdered?: boolean;
    isUnique?: boolean;
    multiplicity?: string;
    direction?: 'in' | 'out' | 'inout' | 'return';
    isBehavior?: boolean;
    isService?: boolean;
    isConjugated?: boolean;
    isFlow?: boolean;
    isAtomic?: boolean;
    isActive?: boolean;
    isReentrant?: boolean;
    guard?: string;
    effect?: string;
    trigger?: string;
    entry?: string;
    exit?: string;
    do?: string;
    invariant?: string;
    constraint?: string;
    requirement?: string;
    verification?: string;
    satisfaction?: string;
    derivation?: string;
    refinement?: string;
    trace?: string;
}

// SysML Node
export interface SysMLNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: SysMLNodeData;
}

// SysML Edge
export interface SysMLEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type: string;
    data: SysMLEdgeData;
}

// SysML Model
export interface SysMLModel {
    id: string;
    name: string;
    description: string;
    diagramType: SysMLDiagramType;
    nodes: SysMLNode[];
    edges: SysMLEdge[];
    packages: SysMLPackage[];
    stereotypes: string[];
    customConnectionTypes: SysMLConnectionType[];
    lastModified: string;
    created: string;
    version: string;
    author: string;
    tags: string[];
    metadata: Record<string, any>;
}

// SysML Package
export interface SysMLPackage {
    id: string;
    name: string;
    description: string;
    parentId?: string;
    children: SysMLPackage[];
    elements: string[]; // Element IDs
    stereotypes: string[];
    visibility: 'public' | 'private' | 'protected' | 'package';
    isAbstract: boolean;
    isLeaf: boolean;
    isRoot: boolean;
}

// SysML Workspace
export interface SysMLWorkspace {
    id: string;
    name: string;
    description: string;
    models: SysMLModel[];
    packages: SysMLPackage[];
    stereotypes: string[];
    customConnectionTypes: SysMLConnectionType[];
    settings: {
        defaultDiagramType: SysMLDiagramType;
        autoSave: boolean;
        validationEnabled: boolean;
        showGrid: boolean;
        snapToGrid: boolean;
        gridSize: number;
        theme: 'light' | 'dark';
        language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
    };
    lastModified: string;
    created: string;
}

// Validation Result
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    timestamp: string;
}

// Dual View State
export interface DualViewState {
    activeMode: ViewMode;
    sysmlContent: string;
    sysmlFormat: 'sysml' | 'json' | 'xml' | 'xmi';
    isSync: boolean;
}

// Store State
interface SysMLWorkspaceState {
    // Workspace
    workspace: SysMLWorkspace | null;
    activeModel: SysMLModel | null;
    isInitialized: boolean;

    // UI State
    isPropertiesPanelOpen: boolean;
    isFullscreen: boolean;
    isMinimapVisible: boolean;

    // Selection
    selectedNodes: string[];
    selectedEdges: string[];

    // Validation
    validationResult: ValidationResult | null;

    // Dual View
    dualView: DualViewState;

    // Actions
    ensureWorkspace: () => void;
    loadMockWorkspace: () => void;
    setActiveModel: (model: SysMLModel | null) => void;
    addModel: (model: SysMLModel) => void;
    updateModel: (modelId: string, updates: Partial<SysMLModel>) => void;
    deleteModel: (modelId: string) => void;
    addNode: (node: SysMLNode) => void;
    updateNode: (nodeId: string, updates: Partial<SysMLNode>) => void;
    deleteNode: (nodeId: string) => void;
    addEdge: (edge: SysMLEdge) => void;
    updateEdge: (edgeId: string, updates: Partial<SysMLEdge>) => void;
    deleteEdge: (edgeId: string) => void;
    updateNodePositions: (positions: { id: string; position: { x: number; y: number } }[]) => void;
    setSelectedNodes: (nodeIds: string[]) => void;
    setSelectedEdges: (edgeIds: string[]) => void;
    togglePropertiesPanel: () => void;
    toggleFullscreen: () => void;
    toggleMinimap: () => void;
    setViewMode: (mode: ViewMode) => void;
    setSysMLContent: (content: string) => void;
    syncViews: () => void;
    addCustomConnectionType: (type: SysMLConnectionType) => void;
    validateModel: () => ValidationResult;
}

// Mock data for initial workspace
const createMockWorkspace = (): SysMLWorkspace => ({
    id: 'sysml-workspace-1',
    name: 'DADMS SysML Workspace',
    description: 'System modeling workspace for DADMS decision analysis',
    models: [],
    packages: [
        {
            id: 'pkg-root',
            name: 'Root Package',
            description: 'Root package for all SysML elements',
            children: [],
            elements: [],
            stereotypes: [],
            visibility: 'public',
            isAbstract: false,
            isLeaf: false,
            isRoot: true,
        }
    ],
    stereotypes: [
        'block',
        'interface',
        'port',
        'part',
        'reference',
        'value',
        'constraint',
        'requirement',
        'testCase',
        'actor',
        'useCase',
        'activity',
        'state',
        'transition',
        'region',
        'entry',
        'exit',
        'do',
        'guard',
        'effect',
        'trigger',
        'invariant',
        'derived',
        'readonly',
        'ordered',
        'unique',
        'behavior',
        'service',
        'conjugated',
        'flow',
        'atomic',
        'active',
        'reentrant',
    ],
    customConnectionTypes: [],
    settings: {
        defaultDiagramType: 'block_definition',
        autoSave: true,
        validationEnabled: true,
        showGrid: true,
        snapToGrid: true,
        gridSize: 15,
        theme: 'dark',
        language: 'en',
    },
    lastModified: new Date().toISOString(),
    created: new Date().toISOString(),
});

const createMockModel = (): SysMLModel => ({
    id: 'model-1',
    name: 'Example System Model',
    description: 'A simple example SysML v2 model',
    diagramType: 'block_definition',
    nodes: [
        {
            id: 'node-1',
            type: 'sysml_block',
            position: { x: 100, y: 100 },
            data: {
                label: 'System',
                elementType: 'block',
                properties: {},
                description: 'Main system block',
                stereotype: 'block',
                visibility: 'public',
                isAbstract: false,
                isLeaf: false,
                isRoot: false,
            }
        },
        {
            id: 'node-2',
            type: 'sysml_part',
            position: { x: 300, y: 100 },
            data: {
                label: 'Subsystem',
                elementType: 'part',
                properties: {},
                description: 'Subsystem component',
                stereotype: 'part',
                visibility: 'public',
                multiplicity: '1',
                type: 'SubsystemType',
            }
        },
        {
            id: 'node-3',
            type: 'sysml_attribute',
            position: { x: 100, y: 250 },
            data: {
                label: 'status',
                elementType: 'attribute',
                properties: {},
                description: 'System status attribute',
                stereotype: 'attribute',
                visibility: 'public',
                type: 'String',
                defaultValue: '"operational"',
                isReadOnly: false,
            }
        }
    ],
    edges: [
        {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'sysml_composition',
            data: {
                connectionType: 'composition',
                properties: {},
                strength: 1.0,
                isInferred: false,
                label: 'contains',
                stereotype: 'composition',
                multiplicity: '1',
            }
        }
    ],
    packages: [],
    stereotypes: [],
    customConnectionTypes: [],
    lastModified: new Date().toISOString(),
    created: new Date().toISOString(),
    version: '1.0.0',
    author: 'DADMS User',
    tags: ['example', 'system', 'block'],
    metadata: {},
});

export const useSysMLWorkspaceStore = create<SysMLWorkspaceState>()(
    devtools(
        (set, get) => ({
            // Initial State
            workspace: null,
            activeModel: null,
            isInitialized: false,
            isPropertiesPanelOpen: true,
            isFullscreen: false,
            isMinimapVisible: true,
            selectedNodes: [],
            selectedEdges: [],
            validationResult: null,
            dualView: {
                activeMode: 'diagram',
                sysmlContent: '',
                sysmlFormat: 'sysml',
                isSync: true,
            },

            // Actions
            ensureWorkspace: () => {
                const { workspace } = get();
                if (!workspace) {
                    const mockWorkspace = createMockWorkspace();
                    const mockModel = createMockModel();
                    mockWorkspace.models = [mockModel];
                    set({ workspace: mockWorkspace, activeModel: mockModel, isInitialized: true });
                }
            },

            loadMockWorkspace: () => {
                const mockWorkspace = createMockWorkspace();
                const mockModel = createMockModel();
                mockWorkspace.models = [mockModel];
                set({ workspace: mockWorkspace, activeModel: mockModel, isInitialized: true });
            },

            setActiveModel: (model) => {
                set({ activeModel: model });
            },

            addModel: (model) => {
                const { workspace } = get();
                if (workspace) {
                    const updatedWorkspace = {
                        ...workspace,
                        models: [...workspace.models, model],
                        lastModified: new Date().toISOString(),
                    };
                    set({ workspace: updatedWorkspace, activeModel: model });
                }
            },

            updateModel: (modelId, updates) => {
                const { workspace, activeModel } = get();
                if (workspace) {
                    const updatedModels = workspace.models.map(model =>
                        model.id === modelId ? { ...model, ...updates, lastModified: new Date().toISOString() } : model
                    );
                    const updatedWorkspace = {
                        ...workspace,
                        models: updatedModels,
                        lastModified: new Date().toISOString(),
                    };
                    const updatedActiveModel = activeModel?.id === modelId ? { ...activeModel, ...updates } : activeModel;
                    set({ workspace: updatedWorkspace, activeModel: updatedActiveModel });
                }
            },

            deleteModel: (modelId) => {
                const { workspace, activeModel } = get();
                if (workspace) {
                    const updatedModels = workspace.models.filter(model => model.id !== modelId);
                    const updatedWorkspace = {
                        ...workspace,
                        models: updatedModels,
                        lastModified: new Date().toISOString(),
                    };
                    const updatedActiveModel = activeModel?.id === modelId ? null : activeModel;
                    set({ workspace: updatedWorkspace, activeModel: updatedActiveModel });
                }
            },

            addNode: (node) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedModel = {
                        ...activeModel,
                        nodes: [...activeModel.nodes, node],
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            updateNode: (nodeId, updates) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedNodes = activeModel.nodes.map(node =>
                        node.id === nodeId ? { ...node, ...updates } : node
                    );
                    const updatedModel = {
                        ...activeModel,
                        nodes: updatedNodes,
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            deleteNode: (nodeId) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedNodes = activeModel.nodes.filter(node => node.id !== nodeId);
                    const updatedEdges = activeModel.edges.filter(edge =>
                        edge.source !== nodeId && edge.target !== nodeId
                    );
                    const updatedModel = {
                        ...activeModel,
                        nodes: updatedNodes,
                        edges: updatedEdges,
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            addEdge: (edge) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedModel = {
                        ...activeModel,
                        edges: [...activeModel.edges, edge],
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            updateEdge: (edgeId, updates) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedEdges = activeModel.edges.map(edge =>
                        edge.id === edgeId ? { ...edge, ...updates } : edge
                    );
                    const updatedModel = {
                        ...activeModel,
                        edges: updatedEdges,
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            deleteEdge: (edgeId) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedEdges = activeModel.edges.filter(edge => edge.id !== edgeId);
                    const updatedModel = {
                        ...activeModel,
                        edges: updatedEdges,
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            updateNodePositions: (positions) => {
                const { activeModel } = get();
                if (activeModel) {
                    const updatedNodes = activeModel.nodes.map(node => {
                        const positionUpdate = positions.find(p => p.id === node.id);
                        return positionUpdate ? { ...node, position: positionUpdate.position } : node;
                    });
                    const updatedModel = {
                        ...activeModel,
                        nodes: updatedNodes,
                        lastModified: new Date().toISOString(),
                    };
                    get().updateModel(activeModel.id, updatedModel);
                }
            },

            setSelectedNodes: (nodeIds) => {
                set({ selectedNodes: nodeIds, selectedEdges: [] });
            },

            setSelectedEdges: (edgeIds) => {
                set({ selectedEdges: edgeIds, selectedNodes: [] });
            },

            togglePropertiesPanel: () => {
                set(state => ({ isPropertiesPanelOpen: !state.isPropertiesPanelOpen }));
            },

            toggleFullscreen: () => {
                set(state => ({ isFullscreen: !state.isFullscreen }));
            },

            toggleMinimap: () => {
                set(state => ({ isMinimapVisible: !state.isMinimapVisible }));
            },

            setViewMode: (mode) => {
                set(state => ({
                    dualView: { ...state.dualView, activeMode: mode }
                }));
            },

            setSysMLContent: (content) => {
                set(state => ({
                    dualView: { ...state.dualView, sysmlContent: content, isSync: false }
                }));
            },

            syncViews: () => {
                // In a real implementation, this would sync between diagram and SysML text
                set(state => ({
                    dualView: { ...state.dualView, isSync: true }
                }));
            },

            addCustomConnectionType: (type) => {
                const { workspace } = get();
                if (workspace && !workspace.customConnectionTypes.includes(type)) {
                    const updatedWorkspace = {
                        ...workspace,
                        customConnectionTypes: [...workspace.customConnectionTypes, type],
                        lastModified: new Date().toISOString(),
                    };
                    set({ workspace: updatedWorkspace });
                }
            },

            validateModel: () => {
                const { activeModel } = get();
                const errors: string[] = [];
                const warnings: string[] = [];

                if (!activeModel) {
                    errors.push('No active model to validate');
                } else {
                    // Basic validation rules
                    if (!activeModel.name.trim()) {
                        errors.push('Model must have a name');
                    }

                    if (activeModel.nodes.length === 0) {
                        warnings.push('Model has no elements');
                    }

                    // Check for orphaned edges
                    const nodeIds = new Set(activeModel.nodes.map(n => n.id));
                    activeModel.edges.forEach(edge => {
                        if (!nodeIds.has(edge.source)) {
                            errors.push(`Edge ${edge.id} references non-existent source node ${edge.source}`);
                        }
                        if (!nodeIds.has(edge.target)) {
                            errors.push(`Edge ${edge.id} references non-existent target node ${edge.target}`);
                        }
                    });

                    // Check for duplicate node IDs
                    const nodeIdCounts = new Map<string, number>();
                    activeModel.nodes.forEach(node => {
                        nodeIdCounts.set(node.id, (nodeIdCounts.get(node.id) || 0) + 1);
                    });
                    nodeIdCounts.forEach((count, id) => {
                        if (count > 1) {
                            errors.push(`Duplicate node ID: ${id}`);
                        }
                    });

                    // Check for duplicate edge IDs
                    const edgeIdCounts = new Map<string, number>();
                    activeModel.edges.forEach(edge => {
                        edgeIdCounts.set(edge.id, (edgeIdCounts.get(edge.id) || 0) + 1);
                    });
                    edgeIdCounts.forEach((count, id) => {
                        if (count > 1) {
                            errors.push(`Duplicate edge ID: ${id}`);
                        }
                    });
                }

                const result: ValidationResult = {
                    isValid: errors.length === 0,
                    errors,
                    warnings,
                    timestamp: new Date().toISOString(),
                };

                set({ validationResult: result });
                return result;
            },
        }),
        {
            name: 'sysml-workspace-store',
        }
    )
); 