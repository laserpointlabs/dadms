import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
    DualViewState,
    ExternalOntologyReference,
    OntologyEdge,
    OntologyNode,
    OntologyState,
    ValidationResult,
    ViewMode,
    WorkspaceState
} from './types';

interface OntologyWorkspaceStore {
    // Workspace State
    workspace: WorkspaceState | null;
    activeOntology: OntologyState | null;
    isInitialized: boolean;

    // Dual View State
    dualView: DualViewState;

    // External References
    externalReferences: ExternalOntologyReference[];

    // UI State
    selectedNodes: string[];
    selectedEdges: string[];
    isPropertiesPanelOpen: boolean;
    isExternalPanelOpen: boolean;
    isValidating: boolean;
    validationResult: ValidationResult | null;

    // Actions
    setWorkspace: (workspace: WorkspaceState) => void;
    setActiveOntology: (activeOntology: OntologyState) => void;
    ensureWorkspace: () => WorkspaceState;

    // Node/Edge Operations
    addNode: (node: OntologyNode) => void;
    updateNode: (nodeId: string, updates: Partial<OntologyNode>) => void;
    deleteNode: (nodeId: string) => void;
    addEdge: (edge: OntologyEdge) => void;
    updateEdge: (edgeId: string, updates: Partial<OntologyEdge>) => void;
    deleteEdge: (edgeId: string) => void;
    updateNodePositions: (nodeUpdates: { id: string; position: { x: number; y: number } }[]) => void;

    // Selection
    setSelectedNodes: (nodeIds: string[]) => void;
    setSelectedEdges: (edgeIds: string[]) => void;
    clearSelection: () => void;

    // Dual View
    setViewMode: (mode: ViewMode) => void;
    setOwlContent: (content: string) => void;
    syncViews: () => void;

    // External References
    addExternalReference: (reference: ExternalOntologyReference) => void;
    removeExternalReference: (referenceId: string) => void;
    toggleExternalReference: (referenceId: string) => void;

    // UI State
    togglePropertiesPanel: () => void;
    toggleExternalPanel: () => void;

    // Validation
    validateOntology: () => Promise<void>;

    // Save/Load Operations
    saveOntologyToFile: () => void;
    loadOntologyFromFile: (file: File) => Promise<void>;
    createNewOntology: () => void;
    duplicateOntology: (ontologyId: string, newName: string) => void;
    deleteOntology: (ontologyId: string) => void;

    // Mock Data Generators (for scaffolding)
    loadMockWorkspace: () => void;
    generateMockOntology: () => void;
}

// Mock data for scaffolding
const createMockWorkspace = (): WorkspaceState => ({
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    ontologies: [
        {
            id: 'ontology-1',
            name: 'Basic Ontology',
            description: 'Simple ontology for testing with entities and properties',
            nodes: [
                {
                    id: 'node-1',
                    type: 'entity',
                    position: { x: 100, y: 100 },
                    data: {
                        label: 'Person',
                        entityType: 'Entity',
                        properties: {
                            type: 'Class',
                            domain: 'People'
                        },
                        description: 'A human being'
                    }
                },
                {
                    id: 'node-2',
                    type: 'entity',
                    position: { x: 300, y: 150 },
                    data: {
                        label: 'Organization',
                        entityType: 'Entity',
                        properties: {
                            type: 'Class',
                            domain: 'Organizations'
                        },
                        description: 'A group or company'
                    }
                },
                {
                    id: 'node-3',
                    type: 'object_property',
                    position: { x: 200, y: 250 },
                    data: {
                        label: 'worksFor',
                        entityType: 'Object Property',
                        properties: {
                            domain: 'Person',
                            range: 'Organization'
                        },
                        description: 'Relationship between person and organization'
                    }
                }
            ],
            edges: [
                {
                    id: 'edge-1',
                    source: 'node-1',
                    target: 'node-2',
                    type: 'default',
                    data: {
                        relationshipType: 'relates_to',
                        properties: {
                            description: 'Person relates to Organization'
                        }
                    }
                },
                {
                    id: 'edge-2',
                    source: 'node-3',
                    target: 'node-1',
                    type: 'default',
                    data: {
                        relationshipType: 'has_property',
                        properties: {
                            description: 'Person has worksFor property'
                        }
                    }
                }
            ],
            viewport: { x: 0, y: 0, zoom: 1 },
            lastModified: new Date().toISOString(),
            version: '1.0.0'
        }
    ],
    activeOntologyId: 'ontology-1',
    collaborators: [
        {
            userId: 'user-1',
            username: 'ontology_user',
            displayName: 'Ontology User',
            role: 'ontology_architect',
            status: 'active'
        }
    ],
    isReadOnly: false
});

