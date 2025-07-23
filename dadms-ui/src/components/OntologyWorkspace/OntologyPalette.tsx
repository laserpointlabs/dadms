import React from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { CodiconName, Icon } from '../shared/Icon';
import { DADMSEntityType } from './types';

interface PaletteItem {
    type: DADMSEntityType;
    label: string;
    description: string;
    icon: CodiconName;
    color: string;
}

// Simple ontology entity definitions
const paletteItems: PaletteItem[] = [
    {
        type: 'entity',
        label: 'Entity',
        description: 'Classes, concepts, and individuals',
        icon: 'circle-filled',
        color: dadmsTheme.colors.accent.primary,
    },
    {
        type: 'object_property',
        label: 'Object Property',
        description: 'Relationships between entities',
        icon: 'arrow-right',
        color: dadmsTheme.colors.accent.success,
    },
    {
        type: 'data_property',
        label: 'Data Property',
        description: 'Attributes and literal values',
        icon: 'add',
        color: dadmsTheme.colors.accent.info,
    },
];

interface OntologyPaletteProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const OntologyPalette: React.FC<OntologyPaletteProps> = ({
    isCollapsed = false,
    onToggleCollapse
}) => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const containerStyle = {
        width: isCollapsed ? '48px' : '280px',
        height: '100%',
        background: dadmsTheme.colors.background.secondary,
        borderRight: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: dadmsTheme.transitions.normal,
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
        padding: isCollapsed ? dadmsTheme.spacing.xs : dadmsTheme.spacing.md,
        overflowY: 'auto' as const,
    };

    const iconContainerStyle = (color: string) => ({
        width: '32px',
        height: '32px',
        borderRadius: dadmsTheme.borderRadius.md,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: isCollapsed ? 0 : dadmsTheme.spacing.md,
        flexShrink: 0,
        boxShadow: dadmsTheme.shadows.sm,
    });

    const itemStyle = (color: string) => ({
        display: 'flex',
        alignItems: 'center',
        padding: dadmsTheme.spacing.md,
        marginBottom: dadmsTheme.spacing.sm,
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.lg,
        cursor: 'grab',
        transition: dadmsTheme.transitions.fast,
        userSelect: 'none' as const,
        boxShadow: dadmsTheme.shadows.sm,
        ':hover': {
            background: dadmsTheme.colors.background.hover,
            borderColor: color,
            transform: 'translateY(-2px)',
            boxShadow: dadmsTheme.shadows.md,
        },
        ':active': {
            cursor: 'grabbing',
            transform: 'translateY(0)',
        },
    });

    const labelStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
        marginBottom: '2px',
    };

    const descriptionStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
        lineHeight: 1.3,
    };

    const collapseButtonStyle = {
        background: 'none',
        border: 'none',
        color: dadmsTheme.colors.text.secondary,
        cursor: 'pointer',
        padding: dadmsTheme.spacing.xs,
        borderRadius: dadmsTheme.borderRadius.sm,
        fontSize: dadmsTheme.typography.fontSize.sm,
        transition: dadmsTheme.transitions.fast,
        ':hover': {
            background: dadmsTheme.colors.background.hover,
            color: dadmsTheme.colors.text.primary,
        },
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                {!isCollapsed && <div style={titleStyle}>Ontology Elements</div>}
                <button
                    style={collapseButtonStyle}
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand palette' : 'Collapse palette'}
                >
                    {isCollapsed ? '»' : '«'}
                </button>
            </div>

            <div style={contentStyle}>
                {paletteItems.map((item) => (
                    <div
                        key={item.type}
                        style={itemStyle(item.color)}
                        onDragStart={(event) => onDragStart(event, item.type)}
                        draggable
                        title={item.description}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = dadmsTheme.colors.background.hover;
                            e.currentTarget.style.borderColor = item.color;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = dadmsTheme.colors.background.primary;
                            e.currentTarget.style.borderColor = dadmsTheme.colors.border.default;
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={iconContainerStyle(item.color)}>
                            <Icon name={item.icon} size="md" color="#ffffff" />
                        </div>
                        {!isCollapsed && (
                            <div style={{ flex: 1 }}>
                                <div style={labelStyle}>{item.label}</div>
                                <div style={descriptionStyle}>{item.description}</div>
                            </div>
                        )}
                    </div>
                ))}

                {!isCollapsed && (
                    <div style={{
                        marginTop: dadmsTheme.spacing.lg,
                        padding: dadmsTheme.spacing.sm,
                        background: dadmsTheme.colors.background.elevated,
                        borderRadius: dadmsTheme.borderRadius.md,
                        border: `1px solid ${dadmsTheme.colors.border.light}`,
                    }}>
                        <div style={{
                            fontSize: dadmsTheme.typography.fontSize.xs,
                            color: dadmsTheme.colors.text.muted,
                            lineHeight: 1.4,
                        }}>
                            <strong>Usage:</strong> Drag elements onto the canvas to build your ontology.
                            Create entities, properties, and relationships.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OntologyPalette; 