"use client";

import React, { useCallback, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { dadmsTheme } from '../../../design-system/theme';
import { CodiconName, Icon } from '../../shared/Icon';
import { useOntologyWorkspaceStore } from '../store';
import { OntologyNodeData } from '../types';

interface OntologyNoteNodeData extends OntologyNodeData {
    noteContent: string;
    noteType: 'info' | 'warning' | 'error' | 'success' | 'general';
    noteAuthor?: string;
    noteCreated?: string;
    noteLastModified?: string;
}

const OntologyNoteNode: React.FC<NodeProps<OntologyNoteNodeData>> = ({ data, selected, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(data.noteContent || '');
    const [isExpanded, setIsExpanded] = useState(false);
    const { updateNode } = useOntologyWorkspaceStore();

    const handleDoubleClick = useCallback(() => {
        setIsEditing(true);
        setEditContent(data.noteContent || '');
    }, [data.noteContent]);

    const handleSave = useCallback(() => {
        // Update the node data through the store to ensure persistence
        updateNode(id, {
            data: {
                ...data,
                noteContent: editContent,
                noteLastModified: new Date().toISOString(),
            },
        });
        setIsEditing(false);
    }, [editContent, id, updateNode, data]);

    const handleCancel = useCallback(() => {
        setEditContent(data.noteContent || '');
        setIsEditing(false);
    }, [data.noteContent]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [handleSave, handleCancel]);

    const getNoteTypeConfig = (type: string) => {
        switch (type) {
            case 'info':
                return {
                    icon: 'info' as CodiconName,
                    color: dadmsTheme.colors.accent.info,
                    bgColor: dadmsTheme.colors.accent.info + '20',
                    borderColor: dadmsTheme.colors.accent.info
                };
            case 'warning':
                return {
                    icon: 'warning' as CodiconName,
                    color: dadmsTheme.colors.accent.warning,
                    bgColor: dadmsTheme.colors.accent.warning + '20',
                    borderColor: dadmsTheme.colors.accent.warning
                };
            case 'error':
                return {
                    icon: 'error' as CodiconName,
                    color: dadmsTheme.colors.accent.error,
                    bgColor: dadmsTheme.colors.accent.error + '20',
                    borderColor: dadmsTheme.colors.accent.error
                };
            case 'success':
                return {
                    icon: 'pass' as CodiconName,
                    color: dadmsTheme.colors.accent.success,
                    bgColor: dadmsTheme.colors.accent.success + '20',
                    borderColor: dadmsTheme.colors.accent.success
                };
            default:
                return {
                    icon: 'file-text' as CodiconName,
                    color: dadmsTheme.colors.accent.secondary,
                    bgColor: dadmsTheme.colors.accent.secondary + '20',
                    borderColor: dadmsTheme.colors.accent.secondary
                };
        }
    };

    const typeConfig = getNoteTypeConfig(data.noteType || 'general');

    const nodeStyle = {
        background: typeConfig.bgColor,
        border: `2px solid ${selected ? dadmsTheme.colors.accent.primary : typeConfig.borderColor}`,
        borderRadius: dadmsTheme.borderRadius.lg,
        padding: dadmsTheme.spacing.sm,
        minWidth: '200px',
        maxWidth: '300px',
        boxShadow: selected ? dadmsTheme.shadows.lg : dadmsTheme.shadows.sm,
        transition: dadmsTheme.transitions.fast,
        cursor: 'pointer',
        fontFamily: dadmsTheme.typography.fontFamily.default,
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: dadmsTheme.spacing.xs,
        gap: dadmsTheme.spacing.xs,
    };

    const titleStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontWeight: dadmsTheme.typography.fontWeight.medium,
        color: typeConfig.color,
        display: 'flex',
        alignItems: 'center',
        gap: dadmsTheme.spacing.xs,
        flex: 1,
    };

    const contentStyle = {
        fontSize: dadmsTheme.typography.fontSize.sm,
        color: dadmsTheme.colors.text.primary,
        lineHeight: '1.4',
        wordBreak: 'break-word' as const,
        whiteSpace: 'pre-wrap' as const,
    };

    const textareaStyle = {
        width: '100%',
        minHeight: '80px',
        padding: dadmsTheme.spacing.xs,
        background: dadmsTheme.colors.background.primary,
        border: `1px solid ${dadmsTheme.colors.border.default}`,
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.primary,
        fontSize: dadmsTheme.typography.fontSize.sm,
        fontFamily: dadmsTheme.typography.fontFamily.default,
        resize: 'vertical' as const,
        outline: 'none',
    };

    const footerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: dadmsTheme.spacing.xs,
        fontSize: dadmsTheme.typography.fontSize.xs,
        color: dadmsTheme.colors.text.secondary,
    };

    const actionsStyle = {
        display: 'flex',
        gap: dadmsTheme.spacing.xs,
    };

    const actionButtonStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: dadmsTheme.borderRadius.sm,
        color: dadmsTheme.colors.text.secondary,
        fontSize: dadmsTheme.typography.fontSize.xs,
        transition: dadmsTheme.transitions.fast,
    };

    const truncatedContent = data.noteContent?.length > 100 && !isExpanded
        ? data.noteContent.substring(0, 100) + '...'
        : data.noteContent;

    return (
        <div style={nodeStyle} onDoubleClick={handleDoubleClick}>
            {/* Right handle - outgoing only */}
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: typeConfig.color,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '8px',
                    height: '8px',
                }}
            />

            {/* Bottom handle - outgoing only */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: typeConfig.color,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '8px',
                    height: '8px',
                }}
            />

            {/* Left handle - outgoing only */}
            <Handle
                type="source"
                position={Position.Left}
                style={{
                    background: typeConfig.color,
                    border: `2px solid ${dadmsTheme.colors.background.primary}`,
                    width: '8px',
                    height: '8px',
                }}
            />

            <div style={headerStyle}>
                <div style={titleStyle}>
                    <Icon name={typeConfig.icon} size="sm" color={typeConfig.color} />
                    <span style={{ textTransform: 'capitalize' }}>
                        {data.noteType || 'general'} Note
                    </span>
                </div>
                <div style={actionsStyle}>
                    {!isEditing && (
                        <button
                            style={actionButtonStyle}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            <Icon
                                name={isExpanded ? 'arrow-up' : 'arrow-down'}
                                size="xs"
                            />
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div>
                    <textarea
                        style={textareaStyle}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter note content..."
                        autoFocus
                    />
                    <div style={actionsStyle}>
                        <button
                            style={{
                                ...actionButtonStyle,
                                color: dadmsTheme.colors.accent.success,
                            }}
                            onClick={handleSave}
                            title="Save (Ctrl+Enter)"
                        >
                            <Icon name="check" size="xs" />
                        </button>
                        <button
                            style={{
                                ...actionButtonStyle,
                                color: dadmsTheme.colors.accent.error,
                            }}
                            onClick={handleCancel}
                            title="Cancel (Esc)"
                        >
                            <Icon name="close" size="xs" />
                        </button>
                    </div>
                </div>
            ) : (
                <div style={contentStyle}>
                    {truncatedContent || 'Double-click to add note content...'}
                </div>
            )}

            <div style={footerStyle}>
                <span>
                    {data.noteAuthor && `by ${data.noteAuthor}`}
                </span>
                <span>
                    {data.noteLastModified && new Date(data.noteLastModified).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

export default OntologyNoteNode; 