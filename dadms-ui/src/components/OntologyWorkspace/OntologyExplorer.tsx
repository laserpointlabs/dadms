"use client";

import React, { useMemo, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { CodiconName, Icon } from '../shared/Icon';
import { useOntologyWorkspaceStore } from './store';

interface OntologyExplorerProps {
    isOpen: boolean;
    onToggle: () => void;
}

interface TreeNode {
    id: string;
    label: string;
    type: 'entity' | 'data_property' | 'relationship' | 'ontology' | 'folder' | 'external_ontology' | 'external_entity' | 'external_property';
    children?: TreeNode[];
    node?: any;
    edge?: any;
    externalReference?: any;
}

const OntologyExplorer: React.FC<OntologyExplorerProps> = ({ isOpen, onToggle }) => {
    const {
        activeOntology,
        selectedNodes,
        selectedEdges,
        setSelectedNodes,
        setSelectedEdges,
    } = useOntologyWorkspaceStore();

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['ontology', 'entities', 'relationships', 'properties', 'external-ontologies']));
    const [searchQuery, setSearchQuery] = useState('');

    // Build tree structure from ontology data
    const treeData = useMemo(() => {
        if (!activeOntology) return [];

        const entities = activeOntology.nodes.filter(n => n.type === 'entity');
        const dataProperties = activeOntology.nodes.filter(n => n.type === 'data_property');
        const relationships = activeOntology.edges;

        const tree: TreeNode[] = [
            {
                id: 'ontology',
                label: activeOntology.name || 'Ontology',
                type: 'ontology',
                children: [
                    {
                        id: 'entities',
                        label: `Entities (${entities.length})`,
                        type: 'folder',
                        children: entities.map(node => ({
                            id: node.id,
                            label: node.data.label || 'Unnamed Entity',
                            type: 'entity' as const,
                            node
                        }))
                    },
                    {
                        id: 'relationships',
                        label: `Relationships (${relationships.length})`,
                        type: 'folder',
                        children: relationships.map(edge => {
                            const sourceNode = activeOntology.nodes.find(n => n.id === edge.source);
                            const targetNode = activeOntology.nodes.find(n => n.id === edge.target);
                            const sourceLabel = sourceNode?.data.label || 'Unknown';
                            const targetLabel = targetNode?.data.label || 'Unknown';
                            const relationshipType = edge.data?.relationshipType || 'relates_to';

                            return {
                                id: edge.id,
                                label: `${sourceLabel} → ${targetLabel} (${relationshipType})`,
                                type: 'relationship' as const,
                                edge
                            };
                        })
                    },
                    {
                        id: 'properties',
                        label: `Data Properties (${dataProperties.length})`,
                        type: 'folder',
                        children: dataProperties.map(node => ({
                            id: node.id,
                            label: node.data.label || 'Unnamed Property',
                            type: 'data_property' as const,
                            node
                        }))
                    },
                    {
                        id: 'external-ontologies',
                        label: 'Imported External Ontologies (0)',
                        type: 'folder',
                        children: [
                            {
                                id: 'external-placeholder',
                                label: 'No external ontologies imported',
                                type: 'external_ontology' as const,
                                children: []
                            }
                        ]
                    }
                ]
            }
        ];

        return tree;
    }, [activeOntology]);

    // Filter tree based on search query
    const filteredTreeData = useMemo(() => {
        if (!searchQuery.trim()) return treeData;

        const filterNode = (node: TreeNode): TreeNode | null => {
            const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());

            if (node.children) {
                const filteredChildren = node.children
                    .map(child => filterNode(child))
                    .filter(Boolean) as TreeNode[];

                if (filteredChildren.length > 0 || matchesSearch) {
                    return {
                        ...node,
                        children: filteredChildren
                    };
                }
            }

            return matchesSearch ? node : null;
        };

        return treeData.map(node => filterNode(node)).filter(Boolean) as TreeNode[];
    }, [treeData, searchQuery]);

    const toggleExpanded = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const handleNodeClick = (node: TreeNode) => {
        if (node.type === 'entity' || node.type === 'data_property') {
            if (node.node) {
                setSelectedNodes([node.node.id]);
                setSelectedEdges([]);
            }
        } else if (node.type === 'relationship') {
            if (node.edge) {
                setSelectedEdges([node.edge.id]);
                setSelectedNodes([]);
            }
        }
    };

    const isNodeSelected = (node: TreeNode) => {
        if (node.type === 'entity' || node.type === 'data_property') {
            return selectedNodes.includes(node.id);
        } else if (node.type === 'relationship') {
            return selectedEdges.includes(node.id);
        }
        return false;
    };

    const renderTreeNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = isNodeSelected(node);
        const hasChildren = node.children && node.children.length > 0;
        const isClickable = node.type === 'entity' || node.type === 'data_property' || node.type === 'relationship' || node.type === 'external_entity' || node.type === 'external_property';

        const nodeStyle = {
            display: 'flex',
            alignItems: 'center',
            padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
            paddingLeft: `${dadmsTheme.spacing.sm + (depth * 16)}px`,
            cursor: isClickable ? 'pointer' : 'default',
            background: isSelected ? dadmsTheme.colors.accent.primary : 'transparent',
            color: isSelected ? dadmsTheme.colors.text.inverse : dadmsTheme.colors.text.primary,
            fontSize: dadmsTheme.typography.fontSize.sm,
            transition: dadmsTheme.transitions.fast,
            borderRadius: dadmsTheme.borderRadius.sm,
            marginBottom: '1px',
            opacity: node.type.startsWith('external_') ? 0.8 : 1,
            fontStyle: node.type.startsWith('external_') ? 'italic' as const : 'normal',
        };

        const getIconName = (type: string): CodiconName => {
            switch (type) {
                case 'ontology': return 'project';
                case 'folder': return 'folder';
                case 'entity': return 'circle-filled';
                case 'data_property': return 'add';
                case 'relationship': return 'arrow-right';
                case 'external_ontology': return 'references';
                case 'external_entity': return 'symbol-class';
                case 'external_property': return 'symbol-field';
                default: return 'file';
            }
        };

        const getIconColor = (type: string): string => {
            switch (type) {
                case 'ontology': return dadmsTheme.colors.accent.primary;
                case 'folder': return dadmsTheme.colors.text.secondary;
                case 'entity': return dadmsTheme.colors.accent.primary;
                case 'data_property': return dadmsTheme.colors.accent.info;
                case 'relationship': return dadmsTheme.colors.accent.secondary;
                case 'external_ontology': return dadmsTheme.colors.accent.warning;
                case 'external_entity': return dadmsTheme.colors.accent.warning;
                case 'external_property': return dadmsTheme.colors.accent.warning;
                default: return dadmsTheme.colors.text.muted;
            }
        };

        return (
            <div key={node.id}>
                <div
                    style={nodeStyle}
                    title={node.type.startsWith('external_') ? `${node.label} (External - Read Only)` : node.label}
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpanded(node.id);
                        } else if (isClickable) {
                            handleNodeClick(node);
                        }
                    }}
                    onMouseEnter={(e) => {
                        if (!isSelected && isClickable) {
                            e.currentTarget.style.background = dadmsTheme.colors.background.hover;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected && isClickable) {
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    {hasChildren && (
                        <span style={{
                            marginRight: dadmsTheme.spacing.xs,
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: dadmsTheme.transitions.fast,
                            fontSize: dadmsTheme.typography.fontSize.xs,
                            color: isSelected ? dadmsTheme.colors.text.inverse : dadmsTheme.colors.text.secondary,
                        }}>
                            ▶
                        </span>
                    )}
                    {!hasChildren && (
                        <span style={{ width: '12px', marginRight: dadmsTheme.spacing.xs }} />
                    )}
                    <Icon
                        name={getIconName(node.type)}
                        size="sm"
                        color={isSelected ? dadmsTheme.colors.text.inverse : getIconColor(node.type)}
                        style={{ marginRight: dadmsTheme.spacing.xs }}
                    />
                    <span style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                    }}>
                        {node.label}
                        {node.type.startsWith('external_') && (
                            <span style={{
                                fontSize: dadmsTheme.typography.fontSize.xs,
                                color: dadmsTheme.colors.text.muted,
                                marginLeft: dadmsTheme.spacing.xs,
                            }}>
                                (external)
                            </span>
                        )}
                    </span>
                </div>
                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map(child => renderTreeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const containerStyle = {
        width: isOpen ? '280px' : '48px',
        height: '100%',
        background: dadmsTheme.colors.background.secondary,
        borderRight: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: dadmsTheme.transitions.normal,
        overflow: 'hidden',
        zIndex: dadmsTheme.zIndex.elevated,
    };

    const headerStyle = {
        padding: `${dadmsTheme.spacing.sm} ${dadmsTheme.spacing.md}`,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        background: dadmsTheme.colors.background.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const collapsedHeaderStyle = {
        padding: `${dadmsTheme.spacing.sm} ${dadmsTheme.spacing.md}`,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        background: dadmsTheme.colors.background.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    };

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.md,
        fontWeight: dadmsTheme.typography.fontWeight.semibold,
        color: dadmsTheme.colors.text.primary,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const searchStyle = {
        padding: dadmsTheme.spacing.sm,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        background: dadmsTheme.colors.background.primary,
    };

    const inputStyle = {
        width: '100%',
        padding: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.secondary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.primary,
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const contentStyle = {
        flex: 1,
        overflowY: 'auto' as const,
        padding: dadmsTheme.spacing.xs,
    };

    const buttonStyle = {
        background: 'none',
        border: 'none',
        color: dadmsTheme.colors.text.secondary,
        cursor: 'pointer',
        padding: dadmsTheme.spacing.xs,
        borderRadius: dadmsTheme.borderRadius.sm,
        fontSize: dadmsTheme.typography.fontSize.sm,
        transition: dadmsTheme.transitions.fast,
    };

    const emptyStateStyle = {
        textAlign: 'center' as const,
        color: dadmsTheme.colors.text.muted,
        fontSize: dadmsTheme.typography.fontSize.sm,
        padding: dadmsTheme.spacing.xl,
    };

    return (
        <div style={containerStyle}>
            {isOpen ? (
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: dadmsTheme.spacing.sm }}>
                        <Icon name="files" size="md" />
                        <div style={titleStyle}>Ontology Explorer</div>
                    </div>
                    <button
                        style={buttonStyle}
                        onClick={onToggle}
                        title="Close ontology explorer"
                    >
                        ×
                    </button>
                </div>
            ) : (
                <div style={collapsedHeaderStyle} onClick={onToggle} title="Open ontology explorer">
                    <Icon name="files" size="md" />
                </div>
            )}

            {isOpen && (
                <>
                    <div style={searchStyle}>
                        <input
                            style={inputStyle}
                            placeholder="Search elements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={contentStyle}>
                        {activeOntology ? (
                            filteredTreeData.length > 0 ? (
                                filteredTreeData.map(node => renderTreeNode(node))
                            ) : (
                                <div style={emptyStateStyle}>
                                    <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                                        <Icon name="search" size="xl" />
                                    </div>
                                    <div>No elements found</div>
                                    <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, marginTop: dadmsTheme.spacing.sm }}>
                                        Try adjusting your search terms
                                    </div>
                                </div>
                            )
                        ) : (
                            <div style={emptyStateStyle}>
                                <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                                    <Icon name="project" size="xl" />
                                </div>
                                <div>No ontology loaded</div>
                                <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, marginTop: dadmsTheme.spacing.sm }}>
                                    Create or load an ontology to explore its structure
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OntologyExplorer; 