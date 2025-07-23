"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { useOntologyWorkspaceStore } from './store';

interface PropertiesPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ isOpen, onToggle }) => {
    const {
        activeOntology,
        selectedNodes,
        selectedEdges,
        updateNode,
        updateEdge,
    } = useOntologyWorkspaceStore();

    const [editingProperty, setEditingProperty] = useState<string | null>(null);
    const [propertyValue, setPropertyValue] = useState<string>('');

    // Local state for inputs to prevent re-render issues
    const [localLabel, setLocalLabel] = useState<string>('');
    const [localEntityType, setLocalEntityType] = useState<string>('');
    const [localDescription, setLocalDescription] = useState<string>('');

    const selectedNode = selectedNodes.length === 1
        ? activeOntology?.nodes.find(n => n.id === selectedNodes[0])
        : null;

    const selectedEdge = selectedEdges.length === 1
        ? activeOntology?.edges.find(e => e.id === selectedEdges[0])
        : null;

    // Update local state when selection changes
    useEffect(() => {
        if (selectedNode) {
            setLocalLabel(selectedNode.data.label);
            setLocalEntityType(selectedNode.data.entityType);
            setLocalDescription(selectedNode.data.description || '');
        }
    }, [selectedNode?.id]); // Only update when node ID changes

    // Debounced update functions
    const debouncedUpdateNode = useCallback(
        debounce((nodeId: string, updates: any) => {
            updateNode(nodeId, updates);
        }, 300),
        [updateNode]
    );

    const handlePropertyEdit = (key: string, value: any) => {
        setEditingProperty(key);
        setPropertyValue(String(value));
    };

    const handlePropertySave = (key: string) => {
        if (selectedNode) {
            debouncedUpdateNode(selectedNode.id, {
                data: {
                    ...selectedNode.data,
                    properties: {
                        ...selectedNode.data.properties,
                        [key]: propertyValue,
                    },
                },
            });
        } else if (selectedEdge) {
            debouncedUpdateNode(selectedEdge.id, {
                data: {
                    relationshipType: 'relates_to',
                    ...selectedEdge.data,
                    properties: {
                        ...selectedEdge.data?.properties,
                        [key]: propertyValue,
                    },
                },
            });
        }
        setEditingProperty(null);
        setPropertyValue('');
    };

    const handlePropertyCancel = () => {
        setEditingProperty(null);
        setPropertyValue('');
    };

    const handleAddProperty = () => {
        if (selectedNode) {
            const key = prompt('Property name:');
            if (key && key.trim()) {
                const value = prompt('Property value:', '');
                debouncedUpdateNode(selectedNode.id, {
                    data: {
                        ...selectedNode.data,
                        properties: {
                            ...selectedNode.data.properties,
                            [key.trim()]: value || '',
                        },
                    },
                });
            }
        } else if (selectedEdge) {
            const key = prompt('Property name:');
            if (key && key.trim()) {
                const value = prompt('Property value:', '');
                debouncedUpdateNode(selectedEdge.id, {
                    data: {
                        relationshipType: 'relates_to',
                        ...selectedEdge.data,
                        properties: {
                            ...selectedEdge.data?.properties,
                            [key.trim()]: value || '',
                        },
                    },
                });
            }
        }
    };

    const handleDeleteProperty = (key: string) => {
        if (confirm(`Are you sure you want to delete the property "${key}"?`)) {
            if (selectedNode) {
                const newProperties = { ...selectedNode.data.properties };
                delete newProperties[key];
                debouncedUpdateNode(selectedNode.id, {
                    data: {
                        ...selectedNode.data,
                        properties: newProperties,
                    },
                });
            } else if (selectedEdge) {
                const newProperties = { ...selectedEdge.data?.properties };
                delete newProperties[key];
                debouncedUpdateNode(selectedEdge.id, {
                    data: {
                        relationshipType: 'relates_to',
                        ...selectedEdge.data,
                        properties: newProperties,
                    },
                });
            }
        }
    };

