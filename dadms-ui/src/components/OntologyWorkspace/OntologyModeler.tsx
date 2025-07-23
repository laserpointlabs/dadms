"use client";

import React, { useCallback, useRef } from 'react';
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
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { dadmsTheme } from '../../design-system/theme';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';
import { useOntologyWorkspaceStore } from './store';
import { OntologyEdge, OntologyNode } from './types';

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
            const newEdge: OntologyEdge = {
                ...params,
                id: `edge-${Date.now()}`,
                type: 'dadms_relationship',
                data: {
                    relationshipType: 'relates_to', // Default relationship type
                },
            } as OntologyEdge;

            setEdges((eds) => addEdge(newEdge, eds));
            storeAddEdge(newEdge);
        },
        [setEdges, storeAddEdge],
    );

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
                    case 'object_property':
                        return 'hasRelation';
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
                    case 'object_property':
                        return 'Object Property';
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
        },
        [project, setNodes, addNode],
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
        <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%' }}>
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
                            case 'object_property':
                                return dadmsTheme.colors.accent.success;
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