'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Type declarations for mxGraph
declare global {
    interface Window {
        mxGraph: any;
        mxGraphModel: any;
        mxCell: any;
        mxGeometry: any;
        mxPoint: any;
        mxUtils: any;
        mxEvent: any;
        mxRubberband: any;
        mxKeyHandler: any;
        mxToolbar: any;
        mxCodec: any;
        mxConstants: any;
        mxPerimeter: any;
        mxEdgeStyle: any;
        mxStyleRegistry: any;
        mxCellRenderer: any;
        mxConnectionHandler: any;
    }
}

export interface MxGraphOntologyEditorProps {
    className?: string;
    height?: string;
    workspaceId?: string;
    ontologyId?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    onSave?: (ontologyData: any) => void;
    onValidate?: (validationResult: any) => void;
}

interface OntologyElement {
    id: string;
    type: 'class' | 'objectProperty' | 'dataProperty' | 'individual' | 'annotation';
    label: string;
    iri?: string;
    properties?: Record<string, any>;
}

export const MxGraphOntologyEditor: React.FC<MxGraphOntologyEditorProps> = ({
    className = '',
    height = '100vh',
    workspaceId,
    ontologyId,
    onLoad,
    onError,
    onSave,
    onValidate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedElement, setSelectedElement] = useState<OntologyElement | null>(null);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    // Initialize mxGraph when component mounts
    useEffect(() => {
        const initializeMxGraph = async () => {
            try {
                // Load mxGraph dynamically
                if (!window.mxGraph) {
                    // In a real implementation, you would load mxGraph from CDN or npm package
                    // For this example, we'll create a placeholder
                    await loadMxGraphLibrary();
                }

                if (containerRef.current) {
                    setupOntologyEditor();
                }
            } catch (error) {
                console.error('Failed to initialize mxGraph:', error);
                onError?.(new Error('Failed to load ontology editor'));
            }
        };

        initializeMxGraph();
    }, []);

    // Update theme when it changes
    useEffect(() => {
        if (graphRef.current) {
            updateGraphTheme();
        }
    }, [theme]);

    const loadMxGraphLibrary = async (): Promise<void> => {
        return new Promise((resolve, reject) => {
            // In a production environment, you would load the actual mxGraph library
            // For this demo, we'll create a more complete mock implementation
            if (typeof window !== 'undefined') {
                // Mock mxGraph for demonstration with all required methods
                window.mxGraph = class MockGraph {
                    container: HTMLElement;
                    model: any;
                    view: any;

                    constructor(container: HTMLElement) {
                        this.container = container;
                        this.model = {
                            beginUpdate: () => { },
                            endUpdate: () => { },
                            getRoot: () => ({ children: [] }),
                            cells: {}
                        };
                        this.view = {
                            setBackgroundColor: (color: string) => {
                                if (this.container) {
                                    this.container.style.backgroundColor = color;
                                }
                            }
                        };
                    }

                    // Graph configuration methods
                    setConnectable(connectable: boolean) {
                        console.log('mxGraph.setConnectable:', connectable);
                    }

                    setDropEnabled(enabled: boolean) {
                        console.log('mxGraph.setDropEnabled:', enabled);
                    }

                    setPanning(enabled: boolean) {
                        console.log('mxGraph.setPanning:', enabled);
                    }

                    // Element creation methods
                    insertVertex(parent: any, id: string, value: string, x: number, y: number, width: number, height: number, style?: string) {
                        const vertex = {
                            id: id || `vertex_${Date.now()}`,
                            value,
                            geometry: { x, y, width, height },
                            style,
                            vertex: true
                        };

                        // Add to model cells
                        this.model.cells[vertex.id] = vertex;

                        // Create visual representation
                        this.createVisualElement(vertex);

                        return vertex;
                    }

                    insertEdge(parent: any, id: string, value: string, source: any, target: any, style?: string) {
                        const edge = {
                            id: id || `edge_${Date.now()}`,
                            value,
                            source,
                            target,
                            style,
                            edge: true
                        };

                        // Add to model cells
                        this.model.cells[edge.id] = edge;

                        return edge;
                    }

                    getDefaultParent() {
                        return this.model.getRoot();
                    }

                    refresh() {
                        // Refresh the visual representation
                        console.log('mxGraph.refresh() called');
                    }

                    // Event handling
                    addListener(event: string, callback: Function) {
                        if (event === 'click' && this.container) {
                            this.container.addEventListener('click', (e) => {
                                // Find the clicked cell
                                const target = e.target as HTMLElement;
                                const cellId = target.getAttribute('data-cell-id');
                                if (cellId && this.model.cells[cellId]) {
                                    const mockEvent = {
                                        getProperty: (prop: string) => {
                                            if (prop === 'cell') {
                                                return this.model.cells[cellId];
                                            }
                                            return null;
                                        }
                                    };
                                    callback(this, mockEvent);
                                }
                            });
                        }
                    }

                    // Stylesheet management
                    getStylesheet() {
                        return {
                            putCellStyle: (name: string, style: any) => {
                                console.log('putCellStyle:', name, style);
                            }
                        };
                    }

                    // Visual element creation helper
                    createVisualElement(cell: any) {
                        if (!this.container || !cell.geometry) return;

                        const element = document.createElement('div');
                        element.setAttribute('data-cell-id', cell.id);
                        element.style.position = 'absolute';
                        element.style.left = cell.geometry.x + 'px';
                        element.style.top = cell.geometry.y + 'px';
                        element.style.width = cell.geometry.width + 'px';
                        element.style.height = cell.geometry.height + 'px';
                        element.style.border = '2px solid #333';
                        element.style.borderRadius = '4px';
                        element.style.cursor = 'pointer';
                        element.style.display = 'flex';
                        element.style.alignItems = 'center';
                        element.style.justifyContent = 'center';
                        element.style.fontSize = '12px';
                        element.style.fontWeight = 'bold';
                        element.style.userSelect = 'none';
                        element.textContent = cell.value;

                        // Apply style-based colors
                        this.applyElementStyle(element, cell.style);

                        this.container.appendChild(element);
                    }

                    // Apply ontology-specific styling
                    applyElementStyle(element: HTMLElement, style?: string) {
                        switch (style) {
                            case 'class':
                                element.style.backgroundColor = '#E3F2FD';
                                element.style.borderColor = '#1976D2';
                                element.style.color = '#1976D2';
                                break;
                            case 'objectProperty':
                                element.style.backgroundColor = '#F3E5F5';
                                element.style.borderColor = '#7B1FA2';
                                element.style.color = '#7B1FA2';
                                break;
                            case 'dataProperty':
                                element.style.backgroundColor = '#E8F5E8';
                                element.style.borderColor = '#388E3C';
                                element.style.color = '#388E3C';
                                break;
                            case 'individual':
                                element.style.backgroundColor = '#FFF3E0';
                                element.style.borderColor = '#F57C00';
                                element.style.color = '#F57C00';
                                break;
                            default:
                                element.style.backgroundColor = '#f5f5f5';
                                element.style.borderColor = '#999';
                                element.style.color = '#333';
                        }
                    }
                };

                // Mock other mxGraph utilities
                window.mxUtils = {
                    alert: (message: string) => alert(message),
                    error: (message: string) => console.error(message)
                };

                window.mxConstants = {
                    STYLE_STROKECOLOR: 'strokeColor',
                    STYLE_FILLCOLOR: 'fillColor',
                    STYLE_FONTCOLOR: 'fontColor'
                };

                window.mxEvent = {
                    addListener: (element: any, event: string, callback: Function) => {
                        if (element && element.addEventListener) {
                            element.addEventListener(event, callback);
                        }
                    }
                };

                resolve();
            } else {
                reject(new Error('Window object not available'));
            }
        });
    };

    const setupOntologyEditor = () => {
        if (!containerRef.current || !window.mxGraph) return;

        try {
            // Create the graph
            const graph = new window.mxGraph(containerRef.current);
            graphRef.current = graph;

            // Configure graph for ontology editing
            configureOntologyGraph(graph);

            // Setup toolbar
            setupOntologyToolbar();

            // Setup ontology-specific styles
            setupOntologyStyles(graph);

            // Add sample ontology elements
            addSampleOntologyElements(graph);

            setIsLoading(false);
            onLoad?.();
        } catch (error) {
            console.error('Error setting up ontology editor:', error);
            onError?.(new Error('Failed to setup ontology editor'));
        }
    };

    const configureOntologyGraph = (graph: any) => {
        // Enable various features
        graph.setConnectable(true);
        graph.setDropEnabled(true);
        graph.setPanning(true);

        // Set up selection and editing
        graph.addListener('click', (sender: any, evt: any) => {
            const cell = evt.getProperty('cell');
            if (cell) {
                handleElementSelection(cell);
            }
        });
    };

    const setupOntologyToolbar = () => {
        if (!toolbarRef.current) return;

        // Clear existing toolbar
        toolbarRef.current.innerHTML = '';

        // Create ontology-specific toolbar buttons
        const toolbarButtons = [
            { label: 'Class', type: 'class', icon: '🏛️' },
            { label: 'Object Property', type: 'objectProperty', icon: '🔗' },
            { label: 'Data Property', type: 'dataProperty', icon: '📊' },
            { label: 'Individual', type: 'individual', icon: '👤' },
            { label: 'Validate', type: 'validate', icon: '✅' },
            { label: 'Export', type: 'export', icon: '💾' }
        ];

        toolbarButtons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = 'mx-2 px-3 py-2 text-sm bg-theme-accent-primary text-white rounded hover:bg-opacity-80 transition-colors';
            btn.innerHTML = `${button.icon} ${button.label}`;
            btn.onclick = () => handleToolbarAction(button.type);
            toolbarRef.current?.appendChild(btn);
        });
    };

    const setupOntologyStyles = (graph: any) => {
        const stylesheet = graph.getStylesheet();

        // Define styles for different ontology elements
        const styles = {
            'class': {
                [window.mxConstants.STYLE_FILLCOLOR]: '#E3F2FD',
                [window.mxConstants.STYLE_STROKECOLOR]: '#1976D2',
                [window.mxConstants.STYLE_FONTCOLOR]: '#1976D2'
            },
            'objectProperty': {
                [window.mxConstants.STYLE_FILLCOLOR]: '#F3E5F5',
                [window.mxConstants.STYLE_STROKECOLOR]: '#7B1FA2',
                [window.mxConstants.STYLE_FONTCOLOR]: '#7B1FA2'
            },
            'dataProperty': {
                [window.mxConstants.STYLE_FILLCOLOR]: '#E8F5E8',
                [window.mxConstants.STYLE_STROKECOLOR]: '#388E3C',
                [window.mxConstants.STYLE_FONTCOLOR]: '#388E3C'
            },
            'individual': {
                [window.mxConstants.STYLE_FILLCOLOR]: '#FFF3E0',
                [window.mxConstants.STYLE_STROKECOLOR]: '#F57C00',
                [window.mxConstants.STYLE_FONTCOLOR]: '#F57C00'
            }
        };

        Object.entries(styles).forEach(([key, style]) => {
            stylesheet.putCellStyle(key, style);
        });
    };

    const addSampleOntologyElements = (graph: any) => {
        const parent = graph.getDefaultParent();

        graph.model.beginUpdate();
        try {
            // Add sample classes
            const decisionClass = graph.insertVertex(parent, 'decision', 'Decision', 100, 50, 120, 60, 'class');
            const criteriaClass = graph.insertVertex(parent, 'criteria', 'Criteria', 300, 50, 120, 60, 'class');
            const alternativeClass = graph.insertVertex(parent, 'alternative', 'Alternative', 500, 50, 120, 60, 'class');

            // Add sample properties
            const hasProperty = graph.insertVertex(parent, 'has', 'has', 200, 150, 80, 40, 'objectProperty');
            const evaluatesProperty = graph.insertVertex(parent, 'evaluates', 'evaluates', 400, 150, 80, 40, 'objectProperty');

            // Add sample individuals
            const myDecision = graph.insertVertex(parent, 'myDecision', 'MyDecision', 100, 250, 120, 60, 'individual');

            // Add relationships
            graph.insertEdge(parent, 'edge1', 'subClassOf', alternativeClass, decisionClass);
            graph.insertEdge(parent, 'edge2', 'hasCriteria', decisionClass, criteriaClass);

        } finally {
            graph.model.endUpdate();
        }
    };

    const handleToolbarAction = (actionType: string) => {
        const graph = graphRef.current;
        if (!graph) return;

        switch (actionType) {
            case 'class':
                addOntologyElement('class');
                break;
            case 'objectProperty':
                addOntologyElement('objectProperty');
                break;
            case 'dataProperty':
                addOntologyElement('dataProperty');
                break;
            case 'individual':
                addOntologyElement('individual');
                break;
            case 'validate':
                validateOntology();
                break;
            case 'export':
                exportOntology();
                break;
        }
    };

    const addOntologyElement = (type: string) => {
        const graph = graphRef.current;
        if (!graph) return;

        const parent = graph.getDefaultParent();
        const x = Math.random() * 400 + 50;
        const y = Math.random() * 300 + 50;

        graph.model.beginUpdate();
        try {
            const label = `New${type.charAt(0).toUpperCase() + type.slice(1)}`;
            graph.insertVertex(parent, null, label, x, y, 120, 60, type);
        } finally {
            graph.model.endUpdate();
        }
    };

    const handleElementSelection = (cell: any) => {
        if (cell && cell.value) {
            const element: OntologyElement = {
                id: cell.id,
                type: cell.style || 'class',
                label: cell.value,
                iri: `http://example.org/ontology#${cell.value}`,
                properties: {}
            };
            setSelectedElement(element);
        } else {
            setSelectedElement(null);
        }
    };

    const validateOntology = () => {
        // Simulate ontology validation
        const warnings = [
            'Class "Decision" lacks proper documentation',
            'Property "has" should have domain and range defined',
            'Individual "MyDecision" type should be explicitly stated'
        ];

        setValidationWarnings(warnings);
        onValidate?.({
            valid: warnings.length === 0,
            warnings,
            errors: []
        });
    };

    const exportOntology = () => {
        const graph = graphRef.current;
        if (!graph) return;

        // Extract ontology data from graph
        const cells = graph.model.cells;
        const ontologyData: {
            classes: Array<{ id: string, label: string, type: string, position: { x: number, y: number } | null }>,
            properties: Array<{ id: string, label: string, type: string, position: { x: number, y: number } | null }>,
            individuals: Array<{ id: string, label: string, type: string, position: { x: number, y: number } | null }>,
            relationships: Array<any>
        } = {
            classes: [],
            properties: [],
            individuals: [],
            relationships: []
        };

        // Process cells and extract ontology information
        Object.values(cells).forEach((cell: any) => {
            if (cell.vertex) {
                const element = {
                    id: cell.id,
                    label: cell.value,
                    type: cell.style,
                    position: cell.geometry ? { x: cell.geometry.x, y: cell.geometry.y } : null
                };

                switch (cell.style) {
                    case 'class':
                        ontologyData.classes.push(element);
                        break;
                    case 'objectProperty':
                    case 'dataProperty':
                        ontologyData.properties.push(element);
                        break;
                    case 'individual':
                        ontologyData.individuals.push(element);
                        break;
                }
            }
        });

        onSave?.(ontologyData);
    };

    const updateGraphTheme = () => {
        const graph = graphRef.current;
        if (!graph || !containerRef.current) return;

        // Update container background based on theme
        const isDark = theme === 'dark';
        containerRef.current.style.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';

        // Update graph background
        graph.view.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff');
        graph.refresh();
    };

    return (
        <div className={`mxgraph-ontology-editor ${className}`} style={{ height }}>
            {/* Toolbar */}
            <div
                ref={toolbarRef}
                className="bg-theme-surface border-b border-theme-border p-2 flex flex-wrap items-center"
                style={{ minHeight: '60px' }}
            />

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center h-full bg-theme-surface">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent-primary mx-auto mb-2"></div>
                        <p className="text-theme-text-secondary">Loading Onto4ALL-style Editor...</p>
                    </div>
                </div>
            )}

            {/* Graph Container */}
            <div className="flex h-full">
                <div
                    ref={containerRef}
                    className="flex-1 bg-theme-surface"
                    style={{
                        height: 'calc(100% - 60px)',
                        display: isLoading ? 'none' : 'block',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                />

                {/* Properties Panel */}
                <div className="w-80 bg-theme-surface border-l border-theme-border p-4 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Properties</h3>

                    {selectedElement ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Element Type
                                </label>
                                <div className="text-theme-text-primary capitalize">
                                    {selectedElement.type}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={selectedElement.label}
                                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                                    onChange={(e) => setSelectedElement({
                                        ...selectedElement,
                                        label: e.target.value
                                    })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    IRI
                                </label>
                                <input
                                    type="text"
                                    value={selectedElement.iri || ''}
                                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                                    onChange={(e) => setSelectedElement({
                                        ...selectedElement,
                                        iri: e.target.value
                                    })}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-theme-text-secondary">Select an element to edit its properties</p>
                    )}

                    {/* Validation Warnings */}
                    {validationWarnings.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-medium text-theme-accent-warning mb-2">
                                Validation Warnings
                            </h4>
                            <ul className="space-y-1">
                                {validationWarnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-theme-text-secondary">
                                        ⚠️ {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 