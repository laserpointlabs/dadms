'use client';

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    BackgroundVariant,
    Connection,
    Controls,
    Edge,
    EdgeTypes,
    MarkerType,
    MiniMap,
    Node,
    NodeTypes,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useTheme } from '../../contexts/ThemeContext';

// Custom Node Components
const ClassNode = ({ data, selected }: { data: any; selected: boolean }) => {
    return (
        <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[120px] bg-blue-50 border-blue-400 text-blue-800 ${selected ? 'ring-2 ring-blue-500' : ''
            }`}>
            <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <div className="font-semibold text-sm">{data.label}</div>
            </div>
            {data.description && (
                <div className="text-xs text-blue-600 mt-1">{data.description}</div>
            )}
        </div>
    );
};

const ObjectPropertyNode = ({ data, selected }: { data: any; selected: boolean }) => {
    return (
        <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[120px] bg-purple-50 border-purple-400 text-purple-800 ${selected ? 'ring-2 ring-purple-500' : ''
            }`}>
            <div className="flex items-center gap-2">
                <span className="text-lg">🔗</span>
                <div className="font-semibold text-sm">{data.label}</div>
            </div>
            {data.domain && data.range && (
                <div className="text-xs text-purple-600 mt-1">
                    {data.domain} → {data.range}
                </div>
            )}
        </div>
    );
};

