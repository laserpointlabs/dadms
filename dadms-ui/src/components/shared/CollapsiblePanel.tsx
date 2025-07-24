'use client';

import React from 'react';
import { usePanel } from '../../contexts/PanelStateContext';
import { Icon } from './Icon';

interface CollapsiblePanelProps {
    panelId: string;
    title: string;
    icon?: string;
    children: React.ReactNode;
    className?: string;
    defaultCollapsed?: boolean;
    showToggleButton?: boolean;
    onToggle?: (collapsed: boolean) => void;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
    panelId,
    title,
    icon,
    children,
    className = '',
    defaultCollapsed = false,
    showToggleButton = true,
    onToggle
}) => {
    const panel = usePanel(panelId);

    // Initialize with default state if not already set
    React.useEffect(() => {
        if (defaultCollapsed !== panel.isCollapsed) {
            panel.setCollapsed(defaultCollapsed);
        }
    }, [defaultCollapsed, panel]);

    const handleToggle = () => {
        panel.toggleCollapsed();
        onToggle?.(!panel.isCollapsed);
    };

    return (
        <div className={`collapsible-panel ${className}`}>
            <div className="collapsible-panel-header">
                <button
                    className="collapsible-panel-toggle"
                    onClick={handleToggle}
                    title={panel.isCollapsed ? "Expand panel" : "Collapse panel"}
                >
                    <Icon
                        name={panel.isCollapsed ? "chevron-right" : "chevron-down"}
                        size="sm"
                        className="toggle-icon"
                    />
                </button>

                {icon && (
                    <Icon name={icon} size="sm" className="panel-icon" />
                )}

                <span className="panel-title">{title}</span>

                {showToggleButton && (
                    <button
                        className="panel-toggle-button"
                        onClick={handleToggle}
                        title={panel.isCollapsed ? "Expand" : "Collapse"}
                    >
                        <Icon
                            name={panel.isCollapsed ? "expand-all" : "collapse-all"}
                            size="sm"
                        />
                    </button>
                )}
            </div>

            {!panel.isCollapsed && (
                <div className="collapsible-panel-content">
                    {children}
                </div>
            )}
        </div>
    );
};

// CSS styles for the collapsible panel
const styles = `
.collapsible-panel {
    border: 1px solid var(--theme-border);
    border-radius: var(--theme-border-radius);
    background: var(--theme-bg-primary);
    margin-bottom: 8px;
}

.collapsible-panel-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--theme-bg-secondary);
    border-bottom: 1px solid var(--theme-border);
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
}

.collapsible-panel-header:hover {
    background: var(--theme-bg-hover);
}

.collapsible-panel-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    margin-right: 8px;
    color: var(--theme-text-secondary);
    transition: color 0.2s ease;
}

.collapsible-panel-toggle:hover {
    color: var(--theme-text-primary);
}

.toggle-icon {
    transition: transform 0.2s ease;
}

.panel-icon {
    margin-right: 8px;
    color: var(--theme-accent-primary);
}

.panel-title {
    flex: 1;
    font-weight: 500;
    color: var(--theme-text-primary);
    font-size: 14px;
}

.panel-toggle-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--theme-text-secondary);
    transition: color 0.2s ease;
}

.panel-toggle-button:hover {
    color: var(--theme-text-primary);
}

.collapsible-panel-content {
    padding: 12px;
    animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
} 