    const handleLabelChange = (value: string) => {
        setLocalLabel(value);
        if (selectedNode) {
            debouncedUpdateNode(selectedNode.id, {
                data: { ...selectedNode.data, label: value }
            });
        }
    };

    const handleEntityTypeChange = (value: string) => {
        setLocalEntityType(value);
        if (selectedNode) {
            debouncedUpdateNode(selectedNode.id, {
                data: { ...selectedNode.data, entityType: value }
            });
        }
    };

    const handleDescriptionChange = (value: string) => {
        setLocalDescription(value);
        if (selectedNode) {
            debouncedUpdateNode(selectedNode.id, {
                data: { ...selectedNode.data, description: value }
            });
        }
    };

    const handleRelationshipTypeChange = (value: string) => {
        if (selectedEdge) {
            debouncedUpdateNode(selectedEdge.id, {
                data: {
                    ...selectedEdge.data,
                    relationshipType: value as any
                }
            });
        }
    };

    const containerStyle = {
        width: isOpen ? '320px' : '0px',
        height: '100%',
        background: dadmsTheme.colors.background.secondary,
        borderLeft: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: dadmsTheme.transitions.normal,
        overflow: 'hidden',
        zIndex: dadmsTheme.zIndex.elevated,
    };

    const headerStyle = {
        padding: dadmsTheme.spacing.md,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        background: dadmsTheme.colors.background.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.md,
        fontWeight: dadmsTheme.typography.fontWeight.semibold,
        color: dadmsTheme.colors.text.primary,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const contentStyle = {
        flex: 1,
        padding: dadmsTheme.spacing.md,
        overflowY: 'auto' as const,
    };

    const sectionStyle = {
        marginBottom: dadmsTheme.spacing.lg,
    };

    const sectionTitleStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
        marginBottom: dadmsTheme.spacing.sm,
    };

    const fieldStyle = {
        marginBottom: dadmsTheme.spacing.sm,
    };

    const labelStyle = {
        display: 'block',
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
        marginBottom: dadmsTheme.spacing.xs,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
    };

    const inputStyle = {
        width: '100%',
        padding: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.primary,
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const propertyRowStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        marginBottom: dadmsTheme.spacing.xs,
    };

