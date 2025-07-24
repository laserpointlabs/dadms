"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const RequirementsExtractorPage: React.FC = () => {
    return (
        <PageLayout
            title="Requirements Extractor"
            subtitle="AI-powered requirements extraction and analysis from documents and stakeholder input"
            icon="list-tree"
            status={{ text: 'Coming Soon', type: 'warning' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="list-tree" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Requirements Intelligence Engine</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Requirements Extractor uses AI to automatically extract, analyze, and structure
                                requirements from various sources including documents, stakeholder interviews,
                                and existing systems.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Extraction Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Document parsing and analysis</li>
                                        <li>• Stakeholder input processing</li>
                                        <li>• Requirement classification</li>
                                        <li>• Dependency identification</li>
                                        <li>• Traceability mapping</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Analysis Capabilities</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Requirement validation</li>
                                        <li>• Conflict detection</li>
                                        <li>• Completeness analysis</li>
                                        <li>• Impact assessment</li>
                                        <li>• Prioritization support</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Input Sources */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Input Sources</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="file-text" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Documents</h4>
                            <p className="text-sm text-theme-text-secondary">
                                PDFs, Word docs, specifications, and technical documents
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="person" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Stakeholder Input</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Interviews, surveys, and direct stakeholder feedback
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="database" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Existing Systems</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Legacy systems, databases, and current implementations
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="globe" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">External Sources</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Standards, regulations, and industry best practices
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Extraction Process */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Requirements Extraction Process</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="cloud-download" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Ingest</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Import and process source materials
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="brain" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Analyze</h4>
                            <p className="text-sm text-theme-text-secondary">
                                AI-powered content analysis and extraction
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="tag" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Classify</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Categorize and structure requirements
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="validate" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Validate</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Verify completeness and consistency
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-warning bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="export" size="md" className="text-theme-warning" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Export</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Generate structured requirements output
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Integration Points */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Service Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="type-hierarchy" size="sm" className="text-theme-accent-primary" />
                                Ontology Workspace
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides domain ontologies for requirements classification and semantic analysis
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="git-branch" size="sm" className="text-theme-accent-secondary" />
                                Process Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Converts requirements into executable BPMN workflows and process definitions
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="book" size="sm" className="text-theme-accent-tertiary" />
                                Agent Assistant
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides requirements context for decision-making and documentation
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="layers" size="sm" className="text-theme-warning" />
                                Model Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Informs model development and validation based on extracted requirements
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Development Status */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Development Roadmap</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-warning rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 1: Basic document parsing and requirement extraction</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 2: Advanced AI analysis and classification</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 3: Full integration with all DADMS services</span>
                        </div>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default RequirementsExtractorPage; 