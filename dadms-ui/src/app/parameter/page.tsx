"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const ParameterManagerPage: React.FC = () => {
    return (
        <PageLayout
            title="Parameter Manager"
            subtitle="Centralized parameter management and configuration for models and simulations"
            icon="settings"
            status={{ text: 'Coming Soon', type: 'warning' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="settings" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Parameter Configuration Hub</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Parameter Manager provides centralized management of all model and simulation parameters,
                                enabling consistent configuration, validation, and optimization across the DADMS platform.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Management Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Parameter versioning and history</li>
                                        <li>• Validation and constraints</li>
                                        <li>• Template management</li>
                                        <li>• Environment-specific configs</li>
                                        <li>• Dependency tracking</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Integration Capabilities</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Model Manager connectivity</li>
                                        <li>• Simulation Manager integration</li>
                                        <li>• Analysis Manager collaboration</li>
                                        <li>• Automated parameter optimization</li>
                                        <li>• Configuration governance</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Parameter Types */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Parameter Categories</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="layers" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Model Parameters</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Configuration settings for ML and computational models
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="pulse" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Simulation Parameters</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Execution settings for simulation runs and scenarios
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="graph-line" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Analysis Parameters</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Settings for analytical methods and evaluation criteria
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="gear" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">System Parameters</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Platform configuration and operational settings
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Parameter Workflow */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Parameter Management Workflow</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="plus" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Define</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Create parameter definitions with constraints and validation rules
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="validate" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Validate</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Verify parameter values against constraints and dependencies
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="save" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Store</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Save validated parameters with versioning and metadata
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="sync" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Distribute</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provide parameters to models and simulations as needed
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-warning bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="refresh" size="md" className="text-theme-warning" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Optimize</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Continuously improve parameters based on performance feedback
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
                                <Icon name="layers" size="sm" className="text-theme-accent-primary" />
                                Model Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides model-specific parameters and receives optimization feedback
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="pulse" size="sm" className="text-theme-accent-secondary" />
                                Simulation Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Supplies execution parameters and receives performance data for optimization
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="graph-line" size="sm" className="text-theme-accent-tertiary" />
                                Analysis Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides analytical method parameters and receives optimization recommendations
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="pie-chart" size="sm" className="text-theme-warning" />
                                Decision Analytics
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Manages decision analysis parameters and receives outcome-based optimization
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
                            <span className="text-theme-text-secondary">Phase 1: Basic parameter storage and validation</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 2: Advanced versioning and dependency management</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 3: Automated optimization and full service integration</span>
                        </div>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default ParameterManagerPage; 