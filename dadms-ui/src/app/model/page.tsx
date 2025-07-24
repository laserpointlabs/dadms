"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const ModelManagerPage: React.FC = () => {
    return (
        <PageLayout
            title="Model Manager"
            subtitle="Central registry for computational models with comprehensive versioning and metadata management"
            icon="layers"
            status={{ text: 'Coming Soon', type: 'warning' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="layers" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Model Registry & Management</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Model Manager serves as the central registry for all computational models including ML models,
                                simulation models, physics models, and mission models. It provides comprehensive versioning,
                                metadata management, artifact storage, and lineage tracking.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Registry Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Model versioning and lifecycle</li>
                                        <li>• Metadata and documentation</li>
                                        <li>• Artifact storage and retrieval</li>
                                        <li>• Lineage tracking and provenance</li>
                                        <li>• Model performance monitoring</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Integration Capabilities</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Simulation Manager integration</li>
                                        <li>• Data Manager connectivity</li>
                                        <li>• Analysis Manager collaboration</li>
                                        <li>• Deployment automation</li>
                                        <li>• Model governance and compliance</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Model Types */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Supported Model Types</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="brain" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Machine Learning</h4>
                            <p className="text-sm text-theme-text-secondary">
                                ML models, neural networks, and AI algorithms
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="pulse" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Simulation</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Computational simulations and modeling
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="atom" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Physics</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Physics-based models and equations
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="rocket" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Mission</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Mission planning and execution models
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Model Lifecycle */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Model Lifecycle Management</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icon name="plus" size="sm" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1 text-sm">Create</h4>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icon name="test" size="sm" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1 text-sm">Test</h4>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icon name="validate" size="sm" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1 text-sm">Validate</h4>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icon name="play" size="sm" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1 text-sm">Deploy</h4>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-theme-warning bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icon name="monitor" size="sm" className="text-theme-warning" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1 text-sm">Monitor</h4>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-theme-error bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Icon name="archive" size="sm" className="text-theme-error" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1 text-sm">Retire</h4>
                        </div>
                    </div>
                </Card>

                {/* Integration Points */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Service Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="pulse" size="sm" className="text-theme-accent-primary" />
                                Simulation Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides models for simulation execution and receives performance feedback
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="server" size="sm" className="text-theme-accent-secondary" />
                                Data Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Receives training data and provides model artifacts for deployment
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="graph-line" size="sm" className="text-theme-accent-tertiary" />
                                Analysis Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Evaluates model performance and provides optimization recommendations
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="settings" size="sm" className="text-theme-warning" />
                                Parameter Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Manages model parameters and configuration for different deployment scenarios
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
                            <span className="text-theme-text-secondary">Phase 1: Basic model registry and versioning</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 2: Advanced metadata management and lineage tracking</span>
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

export default ModelManagerPage; 