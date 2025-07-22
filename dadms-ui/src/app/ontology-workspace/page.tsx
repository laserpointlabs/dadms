"use client";

import { useCallback, useState } from 'react';
import { DrawIOModeler } from '../../components/OntologyWorkspace/DrawIOModeler';
import { Modal } from '../../components/ProjectDashboard/Modal';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { FormField, Input, Select, TextArea } from '../../components/shared/FormField';
import { PageLayout } from '../../components/shared/PageLayout';

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

export default function OntologyWorkspacePage() {
    const [selectedWorkspace, setSelectedWorkspace] = useState<OntologyWorkspace | null>(null);
    const [selectedOntology, setSelectedOntology] = useState<OntologyDocument | null>(null);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showOntologyModal, setShowOntologyModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock data - in real implementation, this would come from API
    const [workspaces] = useState<OntologyWorkspace[]>([
        {
            id: '1',
            name: 'Decision Analysis Ontology',
            description: 'Core ontology for decision analysis concepts',
            project_id: 'proj1',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-20T15:30:00Z'
        },
        {
            id: '2',
            name: 'UAV Mission Ontology',
            description: 'Ontology for UAV mission planning and execution',
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
            description: 'Base decision-making concepts and relationships',
            format: 'OWL/XML',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z'
        },
        {
            id: '2',
            workspace_id: '1',
            name: 'Stakeholder Model',
            description: 'Stakeholder roles and responsibilities',
            format: 'Turtle',
            status: 'draft',
            created_at: '2024-01-16T11:45:00Z'
        }
    ]);

    const handleWorkspaceSelect = useCallback((workspace: OntologyWorkspace) => {
        setSelectedWorkspace(workspace);
        setSelectedOntology(null);
    }, []);

    const handleOntologySelect = useCallback((ontology: OntologyDocument) => {
        setSelectedOntology(ontology);
    }, []);

    const handleModelerLoad = useCallback(() => {
        setIsLoading(false);
        setError(null);
    }, []);

    const handleModelerError = useCallback((error: Error) => {
        setError(error.message);
        setIsLoading(false);
    }, []);

    const handleModelerSave = useCallback(async (xmlData: string, pngData: string) => {
        try {
            setIsLoading(true);

            // Save to backend via API
            const response = await fetch('/api/ontology-workspace/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspaceId: selectedWorkspace?.id,
                    ontologyId: selectedOntology?.id,
                    xmlData,
                    pngData
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save ontology');
            }

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedWorkspace, selectedOntology]);

    const handleOntologyImport = useCallback(async (ontologyData: any) => {
        try {
            setIsLoading(true);

            // Import ontology data via cemento
            const response = await fetch('/api/ontology-workspace/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspaceId: selectedWorkspace?.id,
                    ontologyData
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to import ontology');
            }

            const result = await response.json();
            setError(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedWorkspace]);

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

    const pageActions = (
        <div className="flex items-center gap-2">
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
                title="Ontology Workspace"
                subtitle="Visual ontology modeling with draw.io and cemento integration"
                icon="graph"
                actions={pageActions}
                status={{ text: 'Select Workspace', type: 'inactive' }}
            >
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleWorkspaceSelect(workspace);
                                        }}
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
                    title="Create New Workspace"
                >
                    <form className="space-y-4">
                        <FormField label="Workspace Name" required>
                            <Input placeholder="e.g., Decision Analysis Ontology" />
                        </FormField>
                        <FormField label="Description">
                            <TextArea placeholder="Describe the purpose of this ontology workspace..." />
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
            subtitle="Visual ontology modeling with draw.io and cemento integration"
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
                                    variant="ghost"
                                    size="sm"
                                    leftIcon="arrow-left"
                                    onClick={() => setSelectedWorkspace(null)}
                                >
                                    Back to Workspaces
                                </Button>
                            </div>
                            <h2 className="text-xl font-semibold text-theme-text-primary">
                                {selectedWorkspace.name}
                            </h2>
                            <p className="text-theme-text-secondary">
                                {selectedWorkspace.description}
                            </p>
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
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="ml-auto"
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                )}

                {/* Draw.io Modeler */}
                <div className="flex-1 bg-theme-surface border border-theme-border rounded-lg overflow-hidden">
                    <DrawIOModeler
                        workspaceId={selectedWorkspace.id}
                        ontologyId={selectedOntology?.id}
                        onLoad={handleModelerLoad}
                        onError={handleModelerError}
                        onSave={handleModelerSave}
                        onOntologyImport={handleOntologyImport}
                        height="100%"
                    />
                </div>

                {/* Create Ontology Modal */}
                <Modal
                    isOpen={showOntologyModal}
                    onClose={() => setShowOntologyModal(false)}
                    title="Create New Ontology"
                >
                    <form className="space-y-4">
                        <FormField label="Ontology Name" required>
                            <Input placeholder="e.g., Core Decision Model" />
                        </FormField>
                        <FormField label="Description">
                            <TextArea placeholder="Describe this ontology component..." />
                        </FormField>
                        <FormField label="Format">
                            <Select>
                                <option value="owl">OWL/XML</option>
                                <option value="turtle">Turtle</option>
                                <option value="rdf">RDF/XML</option>
                                <option value="jsonld">JSON-LD</option>
                            </Select>
                        </FormField>
                        <FormField label="Initial Template">
                            <Select>
                                <option value="">Empty Ontology</option>
                                <option value="decision">Decision Analysis Template</option>
                                <option value="process">Process Ontology Template</option>
                                <option value="stakeholder">Stakeholder Model Template</option>
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