    const buttonStyle = (variant: 'primary' | 'secondary' = 'secondary', size: 'sm' | 'xs' = 'sm') => ({
        padding: size === 'xs' ? '2px 6px' : `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
        background: variant === 'primary' ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.background.tertiary,
        border: `1px solid ${variant === 'primary' ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: variant === 'primary' ? dadmsTheme.colors.text.inverse : dadmsTheme.colors.text.primary,
        cursor: 'pointer',
        fontSize: size === 'xs' ? '10px' : dadmsTheme.typography.fontSize.xs,
        transition: dadmsTheme.transitions.fast,
    });

    const saveButtonStyle = {
        ...buttonStyle('primary', 'xs'),
        padding: '2px 6px',
        marginLeft: dadmsTheme.spacing.xs,
    };

    const emptyStateStyle = {
        textAlign: 'center' as const,
        color: dadmsTheme.colors.text.muted,
        fontSize: dadmsTheme.typography.fontSize.sm,
        padding: dadmsTheme.spacing.xl,
    };

    if (!isOpen) {
        return (
            <div style={{ ...containerStyle, width: '0px' }}>
                {/* Collapsed state - just the border */}
            </div>
        );
    }

    const hasSelection = selectedNode || selectedEdge;

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={titleStyle}>Properties</div>
                <button
                    style={buttonStyle('secondary', 'xs')}
                    onClick={onToggle}
                    title="Close properties panel"
                >
                    ×
                </button>
            </div>

            <div style={contentStyle}>
                {!hasSelection ? (
                    <div style={emptyStateStyle}>
                        <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                            <Icon name="settings-gear" size="xl" />
                        </div>
                        <div>Select a node or edge to view its properties</div>
                    </div>
                ) : (
                    <>
                        {selectedNode && (
                            <>
                                <div style={sectionStyle}>
                                    <div style={sectionTitleStyle}>Node Properties</div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Label</label>
                                        <input
                                            style={inputStyle}
                                            value={localLabel}
                                            onChange={(e) => handleLabelChange(e.target.value)}
                                        />
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Entity Type</label>
                                        <input
                                            style={inputStyle}
                                            value={localEntityType}
                                            onChange={(e) => handleEntityTypeChange(e.target.value)}
                                        />
                                    </div>

                                    {selectedNode.data.description !== undefined && (
                                        <div style={fieldStyle}>
                                            <label style={labelStyle}>Description</label>
                                            <textarea
                                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
                                                value={localDescription}
                                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={sectionStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: dadmsTheme.spacing.sm }}>
                                        <div style={sectionTitleStyle}>Custom Properties</div>
                                        <button
                                            style={buttonStyle('primary', 'xs')}
                                            onClick={handleAddProperty}
                                            title="Add new property"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {Object.entries(selectedNode.data.properties || {}).map(([key, value]) => (
                                        <div key={key} style={propertyRowStyle}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, fontWeight: dadmsTheme.typography.fontWeight.medium }}>
                                                    {key}
                                                </div>
                                                {editingProperty === key ? (
                                                    <div style={{ display: 'flex', gap: dadmsTheme.spacing.xs, marginTop: dadmsTheme.spacing.xs }}>
                                                        <input
                                                            style={{ ...inputStyle, fontSize: dadmsTheme.typography.fontSize.xs }}
                                                            value={propertyValue}
                                                            onChange={(e) => setPropertyValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handlePropertySave(key);
                                                                if (e.key === 'Escape') handlePropertyCancel();
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            style={saveButtonStyle}
                                                            onClick={() => handlePropertySave(key)}
                                                        >
                                                            <Icon name="check" size="sm" />
                                                        </button>
                                                        <button
                                                            style={buttonStyle('secondary', 'xs')}
                                                            onClick={handlePropertyCancel}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            fontSize: dadmsTheme.typography.fontSize.xs,
                                                            color: dadmsTheme.colors.text.secondary,
                                                            cursor: 'pointer',
                                                            marginTop: '2px'
                                                        }}
                                                        onClick={() => handlePropertyEdit(key, value)}
                                                    >
                                                        {String(value)}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                style={buttonStyle('secondary', 'xs')}
                                                onClick={() => handleDeleteProperty(key)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {selectedEdge && (
                            <div style={sectionStyle}>
                                <div style={sectionTitleStyle}>Edge Properties</div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Relationship Type</label>
                                    <select
                                        style={inputStyle}
                                        value={selectedEdge.data?.relationshipType || 'relates_to'}
                                        onChange={(e) => handleRelationshipTypeChange(e.target.value)}
                                    >
                                        <option value="subclass_of">Subclass Of</option>
                                        <option value="instance_of">Instance Of</option>
                                        <option value="relates_to">Relates To</option>
                                        <option value="has_property">Has Property</option>
                                        <option value="equivalent_to">Equivalent To</option>
                                    </select>
                                </div>

                                {selectedEdge.data?.properties && Object.keys(selectedEdge.data.properties).length > 0 && (
                                    <div>
                                        <div style={sectionTitleStyle}>Edge Properties</div>
                                        {Object.entries(selectedEdge.data.properties).map(([key, value]) => (
                                            <div key={key} style={propertyRowStyle}>
                                                <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, fontWeight: dadmsTheme.typography.fontWeight.medium }}>
                                                    {key}: {String(value)}
                                                </div>
                                                <button
                                                    style={buttonStyle('secondary', 'xs')}
                                                    onClick={() => handleDeleteProperty(key)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default PropertiesPanel; 