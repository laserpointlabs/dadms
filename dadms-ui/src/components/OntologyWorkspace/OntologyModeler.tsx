"use client";

import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    BackgroundVariant,
    Connection,
    Controls,
    Edge,
    EdgeTypes,
    MiniMap,
    Node,
    NodeChange,
    NodeTypes,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { dadmsTheme } from '../../design-system/theme';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';
import { useOntologyWorkspaceStore } from './store';
import { DADMSRelationshipType, OntologyEdge, OntologyNode } from './types';

// Relationship Type Selector Component
interface RelationshipSelectorProps {
    isVisible: boolean;
    position: { x: number; y: number };
    onSelect: (relationshipType: DADMSRelationshipType) => void;
    onCancel: () => void;
}

const RelationshipSelector: React.FC<RelationshipSelectorProps> = ({
    isVisible,
    position,
    onSelect,
    onCancel
}) => {
    const [customRelationship, setCustomRelationship] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Reset state when selector becomes visible
    React.useEffect(() => {
        if (isVisible) {
            setCustomRelationship('');
            setShowCustomInput(false);
        }
    }, [isVisible]);

    const relationshipGroups = [
        {
            title: "Decision Intelligence",
            relationships: [
                { type: 'influences' as const, label: 'Influences', description: 'One entity influences another' },
                { type: 'depends_on' as const, label: 'Depends On', description: 'One entity depends on another' },
                { type: 'conflicts_with' as const, label: 'Conflicts With', description: 'Entities are in conflict' },
                { type: 'supports_decision' as const, label: 'Supports Decision', description: 'Supports a decision' },
            ]
        },
        {
            title: "Organizational",
            relationships: [
                { type: 'has_stakeholder' as const, label: 'Has Stakeholder', description: 'Has a stakeholder' },
                { type: 'has_responsibility' as const, label: 'Has Responsibility', description: 'Has responsibility for' },
                { type: 'manages' as const, label: 'Manages', description: 'Manages or oversees' },
                { type: 'reports_to' as const, label: 'Reports To', description: 'Reports to' },
            ]
        },
        {
            title: "Basic",
            relationships: [
                { type: 'relates_to' as const, label: 'Relates To', description: 'General relationship' },
                { type: 'has_property' as const, label: 'Has Property', description: 'Has a property' },
                { type: 'part_of' as const, label: 'Part Of', description: 'Is part of' },
            ]
        }
    ];

    const handleCustomSubmit = () => {
        if (customRelationship.trim()) {
            // Convert custom string to valid relationship type format
            const customType = customRelationship.trim().toLowerCase().replace(/\s+/g, '_') as DADMSRelationshipType;
            onSelect(customType);
            setCustomRelationship('');
            setShowCustomInput(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            background: dadmsTheme.colors.background.elevated,
            border: `1px solid ${dadmsTheme.colors.border.default}`,
            borderRadius: dadmsTheme.borderRadius.lg,
            boxShadow: dadmsTheme.shadows.lg,
            zIndex: dadmsTheme.zIndex.modal,
            minWidth: '320px',
            maxHeight: '500px',
            overflowY: 'auto',
            fontFamily: dadmsTheme.typography.fontFamily.default,
        }}>
            <div style={{
                padding: dadmsTheme.spacing.md,
                borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
                background: dadmsTheme.colors.background.secondary,
                borderRadius: `${dadmsTheme.borderRadius.lg} ${dadmsTheme.borderRadius.lg} 0 0`,
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: dadmsTheme.typography.fontSize.md,
                        fontWeight: dadmsTheme.typography.fontWeight.semibold,
                        color: dadmsTheme.colors.text.primary,
                    }}>Select Relationship Type</h3>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: dadmsTheme.colors.text.secondary,
                            fontSize: dadmsTheme.typography.fontSize.lg,
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Custom Relationship Input */}
            <div style={{ padding: dadmsTheme.spacing.sm }}>
                {showCustomInput ? (
                    <div style={{
                        padding: dadmsTheme.spacing.sm,
                        background: dadmsTheme.colors.background.primary,
                        border: `1px solid ${dadmsTheme.colors.accent.primary}`,
                        borderRadius: dadmsTheme.borderRadius.md,
                        marginBottom: dadmsTheme.spacing.sm,
                    }}>
                        <h4 style={{
                            margin: `0 0 ${dadmsTheme.spacing.xs} 0`,
                            fontSize: dadmsTheme.typography.fontSize.sm,
                            fontWeight: dadmsTheme.typography.fontWeight.medium,
                            color: dadmsTheme.colors.text.primary,
                        }}>Custom Relationship</h4>
                        <div style={{ display: 'flex', gap: dadmsTheme.spacing.xs }}>
                            <input
                                type="text"
                                value={customRelationship}
                                onChange={(e) => setCustomRelationship(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCustomSubmit();
                                    if (e.key === 'Escape') setShowCustomInput(false);
                                }}
                                placeholder="e.g., 'owns', 'created by', 'similar to'"
                                style={{
                                    flex: 1,
                                    padding: dadmsTheme.spacing.xs,
                                    border: `1px solid ${dadmsTheme.colors.border.default}`,
                                    borderRadius: dadmsTheme.borderRadius.sm,
                                    fontSize: dadmsTheme.typography.fontSize.sm,
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handleCustomSubmit}
                                disabled={!customRelationship.trim()}
                                style={{
                                    padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
                                    background: dadmsTheme.colors.accent.success,
                                    color: dadmsTheme.colors.text.inverse,
                                    border: 'none',
                                    borderRadius: dadmsTheme.borderRadius.sm,
                                    cursor: customRelationship.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: dadmsTheme.typography.fontSize.sm,
                                }}
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCustomInput(false)}
                                style={{
                                    padding: dadmsTheme.spacing.xs,
                                    background: dadmsTheme.colors.background.secondary,
                                    border: `1px solid ${dadmsTheme.colors.border.default}`,
                                    borderRadius: dadmsTheme.borderRadius.sm,
                                    cursor: 'pointer',
                                    fontSize: dadmsTheme.typography.fontSize.sm,
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCustomInput(true)}
                        style={{
                            width: '100%',
                            padding: dadmsTheme.spacing.sm,
                            background: dadmsTheme.colors.accent.primary,
                            color: dadmsTheme.colors.text.inverse,
                            border: 'none',
                            borderRadius: dadmsTheme.borderRadius.md,
                            cursor: 'pointer',
                            fontSize: dadmsTheme.typography.fontSize.sm,
                            fontWeight: dadmsTheme.typography.fontWeight.medium,
                            marginBottom: dadmsTheme.spacing.sm,
                        }}
                    >
                        + Create Custom Relationship
                    </button>
                )}
            </div>

            {relationshipGroups.map((group) => (
                <div key={group.title} style={{ padding: dadmsTheme.spacing.sm }}>
                    <h4 style={{
                        margin: `${dadmsTheme.spacing.sm} 0 ${dadmsTheme.spacing.xs} 0`,
                        fontSize: dadmsTheme.typography.fontSize.sm,
                        fontWeight: dadmsTheme.typography.fontWeight.medium,
                        color: dadmsTheme.colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>{group.title}</h4>

                    {group.relationships.map((rel) => (
                        <button
                            key={rel.type}
                            onClick={() => onSelect(rel.type)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: dadmsTheme.spacing.sm,
                                marginBottom: dadmsTheme.spacing.xs,
                                background: dadmsTheme.colors.background.primary,
                                border: `1px solid ${dadmsTheme.colors.border.default}`,
                                borderRadius: dadmsTheme.borderRadius.md,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: dadmsTheme.transitions.fast,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = dadmsTheme.colors.background.hover;
                                e.currentTarget.style.borderColor = dadmsTheme.colors.accent.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = dadmsTheme.colors.background.primary;
                                e.currentTarget.style.borderColor = dadmsTheme.colors.border.default;
                            }}
                        >
                            <div style={{
                                fontSize: dadmsTheme.typography.fontSize.sm,
                                fontWeight: dadmsTheme.typography.fontWeight.medium,
                                color: dadmsTheme.colors.text.primary,
                                marginBottom: '2px',
                            }}>{rel.label}</div>
                            <div style={{
                                fontSize: dadmsTheme.typography.fontSize.xs,
                                color: dadmsTheme.colors.text.secondary,
                            }}>{rel.description}</div>
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

const OntologyModelerInner: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { project } = useReactFlow();

    const {
        activeOntology,
        selectedNodes,
        selectedEdges,
        addNode,
        addEdge: storeAddEdge,
        setSelectedNodes,
        setSelectedEdges,
        updateNode,
        updateEdge,
        deleteNode,
        deleteEdge,
        updateNodePositions,
    } = useOntologyWorkspaceStore();

    const [nodes, setNodes, onNodesChange] = useNodesState(activeOntology?.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(activeOntology?.edges || []);
    const [isConnectionMode, setIsConnectionMode] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    // Sync with store when activeOntology changes
    React.useEffect(() => {
        if (activeOntology) {
            setNodes(activeOntology.nodes);
            setEdges(activeOntology.edges);
        }
    }, [activeOntology, setNodes, setEdges]);

    // Handle node position changes and persist them
    const onNodeDragStop = useCallback(
        (event: React.MouseEvent, node: Node) => {
            // Update the position in the store
            updateNodePositions([{ id: node.id, position: node.position }]);
        },
        [updateNodePositions],
    );

    // Handle multiple node position changes (for batch updates)
    const onNodesChangeHandler = useCallback(
        (changes: NodeChange[]) => {
            onNodesChange(changes);

            // Check if any changes are position changes
            const positionChanges = changes
                .filter((change): change is NodeChange & { type: 'position'; id: string; position?: { x: number; y: number } } =>
                    change.type === 'position' && 'position' in change && change.position !== undefined
                )
                .map(change => ({
                    id: change.id,
                    position: change.position!
                }));

            if (positionChanges.length > 0) {
                updateNodePositions(positionChanges);
            }
        },
        [onNodesChange, updateNodePositions],
    );

    const onConnect = useCallback(
        (params: Connection | Edge) => {
            // Convert Edge to Connection if needed
            const connection: Connection = 'sourceHandle' in params && params.sourceHandle !== undefined
                ? params as Connection
                : {
                    source: params.source,
                    target: params.target,
                    sourceHandle: params.sourceHandle || null,
                    targetHandle: params.targetHandle || null,
                };

            // Store the connection parameters and show the relationship selector
            setPendingConnection(connection);

            // Calculate position for the selector (center of the canvas)
            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            if (reactFlowBounds) {
                setSelectorPosition({
                    x: reactFlowBounds.width / 2 - 160, // Center horizontally (160 is half of selector width)
                    y: reactFlowBounds.height / 2 - 100, // Center vertically
                });
            } else {
                // Fallback position if bounds are not available
                setSelectorPosition({ x: 200, y: 200 });
            }
        },
        [],
    );

    const handleRelationshipSelect = useCallback(
        (relationshipType: DADMSRelationshipType) => {
            if (pendingConnection) {
                try {
                    const newEdge: OntologyEdge = {
                        ...pendingConnection,
                        id: `edge-${Date.now()}`,
                        type: 'dadms_relationship',
                        data: {
                            relationshipType,
                            properties: {},
                            strength: 1.0,
                            isInferred: false,
                        },
                    } as OntologyEdge;

                    setEdges((eds) => addEdge(newEdge, eds));
                    storeAddEdge(newEdge);

                    // Automatically select the newly created edge to show its properties
                    setSelectedNodes([]);
                    setSelectedEdges([newEdge.id]);

                    console.log('Successfully created edge:', newEdge);
                } catch (error) {
                    console.error('Error creating edge:', error);
                }
            }

            // Always clear the pending connection and hide selector
            setPendingConnection(null);
        },
        [pendingConnection, setEdges, storeAddEdge, setSelectedNodes, setSelectedEdges],
    );

    const handleRelationshipCancel = useCallback(() => {
        setPendingConnection(null);
        console.log('Relationship creation cancelled');
    }, []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type || !reactFlowBounds) {
                return;
            }

            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            // Create better default labels based on type
            const getDefaultLabel = (nodeType: string) => {
                switch (nodeType) {
                    case 'entity':
                        return 'MyEntity';
                    case 'data_property':
                        return 'hasValue';
                    default:
                        return 'NewElement';
                }
            };

            const getEntityType = (nodeType: string) => {
                switch (nodeType) {
                    case 'entity':
                        return 'Entity';
                    case 'data_property':
                        return 'Data Property';
                    default:
                        return 'Element';
                }
            };

            const newNode: OntologyNode = {
                id: `node-${Date.now()}`,
                type,
                position,
                data: {
                    label: getDefaultLabel(type),
                    entityType: getEntityType(type),
                    properties: {},
                    description: '',
                },
            };

            setNodes((nds) => nds.concat(newNode));
            addNode(newNode);

            // Automatically select the newly created node
            setSelectedNodes([newNode.id]);
            setSelectedEdges([]);
        },
        [project, setNodes, addNode, setSelectedNodes, setSelectedEdges],
    );

    const onSelectionChange = useCallback(
        ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
            setSelectedNodes(selectedNodes.map(n => n.id));
            setSelectedEdges(selectedEdges.map(e => e.id));
        },
        [setSelectedNodes, setSelectedEdges],
    );

    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            console.log('Node clicked:', node);
        },
        [],
    );

    const onEdgeClick = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            console.log('Edge clicked:', edge);
        },
        [],
    );

    // Handle canvas click to show ontology properties
    const onPaneClick = useCallback(
        (event: React.MouseEvent) => {
            // Clear node and edge selections to show ontology properties
            setSelectedNodes([]);
            setSelectedEdges([]);
            console.log('Canvas clicked - showing ontology properties');
        },
        [setSelectedNodes, setSelectedEdges],
    );

    // Custom styles for DADMS theme
    const reactFlowStyle = {
        background: dadmsTheme.colors.background.primary,
        height: '100%',
        width: '100%',
    };

    const minimapStyle = {
        backgroundColor: dadmsTheme.colors.background.secondary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
    };

    const controlsStyle = {
        backgroundColor: dadmsTheme.colors.background.secondary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.md,
    };

    return (
        <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeHandler}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onSelectionChange={onSelectionChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onNodeDragStop={onNodeDragStop}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes as NodeTypes}
                edgeTypes={edgeTypes as EdgeTypes}
                style={reactFlowStyle}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                attributionPosition="bottom-left"
                snapToGrid={true}
                snapGrid={[15, 15]}
                deleteKeyCode="Delete"
                multiSelectionKeyCode="Ctrl"
                panOnScroll={true}
                panOnScrollSpeed={0.5}
                zoomOnScroll={true}
                zoomOnPinch={true}
                zoomOnDoubleClick={false}
                selectNodesOnDrag={false}
                fitView={false}
            >
                <Controls
                    style={controlsStyle}
                    showZoom={true}
                    showFitView={true}
                    showInteractive={true}
                    position="top-left"
                />

                <MiniMap
                    style={minimapStyle}
                    nodeColor={(node) => {
                        switch (node.type) {
                            case 'entity':
                                return dadmsTheme.colors.accent.primary;
                            case 'data_property':
                                return dadmsTheme.colors.accent.info;
                            case 'external_reference':
                                return dadmsTheme.colors.border.light;
                            default:
                                return dadmsTheme.colors.border.default;
                        }
                    }}
                    nodeStrokeWidth={2}
                    position="bottom-right"
                    pannable={true}
                    zoomable={true}
                />

                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color={dadmsTheme.colors.border.default}
                />
            </ReactFlow>

            {/* Relationship Type Selector */}
            <RelationshipSelector
                isVisible={pendingConnection !== null}
                position={selectorPosition}
                onSelect={handleRelationshipSelect}
                onCancel={handleRelationshipCancel}
            />
        </div>
    );
};

const OntologyModeler: React.FC = () => {
    return (
        <ReactFlowProvider>
            <OntologyModelerInner />
        </ReactFlowProvider>
    );
};

export default OntologyModeler; 