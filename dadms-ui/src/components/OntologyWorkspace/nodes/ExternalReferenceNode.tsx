import React from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { dadmsTheme } from '../../../design-system/theme';
import { Icon } from '../../shared/Icon';
import { OntologyNodeData } from '../types';

const ExternalReferenceNode: React.FC<NodeProps<OntologyNodeData>> = ({ data, selected }) => {
    const { label, entityType, properties, description, externalSource } = data;

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: dadmsTheme.spacing.xs,
    };

    const iconContainerStyle = {
        width: '20px',
        height: '20px',
        marginRight: dadmsTheme.spacing.xs,
        background: `linear-gradient(135deg, ${dadmsTheme.colors.border.light}, ${dadmsTheme.colors.border.light}dd)`,
        borderRadius: dadmsTheme.borderRadius.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: dadmsTheme.colors.text.primary,
        boxShadow: dadmsTheme.shadows.sm,
    };

    return (
        <div style={{
            background: dadmsTheme.colors.background.tertiary,
            border: `2px dashed ${selected ? dadmsTheme.colors.border.focus : dadmsTheme.colors.border.light}`,
            borderRadius: dadmsTheme.borderRadius.md,
            padding: dadmsTheme.spacing.sm,
            minWidth: '160px',
            maxWidth: '220px',
            color: dadmsTheme.colors.text.secondary,
            fontSize: dadmsTheme.typography.fontSize.sm,
            fontFamily: dadmsTheme.typography.fontFamily.default,
            boxShadow: selected ? dadmsTheme.shadows.md : dadmsTheme.shadows.sm,
            transition: dadmsTheme.transitions.fast,
            opacity: 0.8,
        }}>
            <Handle type="target" position={Position.Top} style={{ background: dadmsTheme.colors.border.light, border: `2px solid ${dadmsTheme.colors.background.primary}` }} />

            <div style={headerStyle}>
                <div style={iconContainerStyle}>
                    <Icon name="type-hierarchy" size="xs" />
                </div>
                <div style={{ color: dadmsTheme.colors.text.secondary }}>
                    {label || 'External Reference'}
                </div>
            </div>

            {externalSource && (
                <div style={{
                    fontSize: dadmsTheme.typography.fontSize.xs,
                    color: dadmsTheme.colors.text.muted,
                    marginBottom: dadmsTheme.spacing.xs,
                    background: dadmsTheme.colors.background.secondary,
                    padding: '2px 4px',
                    borderRadius: dadmsTheme.borderRadius.sm
                }}>
                    {externalSource}
                </div>
            )}

            {description && <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, color: dadmsTheme.colors.text.secondary, marginBottom: dadmsTheme.spacing.xs, fontStyle: 'italic' }}>{description}</div>}

            {properties && Object.keys(properties).length > 0 && (
                <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, color: dadmsTheme.colors.text.secondary, marginTop: dadmsTheme.spacing.xs }}>
                    {Object.entries(properties).slice(0, 2).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '2px' }}>
                            <span style={{ fontWeight: dadmsTheme.typography.fontWeight.medium }}>{key}:</span> <span>{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: dadmsTheme.colors.accent.info,
                color: dadmsTheme.colors.text.inverse,
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: dadmsTheme.typography.fontWeight.bold,
            }}>
                @
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: dadmsTheme.colors.border.light, border: `2px solid ${dadmsTheme.colors.background.primary}` }} />
        </div>
    );
};

export default ExternalReferenceNode; 