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

// Simplified ontology entity definitions - removed object_property since it should be an edge
const paletteItems: PaletteItem[] = [
    {
        type: 'entity',
        label: 'Entity',
        description: 'Classes, concepts, and individuals',
        icon: 'circle-filled',
        color: dadmsTheme.colors.accent.primary,
    },
    {
        type: 'data_property',
        label: 'Data Property',
        description: 'Attributes and literal values',
        icon: 'symbol-field',
        color: dadmsTheme.colors.accent.info,
    },

];

interface OntologyPaletteProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    onConnectionModeToggle?: () => void;
    isConnectionMode?: boolean;
}

const OntologyPalette: React.FC<OntologyPaletteProps> = ({
    isCollapsed = false,
    onToggleCollapse,
    onConnectionModeToggle,
    isConnectionMode = false
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

    const connectionButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: dadmsTheme.spacing.md,
        marginBottom: dadmsTheme.spacing.md,
        background: isConnectionMode ? dadmsTheme.colors.accent.success : dadmsTheme.colors.background.primary,
        border: `2px solid ${isConnectionMode ? dadmsTheme.colors.accent.success : dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.lg,
        cursor: 'pointer',
        transition: dadmsTheme.transitions.fast,
        userSelect: 'none' as const,
        boxShadow: dadmsTheme.shadows.sm,
        width: '100%',
    };

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
            {isCollapsed ? (
                <div style={collapsedHeaderStyle} onClick={onToggleCollapse} title="Expand ontology elements panel">
                    <Icon name="symbol-class" size="md" />
                </div>
            ) : (
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: dadmsTheme.spacing.sm }}>
                        <Icon name="symbol-class" size="md" />
                        <div style={titleStyle}>Ontology Elements</div>
                    </div>
                    <button
                        style={collapseButtonStyle}
                        onClick={onToggleCollapse}
                        title="Collapse palette"
                    >
                        <Icon name="chevron-right" size="sm" />
                    </button>
                </div>
            )}

            <div style={contentStyle}>
                {/* Connection Mode Toggle */}
                {!isCollapsed && onConnectionModeToggle && (
                    <button
                        style={connectionButtonStyle}
                        onClick={onConnectionModeToggle}
                        title={isConnectionMode ? 'Exit connection mode' : 'Enter connection mode to create relationships'}
                    >
                        <div style={iconContainerStyle(isConnectionMode ? dadmsTheme.colors.accent.success : dadmsTheme.colors.accent.secondary)}>
                            <Icon name="arrow-right" size="md" color="#ffffff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={labelStyle}>
                                {isConnectionMode ? 'Exit Connection Mode' : 'Create Relationships'}
                            </div>
                            <div style={descriptionStyle}>
                                {isConnectionMode ? 'Click to exit connection mode' : 'Connect entities with object properties'}
                            </div>
                        </div>
                    </button>
                )}

                {/* Relationship Icon for Collapsed Mode */}
                {isCollapsed && onConnectionModeToggle && (
                    <div
                        style={{
                            ...iconContainerStyle(isConnectionMode ? dadmsTheme.colors.accent.success : dadmsTheme.colors.accent.secondary),
                            width: '100%',
                            marginBottom: dadmsTheme.spacing.sm,
                            cursor: 'pointer',
                        }}
                        onClick={onConnectionModeToggle}
                        title={isConnectionMode ? 'Exit connection mode' : 'Enter connection mode to create relationships'}
                    >
                        <Icon name="arrow-right" size="md" color="#ffffff" />
                    </div>
                )}

                {/* Entity Types */}
                {paletteItems.map((item) => (
                    <div
                        key={item.type}
                        style={isCollapsed ? {
                            ...iconContainerStyle(item.color),
                            width: '100%',
                            marginBottom: dadmsTheme.spacing.sm,
                            cursor: 'grab',
                            transition: dadmsTheme.transitions.fast,
                            userSelect: 'none' as const,
                            boxShadow: dadmsTheme.shadows.sm,
                        } : itemStyle(item.color)}
                        onDragStart={(event) => onDragStart(event, item.type)}
                        draggable
                        title={item.description}
                        onMouseEnter={(e) => {
                            if (!isCollapsed) {
                                e.currentTarget.style.background = dadmsTheme.colors.background.hover;
                                e.currentTarget.style.borderColor = item.color;
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isCollapsed) {
                                e.currentTarget.style.background = dadmsTheme.colors.background.primary;
                                e.currentTarget.style.borderColor = dadmsTheme.colors.border.default;
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <Icon name={item.icon} size="md" color="#ffffff" />
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
                            <strong>Usage:</strong> Drag entities onto the canvas. Use "Create Relationships" to connect entities with object properties.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OntologyPalette; 