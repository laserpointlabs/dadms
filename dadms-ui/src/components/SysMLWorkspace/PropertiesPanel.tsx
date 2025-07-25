"use client";

import React from 'react';
import { useSysMLWorkspaceStore } from './store';

interface PropertiesPanelProps {
    isOpen?: boolean;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ isOpen = true }) => {
    const {
        selectedNodes,
        selectedEdges,
        activeModel,
        updateNode,
        updateEdge,
        updateModel
    } = useSysMLWorkspaceStore();

    if (!isOpen) return null;

    // Get the selected element (node, edge, or model)
    const getSelectedElement = () => {
        if (selectedNodes.length === 1 && activeModel) {
            return activeModel.nodes.find(node => node.id === selectedNodes[0]);
        }
        if (selectedEdges.length === 1 && activeModel) {
            return activeModel.edges.find(edge => edge.id === selectedEdges[0]);
        }
        return activeModel;
    };

    const selectedElement = getSelectedElement();

    const renderNodeProperties = (node: any) => (
        <div className="space-y-4">
            {/* Block Header */}
            <div className="bg-theme-accent-primary text-white p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                    <span className="codicon codicon-symbol-class text-lg"></span>
                    <span className="font-semibold">SysML Block</span>
                </div>
                <div className="text-sm opacity-90">
                    {node.data.elementType} • {node.data.stereotype ? `«${node.data.stereotype}»` : 'No stereotype'}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Block Name
                </label>
                <input
                    type="text"
                    value={node.data.label}
                    onChange={(e) => updateNode(node.id, {
                        data: { ...node.data, label: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary font-medium"
                    placeholder="Enter block name"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Element Type
                </label>
                <select
                    value={node.data.elementType}
                    onChange={(e) => updateNode(node.id, {
                        data: { ...node.data, elementType: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                >
                    <option value="block">Block</option>
                    <option value="part">Part</option>
                    <option value="attribute">Attribute</option>
                    <option value="activity">Activity</option>
                    <option value="state">State</option>
                    <option value="interface">Interface</option>
                    <option value="port">Port</option>
                    <option value="constraint">Constraint</option>
                    <option value="requirement">Requirement</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Stereotype (SysML v2)
                </label>
                <input
                    type="text"
                    value={node.data.stereotype || ''}
                    onChange={(e) => updateNode(node.id, {
                        data: { ...node.data, stereotype: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                    placeholder="e.g., system, component, interface"
                />
                <div className="text-xs text-theme-text-secondary mt-1">
                    SysML v2 stereotypes help categorize and extend element semantics
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Stereotype
                </label>
                <input
                    type="text"
                    value={node.data.stereotype || ''}
                    onChange={(e) => updateNode(node.id, {
                        data: { ...node.data, stereotype: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                    placeholder="Enter stereotype"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Description
                </label>
                <textarea
                    value={node.data.description}
                    onChange={(e) => updateNode(node.id, {
                        data: { ...node.data, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                />
            </div>

            {/* Attributes Section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-theme-text-primary">
                        Attributes
                    </label>
                    <button
                        onClick={() => {
                            const newAttributes = [...(node.data.properties.attributes || []), {
                                id: `attr-${Date.now()}`,
                                name: 'New Attribute',
                                type: 'string',
                                visibility: 'public',
                                multiplicity: '1',
                                defaultValue: '',
                                isDerived: false,
                                isReadOnly: false
                            }];
                            updateNode(node.id, {
                                data: {
                                    ...node.data,
                                    properties: {
                                        ...node.data.properties,
                                        attributes: newAttributes
                                    }
                                }
                            });
                        }}
                        className="text-xs px-2 py-1 bg-theme-accent-primary text-white rounded hover:bg-theme-accent-secondary"
                    >
                        + Add
                    </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(node.data.properties.attributes || []).map((attr: any, index: number) => (
                        <div key={attr.id} className="flex items-center gap-2 p-2 bg-theme-surface-elevated rounded border">
                            <input
                                type="text"
                                value={attr.name}
                                onChange={(e) => {
                                    const newAttributes = [...(node.data.properties.attributes || [])];
                                    newAttributes[index] = { ...attr, name: e.target.value };
                                    updateNode(node.id, {
                                        data: {
                                            ...node.data,
                                            properties: {
                                                ...node.data.properties,
                                                attributes: newAttributes
                                            }
                                        }
                                    });
                                }}
                                className="flex-1 text-xs px-2 py-1 border border-theme-border rounded bg-theme-surface"
                                placeholder="Attribute name"
                            />
                            <select
                                value={attr.type}
                                onChange={(e) => {
                                    const newAttributes = [...(node.data.properties.attributes || [])];
                                    newAttributes[index] = { ...attr, type: e.target.value };
                                    updateNode(node.id, {
                                        data: {
                                            ...node.data,
                                            properties: {
                                                ...node.data.properties,
                                                attributes: newAttributes
                                            }
                                        }
                                    });
                                }}
                                className="text-xs px-2 py-1 border border-theme-border rounded bg-theme-surface"
                            >
                                <option value="string">string</option>
                                <option value="integer">integer</option>
                                <option value="real">real</option>
                                <option value="boolean">boolean</option>
                                <option value="enum">enum</option>
                            </select>
                            <button
                                onClick={() => {
                                    const newAttributes = (node.data.properties.attributes || []).filter((a: any) => a.id !== attr.id);
                                    updateNode(node.id, {
                                        data: {
                                            ...node.data,
                                            properties: {
                                                ...node.data.properties,
                                                attributes: newAttributes
                                            }
                                        }
                                    });
                                }}
                                className="text-xs px-1 py-1 text-red-500 hover:bg-red-50 rounded"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        value={node.position.x}
                        onChange={(e) => updateNode(node.id, {
                            position: { ...node.position, x: parseInt(e.target.value) || 0 }
                        })}
                        className="px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                        placeholder="X"
                    />
                    <input
                        type="number"
                        value={node.position.y}
                        onChange={(e) => updateNode(node.id, {
                            position: { ...node.position, y: parseInt(e.target.value) || 0 }
                        })}
                        className="px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                        placeholder="Y"
                    />
                </div>
            </div>
        </div>
    );

    const renderEdgeProperties = (edge: any) => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Connection Type
                </label>
                <select
                    value={edge.data.connectionType}
                    onChange={(e) => updateEdge(edge.id, {
                        data: { ...edge.data, connectionType: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                >
                    <option value="association">Association</option>
                    <option value="composition">Composition</option>
                    <option value="aggregation">Aggregation</option>
                    <option value="generalization">Generalization</option>
                    <option value="dependency">Dependency</option>
                    <option value="realization">Realization</option>
                    <option value="flow">Flow</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Stereotype
                </label>
                <input
                    type="text"
                    value={edge.data.stereotype || ''}
                    onChange={(e) => updateEdge(edge.id, {
                        data: { ...edge.data, stereotype: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                    placeholder="Enter stereotype"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Multiplicity
                </label>
                <input
                    type="text"
                    value={edge.data.multiplicity || ''}
                    onChange={(e) => updateEdge(edge.id, {
                        data: { ...edge.data, multiplicity: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                    placeholder="e.g., 1..*"
                />
            </div>
        </div>
    );

    const renderModelProperties = (model: any) => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Model Name
                </label>
                <input
                    type="text"
                    value={model.name}
                    onChange={(e) => updateModel(model.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Diagram Type
                </label>
                <select
                    value={model.diagramType}
                    onChange={(e) => updateModel(model.id, { diagramType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                >
                    <option value="block_definition">Block Definition Diagram</option>
                    <option value="internal_block">Internal Block Diagram</option>
                    <option value="activity">Activity Diagram</option>
                    <option value="state_machine">State Machine Diagram</option>
                    <option value="sequence">Sequence Diagram</option>
                    <option value="use_case">Use Case Diagram</option>
                    <option value="requirement">Requirement Diagram</option>
                    <option value="parametric">Parametric Diagram</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Description
                </label>
                <textarea
                    value={model.description}
                    onChange={(e) => updateModel(model.id, { description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Author
                </label>
                <input
                    type="text"
                    value={model.author}
                    onChange={(e) => updateModel(model.id, { author: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-1">
                    Version
                </label>
                <input
                    type="text"
                    value={model.version}
                    onChange={(e) => updateModel(model.id, { version: e.target.value })}
                    className="w-full px-3 py-2 border border-theme-border rounded-md bg-theme-surface text-theme-text-primary"
                />
            </div>
        </div>
    );

    const renderNoSelection = () => (
        <div className="text-center py-8">
            <div className="text-theme-text-muted text-sm">
                <div className="codicon codicon-info text-2xl mb-2"></div>
                <p>No element selected</p>
                <p className="text-xs mt-1">Select a node, edge, or model to view properties</p>
            </div>
        </div>
    );

    const renderMultipleSelection = () => (
        <div className="text-center py-8">
            <div className="text-theme-text-muted text-sm">
                <div className="codicon codicon-multiple-windows text-2xl mb-2"></div>
                <p>Multiple elements selected</p>
                <p className="text-xs mt-1">Select a single element to view properties</p>
            </div>
        </div>
    );

    return (
        <div
            className="h-full overflow-y-auto bg-theme-surface border-l border-theme-border"
            style={{ minWidth: 280, maxWidth: 400 }}
        >
            <div className="flex items-center justify-between px-3 py-2 border-b border-theme-border bg-theme-surface-elevated">
                <span className="font-semibold text-theme-text-primary flex items-center">
                    <span className="codicon codicon-settings-gear mr-2"></span>
                    Properties
                    {selectedNodes.length === 1 && (
                        <span className="ml-2 text-xs bg-theme-accent-primary text-white px-2 py-1 rounded">
                            Block Selected
                        </span>
                    )}
                </span>
            </div>

            <div className="p-4">
                {!selectedElement ? (
                    renderNoSelection()
                ) : selectedNodes.length > 1 || selectedEdges.length > 1 ? (
                    renderMultipleSelection()
                ) : selectedNodes.length === 1 ? (
                    renderNodeProperties(selectedElement)
                ) : selectedEdges.length === 1 ? (
                    renderEdgeProperties(selectedElement)
                ) : (
                    renderModelProperties(selectedElement)
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel; 