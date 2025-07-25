"use client";

import React from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { SysMLElementType } from './store';

interface SysMLPaletteProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onConnectionModeToggle: () => void;
    isConnectionMode: boolean;
}

interface PaletteElement {
    type: SysMLElementType;
    label: string;
    description: string;
    icon: string;
    category: string;
}

const SysMLPalette: React.FC<SysMLPaletteProps> = ({
    isCollapsed,
    onToggleCollapse,
    onConnectionModeToggle,
    isConnectionMode
}) => {
    const paletteElements: PaletteElement[] = [
        // Structural Elements
        { type: 'package', label: 'Package', description: 'Container for organizing elements', icon: 'package', category: 'Structural' },
        { type: 'block', label: 'Block', description: 'System component or entity', icon: 'symbol-class', category: 'Structural' },
        { type: 'part', label: 'Part', description: 'Component instance within a block', icon: 'symbol-variable', category: 'Structural' },
        { type: 'interface', label: 'Interface', description: 'Contract for services', icon: 'symbol-interface', category: 'Structural' },
        { type: 'port', label: 'Port', description: 'Interaction point', icon: 'plug', category: 'Structural' },

        // Behavioral Elements
        { type: 'activity', label: 'Activity', description: 'Behavioral specification', icon: 'workflow', category: 'Behavioral' },
        { type: 'state', label: 'State', description: 'System state', icon: 'circle', category: 'Behavioral' },

        // Property Elements
        { type: 'attribute', label: 'Attribute', description: 'Data property of an element', icon: 'symbol-field', category: 'Properties' },
        { type: 'connection', label: 'Connection', description: 'Relationship between elements', icon: 'arrow-right', category: 'Properties' },

        // Other Elements
        { type: 'constraint', label: 'Constraint', description: 'System constraint or rule', icon: 'symbol-constant', category: 'Other' },
        { type: 'requirement', label: 'Requirement', description: 'System requirement', icon: 'checklist', category: 'Other' },
        { type: 'note', label: 'Note', description: 'Additional information', icon: 'note', category: 'Other' },
    ];

    const handleDragStart = (e: React.DragEvent, elementType: SysMLElementType) => {
        e.dataTransfer.setData('application/sysml-element', JSON.stringify({
            type: elementType,
            label: getElementLabel(elementType),
            timestamp: Date.now()
        }));
        e.dataTransfer.effectAllowed = 'copy';

        // Set drag image
        const dragImage = document.createElement('div');
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        dragImage.style.background = 'white';
        dragImage.style.border = '2px solid #007acc';
        dragImage.style.borderRadius = '4px';
        dragImage.style.padding = '8px 12px';
        dragImage.style.fontSize = '12px';
        dragImage.style.fontWeight = 'bold';
        dragImage.style.color = '#007acc';
        dragImage.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        dragImage.textContent = getElementLabel(elementType);
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Clean up after drag starts
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    };

    const getElementLabel = (elementType: SysMLElementType): string => {
        const element = paletteElements.find(el => el.type === elementType);
        return element ? element.label : elementType;
    };

    const containerStyle = {
        width: isCollapsed ? '40px' : '280px',
        background: dadmsTheme.colors.background.secondary,
        borderRight: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: dadmsTheme.transitions.fast,
        overflow: 'hidden',
    };

    const headerStyle = {
        padding: dadmsTheme.spacing.sm,
        background: dadmsTheme.colors.background.tertiary,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '40px',
    };

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
        margin: 0,
        display: isCollapsed ? 'none' : 'block',
    };

    const toggleButtonStyle = {
        background: 'none',
        border: 'none',
        color: dadmsTheme.colors.text.secondary,
        cursor: 'pointer',
        padding: dadmsTheme.spacing.xs,
        borderRadius: dadmsTheme.borderRadius.sm,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: dadmsTheme.transitions.fast,
    };

    const contentStyle = {
        flex: 1,
        overflowY: 'auto' as const,
        padding: isCollapsed ? dadmsTheme.spacing.xs : dadmsTheme.spacing.sm,
    };

    const connectionModeButtonStyle = {
        width: '100%',
        padding: dadmsTheme.spacing.sm,
        marginBottom: dadmsTheme.spacing.sm,
        background: isConnectionMode ? dadmsTheme.colors.accent.success : dadmsTheme.colors.background.primary,
        color: isConnectionMode ? dadmsTheme.colors.text.inverse : dadmsTheme.colors.text.primary,
        border: `1px solid ${isConnectionMode ? dadmsTheme.colors.accent.success : dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.md,
        cursor: 'pointer',
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        transition: dadmsTheme.transitions.fast,
    };

    const categoryStyle = {
        marginBottom: dadmsTheme.spacing.md,
        display: isCollapsed ? 'none' : 'block',
    };

    const categoryTitleStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.secondary,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        margin: `0 0 ${dadmsTheme.spacing.xs} 0`,
        padding: `0 ${dadmsTheme.spacing.xs}`,
    };

    const elementStyle = {
        padding: dadmsTheme.spacing.xs,
        marginBottom: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        cursor: 'grab',
        fontSize: dadmsTheme.typography.fontSize.sm,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        transition: dadmsTheme.transitions.fast,
        minHeight: isCollapsed ? '32px' : 'auto',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
    };

    const elementIconStyle = {
        color: dadmsTheme.colors.accent.primary,
        flexShrink: 0,
    };

    const elementTextStyle = {
        display: isCollapsed ? 'none' : 'block',
        flex: 1,
    };

    const elementLabelStyle = {
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
        marginBottom: '2px',
    };

    const elementDescriptionStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
        lineHeight: 1.2,
    };

    // Group elements by category
    const groupedElements = paletteElements.reduce((groups, element) => {
        if (!groups[element.category]) {
            groups[element.category] = [];
        }
        groups[element.category].push(element);
        return groups;
    }, {} as Record<string, PaletteElement[]>);

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h3 style={titleStyle}>SysML Elements</h3>
                <button
                    style={toggleButtonStyle}
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand palette' : 'Collapse palette'}
                >
                    <Icon
                        name={isCollapsed ? "chevron-right" : "chevron-left"}
                        size="sm"
                    />
                </button>
            </div>

            <div style={contentStyle}>
                {/* Connection Mode Toggle */}
                <button
                    style={connectionModeButtonStyle}
                    onClick={onConnectionModeToggle}
                    title={isConnectionMode ? 'Exit connection mode' : 'Enter connection mode'}
                >
                    <Icon name="arrow-right" size="sm" />
                    {!isCollapsed && (
                        <span>{isConnectionMode ? 'Exit' : 'Connection'} Mode</span>
                    )}
                </button>

                {/* Element Categories */}
                {Object.entries(groupedElements).map(([category, elements]) => (
                    <div key={category} style={categoryStyle}>
                        <h4 style={categoryTitleStyle}>{category}</h4>
                        {elements.map((element) => (
                            <div
                                key={element.type}
                                style={elementStyle}
                                draggable
                                onDragStart={(e) => handleDragStart(e, element.type)}
                                title={isCollapsed ? `${element.label}: ${element.description}` : undefined}
                            >
                                <Icon
                                    name={element.icon as any}
                                    size="sm"
                                    style={elementIconStyle}
                                />
                                <div style={elementTextStyle}>
                                    <div style={elementLabelStyle}>{element.label}</div>
                                    <div style={elementDescriptionStyle}>{element.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SysMLPalette; 