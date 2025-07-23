import React from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { dadmsTheme } from '../../../design-system/theme';
import { Icon } from '../../shared/Icon';
import { OntologyNodeData } from '../types';

const KnowledgeEntityNode: React.FC<NodeProps<OntologyNodeData>> = ({ data, selected }) => {
    const { label, entityType, properties, description, isExternal } = data;

    const iconContainerStyle = {
        width: '20px',
        height: '20px',
        marginRight: dadmsTheme.spacing.xs,
        background: `linear-gradient(135deg, ${dadmsTheme.colors.accent.secondary}, ${dadmsTheme.colors.accent.secondary}dd)`,
        borderRadius: dadmsTheme.borderRadius.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: dadmsTheme.colors.text.inverse,
        boxShadow: dadmsTheme.shadows.sm,
    };

    return (
        <div style={{
            background: isExternal ? dadmsTheme.colors.background.tertiary : dadmsTheme.colors.accent.secondary,
            border: `2px ${isExternal ? 'dashed' : 'solid'} ${selected ? dadmsTheme.colors.border.focus : (isExternal ? dadmsTheme.colors.border.light : dadmsTheme.colors.accent.secondary)}`,
            borderRadius: dadmsTheme.borderRadius.md,
            padding: dadmsTheme.spacing.sm,
            minWidth: '160px',
            maxWidth: '220px',
            color: dadmsTheme.colors.text.primary,
            fontSize: dadmsTheme.typography.fontSize.sm,
            fontFamily: dadmsTheme.typography.fontFamily.default,
            boxShadow: selected ? dadmsTheme.shadows.md : dadmsTheme.shadows.sm,
            transition: dadmsTheme.transitions.fast,
        }}>
            <Handle type="target" position={Position.Top} style={{ background: dadmsTheme.colors.accent.secondary, border: `2px solid ${dadmsTheme.colors.background.primary}` }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: dadmsTheme.spacing.xs, fontWeight: dadmsTheme.typography.fontWeight.semibold }}>
                <div style={iconContainerStyle}>
                    <Icon name="library-books" size="xs" />
                </div>
                <div style={{ color: isExternal ? dadmsTheme.colors.text.secondary : dadmsTheme.colors.text.inverse }}>
                    {label || 'Knowledge Entity'}
                </div>
            </div>

            {description && <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, color: dadmsTheme.colors.text.secondary, marginBottom: dadmsTheme.spacing.xs, fontStyle: 'italic' }}>{description}</div>}

            {properties && Object.keys(properties).length > 0 && (
                <div style={{ fontSize: dadmsTheme.typography.fontSize.xs, color: dadmsTheme.colors.text.secondary, marginTop: dadmsTheme.spacing.xs }}>
                    {Object.entries(properties).slice(0, 3).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '2px' }}>
                            <span style={{ fontWeight: dadmsTheme.typography.fontWeight.medium }}>{key}:</span> <span>{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {isExternal && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: dadmsTheme.colors.accent.warning, color: dadmsTheme.colors.text.inverse, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: dadmsTheme.typography.fontWeight.bold }}>E</div>
            )}

            <Handle type="source" position={Position.Bottom} style={{ background: dadmsTheme.colors.accent.secondary, border: `2px solid ${dadmsTheme.colors.background.primary}` }} />
        </div>
    );
};

export default KnowledgeEntityNode; 