'use client';

import React from 'react';

/**
 * Icon component using VS Code Codicons
 * Replaces unprofessional emoji usage with consistent icon system
 */

export interface IconProps {
    name: CodiconName;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    color?: string;
    title?: string;
}

// Common Codicon names mapped for DADMS use cases
export type CodiconName =
    // Navigation
    | 'files' | 'search' | 'settings-gear' | 'extensions' | 'library' | 'git-branch'
    // Actions
    | 'add' | 'remove' | 'edit' | 'save' | 'close' | 'check' | 'copy' | 'trash' | 'cloud-upload' | 'cloud-download'
    // Status
    | 'circle-filled' | 'check-circle' | 'warning' | 'error' | 'info'
    // Arrows
    | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'chevron-down' | 'chevron-right'
    // Files
    | 'file' | 'file-text' | 'file-pdf' | 'file-zip' | 'folder' | 'folder-opened'
    // DADMS specific
    | 'project' | 'library' | 'type-hierarchy' | 'robot' | 'hubot' | 'graph' | 'pulse' | 'lightbulb' | 'beaker'
    // Tab management
    | 'pin' | 'more' | 'plus'
    // Ontology specific  
    | 'symbol-class' | 'symbol-property' | 'references' | 'symbol-field' | 'symbol-method' | 'symbol-variable'
    // Panel specific
    | 'files' | 'settings-gear' | 'references' | 'symbol-class'
    // Generic
    | 'refresh' | 'filter' | 'sort-precedence' | 'ellipsis' | 'more' | 'loading' | 'sync' | 'tag'
    // Display
    | 'map' | 'screen-full' | 'screen-normal';

const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

export const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    className = '',
    color,
    title
}) => {
    const iconSize = sizeMap[size];

    // Map custom names to actual codicon classes
    const codiconClass = `codicon codicon-${name}`;

    return (
        <i
            className={`${codiconClass} ${className}`}
            style={{
                fontSize: `${iconSize}px`,
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                lineHeight: `${iconSize}px`,
                color: color,
                display: 'inline-block',
                textAlign: 'center',
            }}
            title={title}
            aria-hidden={!title}
            aria-label={title}
        />
    );
};

// Predefined icon mappings for common DADMS actions
export const DADMSIcons = {
    // Projects
    newProject: 'add',
    editProject: 'edit',
    deleteProject: 'trash',
    projectStatus: {
        active: 'circle-filled',
        completed: 'check-circle',
        onHold: 'warning',
        cancelled: 'error',
    },

    // Knowledge
    upload: 'cloud-upload',
    download: 'cloud-download',
    search: 'search',
    domain: 'type-hierarchy',
    tag: 'tag',

    // Navigation
    projects: 'project',
    knowledge: 'library',
    ontology: 'type-hierarchy',
    llm: 'robot',
    context: 'settings-gear',
    bpmn: 'graph',
    process: 'pulse',
    thread: 'git-branch',
    aads: 'lightbulb',

    // Actions
    save: 'save',
    cancel: 'close',
    refresh: 'refresh',
    filter: 'filter',
    sort: 'sort-precedence',
    more: 'ellipsis',

    // Status
    success: 'check-circle',
    warning: 'warning',
    error: 'error',
    info: 'info',
    loading: 'loading',
} as const; 