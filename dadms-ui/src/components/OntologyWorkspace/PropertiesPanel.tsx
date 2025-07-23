"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { useOntologyWorkspaceStore } from './store';

// Custom Collapsible Relationship Dropdown Component
interface CollapsibleRelationshipDropdownProps {
    value: string;
    onChange: (value: string) => void;
    customRelationshipTypes: string[];
    onAddCustomType: (type: string) => void;
}

const CollapsibleRelationshipDropdown: React.FC<CollapsibleRelationshipDropdownProps> = ({
    value,
    onChange,
    customRelationshipTypes,
    onAddCustomType
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['Basic OWL Relationships', 'Knowledge', 'Process', 'Generic']));
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Helper function to format custom relationship type labels
    const formatCustomTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const relationshipGroups = [
        {
            title: "Custom Relationships",
            isCustom: true,
            relationships: customRelationshipTypes.map(type => ({
                value: type,
                label: formatCustomTypeLabel(type)
            }))
        },
        {
            title: "Decision Intelligence",
            relationships: [
                { value: 'influences', label: 'Influences' },
                { value: 'depends_on', label: 'Depends On' },
                { value: 'conflicts_with', label: 'Conflicts With' },
                { value: 'supports_decision', label: 'Supports Decision' },
                { value: 'requires_approval', label: 'Requires Approval' },
            ]
        },
        {
            title: "Organizational",
            relationships: [
                { value: 'has_stakeholder', label: 'Has Stakeholder' },
                { value: 'has_responsibility', label: 'Has Responsibility' },
                { value: 'has_authority', label: 'Has Authority' },
                { value: 'manages', label: 'Manages' },
                { value: 'reports_to', label: 'Reports To' },
            ]
        },
        {
            title: "Basic OWL Relationships",
            relationships: [
                { value: 'subclass_of', label: 'Subclass Of' },
                { value: 'instance_of', label: 'Instance Of' },
                { value: 'equivalent_to', label: 'Equivalent To' },
            ]
        },
        {
            title: "Knowledge",
            relationships: [
                { value: 'contains', label: 'Contains' },
                { value: 'references', label: 'References' },
                { value: 'implements', label: 'Implements' },
                { value: 'validates', label: 'Validates' },
                { value: 'contradicts', label: 'Contradicts' },
            ]
        },
        {
            title: "Process",
            relationships: [
                { value: 'triggers', label: 'Triggers' },
                { value: 'follows', label: 'Follows' },
                { value: 'uses_resource', label: 'Uses Resource' },
                { value: 'produces_output', label: 'Produces Output' },
            ]
        },
        {
            title: "Generic",
            relationships: [
                { value: 'relates_to', label: 'Relates To' },
                { value: 'has_property', label: 'Has Property' },
                { value: 'part_of', label: 'Part Of' },
            ]
        }
    ];

    // Get the display label for the current value
    const getDisplayLabel = (val: string) => {
        // Check in all relationship groups
        const allRelationships = [
            ...relationshipGroups.flatMap(group => group.relationships),
        ];
        const found = allRelationships.find(rel => rel.value === val);
        return found ? found.label : formatCustomTypeLabel(val);
    };

    const toggleGroup = (groupTitle: string) => {
        const newCollapsed = new Set(collapsedGroups);
        if (newCollapsed.has(groupTitle)) {
            newCollapsed.delete(groupTitle);
        } else {
            newCollapsed.add(groupTitle);
        }
        setCollapsedGroups(newCollapsed);
    };

    const handleSelect = (newValue: string) => {
        if (newValue === '__custom__') {
            const customType = prompt('Enter custom relationship type:');
            if (customType && customType.trim()) {
                const formattedType = customType.trim().toLowerCase().replace(/\s+/g, '_');
                onAddCustomType(formattedType);
                onChange(formattedType);
            }
        } else {
            onChange(newValue);
        }
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

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

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Dropdown trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left' as const,
                }}
            >
                <span>{getDisplayLabel(value)}</span>
                <span style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: dadmsTheme.transitions.fast,
                    fontSize: dadmsTheme.typography.fontSize.xs,
                }}>
                    ▼
                </span>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: dadmsTheme.colors.background.elevated,
                    border: `1px solid ${dadmsTheme.colors.border.default}`,
                    borderRadius: dadmsTheme.borderRadius.sm,
                    boxShadow: dadmsTheme.shadows.lg,
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginTop: '2px',
                }}>
                    {relationshipGroups
                        .filter(group => !group.isCustom || group.relationships.length > 0)
                        .map((group) => {
                            const isCollapsed = collapsedGroups.has(group.title);
                            const isCustomGroup = group.isCustom;

                            return (
                                <div key={group.title}>
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            background: dadmsTheme.colors.background.secondary,
                                            border: 'none',
                                            borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
                                            cursor: 'pointer',
                                            padding: dadmsTheme.spacing.xs,
                                            fontSize: dadmsTheme.typography.fontSize.xs,
                                            fontWeight: dadmsTheme.typography.fontWeight.medium,
                                            color: isCustomGroup ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                                            textTransform: 'uppercase' as const,
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        <span>
                                            {group.title} {isCustomGroup && group.relationships.length > 0 && `(${group.relationships.length})`}
                                        </span>
                                        <span style={{
                                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                            transition: dadmsTheme.transitions.fast,
                                        }}>
                                            ▼
                                        </span>
                                    </button>

                                    {!isCollapsed && group.relationships.map((rel) => (
                                        <button
                                            key={rel.value}
                                            onClick={() => handleSelect(rel.value)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: dadmsTheme.spacing.xs,
                                                background: value === rel.value ? dadmsTheme.colors.background.hover : dadmsTheme.colors.background.primary,
                                                border: 'none',
                                                borderBottom: `1px solid ${dadmsTheme.colors.border.light}`,
                                                cursor: 'pointer',
                                                textAlign: 'left' as const,
                                                fontSize: dadmsTheme.typography.fontSize.sm,
                                                color: dadmsTheme.colors.text.primary,
                                                transition: dadmsTheme.transitions.fast,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (value !== rel.value) {
                                                    e.currentTarget.style.background = dadmsTheme.colors.background.hover;
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (value !== rel.value) {
                                                    e.currentTarget.style.background = dadmsTheme.colors.background.primary;
                                                }
                                            }}
                                        >
                                            {rel.label}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}

                    {/* Add Custom Relationship Option */}
                    <button
                        onClick={() => handleSelect('__custom__')}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: dadmsTheme.spacing.xs,
                            background: dadmsTheme.colors.accent.primary,
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left' as const,
                            fontSize: dadmsTheme.typography.fontSize.sm,
                            color: dadmsTheme.colors.text.inverse,
                            fontWeight: dadmsTheme.typography.fontWeight.medium,
                        }}
                    >
                        + Add Custom Relationship...
                    </button>
                </div>
            )}
        </div>
    );
};

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
        updateOntologyProperties,
        addOntologyCustomProperty,
        updateOntologyCustomProperty,
        deleteOntologyCustomProperty,
        addCustomRelationshipType,
        removeCustomRelationshipType,
    } = useOntologyWorkspaceStore();

    const [editingProperty, setEditingProperty] = useState<string | null>(null);
    const [propertyValue, setPropertyValue] = useState<string>('');

    // Use refs to store the current values and avoid stale closures
    const selectedNodeRef = useRef<any>(null);
    const selectedEdgeRef = useRef<any>(null);

    // Local state for inputs to prevent re-render issues and maintain focus
    const [localLabel, setLocalLabel] = useState<string>('');
    const [localEntityType, setLocalEntityType] = useState<string>('');
    const [localDescription, setLocalDescription] = useState<string>('');

    // Local state for ontology properties
    const [localOntologyName, setLocalOntologyName] = useState<string>('');
    const [localOntologyDescription, setLocalOntologyDescription] = useState<string>('');
    const [localOntologyNamespace, setLocalOntologyNamespace] = useState<string>('');
    const [localOntologyAuthor, setLocalOntologyAuthor] = useState<string>('');

    const selectedNode = selectedNodes.length === 1
        ? activeOntology?.nodes.find(n => n.id === selectedNodes[0])
        : null;

    const selectedEdge = selectedEdges.length === 1
        ? activeOntology?.edges.find(e => e.id === selectedEdges[0])
        : null;

    // Update refs when selection changes
    useEffect(() => {
        selectedNodeRef.current = selectedNode;
        selectedEdgeRef.current = selectedEdge;
    }, [selectedNode, selectedEdge]);

    // Update local state when selection changes
    useEffect(() => {
        if (selectedNode) {
            setLocalLabel(selectedNode.data.label);
            setLocalEntityType(selectedNode.data.entityType);
            setLocalDescription(selectedNode.data.description || '');
        }
    }, [selectedNode?.id]); // Only update when node ID changes

    // Update local ontology properties when active ontology changes
    useEffect(() => {
        if (activeOntology) {
            setLocalOntologyName(activeOntology.name);
            setLocalOntologyDescription(activeOntology.description || '');
            setLocalOntologyNamespace(activeOntology.namespace || '');
            setLocalOntologyAuthor(activeOntology.author || '');
        }
    }, [activeOntology?.id]); // Only update when ontology ID changes

    // Create stable debounced update functions using useCallback with empty deps
    const debouncedUpdateNode = useCallback(
        debounce((nodeId: string, updates: any) => {
            updateNode(nodeId, updates);
        }, 500), // Increased debounce time to prevent frequent updates
        [] // Empty dependencies to prevent recreation
    );

    const debouncedUpdateEdge = useCallback(
        debounce((edgeId: string, updates: any) => {
            updateEdge(edgeId, updates);
        }, 500),
        []
    );

    const debouncedUpdateOntology = useCallback(
        debounce((updates: any) => {
            updateOntologyProperties(updates);
        }, 500),
        []
    );

    const handlePropertyEdit = (key: string, value: any) => {
        setEditingProperty(key);
        setPropertyValue(String(value));
    };

    const handlePropertySave = (key: string) => {
        if (selectedNodeRef.current) {
            debouncedUpdateNode(selectedNodeRef.current.id, {
                data: {
                    ...selectedNodeRef.current.data,
                    properties: {
                        ...selectedNodeRef.current.data.properties,
                        [key]: propertyValue,
                    },
                },
            });
        } else if (selectedEdgeRef.current) {
            debouncedUpdateEdge(selectedEdgeRef.current.id, {
                data: {
                    relationshipType: selectedEdgeRef.current.data?.relationshipType || 'relates_to',
                    ...selectedEdgeRef.current.data,
                    properties: {
                        ...selectedEdgeRef.current.data?.properties,
                        [key]: propertyValue,
                    },
                },
            });
        } else if (activeOntology) {
            // Handle ontology custom properties
            updateOntologyCustomProperty(key, propertyValue);
        }
        setEditingProperty(null);
        setPropertyValue('');
    };

    const handlePropertyCancel = () => {
        setEditingProperty(null);
        setPropertyValue('');
    };

    const handleAddProperty = () => {
        if (selectedNodeRef.current) {
            const key = prompt('Property name:');
            if (key && key.trim()) {
                const value = prompt('Property value:', '');
                debouncedUpdateNode(selectedNodeRef.current.id, {
                    data: {
                        ...selectedNodeRef.current.data,
                        properties: {
                            ...selectedNodeRef.current.data.properties,
                            [key.trim()]: value || '',
                        },
                    },
                });
            }
        } else if (selectedEdgeRef.current) {
            const key = prompt('Property name:');
            if (key && key.trim()) {
                const value = prompt('Property value:', '');
                debouncedUpdateEdge(selectedEdgeRef.current.id, {
                    data: {
                        relationshipType: selectedEdgeRef.current.data?.relationshipType || 'relates_to',
                        ...selectedEdgeRef.current.data,
                        properties: {
                            ...selectedEdgeRef.current.data?.properties,
                            [key.trim()]: value || '',
                        },
                    },
                });
            }
        } else if (activeOntology) {
            // Handle ontology custom properties
            const key = prompt('Property name:');
            if (key && key.trim()) {
                const value = prompt('Property value:', '');
                addOntologyCustomProperty(key.trim(), value || '');
            }
        }
    };

    const handleDeleteProperty = (key: string) => {
        if (confirm(`Are you sure you want to delete the property "${key}"?`)) {
            if (selectedNodeRef.current) {
                const newProperties = { ...selectedNodeRef.current.data.properties };
                delete newProperties[key];
                debouncedUpdateNode(selectedNodeRef.current.id, {
                    data: {
                        ...selectedNodeRef.current.data,
                        properties: newProperties,
                    },
                });
            } else if (selectedEdgeRef.current) {
                const newProperties = { ...selectedEdgeRef.current.data?.properties };
                delete newProperties[key];
                debouncedUpdateEdge(selectedEdgeRef.current.id, {
                    data: {
                        relationshipType: selectedEdgeRef.current.data?.relationshipType || 'relates_to',
                        ...selectedEdgeRef.current.data,
                        properties: newProperties,
                    },
                });
            } else if (activeOntology) {
                // Handle ontology custom properties
                deleteOntologyCustomProperty(key);
            }
        }
    };

    // Immediate UI updates with debounced store updates
    const handleLabelChange = (value: string) => {
        setLocalLabel(value);
        if (selectedNodeRef.current) {
            debouncedUpdateNode(selectedNodeRef.current.id, {
                data: { ...selectedNodeRef.current.data, label: value }
            });
        }
    };

    const handleEntityTypeChange = (value: string) => {
        setLocalEntityType(value);
        if (selectedNodeRef.current) {
            debouncedUpdateNode(selectedNodeRef.current.id, {
                data: { ...selectedNodeRef.current.data, entityType: value }
            });
        }
    };

    const handleDescriptionChange = (value: string) => {
        setLocalDescription(value);
        if (selectedNodeRef.current) {
            debouncedUpdateNode(selectedNodeRef.current.id, {
                data: { ...selectedNodeRef.current.data, description: value }
            });
        }
    };

    const handleRelationshipTypeChange = (value: string) => {
        if (selectedEdgeRef.current) {
            debouncedUpdateEdge(selectedEdgeRef.current.id, {
                data: {
                    ...selectedEdgeRef.current.data,
                    relationshipType: value as any
                }
            });
        }
    };

    // Ontology property handlers
    const handleOntologyNameChange = (value: string) => {
        setLocalOntologyName(value);
        debouncedUpdateOntology({ name: value });
    };

    const handleOntologyDescriptionChange = (value: string) => {
        setLocalOntologyDescription(value);
        debouncedUpdateOntology({ description: value });
    };

    const handleOntologyNamespaceChange = (value: string) => {
        setLocalOntologyNamespace(value);
        debouncedUpdateOntology({ namespace: value });
    };

    const handleOntologyAuthorChange = (value: string) => {
        setLocalOntologyAuthor(value);
        debouncedUpdateOntology({ author: value });
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
                    // Show ontology properties when nothing is selected
                    activeOntology ? (
                        <>
                            <div style={sectionStyle}>
                                <div style={sectionTitleStyle}>Ontology Properties</div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Name</label>
                                    <input
                                        style={inputStyle}
                                        value={localOntologyName}
                                        onChange={(e) => handleOntologyNameChange(e.target.value)}
                                        placeholder="Ontology name"
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Description</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
                                        value={localOntologyDescription}
                                        onChange={(e) => handleOntologyDescriptionChange(e.target.value)}
                                        placeholder="Describe the purpose and scope of this ontology"
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Namespace URI</label>
                                    <input
                                        style={inputStyle}
                                        value={localOntologyNamespace}
                                        onChange={(e) => handleOntologyNamespaceChange(e.target.value)}
                                        placeholder="http://example.com/ontology/"
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Author</label>
                                    <input
                                        style={inputStyle}
                                        value={localOntologyAuthor}
                                        onChange={(e) => handleOntologyAuthorChange(e.target.value)}
                                        placeholder="Author name"
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Version</label>
                                    <input
                                        style={inputStyle}
                                        value={activeOntology.version}
                                        readOnly
                                        placeholder="Version"
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Created</label>
                                    <input
                                        style={inputStyle}
                                        value={new Date(activeOntology.created).toLocaleDateString()}
                                        readOnly
                                        placeholder="Creation date"
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Last Modified</label>
                                    <input
                                        style={inputStyle}
                                        value={new Date(activeOntology.lastModified).toLocaleString()}
                                        readOnly
                                        placeholder="Last modification"
                                    />
                                </div>
                            </div>

                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: dadmsTheme.spacing.sm }}>
                                    <div style={sectionTitleStyle}>Custom Properties</div>
                                    <button
                                        style={buttonStyle('primary', 'xs')}
                                        onClick={handleAddProperty}
                                        title="Add new custom property"
                                    >
                                        +
                                    </button>
                                </div>

                                {Object.entries(activeOntology.customProperties || {}).map(([key, value]) => (
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

                                {Object.keys(activeOntology.customProperties || {}).length === 0 && (
                                    <div style={{
                                        textAlign: 'center' as const,
                                        color: dadmsTheme.colors.text.muted,
                                        fontSize: dadmsTheme.typography.fontSize.xs,
                                        padding: dadmsTheme.spacing.md,
                                        fontStyle: 'italic'
                                    }}>
                                        No custom properties defined. Click + to add one.
                                    </div>
                                )}
                            </div>

                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: dadmsTheme.spacing.sm }}>
                                    <div style={sectionTitleStyle}>Custom Relationship Types</div>
                                    <button
                                        style={buttonStyle('primary', 'xs')}
                                        onClick={() => {
                                            const newType = prompt('Enter new custom relationship type:');
                                            if (newType && newType.trim()) {
                                                const formattedType = newType.trim().toLowerCase().replace(/\s+/g, '_');
                                                if (activeOntology && !activeOntology.customRelationshipTypes.includes(formattedType)) {
                                                    addCustomRelationshipType(formattedType);
                                                }
                                            }
                                        }}
                                        title="Add new custom relationship type"
                                    >
                                        +
                                    </button>
                                </div>
                                {activeOntology?.customRelationshipTypes && activeOntology.customRelationshipTypes.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: dadmsTheme.spacing.xs }}>
                                        {activeOntology.customRelationshipTypes.map((type) => (
                                            <div
                                                key={type}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: dadmsTheme.colors.background.secondary,
                                                    border: `1px solid ${dadmsTheme.colors.border.default}`,
                                                    borderRadius: dadmsTheme.borderRadius.sm,
                                                    padding: dadmsTheme.spacing.xs,
                                                    fontSize: dadmsTheme.typography.fontSize.xs
                                                }}
                                            >
                                                <span style={{ marginRight: dadmsTheme.spacing.xs }}>
                                                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                                <button
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: dadmsTheme.colors.text.secondary,
                                                        padding: '0',
                                                        fontSize: dadmsTheme.typography.fontSize.sm,
                                                        lineHeight: '1'
                                                    }}
                                                    onClick={() => {
                                                        if (confirm(`Remove custom relationship type "${type}"?`)) {
                                                            removeCustomRelationshipType(type);
                                                        }
                                                    }}
                                                    title="Remove custom relationship type"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        textAlign: 'center' as const,
                                        color: dadmsTheme.colors.text.muted,
                                        fontSize: dadmsTheme.typography.fontSize.xs,
                                        padding: dadmsTheme.spacing.md,
                                        fontStyle: 'italic'
                                    }}>
                                        No custom relationship types defined. Click + to add one.
                                    </div>
                                )}
                            </div>

                            <div style={sectionStyle}>
                                <div style={sectionTitleStyle}>Statistics</div>
                                <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, color: dadmsTheme.colors.text.secondary }}>
                                    <div style={{ marginBottom: dadmsTheme.spacing.xs }}>
                                        <strong>Entities:</strong> {activeOntology.nodes.filter(n => n.type === 'entity').length}
                                    </div>
                                    <div style={{ marginBottom: dadmsTheme.spacing.xs }}>
                                        <strong>Data Properties:</strong> {activeOntology.nodes.filter(n => n.type === 'data_property').length}
                                    </div>
                                    <div style={{ marginBottom: dadmsTheme.spacing.xs }}>
                                        <strong>Relationships:</strong> {activeOntology.edges.length}
                                    </div>
                                    <div>
                                        <strong>Total Elements:</strong> {activeOntology.nodes.length + activeOntology.edges.length}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={emptyStateStyle}>
                            <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                                <Icon name="project" size="xl" />
                            </div>
                            <div>No ontology loaded</div>
                            <div style={{ fontSize: dadmsTheme.typography.fontSize.sm, marginTop: dadmsTheme.spacing.sm }}>
                                Create or load an ontology to view its properties
                            </div>
                        </div>
                    )
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
                                    <CollapsibleRelationshipDropdown
                                        value={selectedEdge.data?.relationshipType || 'relates_to'}
                                        onChange={handleRelationshipTypeChange}
                                        customRelationshipTypes={activeOntology?.customRelationshipTypes || []}
                                        onAddCustomType={(formattedType) => {
                                            // Add to the ontology's custom relationship types if it doesn't exist
                                            if (activeOntology && !activeOntology.customRelationshipTypes.includes(formattedType)) {
                                                addCustomRelationshipType(formattedType);
                                            }
                                        }}
                                    />
                                </div>

                                {/* Edge Metadata */}
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>Strength (0.0 - 1.0)</label>
                                    <input
                                        style={inputStyle}
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={selectedEdge.data?.strength || 1.0}
                                        onChange={(e) => {
                                            if (selectedEdge) {
                                                updateEdge(selectedEdge.id, {
                                                    data: {
                                                        relationshipType: selectedEdge.data?.relationshipType || 'relates_to',
                                                        ...selectedEdge.data,
                                                        strength: parseFloat(e.target.value) || 1.0
                                                    }
                                                });
                                            }
                                        }}
                                    />
                                </div>

                                <div style={fieldStyle}>
                                    <label style={labelStyle}>
                                        <input
                                            type="checkbox"
                                            checked={selectedEdge.data?.isInferred || false}
                                            onChange={(e) => {
                                                if (selectedEdge) {
                                                    updateEdge(selectedEdge.id, {
                                                        data: {
                                                            relationshipType: selectedEdge.data?.relationshipType || 'relates_to',
                                                            ...selectedEdge.data,
                                                            isInferred: e.target.checked
                                                        }
                                                    });
                                                }
                                            }}
                                            style={{ marginRight: dadmsTheme.spacing.xs }}
                                        />
                                        Inferred Relationship
                                    </label>
                                </div>

                                {/* Custom Edge Properties */}
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

                                    {Object.entries(selectedEdge.data?.properties || {}).map(([key, value]) => (
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