const DataPropertyNode = ({ data, selected }: { data: any; selected: boolean }) => {
    return (
        <div className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[120px] bg-green-50 border-green-400 text-green-800 ${selected ? 'ring-2 ring-green-500' : ''
            }`}>
            <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div className="font-semibold text-sm">{data.label}</div>
            </div>
            {data.datatype && (
                <div className="text-xs text-green-600 mt-1">Type: {data.datatype}</div>
            )}
        </div>
    );
};

// Define node types
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    objectPropertyNode: ObjectPropertyNode,
    dataPropertyNode: DataPropertyNode,
};

// Define edge types with custom styling
const customEdgeTypes: EdgeTypes = {
    'subClassOf': {
        type: 'smoothstep',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3B82F6',
        },
        style: { stroke: '#3B82F6', strokeWidth: 2 },
    },
    'hasProperty': {
        type: 'straight',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#8B5CF6',
        },
        style: { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '5,5' },
    },
    'hasDataProperty': {
        type: 'straight',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#10B981',
        },
        style: { stroke: '#10B981', strokeWidth: 2, strokeDasharray: '3,3' },
    },
};

interface ReactFlowOntologyEditorProps {
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
    type: 'class' | 'objectProperty' | 'dataProperty';
    label: string;
    iri?: string;
    description?: string;
    domain?: string;
    range?: string;
    datatype?: string;
}

export const ReactFlowOntologyEditor: React.FC<ReactFlowOntologyEditorProps> = ({
    className = '',
    height = '100vh',
    workspaceId,
    ontologyId,
    onLoad,
    onError,
    onSave,
    onValidate
}) => {
    const { theme } = useTheme();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedElement, setSelectedElement] = useState<OntologyElement | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    // Initialize with sample ontology elements
    React.useEffect(() => {
        const initialNodes: Node[] = [
            {
                id: 'decision-class',
                type: 'classNode',
                position: { x: 100, y: 100 },
                data: {
                    label: 'Decision',
                    description: 'A decision to be made',
                    iri: 'http://example.org/ontology#Decision'
                },
            },
            {
                id: 'criteria-class',
                type: 'classNode',
                position: { x: 400, y: 100 },
                data: {
                    label: 'Criteria',
                    description: 'Decision criteria',
                    iri: 'http://example.org/ontology#Criteria'
                },
            },
            {
                id: 'alternative-class',
                type: 'classNode',
                position: { x: 250, y: 300 },
                data: {
                    label: 'Alternative',
                    description: 'A possible choice',
                    iri: 'http://example.org/ontology#Alternative'
                },
            },
            {
                id: 'hasCriteria-property',
                type: 'objectPropertyNode',
                position: { x: 600, y: 200 },
                data: {
                    label: 'hasCriteria',
                    domain: 'Decision',
                    range: 'Criteria',
                    iri: 'http://example.org/ontology#hasCriteria'
                },
            },
            {
                id: 'priority-data-property',
                type: 'dataPropertyNode',
                position: { x: 100, y: 400 },
                data: {
                    label: 'priority',
                    datatype: 'integer',
                    iri: 'http://example.org/ontology#priority'
                },
            },
        ];

        const initialEdges: Edge[] = [
            {
                id: 'e1-2',
                source: 'alternative-class',
                target: 'decision-class',
                type: 'subClassOf',
                label: 'subClassOf',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#3B82F6',
                },
                style: { stroke: '#3B82F6', strokeWidth: 2 },
            },
            {
                id: 'e2-3',
                source: 'decision-class',
                target: 'criteria-class',
                type: 'hasProperty',
                label: 'hasCriteria',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#8B5CF6',
                },
                style: { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '5,5' },
            },
        ];

        setNodes(initialNodes);
        setEdges(initialEdges);
        onLoad?.();
    }, [onLoad, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => {
            const edge: Edge = {
                ...params,
                type: 'smoothstep',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                },
                style: { stroke: '#6B7280', strokeWidth: 2 },
            };
            setEdges((eds) => addEdge(edge, eds));
        },
        [setEdges]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        const element: OntologyElement = {
            id: node.id,
            type: node.type === 'classNode' ? 'class'
                : node.type === 'objectPropertyNode' ? 'objectProperty'
                    : 'dataProperty',
            label: node.data.label,
            iri: node.data.iri,
            description: node.data.description,
            domain: node.data.domain,
            range: node.data.range,
            datatype: node.data.datatype,
        };
        setSelectedElement(element);
        setSelectedNodes([node.id]);
    }, []);

    const addNewElement = useCallback((type: 'class' | 'objectProperty' | 'dataProperty') => {
        const id = `${type}-${Date.now()}`;
        const position = {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100
        };

        let nodeType: string;
        let data: any;

        switch (type) {
            case 'class':
                nodeType = 'classNode';
                data = {
                    label: 'NewClass',
                    description: 'A new ontology class',
                    iri: `http://example.org/ontology#NewClass${Date.now()}`
                };
                break;
            case 'objectProperty':
                nodeType = 'objectPropertyNode';
                data = {
                    label: 'newProperty',
                    domain: 'Domain',
                    range: 'Range',
                    iri: `http://example.org/ontology#newProperty${Date.now()}`
                };
                break;
            case 'dataProperty':
                nodeType = 'dataPropertyNode';
                data = {
                    label: 'newDataProperty',
                    datatype: 'string',
                    iri: `http://example.org/ontology#newDataProperty${Date.now()}`
                };
                break;
        }

        const newNode: Node = {
            id,
            type: nodeType,
            position,
            data,
        };

        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const updateSelectedElement = useCallback((updates: Partial<OntologyElement>) => {
        if (!selectedElement) return;

        setSelectedElement(prev => prev ? { ...prev, ...updates } : null);

        // Update the node data
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedElement.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...updates,
                        },
                    };
                }
                return node;
            })
        );
    }, [selectedElement, setNodes]);

    const validateOntology = useCallback(() => {
        const warnings: string[] = [];

        // Check for isolated nodes
        const connectedNodeIds = new Set();
        edges.forEach(edge => {
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        });

        nodes.forEach(node => {
            if (!connectedNodeIds.has(node.id)) {
                warnings.push(`Node "${node.data.label}" is not connected to any other nodes`);
            }

            if (!node.data.iri) {
                warnings.push(`Node "${node.data.label}" lacks a proper IRI`);
            }
        });

        setValidationWarnings(warnings);
        onValidate?.({
            valid: warnings.length === 0,
            warnings,
            errors: []
        });
    }, [nodes, edges, onValidate]);

    const exportOntology = useCallback(() => {
        const ontologyData = {
            classes: nodes
                .filter(node => node.type === 'classNode')
                .map(node => ({
                    id: node.id,
                    label: node.data.label,
                    iri: node.data.iri,
                    description: node.data.description,
                    position: node.position,
                })),
            objectProperties: nodes
                .filter(node => node.type === 'objectPropertyNode')
                .map(node => ({
                    id: node.id,
                    label: node.data.label,
                    iri: node.data.iri,
                    domain: node.data.domain,
                    range: node.data.range,
                    position: node.position,
                })),
            dataProperties: nodes
                .filter(node => node.type === 'dataPropertyNode')
                .map(node => ({
                    id: node.id,
                    label: node.data.label,
                    iri: node.data.iri,
                    datatype: node.data.datatype,
                    position: node.position,
                })),
            relationships: edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: edge.type,
                label: edge.label,
            })),
        };

        onSave?.(ontologyData);
    }, [nodes, edges, onSave]);

    const backgroundStyle = useMemo(() => ({
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    }), [theme]);

    return (
        <div className={`react-flow-ontology-editor ${className}`} style={{ height }}>
            {/* Toolbar */}
            <div className="bg-theme-surface border-b border-theme-border p-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => addNewElement('class')}
                        className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                        🏛️ Add Class
                    </button>
                    <button
                        onClick={() => addNewElement('objectProperty')}
                        className="px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
                    >
                        🔗 Add Object Property
                    </button>
                    <button
                        onClick={() => addNewElement('dataProperty')}
                        className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        📊 Add Data Property
                    </button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={validateOntology}
                        className="px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                    >
                        ✅ Validate
                    </button>
                    <button
                        onClick={exportOntology}
                        className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        💾 Export
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex h-full">
                {/* React Flow Canvas */}
                <div className="flex-1" style={backgroundStyle}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        edgeTypes={customEdgeTypes}
                        connectionLineType="smoothstep"
                        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        attributionPosition="bottom-left"
                    >
                        <Controls />
                        <MiniMap
                            style={{
                                height: 120,
                                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9',
                            }}
                            zoomable
                            pannable
                        />
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1}
                            color={theme === 'dark' ? '#333' : '#ccc'}
                        />
                    </ReactFlow>
                </div>

                {/* Properties Panel */}
                <div className="w-80 bg-theme-surface border-l border-theme-border p-4 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Properties</h3>

                    {selectedElement ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Element Type
                                </label>
                                <div className="text-theme-text-primary capitalize px-3 py-2 bg-theme-background rounded border">
                                    {selectedElement.type === 'class' ? '🏛️ Class' :
                                        selectedElement.type === 'objectProperty' ? '🔗 Object Property' :
                                            '📊 Data Property'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={selectedElement.label}
                                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => updateSelectedElement({ label: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                    IRI
                                </label>
                                <input
                                    type="text"
                                    value={selectedElement.iri || ''}
                                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => updateSelectedElement({ iri: e.target.value })}
                                />
                            </div>

                            {selectedElement.type === 'class' && (
                                <div>
                                    <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={selectedElement.description || ''}
                                        className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        onChange={(e) => updateSelectedElement({ description: e.target.value })}
                                    />
                                </div>
                            )}

                            {selectedElement.type === 'objectProperty' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                            Domain
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedElement.domain || ''}
                                            className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onChange={(e) => updateSelectedElement({ domain: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                            Range
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedElement.range || ''}
                                            className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onChange={(e) => updateSelectedElement({ range: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedElement.type === 'dataProperty' && (
                                <div>
                                    <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                                        Data Type
                                    </label>
                                    <select
                                        value={selectedElement.datatype || 'string'}
                                        className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => updateSelectedElement({ datatype: e.target.value })}
                                    >
                                        <option value="string">string</option>
                                        <option value="integer">integer</option>
                                        <option value="float">float</option>
                                        <option value="boolean">boolean</option>
                                        <option value="date">date</option>
                                        <option value="dateTime">dateTime</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-theme-text-secondary">Select an element to edit its properties</p>
                    )}

                    {/* Validation Warnings */}
                    {validationWarnings.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-medium text-yellow-600 mb-2">
                                Validation Warnings
                            </h4>
                            <ul className="space-y-1">
                                {validationWarnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-theme-text-secondary bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                                        ⚠️ {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-6">
                        <h4 className="text-md font-medium text-theme-text-primary mb-2">Legend</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
                                <span className="text-theme-text-secondary">Classes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded"></div>
                                <span className="text-theme-text-secondary">Object Properties</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                                <span className="text-theme-text-secondary">Data Properties</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 