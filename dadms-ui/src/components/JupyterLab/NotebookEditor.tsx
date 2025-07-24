"use client";

import { useEffect, useState } from "react";
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { Icon } from '../shared/Icon';
import { LoadingState } from '../shared/LoadingState';

interface Kernel {
    id: string;
    name: string;
    language: string;
    status: 'idle' | 'busy' | 'starting' | 'dead';
    execution_state?: 'idle' | 'busy' | 'starting' | 'dead';
}

interface Notebook {
    id: string;
    name: string;
    path: string;
    type: 'notebook' | 'file';
    content?: any;
}

interface Cell {
    id: string;
    cell_type: 'code' | 'markdown';
    source: string[];
    outputs?: any[];
    execution_count?: number;
    metadata?: any;
}

interface NotebookEditorProps {
    notebook: Notebook;
    kernel: Kernel | null;
    apiUrl: string;
    token: string;
}

export function NotebookEditor({ notebook, kernel, apiUrl, token }: NotebookEditorProps) {
    const [cells, setCells] = useState<Cell[]>([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState<string | null>(null);
    const [notebookContent, setNotebookContent] = useState<any>(null);

    useEffect(() => {
        loadNotebookContent();
    }, [notebook.id]);

    const loadNotebookContent = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/contents/${encodeURIComponent(notebook.path)}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const content = await response.json();
                setNotebookContent(content);
                setCells(content.content?.cells || []);
            }
        } catch (error) {
            console.error('Failed to load notebook content:', error);
        } finally {
            setLoading(false);
        }
    };

    const addCell = (type: 'code' | 'markdown') => {
        const newCell: Cell = {
            id: `cell_${Date.now()}`,
            cell_type: type,
            source: [''],
            outputs: [],
            execution_count: null,
            metadata: {}
        };
        setCells(prev => [...prev, newCell]);
    };

    const updateCell = (index: number, updates: Partial<Cell>) => {
        setCells(prev => prev.map((cell, i) =>
            i === index ? { ...cell, ...updates } : cell
        ));
    };

    const deleteCell = (index: number) => {
        setCells(prev => prev.filter((_, i) => i !== index));
    };

    const executeCell = async (index: number) => {
        if (!kernel) {
            alert('Please select a kernel to execute code');
            return;
        }

        const cell = cells[index];
        if (cell.cell_type !== 'code') return;

        setExecuting(cell.id);
        try {
            // First, check if kernel is ready
            const kernelResponse = await fetch(`${apiUrl}/kernels/${kernel.id}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!kernelResponse.ok) {
                throw new Error('Kernel not accessible');
            }

            const kernelInfo = await kernelResponse.json();
            console.log('Kernel status:', kernelInfo);

            // Execute code via Jupyter Lab API
            const code = cell.source.join('');
            console.log('Executing code:', code);

            // Try the execute endpoint
            const response = await fetch(`${apiUrl}/kernels/${kernel.id}/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    silent: false,
                    store_history: true,
                    user_expressions: {},
                    allow_stdin: false
                })
            });

            console.log('Execution response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Cell execution result:', result);

                // Update cell with execution results
                const outputs = [];

                // Handle different response formats
                if (result.content) {
                    if (result.content.payload) {
                        // Handle payload outputs (like display data)
                        result.content.payload.forEach((payload: any) => {
                            if (payload.source === 'page') {
                                outputs.push({
                                    output_type: 'display_data',
                                    data: payload.data,
                                    metadata: payload.metadata || {}
                                });
                            }
                        });
                    }

                    if (result.content.text) {
                        // Handle text output
                        outputs.push({
                            output_type: 'stream',
                            name: 'stdout',
                            text: result.content.text
                        });
                    }

                    if (result.content.data) {
                        // Handle rich output (like plots, images)
                        outputs.push({
                            output_type: 'execute_result',
                            data: result.content.data,
                            metadata: result.content.metadata || {},
                            execution_count: result.content.execution_count || (cell.execution_count || 0) + 1
                        });
                    }

                    if (result.content.error) {
                        // Handle errors
                        outputs.push({
                            output_type: 'error',
                            ename: result.content.error.ename || 'ExecutionError',
                            evalue: result.content.error.evalue || 'An error occurred during execution',
                            traceback: result.content.error.traceback || []
                        });
                    }
                }

                // If no outputs were generated, create a simple success message
                if (outputs.length === 0) {
                    outputs.push({
                        output_type: 'execute_result',
                        data: {
                            'text/plain': 'Cell executed successfully'
                        },
                        metadata: {},
                        execution_count: (cell.execution_count || 0) + 1
                    });
                }

                updateCell(index, {
                    outputs: outputs,
                    execution_count: outputs.length > 0 ? outputs[outputs.length - 1].execution_count : (cell.execution_count || 0) + 1
                });
            } else {
                const errorText = await response.text();
                console.error('Execution failed:', response.status, errorText);
                throw new Error(`Execution failed: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Cell execution failed:', error);
            updateCell(index, {
                outputs: [{
                    output_type: 'error',
                    ename: 'ExecutionError',
                    evalue: error instanceof Error ? error.message : 'Failed to execute cell',
                    traceback: []
                }]
            });
        } finally {
            setExecuting(null);
        }
    };

    const saveNotebook = async () => {
        try {
            const updatedContent = {
                ...notebookContent,
                content: {
                    ...notebookContent.content,
                    cells: cells
                }
            };

            const response = await fetch(`${apiUrl}/contents/${encodeURIComponent(notebook.path)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedContent)
            });

            if (response.ok) {
                console.log('Notebook saved successfully');
            }
        } catch (error) {
            console.error('Failed to save notebook:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingState message="Loading notebook..." />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {notebook.name}
                    </h2>
                    {kernel && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Icon name="circle" className={`${kernel.status === 'idle' ? 'text-green-500' : 'text-yellow-500'}`} />
                            <span>{kernel.name} ({kernel.status})</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon="save"
                        onClick={saveNotebook}
                    >
                        Save
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon="add"
                        onClick={() => addCell('code')}
                    >
                        Code Cell
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        leftIcon="file-text"
                        onClick={() => addCell('markdown')}
                    >
                        Markdown
                    </Button>
                </div>
            </div>

            {/* Notebook Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cells.length === 0 ? (
                    <div className="text-center py-8">
                        <Icon name="file-text" className="text-gray-400 mx-auto mb-4" size="xl" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Empty Notebook
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Add your first cell to get started with data analysis and prototyping.
                        </p>
                        <div className="space-x-2">
                            <Button
                                variant="primary"
                                onClick={() => addCell('code')}
                            >
                                <Icon name="add" className="mr-2" />
                                Add Code Cell
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => addCell('markdown')}
                            >
                                <Icon name="markdown" className="mr-2" />
                                Add Markdown
                            </Button>
                        </div>
                    </div>
                ) : (
                    cells.map((cell, index) => (
                        <CellEditor
                            key={cell.id}
                            cell={cell}
                            index={index}
                            onUpdate={(updates) => updateCell(index, updates)}
                            onDelete={() => deleteCell(index)}
                            onExecute={() => executeCell(index)}
                            isExecuting={executing === cell.id}
                            canExecute={kernel?.status === 'idle' || kernel?.execution_state === 'idle'}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface CellEditorProps {
    cell: Cell;
    index: number;
    onUpdate: (updates: Partial<Cell>) => void;
    onDelete: () => void;
    onExecute: () => void;
    isExecuting: boolean;
    canExecute: boolean;
}

function CellEditor({ cell, index, onUpdate, onDelete, onExecute, isExecuting, canExecute }: CellEditorProps) {
    const [isEditing, setIsEditing] = useState(false);

    const handleSourceChange = (newSource: string) => {
        onUpdate({ source: [newSource] });
    };

    const renderOutputs = () => {
        if (!cell.outputs || cell.outputs.length === 0) return null;

        return (
            <div className="mt-2 space-y-2">
                {cell.outputs.map((output, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                        {output.output_type === 'execute_result' && (
                            <div className="text-sm">
                                <div className="text-gray-500 dark:text-gray-400 mb-1">
                                    Out [{output.execution_count}]:
                                </div>
                                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                    {output.data?.['text/plain'] || JSON.stringify(output.data, null, 2)}
                                </pre>
                            </div>
                        )}
                        {output.output_type === 'stream' && (
                            <div className="text-sm">
                                <div className="text-gray-500 dark:text-gray-400 mb-1">
                                    {output.name === 'stderr' ? 'Error:' : 'Output:'}
                                </div>
                                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                    {output.text}
                                </pre>
                            </div>
                        )}
                        {output.output_type === 'display_data' && (
                            <div className="text-sm">
                                <div className="text-gray-500 dark:text-gray-400 mb-1">
                                    Display:
                                </div>
                                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                    {output.data?.['text/plain'] || JSON.stringify(output.data, null, 2)}
                                </pre>
                            </div>
                        )}
                        {output.output_type === 'error' && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                                <div className="font-semibold">{output.ename}:</div>
                                <div>{output.evalue}</div>
                                {output.traceback && output.traceback.length > 0 && (
                                    <div className="mt-2">
                                        <pre className="text-xs whitespace-pre-wrap">
                                            {output.traceback.join('\n')}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Card variant="default" padding="sm">
            {/* Cell Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {cell.cell_type === 'code' ? `In [${cell.execution_count || ' '}]:` : 'Markdown'}
                    </span>
                    {cell.cell_type === 'code' && (
                        <button
                            onClick={onExecute}
                            disabled={!canExecute || isExecuting}
                            className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                            <Icon name="play" size="sm" />
                            {isExecuting ? 'Running...' : 'Run'}
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <Icon name={isEditing ? "eye" : "edit"} size="sm" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <Icon name="trash" size="sm" />
                    </button>
                </div>
            </div>

            {/* Cell Content */}
            <div className="space-y-2">
                {cell.cell_type === 'code' ? (
                    <div>
                        <textarea
                            value={cell.source.join('')}
                            onChange={(e) => handleSourceChange(e.target.value)}
                            className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono text-gray-900 dark:text-gray-100 resize-none focus:border-blue-500 focus:outline-none"
                            placeholder="Enter Python code here..."
                        />
                        {renderOutputs()}
                    </div>
                ) : (
                    <div>
                        {isEditing ? (
                            <textarea
                                value={cell.source.join('')}
                                onChange={(e) => handleSourceChange(e.target.value)}
                                className="w-full h-24 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 resize-none focus:border-blue-500 focus:outline-none"
                                placeholder="Enter markdown here..."
                            />
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    {cell.source.join('') || <em className="text-gray-500">Empty markdown cell</em>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
} 