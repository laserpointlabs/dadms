'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../../components/shared/Alert';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { FormField, Input, Select } from '../../components/shared/FormField';
import { Icon } from '../../components/shared/Icon';
import { LoadingState } from '../../components/shared/LoadingState';
import { PageLayout } from '../../components/shared/PageLayout';

// Types based on our API specification
interface Ontology {
    id: string;
    name: string;
    description: string;
    version: string;
    domain: string;
    scope: 'general' | 'domain' | 'project';
    entities: Entity[];
    relationships: Relationship[];
    metadata: OntologyMetadata;
    created_at: string;
    updated_at: string;
}

interface Entity {
    id: string;
    name: string;
    type: 'concept' | 'individual' | 'property';
    confidence: number;
}

interface Relationship {
    id: string;
    name: string;
    type: 'hasA' | 'isA' | 'partOf' | 'relatedTo';
    confidence: number;
}

interface OntologyMetadata {
    extraction_job?: string;
    source_documents?: string[];
    validation_status?: 'pending' | 'validated' | 'needs_review';
    quality_score?: number;
}

interface Tab {
    id: string;
    name: string;
    icon: 'type-hierarchy' | 'folder' | 'graph' | 'sync' | 'settings-gear' | 'pulse';
    description: string;
}

const TABS: Tab[] = [
    { id: 'workspace', name: 'Workspace', icon: 'type-hierarchy', description: 'Ontology management workspace' },
    { id: 'library', name: 'Library', icon: 'folder', description: 'Browse ontology library' },
    { id: 'extraction', name: 'Extraction', icon: 'graph', description: 'Extract from documents' },
    { id: 'validation', name: 'Validation', icon: 'sync', description: 'Review and validate' },
    { id: 'integration', name: 'Integration', icon: 'settings-gear', description: 'System integration' },
    { id: 'analytics', name: 'Analytics', icon: 'pulse', description: 'Usage analytics' }
];

// Mock data
const MOCK_ONTOLOGIES: Ontology[] = [
    {
        id: 'onto-1',
        name: 'Defense Decision Making',
        description: 'Core ontology for military decision-making processes',
        version: '2.1.0',
        domain: 'Defense',
        scope: 'domain',
        entities: [
            { id: 'e1', name: 'Mission', type: 'concept', confidence: 0.95 },
            { id: 'e2', name: 'Threat Assessment', type: 'concept', confidence: 0.92 },
            { id: 'e3', name: 'Resource Allocation', type: 'concept', confidence: 0.88 }
        ],
        relationships: [
            { id: 'r1', name: 'requires', type: 'hasA', confidence: 0.90 },
            { id: 'r2', name: 'influences', type: 'relatedTo', confidence: 0.85 }
        ],
        metadata: {
            validation_status: 'validated',
            quality_score: 0.94,
            source_documents: ['FM-1', 'ATP-2', 'CONOPS-3']
        },
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
    },
    {
        id: 'onto-2',
        name: 'Project Management',
        description: 'General project management concepts and relationships',
        version: '1.0.0',
        domain: 'Business',
        scope: 'general',
        entities: [
            { id: 'e4', name: 'Project', type: 'concept', confidence: 0.98 },
            { id: 'e5', name: 'Task', type: 'concept', confidence: 0.96 },
            { id: 'e6', name: 'Milestone', type: 'concept', confidence: 0.94 }
        ],
        relationships: [
            { id: 'r3', name: 'contains', type: 'hasA', confidence: 0.93 },
            { id: 'r4', name: 'precedes', type: 'relatedTo', confidence: 0.89 }
        ],
        metadata: {
            validation_status: 'needs_review',
            quality_score: 0.87
        },
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-18T16:45:00Z'
    }
];

