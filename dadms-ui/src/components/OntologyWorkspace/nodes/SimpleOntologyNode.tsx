"use client";

import React from 'react';
import { Handle, Position } from 'reactflow';
import { dadmsTheme } from '../../../design-system/theme';
import { Icon } from '../../shared/Icon';
import { OntologyNodeData } from '../types';

interface SimpleOntologyNodeProps {
    data: OntologyNodeData;
    selected?: boolean;
}

const SimpleOntologyNode: React.FC<SimpleOntologyNodeProps> = ({ data, selected }) => {
    const getNodeColor = (entityType: string) => {
        switch (entityType) {
            case 'Entity':
                return dadmsTheme.colors.accent.primary;
            case 'Object Property':
                return dadmsTheme.colors.accent.success;
            case 'Data Property':
                return dadmsTheme.colors.accent.info;
            default:
                return dadmsTheme.colors.accent.secondary;
        }
    };

    const getNodeIcon = (entityType: string) => {
        switch (entityType) {
            case 'Entity':
                return 'circle-filled' as const;
            case 'Object Property':
                return 'arrow-right' as const;
            case 'Data Property':
                return 'add' as const;
            default:
                return 'circle-filled' as const;
        }
    };

    const nodeColor = getNodeColor(data.entityType);
    const nodeIcon = getNodeIcon(data.entityType);

    const nodeStyle = {
        background: dadmsTheme.colors.background.primary,
        border: `2px solid ${selected ? dadmsTheme.colors.accent.primary : nodeColor}`,
        borderRadius: dadmsTheme.borderRadius.lg,
        padding: dadmsTheme.spacing.md,
        minWidth: '150px',
        maxWidth: '200px',
        boxShadow: selected ? dadmsTheme.shadows.lg : dadmsTheme.shadows.md,
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontFamily: dadmsTheme.typography.fontFamily.default,
        color: dadmsTheme.colors.text.primary,
        transition: dadmsTheme.transitions.fast,
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        marginBottom: dadmsTheme.spacing.sm,
        paddingBottom: dadmsTheme.spacing.xs,
        borderBottom: `1px solid ${dadmsTheme.colors.border.light}`,
    };

    const iconContainerStyle = {
        width: '20px',
        height: '20px',
        borderRadius: dadmsTheme.borderRadius.sm,
        background: nodeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };

    const labelStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.semibold,
        color: dadmsTheme.colors.text.primary,
        wordBreak: 'break-word' as const,
        flex: 1,
    };

    const typeStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
        fontStyle: 'italic' as const,
        marginBottom: dadmsTheme.spacing.xs,
    };

    const descriptionStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.muted,
        lineHeight: 1.3,
        marginTop: dadmsTheme.spacing.xs,
        wordBreak: 'break-word' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
    };

    const propertiesStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.muted,
        marginTop: dadmsTheme.spacing.xs,
    };

    return (
        <div style={nodeStyle}>
            {/* Connection handles - Multiple attachment points */}
            {/* Top handles */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                style={{
                    background: nodeColor,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '12px',
                    height: '12px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                }}
                className="react-flow__handle"
            />

            {/* Right handles */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                style={{
                    background: nodeColor,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '12px',
                    height: '12px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                }}
                className="react-flow__handle"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right-source"
                style={{
                    background: nodeColor,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '12px',
                    height: '12px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                }}
                className="react-flow__handle"
            />

            {/* Bottom handles */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{
                    background: nodeColor,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '12px',
                    height: '12px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                }}
                className="react-flow__handle"
            />

            {/* Left handles */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                style={{
                    background: nodeColor,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '12px',
                    height: '12px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                }}
                className="react-flow__handle"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                style={{
                    background: nodeColor,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '12px',
                    height: '12px',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                }}
                className="react-flow__handle"
            />

            {/* Node header */}
            <div style={headerStyle}>
                <div style={iconContainerStyle}>
                    <Icon name={nodeIcon} size="xs" color="#ffffff" />
                </div>
                <div style={labelStyle}>{data.label}</div>
            </div>

            {/* Entity type */}
            <div style={typeStyle}>{data.entityType}</div>

            {/* Description */}
            {data.description && (
                <div style={descriptionStyle}>{data.description}</div>
            )}

            {/* Properties count */}
            {data.properties && Object.keys(data.properties).length > 0 && (
                <div style={propertiesStyle}>
                    {Object.keys(data.properties).length} properties
                </div>
            )}
        </div>
    );
};

export default SimpleOntologyNode; 