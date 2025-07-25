"use client";

import React, { useCallback, useRef, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { SysMLConnectionType, SysMLEdge, useSysMLWorkspaceStore } from './store';

// Connection Type Selector Component
interface ConnectionSelectorProps {
    isVisible: boolean;
    position: { x: number; y: number };
    onSelect: (connectionType: SysMLConnectionType) => void;
    onCancel: () => void;
}

const ConnectionSelector: React.FC<ConnectionSelectorProps> = ({
    isVisible,
    position,
    onSelect,
    onCancel
}) => {
    const [customConnection, setCustomConnection] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Get custom connection types from store
    const { activeModel, addCustomConnectionType } = useSysMLWorkspaceStore();
    const customConnectionTypes = activeModel?.customConnectionTypes || [];

    // Helper function to format custom connection type labels
    const formatCustomTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleCustomSubmit = () => {
        if (customConnection.trim()) {
            // Convert custom string to valid connection type format
            const customType = customConnection.trim().toLowerCase().replace(/\s+/g, '_') as SysMLConnectionType;

            console.log('Creating custom connection type:', customType);

            // Add to the model's custom connection types if it doesn't exist
            if (!customConnectionTypes.includes(customType)) {
                addCustomConnectionType(customType);
            }

            onSelect(customType);
            setCustomConnection('');
            setShowCustomInput(false);
        }
    };

    if (!isVisible) return null;

    const connectionGroups = [
        {
            title: "Custom Connections",
            isCustom: true,
            connections: customConnectionTypes.map(type => ({
                type: type,
                label: formatCustomTypeLabel(type),
                description: 'Custom connection type'
            }))
        },
        {
            title: "Structural",
            connections: [
                { type: 'association' as const, label: 'Association', description: 'General association between elements' },
                { type: 'composition' as const, label: 'Composition', description: 'Strong ownership relationship' },
                { type: 'aggregation' as const, label: 'Aggregation', description: 'Weak ownership relationship' },
                { type: 'generalization' as const, label: 'Generalization', description: 'Inheritance relationship' },
            ]
        },
        {
            title: "Behavioral",
            connections: [
                { type: 'dependency' as const, label: 'Dependency', description: 'One element depends on another' },
                { type: 'realization' as const, label: 'Realization', description: 'Implementation relationship' },
                { type: 'flow' as const, label: 'Flow', description: 'Data or control flow' },
                { type: 'transition' as const, label: 'Transition', description: 'State transition' },
            ]
        },
        {
            title: "Requirements",
            connections: [
                { type: 'satisfy' as const, label: 'Satisfy', description: 'Element satisfies requirement' },
                { type: 'verify' as const, label: 'Verify', description: 'Element verifies requirement' },
                { type: 'refine' as const, label: 'Refine', description: 'Element refines another' },
                { type: 'derive' as const, label: 'Derive', description: 'Element derives from another' },
            ]
        }
    ];

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
                    }}>Select Connection Type</h3>
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

            {/* Custom Connection Input */}
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
                        }}>Custom Connection</h4>
                        <div style={{ display: 'flex', gap: dadmsTheme.spacing.xs }}>
                            <input
                                type="text"
                                value={customConnection}
                                onChange={(e) => setCustomConnection(e.target.value)}
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
                                disabled={!customConnection.trim()}
                                style={{
                                    padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
                                    background: dadmsTheme.colors.accent.success,
                                    color: dadmsTheme.colors.text.inverse,
                                    border: 'none',
                                    borderRadius: dadmsTheme.borderRadius.sm,
                                    cursor: customConnection.trim() ? 'pointer' : 'not-allowed',
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
                        + Create Custom Connection
                    </button>
                )}
            </div>

            {connectionGroups
                .filter(group => !group.isCustom || group.connections.length > 0)
                .map((group) => {
                    const isCustomGroup = group.isCustom;

                    return (
                        <div key={group.title} style={{ padding: dadmsTheme.spacing.sm }}>
                            <h4 style={{
                                margin: `0 0 ${dadmsTheme.spacing.xs} 0`,
                                fontSize: dadmsTheme.typography.fontSize.sm,
                                fontWeight: dadmsTheme.typography.fontWeight.medium,
                                color: isCustomGroup ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                {group.title} {isCustomGroup && group.connections.length > 0 && `(${group.connections.length})`}
                            </h4>

                            {group.connections.map((conn) => (
                                <button
                                    key={conn.type}
                                    onClick={() => onSelect(conn.type)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: dadmsTheme.spacing.sm,
                                        marginBottom: dadmsTheme.spacing.xs,
                                        background: dadmsTheme.colors.background.primary,
                                        border: `1px solid ${isCustomGroup ? dadmsTheme.colors.accent.secondary : dadmsTheme.colors.border.default}`,
                                        borderRadius: dadmsTheme.borderRadius.md,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: dadmsTheme.transitions.fast,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = dadmsTheme.colors.background.hover;
                                        e.currentTarget.style.borderColor = isCustomGroup ? dadmsTheme.colors.accent.secondary : dadmsTheme.colors.accent.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = dadmsTheme.colors.background.primary;
                                        e.currentTarget.style.borderColor = isCustomGroup ? dadmsTheme.colors.accent.secondary : dadmsTheme.colors.border.default;
                                    }}
                                >
                                    <div style={{
                                        fontSize: dadmsTheme.typography.fontSize.sm,
                                        fontWeight: dadmsTheme.typography.fontWeight.medium,
                                        color: dadmsTheme.colors.text.primary,
                                        marginBottom: '2px',
                                    }}>{conn.label}</div>
                                    <div style={{
                                        fontSize: dadmsTheme.typography.fontSize.xs,
                                        color: dadmsTheme.colors.text.secondary,
                                    }}>{conn.description}</div>
                                </button>
                            ))}
                        </div>
                    );
                })}
        </div>
    );
};

