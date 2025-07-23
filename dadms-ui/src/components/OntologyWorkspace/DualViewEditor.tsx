"use client";

import { Editor } from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import OntologyModeler from './OntologyModeler';
import { useOntologyWorkspaceStore } from './store';
import { ViewMode } from './types';

interface DualViewEditorProps {
    className?: string;
}

const DualViewEditor: React.FC<DualViewEditorProps> = ({ className }) => {
    const {
        dualView,
        setViewMode,
        setOwlContent,
        syncViews,
        activeOntology,
    } = useOntologyWorkspaceStore();

    const [localOwlContent, setLocalOwlContent] = useState(dualView.owlContent);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalOwlContent(dualView.owlContent);
    }, [dualView.owlContent]);

    const handleModeSwitch = (mode: ViewMode) => {
        if (mode !== dualView.activeMode) {
            setViewMode(mode);
            if (mode === 'owl_text' && dualView.activeMode === 'diagram') {
                // Sync diagram to OWL when switching to text mode
                syncViews();
            }
        }
    };

    const handleOwlContentChange = (value: string | undefined) => {
        if (value !== undefined) {
            setLocalOwlContent(value);
            setIsEditing(true);
        }
    };

    const handleOwlContentSave = () => {
        setOwlContent(localOwlContent);
        setIsEditing(false);
        // In a real implementation, this would trigger diagram update
        console.log('OWL content saved:', localOwlContent);
    };

    const handleSync = () => {
        syncViews();
    };

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        background: dadmsTheme.colors.background.primary,
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${dadmsTheme.spacing.sm} ${dadmsTheme.spacing.md}`,
        background: dadmsTheme.colors.background.secondary,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
    };

    const tabsStyle = {
        display: 'flex',
        gap: dadmsTheme.spacing.xs,
    };

    const tabStyle = (isActive: boolean) => ({
        padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
        background: isActive ? dadmsTheme.colors.background.primary : 'transparent',
        border: `1px solid ${isActive ? dadmsTheme.colors.border.focus : dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: isActive ? dadmsTheme.colors.text.primary : dadmsTheme.colors.text.secondary,
        cursor: 'pointer',
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: isActive ? dadmsTheme.typography.fontWeight.medium : dadmsTheme.typography.fontWeight.normal,
        transition: dadmsTheme.transitions.fast,
        userSelect: 'none' as const,
    });

    const actionsStyle = {
        display: 'flex',
        gap: dadmsTheme.spacing.sm,
        alignItems: 'center',
    };

    const buttonStyle = (variant: 'primary' | 'secondary' = 'secondary') => ({
        padding: `${dadmsTheme.spacing.xs} ${dadmsTheme.spacing.sm}`,
        background: 'transparent',
        border: 'none',
        borderRadius: dadmsTheme.borderRadius.sm,
        color: variant === 'primary' ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.primary,
        cursor: 'pointer',
        fontSize: dadmsTheme.typography.fontSize.sm,
        transition: dadmsTheme.transitions.fast,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        '&:hover': {
            background: dadmsTheme.colors.background.tertiary,
        },
    });

    const statusStyle = {
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dualView.isSync ? dadmsTheme.colors.status.active : dadmsTheme.colors.status.pending,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
    };

    const contentStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
    };

    const editorOptionsStyle = {
        padding: dadmsTheme.spacing.sm,
        background: dadmsTheme.colors.background.tertiary,
        borderBottom: `1px solid ${dadmsTheme.colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.md,
        fontSize: dadmsTheme.typography.fontSize.xs,
    };

    const selectStyle = {
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.primary,
        padding: dadmsTheme.spacing.xs,
        fontSize: dadmsTheme.typography.fontSize.xs,
    };

    return (
        <div style={containerStyle} className={className}>
            <div style={headerStyle}>
                <div style={tabsStyle}>
                    <div
                        style={tabStyle(dualView.activeMode === 'diagram')}
                        onClick={() => handleModeSwitch('diagram')}
                    >
                        <Icon name="project" size="sm" />
                        Diagram View
                    </div>
                    <div
                        style={tabStyle(dualView.activeMode === 'owl_text')}
                        onClick={() => handleModeSwitch('owl_text')}
                    >
                        <Icon name="file-text" size="sm" />
                        OWL Text
                    </div>
                </div>

                <div style={actionsStyle}>
                    <div style={statusStyle}>
                        <div
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: dualView.isSync ? dadmsTheme.colors.status.active : dadmsTheme.colors.status.pending,
                            }}
                        />
                        {dualView.isSync ? 'Synchronized' : 'Out of sync'}
                    </div>

                    {dualView.activeMode === 'owl_text' && isEditing && (
                        <button
                            style={buttonStyle('primary')}
                            onClick={handleOwlContentSave}
                            title="Save OWL changes and sync to diagram"
                        >
                            <Icon name="save" size="sm" />
                            Save
                        </button>
                    )}

                    <button
                        style={buttonStyle('secondary')}
                        onClick={handleSync}
                        title="Synchronize between diagram and OWL text"
                    >
                        <Icon name="sync" size="sm" />
                        Sync
                    </button>
                </div>
            </div>

            {dualView.activeMode === 'owl_text' && (
                <div style={editorOptionsStyle}>
                    <label style={{ color: dadmsTheme.colors.text.secondary }}>
                        Format:
                        <select
                            style={selectStyle}
                            value={dualView.owlFormat}
                            onChange={(e) => {
                                // In real implementation, would update format and re-serialize
                                console.log('Format changed to:', e.target.value);
                            }}
                        >
                            <option value="turtle">Turtle</option>
                            <option value="rdf_xml">RDF/XML</option>
                            <option value="owl_xml">OWL/XML</option>
                            <option value="n3">N3</option>
                            <option value="json_ld">JSON-LD</option>
                        </select>
                    </label>

                    <div style={{ color: dadmsTheme.colors.text.muted }}>
                        Lines: {localOwlContent.split('\n').length} |
                        Characters: {localOwlContent.length}
                    </div>
                </div>
            )}

            <div style={contentStyle}>
                {dualView.activeMode === 'diagram' ? (
                    <OntologyModeler />
                ) : (
                    <Editor
                        height="100%"
                        language="turtle"
                        theme="vs-dark"
                        value={localOwlContent}
                        onChange={handleOwlContentChange}
                        options={{
                            fontSize: 13,
                            fontFamily: dadmsTheme.typography.fontFamily.mono,
                            lineNumbers: 'on',
                            minimap: { enabled: true },
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            renderWhitespace: 'selection',
                            bracketPairColorization: { enabled: true },
                            suggest: {
                                snippetsPreventQuickSuggestions: false,
                            },
                            quickSuggestions: {
                                other: true,
                                comments: true,
                                strings: true,
                            },
                        }}
                        onMount={(editor, monaco) => {
                            // Configure editor for ontology editing
                            editor.addCommand(
                                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                                handleOwlContentSave
                            );
                        }}
                    />
                )}
            </div>

            {!activeOntology && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: dadmsTheme.colors.text.muted,
                        fontSize: dadmsTheme.typography.fontSize.lg,
                    }}
                >
                    <div style={{ marginBottom: dadmsTheme.spacing.md }}>
                        <Icon name="project" size="xl" />
                    </div>
                    <div>No ontology selected</div>
                    <div style={{ fontSize: dadmsTheme.typography.fontSize.sm, marginTop: dadmsTheme.spacing.sm }}>
                        Load an existing ontology or create a new one to get started
                    </div>
                </div>
            )}
        </div>
    );
};

export default DualViewEditor; 