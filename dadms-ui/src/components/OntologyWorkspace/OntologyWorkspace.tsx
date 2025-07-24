"use client";

import React, { useEffect, useState } from 'react';
import { usePanel } from '../../contexts/PanelStateContext';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import DualViewEditor from './DualViewEditor';
import ExternalReferencePanel from './ExternalReferencePanel';
import OntologyExplorer from './OntologyExplorer';
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
        isFullscreen,
        togglePropertiesPanel,
        toggleExternalPanel,
        loadMockWorkspace,
        validationResult,
        ensureWorkspace,
        isInitialized,
    } = useOntologyWorkspaceStore();

    const [isConnectionMode, setIsConnectionMode] = useState(false);

    // Use persistent panel states
    const palettePanel = usePanel('ontology-palette');
    const explorerPanel = usePanel('ontology-explorer');
    const propertiesPanel = usePanel('ontology-properties');
    const referencesPanel = usePanel('ontology-references');

    // Ensure workspace exists when component mounts
    useEffect(() => {
        ensureWorkspace();
    }, [ensureWorkspace]);

    const handleConnectionModeToggle = () => {
        setIsConnectionMode(!isConnectionMode);
    };

    // Add keyboard shortcut to exit connection mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isConnectionMode) {
                setIsConnectionMode(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isConnectionMode]);

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column' as const,
        height: isFullscreen ? '100vh' : '100%',
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' as const : 'relative' as const,
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        background: dadmsTheme.colors.background.primary,
        fontFamily: dadmsTheme.typography.fontFamily.default,
        overflow: 'hidden',
    };

    const mainContentStyle = {
        display: 'flex',
        flex: 1,
        height: 'calc(100% - 48px)', // Reduced toolbar height
        overflow: 'hidden',
    };

    const centerContentStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden',
    };



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
            <OntologyToolbar
                isPropertiesPanelOpen={isPropertiesPanelOpen}
                isExternalPanelOpen={isExternalPanelOpen}
                onTogglePropertiesPanel={togglePropertiesPanel}
                onToggleExternalPanel={toggleExternalPanel}
            />

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
                {/* Left Panel - Ontology Explorer */}
                <OntologyExplorer
                    isOpen={!explorerPanel.isCollapsed}
                    onToggle={() => explorerPanel.toggleCollapsed()}
                />

                {/* Left Panel - Entity Palette */}
                <OntologyPalette
                    isCollapsed={palettePanel.isCollapsed}
                    onToggleCollapse={() => palettePanel.toggleCollapsed()}
                    onConnectionModeToggle={handleConnectionModeToggle}
                    isConnectionMode={isConnectionMode}
                />

                {/* Center Content - Dual View Editor */}
                <div style={centerContentStyle}>
                    {/* Connection Mode Indicator */}
                    {isConnectionMode && (
                        <div style={{
                            position: 'absolute',
                            top: dadmsTheme.spacing.md,
                            left: dadmsTheme.spacing.md,
                            zIndex: dadmsTheme.zIndex.dropdown,
                            background: dadmsTheme.colors.accent.success,
                            color: dadmsTheme.colors.text.inverse,
                            padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
                            borderRadius: dadmsTheme.borderRadius.md,
                            fontSize: dadmsTheme.typography.fontSize.sm,
                            display: 'flex',
                            alignItems: 'center',
                            gap: dadmsTheme.spacing.xs,
                            boxShadow: dadmsTheme.shadows.md,
                        }}>
                            <Icon name="arrow-right" size="sm" />
                            Connection Mode: Click and drag between entities to create relationships
                        </div>
                    )}



                    {/* Main Editor */}
                    <DualViewEditor />
                </div>

                {/* Right Panel - Properties */}
                <PropertiesPanel
                    isOpen={isPropertiesPanelOpen}
                    onToggle={togglePropertiesPanel}
                    isCollapsed={propertiesPanel.isCollapsed}
                    onToggleCollapse={() => propertiesPanel.toggleCollapsed()}
                />

                {/* Right Panel - External References */}
                <ExternalReferencePanel
                    isOpen={isExternalPanelOpen}
                    onToggle={toggleExternalPanel}
                    isCollapsed={referencesPanel.isCollapsed}
                    onToggleCollapse={() => referencesPanel.toggleCollapsed()}
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
                        {isConnectionMode && (
                            <span style={{
                                marginLeft: dadmsTheme.spacing.md,
                                color: dadmsTheme.colors.accent.success,
                                fontWeight: dadmsTheme.typography.fontWeight.medium,
                            }}>
                                | Connection Mode Active
                            </span>
                        )}
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