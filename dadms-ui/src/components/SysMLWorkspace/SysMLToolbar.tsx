"use client";

import React from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { SysMLModel, useSysMLWorkspaceStore } from './store';

interface SysMLToolbarProps {
    isPropertiesPanelOpen: boolean;
    onTogglePropertiesPanel: () => void;
}

const SysMLToolbar: React.FC<SysMLToolbarProps> = ({
    isPropertiesPanelOpen,
    onTogglePropertiesPanel
}) => {
    const {
        activeModel,
        addModel,
        setActiveModel,
        validateModel,
        isMinimapVisible,
        toggleMinimap,
        isFullscreen,
        toggleFullscreen,
    } = useSysMLWorkspaceStore();

    const handleNewModel = () => {
        const newModel: SysMLModel = {
            id: `model-${Date.now()}`,
            name: 'New SysML Model',
            description: 'A new SysML v2 model',
            diagramType: 'block_definition',
            nodes: [],
            edges: [],
            packages: [],
            stereotypes: [],
            customConnectionTypes: [],
            lastModified: new Date().toISOString(),
            created: new Date().toISOString(),
            version: '1.0.0',
            author: 'User',
            tags: [],
            metadata: {}
        };
        addModel(newModel);
        setActiveModel(newModel);
    };

    const handleOpenModel = () => {
        console.log('Open SysML model');
        // In a real implementation, this would open a file picker
    };

    const handleSaveModel = () => {
        console.log('Save SysML model');
        // In a real implementation, this would save the current model
    };

    const handleExportModel = () => {
        console.log('Export SysML model');
        // In a real implementation, this would export the model in various formats
    };

    const handleValidateModel = () => {
        validateModel();
    };

    const handleZoomIn = () => {
        console.log('Zoom in');
        // In a real implementation, this would zoom the canvas
    };

    const handleZoomOut = () => {
        console.log('Zoom out');
        // In a real implementation, this would zoom the canvas
    };

    const handleFitToView = () => {
        console.log('Fit to view');
        // In a real implementation, this would fit all elements to the viewport
    };

    const containerStyle = {
        height: '48px',
        background: dadmsTheme.colors.background.secondary,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${dadmsTheme.spacing.md}`,
        gap: dadmsTheme.spacing.sm,
    };

    const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'secondary') => ({
        padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
        background: 'transparent',
        border: 'none',
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.primary,
        cursor: 'pointer',
        fontSize: dadmsTheme.typography.fontSize.sm,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        transition: dadmsTheme.transitions.fast,
        '&:hover': {
            background: dadmsTheme.colors.background.tertiary,
        },
    });

    const separatorStyle = {
        width: '1px',
        height: '24px',
        background: dadmsTheme.colors.border.default,
        margin: `0 ${dadmsTheme.spacing.sm}`,
    };

    const groupStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
    };

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: dadmsTheme.colors.text.primary,
        margin: 0,
    };

    return (
        <div style={containerStyle}>
            {/* File Operations */}
            <div style={groupStyle}>
                <button
                    style={buttonStyle('primary')}
                    onClick={handleNewModel}
                    title="Create new SysML model"
                >
                    <Icon name="add" size="sm" />
                    New
                </button>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleOpenModel}
                    title="Open SysML model"
                >
                    <Icon name="folder-opened" size="sm" />
                    Open
                </button>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleSaveModel}
                    title="Save SysML model"
                    disabled={!activeModel}
                >
                    <Icon name="save" size="sm" />
                    Save
                </button>
            </div>

            <div style={separatorStyle} />

            {/* Export Operations */}
            <div style={groupStyle}>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleExportModel}
                    title="Export SysML model"
                    disabled={!activeModel}
                >
                    <Icon name="export" size="sm" />
                    Export
                </button>
            </div>

            <div style={separatorStyle} />

            {/* View Controls */}
            <div style={groupStyle}>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleZoomIn}
                    title="Zoom in"
                >
                    <Icon name="zoom-in" size="sm" />
                </button>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleZoomOut}
                    title="Zoom out"
                >
                    <Icon name="zoom-out" size="sm" />
                </button>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleFitToView}
                    title="Fit to view"
                >
                    <Icon name="screen-full" size="sm" />
                </button>
            </div>

            <div style={separatorStyle} />

            {/* Validation */}
            <div style={groupStyle}>
                <button
                    style={buttonStyle('secondary')}
                    onClick={handleValidateModel}
                    title="Validate SysML model"
                    disabled={!activeModel}
                >
                    <Icon name="check" size="sm" />
                    Validate
                </button>
            </div>

            <div style={separatorStyle} />

            {/* View Options */}
            <div style={groupStyle}>
                <button
                    style={{
                        ...buttonStyle('secondary'),
                        color: isMinimapVisible ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                    }}
                    onClick={toggleMinimap}
                    title="Toggle minimap"
                >
                    <Icon name="map" size="sm" />
                </button>
                <button
                    style={{
                        ...buttonStyle('secondary'),
                        color: isPropertiesPanelOpen ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                    }}
                    onClick={onTogglePropertiesPanel}
                    title="Toggle properties panel"
                >
                    <Icon name="settings-gear" size="sm" />
                </button>
                <button
                    style={{
                        ...buttonStyle('secondary'),
                        color: isFullscreen ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                    }}
                    onClick={toggleFullscreen}
                    title="Toggle fullscreen"
                >
                    <Icon name={isFullscreen ? "screen-normal" : "screen-full"} size="sm" />
                </button>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Model Info */}
            {activeModel && (
                <div style={groupStyle}>
                    <span style={{
                        fontSize: dadmsTheme.typography.fontSize.xs,
                        color: dadmsTheme.colors.text.secondary,
                    }}>
                        {activeModel.name}
                    </span>
                </div>
            )}
        </div>
    );
};

export default SysMLToolbar; 