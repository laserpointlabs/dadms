"use client";

import { Editor } from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';
import { dadmsTheme } from '../../design-system/theme';
import { Icon } from '../shared/Icon';
import SysMLModeler from './SysMLModeler';
import { useSysMLWorkspaceStore, ViewMode } from './store';

interface DualViewEditorProps {
    className?: string;
    isConnectionMode?: boolean;
}

const DualViewEditor: React.FC<DualViewEditorProps> = ({ className, isConnectionMode = false }) => {
    const {
        dualView,
        setViewMode,
        setSysMLContent,
        syncViews,
        activeModel,
        isMinimapVisible,
        isFullscreen,
        toggleMinimap,
        toggleFullscreen,
    } = useSysMLWorkspaceStore();

    const [localSysMLContent, setLocalSysMLContent] = useState(dualView.sysmlContent);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalSysMLContent(dualView.sysmlContent);
    }, [dualView.sysmlContent]);

    const handleModeSwitch = (mode: ViewMode) => {
        if (mode !== dualView.activeMode) {
            setViewMode(mode);
            if (mode === 'sysml_text' && dualView.activeMode === 'diagram') {
                // Sync diagram to SysML when switching to text mode
                syncViews();
            }
        }
    };

    const handleSysMLContentChange = (value: string | undefined) => {
        if (value !== undefined) {
            setLocalSysMLContent(value);
            setIsEditing(true);
        }
    };

    const handleSysMLContentSave = () => {
        setSysMLContent(localSysMLContent);
        setIsEditing(false);
        // In a real implementation, this would trigger diagram update
        console.log('SysML content saved:', localSysMLContent);
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

    // Generate example SysML v2 content
    const generateExampleSysMLContent = () => {
        return `package ExampleSystem {
    block System {
        part subsystem : Subsystem[1];
        attribute status : String = "operational";
        
        constraint operational {
            status == "operational" implies subsystem.isActive;
        }
    }
    
    block Subsystem {
        attribute isActive : Boolean = true;
        port input : in;
        port output : out;
        
        activity process {
            // Activity implementation
        }
    }
    
    association contains {
        multiplicity "1" : System;
        multiplicity "1" : Subsystem;
    }
}`;
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
                        style={tabStyle(dualView.activeMode === 'sysml_text')}
                        onClick={() => handleModeSwitch('sysml_text')}
                    >
                        <Icon name="file-text" size="sm" />
                        SysML v2 Text
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

                    {dualView.activeMode === 'sysml_text' && isEditing && (
                        <button
                            style={buttonStyle('primary')}
                            onClick={handleSysMLContentSave}
                            title="Save SysML changes and sync to diagram"
                        >
                            <Icon name="save" size="sm" />
                            Save
                        </button>
                    )}

                    <button
                        style={buttonStyle('secondary')}
                        onClick={handleSync}
                        title="Synchronize between diagram and SysML text"
                    >
                        <Icon name="sync" size="sm" />
                        Sync
                    </button>

                    {dualView.activeMode === 'diagram' && (
                        <button
                            style={{
                                ...buttonStyle('secondary'),
                                color: isMinimapVisible ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                            }}
                            onClick={toggleMinimap}
                            title="Toggle minimap visibility"
                        >
                            <Icon name="map" size="sm" />
                        </button>
                    )}

                    <button
                        style={{
                            ...buttonStyle('secondary'),
                            color: isFullscreen ? dadmsTheme.colors.accent.primary : dadmsTheme.colors.text.secondary,
                        }}
                        onClick={toggleFullscreen}
                        title="Toggle fullscreen mode"
                    >
                        <Icon name={isFullscreen ? "screen-normal" : "screen-full"} size="sm" />
                    </button>
                </div>
            </div>

            {dualView.activeMode === 'sysml_text' && (
                <div style={editorOptionsStyle}>
                    <label style={{ color: dadmsTheme.colors.text.secondary }}>
                        Format:
                        <select
                            style={selectStyle}
                            value={dualView.sysmlFormat}
                            onChange={(e) => {
                                // In real implementation, would update format and re-serialize
                                console.log('Format changed to:', e.target.value);
                            }}
                        >
                            <option value="sysml">SysML v2</option>
                            <option value="json">JSON</option>
                            <option value="xml">XML</option>
                            <option value="xmi">XMI</option>
                        </select>
                    </label>

                    <div style={{ color: dadmsTheme.colors.text.muted }}>
                        Lines: {localSysMLContent.split('\n').length} |
                        Characters: {localSysMLContent.length}
                    </div>
                </div>
            )}

            <div style={contentStyle}>
                {dualView.activeMode === 'diagram' ? (
                    <SysMLModeler isConnectionMode={isConnectionMode} />
                ) : (
                    <Editor
                        height="100%"
                        language="plaintext"
                        theme="vs-dark"
                        value={localSysMLContent || generateExampleSysMLContent()}
                        onChange={handleSysMLContentChange}
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
                            // Disable features that require file system access
                            quickSuggestions: {
                                other: true,
                                comments: false,
                                strings: false,
                            },
                            suggest: {
                                snippetsPreventQuickSuggestions: false,
                                showKeywords: true,
                                showSnippets: false,
                                showClasses: true,
                                showFunctions: true,
                                showVariables: true,
                                showModules: true,
                                showProperties: true,
                                showEvents: true,
                                showOperators: true,
                                showUnits: true,
                                showValues: true,
                                showConstants: true,
                                showEnums: true,
                                showEnumMembers: true,
                                showColors: true,
                                showFiles: false,
                                showReferences: true,
                                showFolders: false,
                                showTypeParameters: true,
                                showWords: true
                            },
                        }}
                        onMount={(editor, monaco) => {
                            // Configure editor for SysML editing
                            editor.addCommand(
                                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                                handleSysMLContentSave
                            );
                        }}
                    />
                )}
            </div>

            {!activeModel && (
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
                    <div>No SysML model selected</div>
                    <div style={{ fontSize: dadmsTheme.typography.fontSize.sm, marginTop: dadmsTheme.spacing.sm }}>
                        Load an existing model or create a new one to get started
                    </div>
                </div>
            )}
        </div>
    );
};

export default DualViewEditor; 