const createMockExternalReferences = (): ExternalOntologyReference[] => [
    {
        id: 'ext-1',
        name: 'Defense Logistics Ontology',
        description: 'Comprehensive ontology for military logistics operations',
        source: 'dadms_registry',
        uri: 'http://dadms.example.com/ontology/defense-logistics',
        isLoaded: false,
        isVisible: true,
        namespacePrefix: 'def_log'
    },
    {
        id: 'ext-2',
        name: 'FOAF (Friend of a Friend)',
        description: 'Standard ontology for describing people and relationships',
        source: 'standard_ontologies',
        uri: 'http://xmlns.com/foaf/0.1/',
        isLoaded: false,
        isVisible: false,
        namespacePrefix: 'foaf'
    }
];

export const useOntologyWorkspaceStore = create<OntologyWorkspaceStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial State
                workspace: null,
                activeOntology: null,
                isInitialized: false,
                dualView: {
                    activeMode: 'diagram',
                    isSync: true,
                    owlContent: '',
                    owlFormat: 'turtle'
                },
                externalReferences: [],
                selectedNodes: [],
                selectedEdges: [],
                isPropertiesPanelOpen: true,
                isExternalPanelOpen: false,
                isValidating: false,
                validationResult: null,

                // Workspace Management
                setWorkspace: (workspace) => set({ workspace }),
                setActiveOntology: (activeOntology) => set({ activeOntology }),
                ensureWorkspace: () => {
                    const { workspace, isInitialized } = get();
                    if (!workspace) {
                        const emptyWorkspace: WorkspaceState = {
                            workspaceId: 'workspace-1',
                            projectId: 'project-1',
                            ontologies: [],
                            collaborators: [],
                            isReadOnly: false
                        };
                        set({ workspace: emptyWorkspace, isInitialized: true });
                        return emptyWorkspace;
                    }
                    if (!isInitialized) {
                        set({ isInitialized: true });
                    }
                    return workspace;
                },

                // Create new ontology
                createNewOntology: () => {
                    const workspace = get().ensureWorkspace();
                    const newOntology: OntologyState = {
                        id: `ontology-${Date.now()}`,
                        name: 'New Ontology',
                        description: 'A new ontology for decision intelligence modeling',
                        nodes: [],
                        edges: [],
                        viewport: { x: 0, y: 0, zoom: 1 },
                        lastModified: new Date().toISOString(),
                        version: '1.0.0'
                    };

                    const updatedWorkspace = {
                        ...workspace,
                        ontologies: [...workspace.ontologies, newOntology]
                    };

                    set({
                        workspace: updatedWorkspace,
                        activeOntology: newOntology
                    });
                },

                // Node Operations
                addNode: (node) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            nodes: [...activeOntology.nodes, node],
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                updateNode: (nodeId, updates) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            nodes: activeOntology.nodes.map(node =>
                                node.id === nodeId ? { ...node, ...updates } : node
                            ),
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                deleteNode: (nodeId) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            nodes: activeOntology.nodes.filter(node => node.id !== nodeId),
                            edges: activeOntology.edges.filter(edge =>
                                edge.source !== nodeId && edge.target !== nodeId
                            ),
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                // Edge Operations
                addEdge: (edge) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            edges: [...activeOntology.edges, edge],
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                updateEdge: (edgeId, updates) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            edges: activeOntology.edges.map(edge =>
                                edge.id === edgeId ? { ...edge, ...updates } : edge
                            ),
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                deleteEdge: (edgeId) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            edges: activeOntology.edges.filter(edge => edge.id !== edgeId),
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                updateNodePositions: (nodeUpdates) => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const updatedOntology = {
                            ...activeOntology,
                            nodes: activeOntology.nodes.map(node => {
                                const update = nodeUpdates.find(upd => upd.id === node.id);
                                return update ? { ...node, position: update.position } : node;
                            }),
                            lastModified: new Date().toISOString()
                        };
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.map(ont =>
                                ont.id === activeOntology.id ? updatedOntology : ont
                            )
                        };
                        set({
                            workspace: updatedWorkspace,
                            activeOntology: updatedOntology
                        });
                    }
                },

                // Selection
                setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
                setSelectedEdges: (edgeIds) => set({ selectedEdges: edgeIds }),
                clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),

                // Dual View
                setViewMode: (mode) => set(state => ({
                    dualView: { ...state.dualView, activeMode: mode }
                })),

                setOwlContent: (content) => set(state => ({
                    dualView: { ...state.dualView, owlContent: content, isSync: false }
                })),

                syncViews: () => {
                    // Mock sync functionality - in real implementation would convert between formats
                    const { activeOntology, dualView } = get();
                    if (activeOntology) {
                        if (dualView.activeMode === 'owl_text') {
                            // Convert OWL text to diagram nodes/edges
                            console.log('Syncing OWL text to diagram...');
                        } else {
                            // Convert diagram to OWL text
                            const mockOwlContent = `@prefix : <http://dadms.example.com/ontology/mission-planning#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

:Mission rdf:type owl:Class ;
    rdfs:label "Mission Planning Decision" ;
    rdfs:comment "Primary decision point for mission planning process" .

:Stakeholder rdf:type owl:Class ;
    rdfs:label "Mission Commander" ;
    rdfs:comment "Primary decision maker for mission planning" .

:requires_approval rdf:type owl:ObjectProperty ;
    rdfs:domain :Mission ;
    rdfs:range :Stakeholder .`;

                            set(state => ({
                                dualView: {
                                    ...state.dualView,
                                    owlContent: mockOwlContent,
                                    isSync: true
                                }
                            }));
                        }
                    }
                },

                // External References
                addExternalReference: (reference) => set(state => ({
                    externalReferences: [...state.externalReferences, reference]
                })),

                removeExternalReference: (referenceId) => set(state => ({
                    externalReferences: state.externalReferences.filter(ref => ref.id !== referenceId)
                })),

                toggleExternalReference: (referenceId) => set(state => ({
                    externalReferences: state.externalReferences.map(ref =>
                        ref.id === referenceId ? { ...ref, isVisible: !ref.isVisible } : ref
                    )
                })),

                // UI State
                togglePropertiesPanel: () => set(state => ({
                    isPropertiesPanelOpen: !state.isPropertiesPanelOpen
                })),

                toggleExternalPanel: () => set(state => ({
                    isExternalPanelOpen: !state.isExternalPanelOpen
                })),

                // Validation
                validateOntology: async () => {
                    set({ isValidating: true });

                    // Mock validation - in real implementation would call backend
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const mockResult: ValidationResult = {
                        isValid: true,
                        errors: [],
                        warnings: [
                            {
                                type: 'completeness',
                                element: 'Mission Planning Decision',
                                message: 'Consider adding more detailed properties',
                                severity: 'warning',
                                suggestion: 'Add timeline, resources, and constraints properties'
                            }
                        ],
                        suggestions: [
                            {
                                type: 'enhancement',
                                message: 'Add temporal relationships between decisions'
                            }
                        ]
                    };

                    set({ isValidating: false, validationResult: mockResult });
                },

                // Save/Load Operations
                saveOntologyToFile: () => {
                    const { workspace, activeOntology } = get();
                    if (workspace && activeOntology) {
                        const ontologyData = JSON.stringify(activeOntology, null, 2);
                        const blob = new Blob([ontologyData], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${activeOntology.name}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }
                },

                loadOntologyFromFile: async (file: File) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target?.result) {
                            try {
                                const loadedOntology = JSON.parse(event.target.result as string);
                                const { workspace, activeOntology } = get();
                                if (workspace) {
                                    const updatedWorkspace = {
                                        ...workspace,
                                        ontologies: workspace.ontologies.map(ont =>
                                            ont.id === activeOntology?.id ? loadedOntology : ont
                                        )
                                    };
                                    set({ workspace: updatedWorkspace, activeOntology: loadedOntology });
                                }
                            } catch (error) {
                                console.error('Error loading ontology from file:', error);
                            }
                        }
                    };
                    reader.readAsText(file);
                },

                duplicateOntology: (ontologyId: string, newName: string) => {
                    const { workspace } = get();
                    if (workspace) {
                        const sourceOntology = workspace.ontologies.find(ont => ont.id === ontologyId);
                        if (sourceOntology) {
                            const newOntology: OntologyState = {
                                id: `ontology-${Date.now()}`,
                                name: newName,
                                description: sourceOntology.description,
                                nodes: [...sourceOntology.nodes],
                                edges: [...sourceOntology.edges],
                                viewport: { ...sourceOntology.viewport },
                                lastModified: new Date().toISOString(),
                                version: '1.0.0'
                            };
                            const updatedWorkspace = {
                                ...workspace,
                                ontologies: [...workspace.ontologies, newOntology]
                            };
                            set({
                                workspace: updatedWorkspace,
                                activeOntology: newOntology
                            });
                        }
                    }
                },

                deleteOntology: (ontologyId: string) => {
                    const { workspace } = get();
                    if (workspace) {
                        const updatedWorkspace = {
                            ...workspace,
                            ontologies: workspace.ontologies.filter(ont => ont.id !== ontologyId)
                        };
                        set({ workspace: updatedWorkspace });
                        if (workspace.activeOntologyId === ontologyId) {
                            set({ activeOntology: null });
                        }
                    }
                },

                // Mock Data Generators
                loadMockWorkspace: () => {
                    const mockWorkspace = createMockWorkspace();
                    const mockReferences = createMockExternalReferences();
                    set({
                        workspace: mockWorkspace,
                        activeOntology: mockWorkspace.ontologies[0],
                        externalReferences: mockReferences
                    });
                },

                generateMockOntology: () => {
                    // Mock implementation for AAS generation
                    console.log('Generating mock ontology via AAS...');
                }
            }),
            {
                name: 'ontology-workspace-store',
                partialize: (state) => ({
                    workspace: state.workspace,
                    activeOntology: state.activeOntology,
                    externalReferences: state.externalReferences,
                    dualView: state.dualView,
                    isInitialized: state.isInitialized,
                }),
                // Handle migration from old state
                onRehydrateStorage: () => (state) => {
                    if (state && state.isInitialized === undefined) {
                        // If isInitialized is missing, set it based on workspace existence
                        state.isInitialized = state.workspace !== null;
                    }
                },
            }
        ),
        {
            name: 'ontology-workspace-devtools'
        }
    )
); 