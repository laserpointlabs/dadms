"use client";

import React, { useEffect, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import DualViewEditor from './DualViewEditor';
import ExternalReferencePanel from './ExternalReferencePanel';
import OntologyPalette from './OntologyPalette';
import OntologyToolbar from './OntologyToolbar';
import PropertiesPanel from './PropertiesPanel';
import { useOntologyWorkspaceStore } from './store';

interface OntologyWorkspaceProps {
    workspaceId?: string;
    projectId?: string;
    className?: string;
}

const OntologyWorkspace: React.FC<OntologyWorkspaceProps> = ({
    workspaceId = 'workspace-1',
    projectId = 'project-1',
    className
}) => {
    const {
        workspace,
        activeOntology,
        isPropertiesPanelOpen,
        isExternalPanelOpen,
        togglePropertiesPanel,
        toggleExternalPanel,
        loadMockWorkspace,
        validationResult,
        ensureWorkspace,
        isInitialized,
    } = useOntologyWorkspaceStore();

    const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);

    // Ensure workspace exists when component mounts
    useEffect(() => {
        ensureWorkspace();
    }, [ensureWorkspace]);

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        background: dadmsTheme.colors.background.primary,
        fontFamily: dadmsTheme.typography.fontFamily.default,
        overflow: 'hidden',
    };

    const mainContentStyle = {
        display: 'flex',
        flex: 1,
        height: 'calc(100% - 60px)', // Account for toolbar height
        overflow: 'hidden',
    };

    const centerContentStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden',
    };

    const panelToggleStyle = {
        position: 'absolute' as const,
        top: dadmsTheme.spacing.md,
        right: dadmsTheme.spacing.md,
        zIndex: dadmsTheme.zIndex.dropdown,
        display: 'flex',
        gap: dadmsTheme.spacing.xs,
    };

    const toggleButtonStyle = (isActive: boolean) => ({
        padding: dadmsTheme.spacing.xs,
        background: isActive ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.background.secondary,
        border: `1px solid ${isActive ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: isActive ? dadmsTheme.colors.text.inverse : dadmsTheme.colors.text.primary,
        cursor: 'pointer',
        fontSize: dadmsTheme.typography.fontSize.xs,
        transition: dadmsTheme.transitions.fast,
        boxShadow: dadmsTheme.shadows.sm,
    });

    const validationBannerStyle = {
        background: validationResult?.warnings.length
            ? dadmsTheme.colors.accent.warning
            : dadmsTheme.colors.accent.success,
        color: dadmsTheme.colors.text.inverse,
        padding: dadmsTheme.spacing.sm,
        fontSize: dadmsTheme.typography.fontSize.sm,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const loadingOverlayStyle = {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `${dadmsTheme.colors.background.primary}cc`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: dadmsTheme.zIndex.modal,
    };

    const emptyStateStyle = {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center' as const,
        color: dadmsTheme.colors.text.muted,
        zIndex: dadmsTheme.zIndex.elevated,
    };

    return (
        <div style={containerStyle} className={className}>
            {/* Toolbar */}
            <OntologyToolbar />

            {/* Validation Banner */}
            {validationResult && (
                <div style={validationBannerStyle}>
                    <div>
                        {validationResult.isValid
                            ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: dadmsTheme.spacing.xs }}>
                                    <Icon name="check-circle" size="sm" />
                                    Ontology is valid{validationResult.warnings.length > 0 ? ` (${validationResult.warnings.length} warnings)` : ''}
                                </span>
                            )
                            : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: dadmsTheme.spacing.xs }}>
                                    <Icon name="error" size="sm" />
                                    Ontology has {validationResult.errors.length} errors
                                </span>
                            )
                        }
                    </div>
                    <button
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: dadmsTheme.typography.fontSize.sm,
                        }}
                        onClick={() => {
                            // Clear validation result
                            console.log('Clear validation result');
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <div style={mainContentStyle}>
                {/* Left Panel - Entity Palette */}
                <OntologyPalette
                    isCollapsed={isPaletteCollapsed}
                    onToggleCollapse={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
                />

                {/* Center Content - Dual View Editor */}
                <div style={centerContentStyle}>
                    {/* Panel Toggle Buttons */}
                    <div style={panelToggleStyle}>
                        <button
                            style={toggleButtonStyle(isPropertiesPanelOpen)}
                            onClick={togglePropertiesPanel}
                            title="Toggle properties panel"
                        >
                            <Icon name="settings-gear" size="sm" />
                            Properties
                        </button>
                        <button
                            style={toggleButtonStyle(isExternalPanelOpen)}
                            onClick={toggleExternalPanel}
                            title="Toggle external references panel"
                        >
                            <Icon name="type-hierarchy" size="sm" />
                            References
                        </button>
                    </div>

                    {/* Main Editor */}
                    <DualViewEditor />
                </div>

                {/* Right Panel - Properties */}
                <PropertiesPanel
                    isOpen={isPropertiesPanelOpen}
                    onToggle={togglePropertiesPanel}
                />

                {/* Right Panel - External References */}
                <ExternalReferencePanel
                    isOpen={isExternalPanelOpen}
                    onToggle={toggleExternalPanel}
                />
            </div>

            {/* Status Bar (Optional) */}
            {activeOntology && (
                <div style={{
                    height: '24px',
                    background: dadmsTheme.colors.background.secondary,
                    borderTop: `1px solid ${dadmsTheme.colors.border.default}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `0 ${dadmsTheme.spacing.md}`,
                    fontSize: dadmsTheme.typography.fontSize.xs,
                    color: dadmsTheme.colors.text.secondary,
                }}>
                    <div>
                        Workspace: {workspaceId} | Project: {projectId}
                    </div>
                    <div>
                        Last modified: {new Date(activeOntology.lastModified).toLocaleTimeString()}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {!isInitialized && (
                <div style={loadingOverlayStyle}>
                    <div style={{ textAlign: 'center', color: dadmsTheme.colors.text.primary }}>
                        <div style={{ fontSize: '20px', marginBottom: dadmsTheme.spacing.md }}>
                            <Icon name="loading" size="lg" />
                        </div>
                        <div>Loading Ontology Workspace...</div>
                    </div>
                </div>
            )}

            {/* Welcome/Empty State */}
            {isInitialized && !activeOntology && (
                <div style={emptyStateStyle}>
                    <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                        <Icon name="add" size="xl" />
                    </div>
                    <div>Create New Ontology</div>
                    <div style={{
                        fontSize: dadmsTheme.typography.fontSize.sm,
                        marginTop: dadmsTheme.spacing.sm
                    }}>
                        Start building your decision intelligence model
                    </div>
                </div>
            )}
        </div>
    );
};

export default OntologyWorkspace; 