interface SysMLModelerProps {
    isConnectionMode?: boolean;
}

const SysMLModeler: React.FC<SysMLModelerProps> = ({ isConnectionMode = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        activeModel,
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
        addCustomConnectionType,
    } = useSysMLWorkspaceStore();

    // Use the prop instead of local state
    // const [isConnectionMode, setIsConnectionMode] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<{
        source: string;
        target: string | null;
        startPos?: { x: number; y: number };
    } | null>(null);
    const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
    const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    // Canvas state
    const [canvasState, setCanvasState] = useState({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isPanning: false,
        lastPanPoint: { x: 0, y: 0 },
    });

    // Handle connection selection
    const handleConnectionSelect = useCallback(
        (connectionType: SysMLConnectionType) => {
            if (pendingConnection) {
                try {
                    const newEdge: SysMLEdge = {
                        id: `edge-${Date.now()}`,
                        source: pendingConnection.source,
                        target: pendingConnection.target,
                        type: `sysml_${connectionType}`,
                        data: {
                            connectionType,
                            properties: {},
                            strength: 1.0,
                            isInferred: false,
                        },
                    };

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
        [pendingConnection, storeAddEdge, setSelectedNodes, setSelectedEdges],
    );

    const handleConnectionCancel = useCallback(() => {
        setPendingConnection(null);
        console.log('Connection creation cancelled');
    }, []);

    // Mouse event handlers
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
        const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;

        // Check if clicking on a node
        const clickedNode = activeModel?.nodes.find(node => {
            const nodeX = node.position.x;
            const nodeY = node.position.y;
            const nodeWidth = 120; // Approximate node width
            const clickAttributes = node.data.properties.attributes || [];
            const nodeHeight = clickAttributes.length > 0 ? 100 : 80; // Variable node height
            return x >= nodeX && x <= nodeX + nodeWidth && y >= nodeY && y <= nodeY + nodeHeight;
        });

        if (clickedNode) {
            // If in connection mode, start connection creation
            if (isConnectionMode) {
                if (!pendingConnection) {
                    // Start connection from this node
                    setPendingConnection({
                        source: clickedNode.id,
                        target: null,
                        startPos: { x: e.clientX, y: e.clientY }
                    });
                    setSelectedNodes([clickedNode.id]);
                    setSelectedEdges([]);
                } else if (pendingConnection.source !== clickedNode.id) {
                    // Complete connection to this node
                    setPendingConnection({
                        ...pendingConnection,
                        target: clickedNode.id
                    });
                    setSelectorPosition({ x: e.clientX, y: e.clientY });
                }
            } else {
                // Normal node selection
                setSelectedElement(clickedNode.id);
                setSelectedNodes([clickedNode.id]);
                setSelectedEdges([]);

                // Add visual feedback for selection
                console.log(`Selected block: ${clickedNode.data.label} (${clickedNode.data.elementType})`);

                setIsDragging(true);
                setDragStart({ x: e.clientX, y: e.clientY });
            }
        } else {
            // Clicked on empty space
            if (!isConnectionMode) {
                setSelectedElement(null);
                setSelectedNodes([]);
                setSelectedEdges([]);
            }
        }
    }, [activeModel, canvasState, setSelectedNodes, setSelectedEdges, isConnectionMode, pendingConnection]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging && selectedElement) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            // Update node position
            updateNodePositions([{
                id: selectedElement,
                position: {
                    x: (activeModel?.nodes.find(n => n.id === selectedElement)?.position.x || 0) + deltaX / canvasState.scale,
                    y: (activeModel?.nodes.find(n => n.id === selectedElement)?.position.y || 0) + deltaY / canvasState.scale,
                }
            }]);

            setDragStart({ x: e.clientX, y: e.clientY });
        }

        // Update connection preview
        if (pendingConnection && !pendingConnection.target) {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
                const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;
                setConnectionPreview({ x, y });
            }
        }
    }, [isDragging, selectedElement, dragStart, canvasState, activeModel, updateNodePositions, pendingConnection]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setSelectedElement(null);
    }, []);

    // Handle drag and drop from palette
    const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas || !activeModel) return;

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('application/sysml-element'));
            const elementType = dragData.type as SysMLElementType;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - canvasState.offsetX) / canvasState.scale;
            const y = (e.clientY - rect.top - canvasState.offsetY) / canvasState.scale;

            // Create new node
            const newNode: SysMLNode = {
                id: `node-${Date.now()}`,
                type: 'sysml-node',
                position: { x: Math.round(x - 60), y: Math.round(y - 40) },
                data: {
                    label: dragData.label || elementType,
                    elementType: elementType,
                    properties: {},
                    description: `New ${elementType}`,
                    stereotype: undefined,
                    visibility: 'public',
                    isAbstract: false,
                    isLeaf: false,
                    isRoot: false,
                    multiplicity: '1',
                    type: undefined,
                    defaultValue: undefined,
                    isDerived: false,
                    isReadOnly: false,
                    isOrdered: false,
                    isUnique: false,
                    direction: undefined,
                    isBehavior: false,
                    isService: false,
                    isConjugated: false,
                    isFlow: false,
                    isAtomic: false,
                    isActive: false,
                    isReentrant: false,
                    guard: undefined,
                    effect: undefined,
                    trigger: undefined,
                    entry: undefined,
                    exit: undefined,
                    do: undefined,
                    invariant: undefined,
                    constraint: undefined,
                    requirement: undefined,
                    verification: undefined,
                    satisfaction: undefined,
                    derivation: undefined,
                    refinement: undefined,
                    trace: undefined,
                    noteContent: undefined,
                    noteType: undefined,
                    noteAuthor: undefined,
                    noteCreated: undefined,
                    noteLastModified: undefined
                }
            };

            addNode(newNode);
            setSelectedNodes([newNode.id]);
            setSelectedEdges([]);
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    }, [activeModel, canvasState, addNode, setSelectedNodes, setSelectedEdges]);

    // Render canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !activeModel) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations
        ctx.save();
        ctx.translate(canvasState.offsetX, canvasState.offsetY);
        ctx.scale(canvasState.scale, canvasState.scale);

        // Draw grid
        const gridSize = 20;
        ctx.strokeStyle = dadmsTheme.colors.border.light;
        ctx.lineWidth = 0.5;

        for (let x = 0; x < canvas.width / canvasState.scale; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height / canvasState.scale);
            ctx.stroke();
        }

        for (let y = 0; y < canvas.height / canvasState.scale; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width / canvasState.scale, y);
            ctx.stroke();
        }

        // Draw edges
        activeModel.edges.forEach(edge => {
            const sourceNode = activeModel.nodes.find(n => n.id === edge.source);
            const targetNode = activeModel.nodes.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
                const isSelected = selectedEdges.includes(edge.id);

                ctx.strokeStyle = isSelected ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.border.default;
                ctx.lineWidth = isSelected ? 3 : 2;

                // Draw connection line
                ctx.beginPath();
                ctx.moveTo(sourceNode.position.x + 60, sourceNode.position.y + 40);
                ctx.lineTo(targetNode.position.x + 60, targetNode.position.y + 40);
                ctx.stroke();

                // Draw arrow
                const angle = Math.atan2(
                    targetNode.position.y - sourceNode.position.y,
                    targetNode.position.x - sourceNode.position.x
                );

                ctx.save();
                ctx.translate(targetNode.position.x + 60, targetNode.position.y + 40);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(-10, -5);
                ctx.lineTo(0, 0);
                ctx.lineTo(-10, 5);
                ctx.stroke();
                ctx.restore();
            }
        });

        // Draw connection preview
        if (pendingConnection && connectionPreview) {
            const sourceNode = activeModel.nodes.find(n => n.id === pendingConnection.source);
            if (sourceNode) {
                ctx.strokeStyle = dadmsTheme.colors.accent.primary;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);

                ctx.beginPath();
                ctx.moveTo(sourceNode.position.x + 60, sourceNode.position.y + 40);
                ctx.lineTo(connectionPreview.x, connectionPreview.y);
                ctx.stroke();

                ctx.setLineDash([]);
            }
        }

        // Draw nodes
        activeModel.nodes.forEach(node => {
            const isSelected = selectedNodes.includes(node.id);

            // Node background - clean white fill
            ctx.fillStyle = isSelected ? '#e3f2fd' : '#ffffff';
            ctx.strokeStyle = isSelected ? dadmsTheme.colors.accent.primary : '#000000';
            ctx.lineWidth = isSelected ? 2 : 1;

            // Calculate node height based on attributes
            const nodeAttributes = node.data.properties.attributes || [];
            const nodeHeight = nodeAttributes.length > 0 ? 100 : 80; // Extra height for attributes section

            // Draw node rectangle
            ctx.beginPath();
            ctx.roundRect(node.position.x, node.position.y, 120, nodeHeight, 8);
            ctx.fill();
            ctx.stroke();

            // Add selection indicator for selected blocks
            if (isSelected) {
                ctx.strokeStyle = dadmsTheme.colors.accent.primary;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(node.position.x - 2, node.position.y - 2, 124, nodeHeight + 4, 10);
                ctx.stroke();
            }

            // Node title - block name (SysML v2 style) - more prominent
            ctx.fillStyle = isSelected ? dadmsTheme.colors.accent.primary : '#000000';
            ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.data.label, node.position.x + 60, node.position.y + 28);

            // Node type - element type (smaller, secondary)
            ctx.fillStyle = isSelected ? dadmsTheme.colors.accent.primary : '#666666';
            ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.data.elementType, node.position.x + 60, node.position.y + 42);

            // Node stereotype if present (SysML v2 notation)
            if (node.data.stereotype) {
                ctx.fillStyle = isSelected ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.accent.primary;
                ctx.font = 'italic 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`«${node.data.stereotype}»`, node.position.x + 60, node.position.y + 55);
            }

            // Draw attributes if present
            const displayAttributes = node.data.properties.attributes || [];
            if (displayAttributes.length > 0) {
                // Draw attributes section separator
                ctx.strokeStyle = isSelected ? dadmsTheme.colors.accent.primary : '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(node.position.x + 2, node.position.y + 65);
                ctx.lineTo(node.position.x + 118, node.position.y + 65);
                ctx.stroke();

                // Show attribute count
                ctx.fillStyle = isSelected ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary;
                ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${displayAttributes.length} attribute${displayAttributes.length !== 1 ? 's' : ''}`, node.position.x + 60, node.position.y + 78);
            }
        });

        ctx.restore();
    }, [activeModel, selectedNodes, selectedEdges, canvasState, dadmsTheme]);

    // Effect to render canvas when dependencies change
    React.useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Handle canvas resize
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            renderCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [renderCanvas]);

    const canvasStyle = {
        width: '100%',
        height: '100%',
        background: dadmsTheme.colors.background.primary,
        cursor: isDragging ? 'grabbing' : 'default',
    };

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <canvas
                ref={canvasRef}
                style={canvasStyle}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            />

            {/* Connection Type Selector */}
            <ConnectionSelector
                isVisible={pendingConnection !== null}
                position={selectorPosition}
                onSelect={handleConnectionSelect}
                onCancel={handleConnectionCancel}
            />

            {/* Connection Mode Indicator */}
            {isConnectionMode && (
                <div style={{
                    position: 'absolute',
                    top: dadmsTheme.spacing.md,
                    left: dadmsTheme.spacing.md,
                    zIndex: dadmsTheme.zIndex.dropdown,
                    background: dadmsTheme.colors.accent.success,
                    color: dadmsTheme.colors.text.inverse,
                    padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
                    borderRadius: dadmsTheme.borderRadius.md,
                    fontSize: dadmsTheme.typography.fontSize.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: dadmsTheme.spacing.xs,
                    boxShadow: dadmsTheme.shadows.md,
                }}>
                    <Icon name="arrow-right" size="sm" />
                    Connection Mode: Click and drag between elements to create connections
                </div>
            )}
        </div>
    );
};

export default SysMLModeler; 