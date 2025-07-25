'use client';

import React, { useState } from 'react';
import { SysMLModel, SysMLPackage, useSysMLWorkspaceStore } from './store';

// Codicon mapping for SysML element types
const iconMap: Record<string, string> = {
    workspace: 'codicon-symbol-class',
    package: 'codicon-package',
    model: 'codicon-symbol-structure',
    bdd: 'codicon-symbol-class',
    ibd: 'codicon-symbol-interface',
    block: 'codicon-symbol-class',
    part: 'codicon-symbol-field',
    attribute: 'codicon-symbol-variable',
    connection: 'codicon-link',
    activity: 'codicon-run-all',
    state: 'codicon-symbol-enum',
};

// Tree node component
const TreeNode: React.FC<{
    label: string;
    icon: string;
    children?: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    depth?: number;
    expandable?: boolean;
    expanded?: boolean;
    onToggle?: () => void;
}> = ({ label, icon, children, isActive, onClick, depth = 0, expandable, expanded, onToggle }) => {
    return (
        <div style={{ paddingLeft: depth * 16, background: isActive ? 'var(--theme-bg-hover)' : undefined }}>
            <div
                className={`flex items-center cursor-pointer py-1 px-2 rounded ${isActive ? 'bg-theme-bg-hover' : ''}`}
                onClick={onClick}
                style={{ color: isActive ? 'var(--theme-accent-primary)' : 'var(--theme-text-primary)' }}
            >
                {expandable && (
                    <span
                        className={`codicon ${expanded ? 'codicon-chevron-down' : 'codicon-chevron-right'} mr-1 text-xs`}
                        onClick={e => {
                            e.stopPropagation();
                            onToggle && onToggle();
                        }}
                    />
                )}
                <span className={`codicon ${icon} mr-2`} />
                <span className="truncate">{label}</span>
            </div>
            {expanded && children}
        </div>
    );
};

const SysMLExplorer: React.FC = () => {
    const workspace = useSysMLWorkspaceStore(s => s.workspace);
    const activeModel = useSysMLWorkspaceStore(s => s.activeModel);
    const setActiveModel = useSysMLWorkspaceStore(s => s.setActiveModel);
    const addModel = useSysMLWorkspaceStore(s => s.addModel);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Expand/collapse helpers
    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Add new model (mock)
    const handleAddModel = () => {
        const newModel: SysMLModel = {
            id: `model-${Date.now()}`,
            name: 'New Model',
            description: 'New SysML model',
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
    };

    // Render models
    const renderModels = (models: SysMLModel[], depth: number) =>
        models.map(model => (
            <TreeNode
                key={model.id}
                label={`${model.name} (${model.diagramType.toUpperCase()})`}
                icon={iconMap[model.diagramType] || 'model'}
                isActive={activeModel?.id === model.id}
                onClick={() => setActiveModel(model)}
                depth={depth}
            />
        ));

    // Render packages recursively
    const renderPackages = (packages: SysMLPackage[], depth: number) =>
        packages.map(pkg => {
            const isPkgExpanded = expanded[pkg.id] ?? true;
            return (
                <React.Fragment key={pkg.id}>
                    <TreeNode
                        label={pkg.name}
                        icon={iconMap['package']}
                        expandable={true}
                        expanded={isPkgExpanded}
                        onToggle={() => toggleExpand(pkg.id)}
                        depth={depth}
                    >
                        <div className="ml-4">
                            <button
                                className="text-xs text-theme-accent-primary hover:underline mb-1"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleAddModel();
                                }}
                            >
                                + Add Model
                            </button>
                        </div>
                        {/* Recursively render sub-packages if needed */}
                        {isPkgExpanded && pkg.children && renderPackages(pkg.children, depth + 1)}
                    </TreeNode>
                </React.Fragment>
            );
        });

    return (
        <div
            className="h-full overflow-y-auto bg-theme-surface border-r border-theme-border"
            style={{ minWidth: 220, maxWidth: 320 }}
        >
            <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border bg-theme-surface-elevated">
                <span className="font-semibold text-theme-text-primary flex items-center">
                    <span className={`codicon ${iconMap['workspace']} mr-2`} />
                    SysML Explorer
                </span>
                <button
                    className="codicon codicon-add text-theme-accent-primary hover:text-theme-accent-secondary text-lg"
                    title="Add Model"
                    onClick={handleAddModel}
                />
            </div>
            <div className="py-2">
                {workspace && workspace.models && workspace.models.length > 0 ? (
                    <div>
                        <div className="px-3 py-1 text-xs font-medium text-theme-text-secondary uppercase tracking-wide">
                            Models
                        </div>
                        {renderModels(workspace.models, 0)}
                    </div>
                ) : (
                    <div className="text-theme-text-muted text-sm px-4 py-6">No models found. Click + to add one.</div>
                )}

                {workspace && workspace.packages && workspace.packages.length > 0 && (
                    <div className="mt-4">
                        <div className="px-3 py-1 text-xs font-medium text-theme-text-secondary uppercase tracking-wide">
                            Packages
                        </div>
                        {renderPackages(workspace.packages, 0)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SysMLExplorer; 