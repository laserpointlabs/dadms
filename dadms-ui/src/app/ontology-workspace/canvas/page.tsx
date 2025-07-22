"use client";

import { useCallback, useState } from 'react';
import { ReactFlowOntologyEditor } from '../../../components/OntologyWorkspace/ReactFlowOntologyEditor';
import { Modal } from '../../../components/ProjectDashboard/Modal';
import { Button } from '../../../components/shared/Button';
import { Card } from '../../../components/shared/Card';
import { FormField, Input, Select, TextArea } from '../../../components/shared/FormField';
import { PageLayout } from '../../../components/shared/PageLayout';

interface OntologyWorkspace {
    id: string;
    name: string;
    description?: string;
    project_id: string;
    created_at: string;
    updated_at: string;
}

interface OntologyDocument {
    id: string;
    workspace_id: string;
    name: string;
    description?: string;
    format: string;
    status: string;
    created_at: string;
}

export default function CanvasOntologyEditorPage() {
    const [selectedWorkspace, setSelectedWorkspace] = useState<OntologyWorkspace | null>(null);
    const [selectedOntology, setSelectedOntology] = useState<OntologyDocument | null>(null);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showOntologyModal, setShowOntologyModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationResult, setValidationResult] = useState<any>(null);

    // Mock data for canvas-based editor
    const [workspaces] = useState<OntologyWorkspace[]>([
        {
            id: '1',
            name: 'Decision Analysis Ontology (Canvas)',
            description: 'Clean React canvas-based ontology editing with drag and drop',
            project_id: 'proj1',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-20T15:30:00Z'
        },
        {
            id: '2',
            name: 'UAV Mission Ontology (Canvas)',
            description: 'Simple block-based ontology modeling with React Flow',
            project_id: 'proj1',
            created_at: '2024-01-18T14:20:00Z',
            updated_at: '2024-01-22T09:15:00Z'
        }
    ]);

    const [ontologies] = useState<OntologyDocument[]>([
        {
            id: '1',
            workspace_id: '1',
            name: 'Core Decision Model',
            description: 'Base decision-making concepts with canvas interface',
            format: 'React Flow JSON',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z'
        },
        {
            id: '2',
            workspace_id: '1',
            name: 'Stakeholder Model',
            description: 'Stakeholder roles with drag-and-drop canvas',
            format: 'React Flow JSON',
            status: 'draft',
            created_at: '2024-01-16T11:45:00Z'
        }
    ]);

    const handleWorkspaceSelect = useCallback((workspace: OntologyWorkspace) => {
        setSelectedWorkspace(workspace);
        setSelectedOntology(null);
        setValidationResult(null);
    }, []);

    const handleOntologySelect = useCallback((ontology: OntologyDocument) => {
        setSelectedOntology(ontology);
        setValidationResult(null);
    }, []);

    const handleEditorLoad = useCallback(() => {
        setIsLoading(false);
        setError(null);
    }, []);

    const handleEditorError = useCallback((error: Error) => {
        setError(error.message);
        setIsLoading(false);
    }, []);

    const handleEditorSave = useCallback(async (ontologyData: any) => {
        try {
            setIsLoading(true);

            // Save via Ontology Workspace Service API (using React Flow data)
            const response = await fetch(`http://localhost:3016/workspaces/${selectedWorkspace?.id}/ontologies/${selectedOntology?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: selectedOntology?.name,
                    description: selectedOntology?.description,
                    format: 'react_flow_ontology',
                    content: ontologyData,
                    visual_layout: {
                        type: 'react_flow',
                        data: JSON.stringify(ontologyData),
                        auto_layout: false
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save ontology via Canvas editor');
            }

            const result = await response.json();
            setError(null);

            // Show success message
            alert('Ontology saved successfully using React Flow Canvas editor!');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedWorkspace, selectedOntology]);

    const handleEditorValidate = useCallback(async (validationResult: any) => {
        setValidationResult(validationResult);

        if (selectedWorkspace && selectedOntology) {
            try {
                // Send validation request to backend
                const response = await fetch(`http://localhost:3016/workspaces/${selectedWorkspace.id}/ontologies/${selectedOntology.id}/validate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        validationEngine: 'react_flow_canvas',
                        includeWarnings: true
                    }),
                });

                if (response.ok) {
                    const backendResult = await response.json();
                    setValidationResult({
                        ...validationResult,
                        backendValidation: backendResult.data
                    });
                }
            } catch (error) {
                console.warn('Backend validation failed:', error);
            }
        }
    }, [selectedWorkspace, selectedOntology]);

    const createNewWorkspace = () => {
        setShowWorkspaceModal(true);
    };

    const createNewOntology = () => {
        if (!selectedWorkspace) {
            setError('Please select a workspace first');
            return;
        }
        setShowOntologyModal(true);
    };

    const navigateToDrawIO = () => {
        window.location.href = '/ontology-workspace';
    };

    const navigateToOnto4All = () => {
        window.location.href = '/ontology-workspace/onto4all';
    };

    const pageActions = (
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                size="sm"
                leftIcon="graph"
                onClick={navigateToDrawIO}
            >
                Draw.io Editor
            </Button>
            <Button
                variant="secondary"
                size="sm"
                leftIcon="graph"
                onClick={navigateToOnto4All}
            >
                Onto4ALL Editor
            </Button>
            <Button
                variant="secondary"
                size="sm"
                leftIcon="add"
                onClick={createNewOntology}
                disabled={!selectedWorkspace}
            >
                New Ontology
            </Button>
            <Button
                variant="primary"
                size="sm"
                leftIcon="folder-opened"
                onClick={createNewWorkspace}
            >
                New Workspace
            </Button>
        </div>
    );

    if (!selectedWorkspace) {
        return (
            <PageLayout
                title="React Flow Canvas Ontology Editor"
                subtitle="Simple drag-and-drop ontology modeling with React Canvas and Flow"
                icon="graph"
                actions={pageActions}
                status={{ text: 'Select Workspace', type: 'inactive' }}
            >
                <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">🎨 React Flow Canvas Editor</h3>
                        <p className="text-green-800 mb-3">
                            This implementation uses React Flow for a native React canvas experience with:
                        </p>
                        <ul className="text-green-800 text-sm space-y-1 ml-4">
                            <li>• Drag-and-drop blocks for Classes 🏛️, Object Properties 🔗, and Data Properties 📊</li>
                            <li>• Native React components with full theme integration</li>
                            <li>• Visual connection drawing between ontology elements</li>
                            <li>• Real-time property editing panel with type-specific fields</li>
                            <li>• Built-in validation with visual feedback</li>
                            <li>• Zoom, pan, and minimap for large ontologies</li>
                            <li>• Clean, modern UI with semantic colors</li>
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map((workspace) => (
                        <Card
                            key={workspace.id}
                            className="cursor-pointer hover:border-theme-accent-primary transition-colors"
                            onClick={() => handleWorkspaceSelect(workspace)}
                        >
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
                                    {workspace.name}
                                </h3>
                                <p className="text-theme-text-secondary mb-4">
                                    {workspace.description || 'No description'}
                                </p>
                                <div className="flex justify-between items-center text-sm text-theme-text-muted">
                                    <span>Updated {new Date(workspace.updated_at).toLocaleDateString()}</span>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleWorkspaceSelect(workspace)}
                                    >
                                        Open
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Create Workspace Modal */}
                <Modal
                    isOpen={showWorkspaceModal}
                    onClose={() => setShowWorkspaceModal(false)}
                    title="Create New Canvas Workspace"
                >
                    <form className="space-y-4">
                        <FormField label="Workspace Name" required>
                            <Input placeholder="e.g., Decision Analysis Ontology (Canvas)" />
                        </FormField>
                        <FormField label="Description">
                            <TextArea placeholder="Describe the purpose of this ontology workspace for canvas editing..." />
                        </FormField>
                        <FormField label="Project">
                            <Select>
                                <option value="">Select Project</option>
                                <option value="proj1">UAV Decision Analysis</option>
                                <option value="proj2">Supply Chain Optimization</option>
                            </Select>
                        </FormField>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setShowWorkspaceModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary">
                                Create Workspace
                            </Button>
                        </div>
                    </form>
                </Modal>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title={selectedWorkspace.name}
            subtitle="React Flow canvas ontology modeling with drag-and-drop blocks"
            icon="graph"
            actions={pageActions}
            status={{
                text: selectedOntology ? `Editing: ${selectedOntology.name}` : 'Workspace Active',
                type: 'active'
            }}
        >
            <div className="flex flex-col h-full">
                {/* Workspace Header */}
                <div className="bg-theme-surface border border-theme-border rounded-lg p-4 mb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon="arrow-left"
                                    onClick={() => setSelectedWorkspace(null)}
                                >
                                    Back to Workspaces
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon="graph"
                                    onClick={navigateToDrawIO}
                                >
                                    Draw.io
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leftIcon="graph"
                                    onClick={navigateToOnto4All}
                                >
                                    Onto4ALL
                                </Button>
                            </div>
                            <h2 className="text-xl font-semibold text-theme-text-primary">
                                {selectedWorkspace.name}
                            </h2>
                            <p className="text-theme-text-secondary">
                                {selectedWorkspace.description}
                            </p>
                            {validationResult && (
                                <div className="mt-2">
                                    <span className={`text-sm px-2 py-1 rounded ${validationResult.valid
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {validationResult.valid ? '✅ Valid Ontology' : `⚠️ ${validationResult.warnings?.length || 0} Warnings`}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {ontologies
                                .filter(ont => ont.workspace_id === selectedWorkspace.id)
                                .map((ontology) => (
                                    <Button
                                        key={ontology.id}
                                        variant={selectedOntology?.id === ontology.id ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={() => handleOntologySelect(ontology)}
                                    >
                                        {ontology.name}
                                    </Button>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-theme-accent-error bg-opacity-10 border border-theme-accent-error rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-theme-accent-error text-sm font-medium">Error:</span>
                            <span className="text-theme-text-primary text-sm">{error}</span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setError(null)}
                                className="ml-auto"
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                )}

                {/* React Flow Canvas Editor */}
                <div className="flex-1 bg-theme-surface border border-theme-border rounded-lg overflow-hidden">
                    <ReactFlowOntologyEditor
                        workspaceId={selectedWorkspace.id}
                        ontologyId={selectedOntology?.id}
                        onLoad={handleEditorLoad}
                        onError={handleEditorError}
                        onSave={handleEditorSave}
                        onValidate={handleEditorValidate}
                        height="100%"
                    />
                </div>

                {/* Create Ontology Modal */}
                <Modal
                    isOpen={showOntologyModal}
                    onClose={() => setShowOntologyModal(false)}
                    title="Create New Ontology (Canvas)"
                >
                    <form className="space-y-4">
                        <FormField label="Ontology Name" required>
                            <Input placeholder="e.g., Core Decision Model" />
                        </FormField>
                        <FormField label="Description">
                            <TextArea placeholder="Describe this ontology component for canvas editing..." />
                        </FormField>
                        <FormField label="Format">
                            <Select>
                                <option value="react_flow">React Flow Canvas</option>
                                <option value="owl">OWL/XML</option>
                                <option value="turtle">Turtle</option>
                                <option value="rdf">RDF/XML</option>
                                <option value="jsonld">JSON-LD</option>
                            </Select>
                        </FormField>
                        <FormField label="Initial Template">
                            <Select>
                                <option value="">Empty Canvas</option>
                                <option value="decision">Decision Analysis Template</option>
                                <option value="process">Process Ontology Template</option>
                                <option value="stakeholder">Stakeholder Model Template</option>
                                <option value="canvas_basic">Canvas Basic Template</option>
                            </Select>
                        </FormField>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setShowOntologyModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary">
                                Create Ontology
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </PageLayout>
    );
} 