export default function OntologyWorkspacePage() {
    const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
    const [ontologies, setOntologies] = useState<Ontology[]>([]);
    const [selectedOntology, setSelectedOntology] = useState<Ontology | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState<string>('all');

    useEffect(() => {
        // Mock data loading
        setTimeout(() => {
            setOntologies(MOCK_ONTOLOGIES);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredOntologies = ontologies.filter(ontology => {
        const matchesSearch = ontology.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ontology.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesScope = filterScope === 'all' || ontology.scope === filterScope;
        return matchesSearch && matchesScope;
    });

    const renderTabContent = () => {
        switch (activeTab) {
            case 'workspace':
                return (
                    <div className="space-y-6">
                        {/* Modeler Section */}
                        <Card variant="outlined" padding="md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                                        <Icon name="type-hierarchy" size="lg" className="text-theme-accent-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-theme-text-primary">Ontology Modeler</h3>
                                        <p className="text-sm text-theme-text-secondary">
                                            Visual ontology design and modeling workspace
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    leftIcon="arrow-right"
                                    onClick={() => window.open('/ontology-modeler', '_blank')}
                                >
                                    Open Modeler
                                </Button>
                            </div>
                        </Card>

                        {/* Search and Filters */}
                        <Card variant="outlined" padding="md">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <FormField label="Search Ontologies">
                                        <div className="relative">
                                            <Input
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by name or description..."
                                                className="pl-10"
                                            />
                                            <Icon name="search" size="md" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-muted" />
                                        </div>
                                    </FormField>
                                </div>
                                <div className="w-full md:w-48">
                                    <FormField label="Scope Filter">
                                        <Select value={filterScope} onChange={(e) => setFilterScope(e.target.value)}>
                                            <option value="all">All Scopes</option>
                                            <option value="general">General</option>
                                            <option value="domain">Domain</option>
                                            <option value="project">Project</option>
                                        </Select>
                                    </FormField>
                                </div>
                                <div className="flex items-end">
                                    <Button variant="primary" leftIcon="add">
                                        New Ontology
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Ontology Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredOntologies.map((ontology) => (
                                <Card key={ontology.id} variant="outlined" padding="md" className="hover:shadow-lg transition-shadow">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-theme-text-primary mb-1">
                                                    {ontology.name}
                                                </h3>
                                                <p className="text-sm text-theme-text-secondary">
                                                    {ontology.description}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 ml-2">
                                                <Button size="sm" variant="tertiary" leftIcon="edit" />
                                                <Button size="sm" variant="tertiary" leftIcon="trash" />
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-theme-text-secondary">Version:</span>
                                                <div className="text-theme-text-primary font-medium">{ontology.version}</div>
                                            </div>
                                            <div>
                                                <span className="text-theme-text-secondary">Domain:</span>
                                                <div className="text-theme-text-primary font-medium">{ontology.domain}</div>
                                            </div>
                                            <div>
                                                <span className="text-theme-text-secondary">Scope:</span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ontology.scope === 'general' ? 'bg-theme-accent-info bg-opacity-20 text-theme-accent-info' :
                                                    ontology.scope === 'domain' ? 'bg-theme-accent-primary bg-opacity-20 text-theme-accent-primary' :
                                                        'bg-theme-accent-warning bg-opacity-20 text-theme-accent-warning'
                                                    }`}>
                                                    {ontology.scope}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-theme-text-secondary">Quality:</span>
                                                <div className="text-theme-text-primary font-medium">
                                                    {ontology.metadata.quality_score ? `${Math.round(ontology.metadata.quality_score * 100)}%` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex justify-between items-center pt-2 border-t border-theme-border">
                                            <div className="text-sm text-theme-text-secondary">
                                                {ontology.entities.length} entities, {ontology.relationships.length} relationships
                                            </div>
                                            <Button size="sm" variant="primary" onClick={() => setSelectedOntology(ontology)}>
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {filteredOntologies.length === 0 && !loading && (
                            <Card variant="outlined" padding="md">
                                <div className="text-center py-8 text-theme-text-secondary">
                                    <Icon name="search" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                    <p>No ontologies found</p>
                                    <p className="text-sm">Try adjusting your search criteria</p>
                                </div>
                            </Card>
                        )}
                    </div>
                );

            case 'library':
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8 text-theme-text-secondary">
                                <Icon name="folder" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                <p>Ontology Library</p>
                                <p className="text-sm">Browse and import ontologies from the shared library</p>
                            </div>
                        </Card>
                    </div>
                );

            case 'extraction':
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8 text-theme-text-secondary">
                                <Icon name="graph" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                <p>Ontology Extraction</p>
                                <p className="text-sm">Extract ontologies from documents and knowledge sources</p>
                            </div>
                        </Card>
                    </div>
                );

            case 'validation':
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8 text-theme-text-secondary">
                                <Icon name="sync" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                <p>Ontology Validation</p>
                                <p className="text-sm">Review and validate extracted ontologies</p>
                            </div>
                        </Card>
                    </div>
                );

            case 'integration':
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8 text-theme-text-secondary">
                                <Icon name="settings-gear" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                <p>System Integration</p>
                                <p className="text-sm">Configure ontology integration with other services</p>
                            </div>
                        </Card>
                    </div>
                );

            case 'analytics':
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8 text-theme-text-secondary">
                                <Icon name="pulse" size="xl" className="mx-auto mb-4 text-theme-text-muted" />
                                <p>Usage Analytics</p>
                                <p className="text-sm">View ontology usage patterns and analytics</p>
                            </div>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <PageLayout
                title="Ontology Workspace"
                subtitle="Manage and develop knowledge ontologies"
                icon="type-hierarchy"
                status={{ text: 'Loading...', type: 'pending' }}
            >
                <div className="flex items-center justify-center py-12">
                    <LoadingState size="lg" />
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout
                title="Ontology Workspace"
                subtitle="Manage and develop knowledge ontologies"
                icon="type-hierarchy"
                status={{ text: 'Error', type: 'error' }}
            >
                <Alert variant="error" title="Error Loading Ontology Workspace" className="m-6">
                    {error}
                </Alert>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Ontology Workspace"
            subtitle="Manage and develop knowledge ontologies"
            icon="type-hierarchy"
            status={{ text: 'Workspace Active', type: 'active' }}
        >
            <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
                {/* Tab Navigation */}
                <Card variant="default" padding="none">
                    <div className="border-b border-theme-border">
                        <nav className="flex overflow-x-auto">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'text-theme-accent-primary bg-theme-surface-elevated border-theme-accent-primary'
                                            : 'text-theme-text-secondary hover:text-theme-accent-primary hover:bg-theme-surface-hover border-transparent'
                                        }
                                    `}
                                >
                                    <Icon
                                        name={tab.icon}
                                        size="md"
                                        className={activeTab === tab.id ? 'text-theme-accent-primary' : 'text-theme-text-muted'}
                                    />
                                    <div className="text-left">
                                        <div>{tab.name}</div>
                                        <div className="text-xs text-theme-text-muted">
                                            {tab.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {renderTabContent()}
                    </div>
                </Card>

                {/* Selected Ontology Detail (if any) */}
                {selectedOntology && (
                    <Card variant="outlined" padding="md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-theme-text-primary">
                                {selectedOntology.name} Details
                            </h2>
                            <Button
                                variant="tertiary"
                                leftIcon="close"
                                onClick={() => setSelectedOntology(null)}
                            >
                                Close
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Entities */}
                            <div>
                                <h3 className="text-lg font-medium text-theme-text-primary mb-3">Entities</h3>
                                <div className="space-y-2">
                                    {selectedOntology.entities.map((entity) => (
                                        <div key={entity.id} className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                            <div>
                                                <span className="text-theme-text-primary font-medium">{entity.name}</span>
                                                <span className="ml-2 text-xs text-theme-text-secondary">({entity.type})</span>
                                            </div>
                                            <span className="text-sm text-theme-text-secondary">
                                                {Math.round(entity.confidence * 100)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Relationships */}
                            <div>
                                <h3 className="text-lg font-medium text-theme-text-primary mb-3">Relationships</h3>
                                <div className="space-y-2">
                                    {selectedOntology.relationships.map((relationship) => (
                                        <div key={relationship.id} className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                            <div>
                                                <span className="text-theme-text-primary font-medium">{relationship.name}</span>
                                                <span className="ml-2 text-xs text-theme-text-secondary">({relationship.type})</span>
                                            </div>
                                            <span className="text-sm text-theme-text-secondary">
                                                {Math.round(relationship.confidence * 100)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
} 