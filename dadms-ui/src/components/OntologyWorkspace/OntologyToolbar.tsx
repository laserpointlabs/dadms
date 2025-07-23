"use client";

import React, { useRef } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import { useOntologyWorkspaceStore } from './store';

interface OntologyToolbarProps {
    className?: string;
}

const OntologyToolbar: React.FC<OntologyToolbarProps> = ({ className }) => {
    const {
        activeOntology,
        isValidating,
        validateOntology,
        loadMockWorkspace,
        generateMockOntology,
        clearSelection,
        selectedNodes,
        selectedEdges,
        saveOntologyToFile,
        loadOntologyFromFile,
        createNewOntology,
    } = useOntologyWorkspaceStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNewOntology = () => {
        createNewOntology();
    };

    const handleSave = () => {
        if (activeOntology) {
            saveOntologyToFile();
        }
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            loadOntologyFromFile(file);
        }
        // Reset the input so the same file can be selected again
        event.target.value = '';
    };

    const handleExport = () => {
        // Use the same save functionality for now
        handleSave();
    };

    const handleValidate = () => {
        validateOntology();
    };

    const handleGenerateAAS = () => {
        generateMockOntology();
    };

    const handleClearSelection = () => {
        clearSelection();
    };

    const handleLoadMockData = () => {
        loadMockWorkspace();
    };

    const handleClearStorage = () => {
        if (confirm('Clear all saved ontology data from browser storage?')) {
            localStorage.removeItem('ontology-workspace-store');
            window.location.reload();
        }
    };

    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: dadmsTheme.spacing.md,
        background: dadmsTheme.colors.background.secondary,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        gap: dadmsTheme.spacing.md,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const leftSectionStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.sm,
    };

    const rightSectionStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.sm,
    };

    const buttonStyle = (variant: 'primary' | 'secondary' | 'warning' = 'secondary', disabled = false) => ({
        padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.md}`,
        background: disabled
            ? dadmsTheme.colors.background.tertiary
            : variant === 'primary'
                ? dadmsTheme.colors.accent.primary
                : variant === 'warning'
                    ? dadmsTheme.colors.accent.warning
                    : dadmsTheme.colors.background.tertiary,
        border: `1px solid ${disabled
            ? dadmsTheme.colors.border.default
            : variant === 'primary'
                ? dadmsTheme.colors.accent.primary
                : variant === 'warning'
                    ? dadmsTheme.colors.accent.warning
                    : dadmsTheme.colors.border.default
            }`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: disabled
            ? dadmsTheme.colors.text.muted
            : variant === 'primary'
                ? dadmsTheme.colors.text.inverse
                : variant === 'warning'
                    ? dadmsTheme.colors.text.inverse
                    : dadmsTheme.colors.text.primary,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        transition: dadmsTheme.transitions.fast,
        opacity: disabled ? 0.6 : 1,
    });

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.lg,
        fontWeight: dadmsTheme.typography.fontWeight.semibold,
        color: dadmsTheme.colors.text.primary,
        marginRight: dadmsTheme.spacing.md,
    };

    const statusStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
    };

    const dividerStyle = {
        width: '1px',
        height: '24px',
        background: dadmsTheme.colors.border.default,
        margin: `0 ${dadmsTheme.spacing.sm}`,
    };

    return (
        <div style={containerStyle} className={className}>
            {/* Hidden file input for importing ontologies */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: 'none' }}
            />

            <div style={leftSectionStyle}>
                <div style={titleStyle}>
                    {activeOntology?.name || 'Ontology Modeler'}
                </div>

                <button
                    style={buttonStyle('secondary')}
                    onClick={handleNewOntology}
                    title="Create new ontology"
                >
                    <Icon name="add" size="sm" />
                    New
                </button>

                <button
                    style={buttonStyle('secondary')}
                    onClick={handleImport}
                    title="Import ontology from file"
                >
                    <Icon name="arrow-down" size="sm" />
                    Import
                </button>

                <button
                    style={buttonStyle('primary', !activeOntology)}
                    onClick={handleSave}
                    disabled={!activeOntology}
                    title="Save current ontology"
                >
                    <Icon name="save" size="sm" />
                    Save
                </button>

                <button
                    style={buttonStyle('secondary', !activeOntology)}
                    onClick={handleExport}
                    disabled={!activeOntology}
                    title="Export ontology"
                >
                    <Icon name="arrow-up" size="sm" />
                    Export
                </button>

                <div style={dividerStyle} />

                <button
                    style={buttonStyle('warning', !activeOntology || isValidating)}
                    onClick={handleValidate}
                    disabled={!activeOntology || isValidating}
                    title="Validate ontology consistency"
                >
                    <Icon name={isValidating ? "loading" : "check"} size="sm" />
                    {isValidating ? 'Validating...' : 'Validate'}
                </button>

                <button
                    style={buttonStyle('secondary')}
                    onClick={handleGenerateAAS}
                    title="Generate ontology using AAS (AI Assistant)"
                >
                    <Icon name="robot" size="sm" />
                    Generate via AAS
                </button>

                <div style={dividerStyle} />

                <button
                    style={buttonStyle('secondary')}
                    onClick={handleLoadMockData}
                    title="Load example ontology for testing"
                >
                    <Icon name="project" size="sm" />
                    Load Example
                </button>

                <button
                    style={buttonStyle('secondary')}
                    onClick={handleClearStorage}
                    title="Clear browser storage and refresh"
                >
                    <Icon name="trash" size="sm" />
                    Clear Storage
                </button>

                {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
                    <>
                        <div style={dividerStyle} />
                        <button
                            style={buttonStyle('secondary')}
                            onClick={handleClearSelection}
                            title="Clear current selection"
                        >
                            ✖ Clear Selection
                        </button>
                    </>
                )}
            </div>

            <div style={rightSectionStyle}>
                <div style={statusStyle}>
                    {activeOntology && (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: dadmsTheme.spacing.xs,
                                fontSize: dadmsTheme.typography.fontSize.xs,
                                color: dadmsTheme.colors.text.secondary,
                            }}>
                                <Icon name="project" size="xs" />
                                {activeOntology.nodes.length} nodes

                                <Icon name="type-hierarchy" size="xs" />
                                {activeOntology.edges.length} edges
                            </div>
                            {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
                                <div style={{ color: dadmsTheme.colors.accent.info }}>
                                    ({selectedNodes.length + selectedEdges.length} selected)
                                </div>
                            )}
                            <div style={dividerStyle} />
                            <div style={{ color: dadmsTheme.colors.status.active }}>
                                v{activeOntology.version}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OntologyToolbar; 