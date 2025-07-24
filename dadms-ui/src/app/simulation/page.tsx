"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const SimulationManagerPage: React.FC = () => {
    return (
        <PageLayout
            title="Simulation Manager"
            subtitle="Execution orchestration hub for scalable simulation across diverse compute resources"
            icon="pulse"
            status={{ text: 'Coming Soon', type: 'warning' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="pulse" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Simulation Execution Hub</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Simulation Manager provides scalable simulation execution across diverse compute resources
                                including local, cloud, and HPC environments. It offers comprehensive result management,
                                monitoring, and fault tolerance capabilities.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Execution Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Multi-resource execution</li>
                                        <li>• Scalable job scheduling</li>
                                        <li>• Real-time monitoring</li>
                                        <li>• Fault tolerance & recovery</li>
                                        <li>• Performance optimization</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Management Capabilities</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Result storage & retrieval</li>
                                        <li>• Progress tracking</li>
                                        <li>• Resource allocation</li>
                                        <li>• Cost optimization</li>
                                        <li>• Security & compliance</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Compute Resources */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Supported Compute Resources</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="computer" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Local Resources</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Desktop workstations and local clusters for development and testing
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="cloud" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Cloud Platforms</h4>
                            <p className="text-sm text-theme-text-secondary">
                                AWS, Azure, Google Cloud for scalable and cost-effective execution
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="server" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">HPC Systems</h4>
                            <p className="text-sm text-theme-text-secondary">
                                High-performance computing clusters for intensive simulations
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Execution Workflow */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Simulation Execution Workflow</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="layers" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Model Selection</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Choose appropriate models from the Model Manager registry
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="settings" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Configuration</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Set parameters and execution environment requirements
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="play" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Execution</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Launch simulation on selected compute resources
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="monitor" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Monitoring</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Track progress and performance in real-time
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-warning bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="database" size="md" className="text-theme-warning" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Results</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Store and retrieve simulation outputs for analysis
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
                                Retrieves models for execution and provides performance feedback for optimization
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="graph-line" size="sm" className="text-theme-accent-secondary" />
                                Analysis Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides simulation outputs for analysis and receives optimization recommendations
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="server" size="sm" className="text-theme-accent-tertiary" />
                                Data Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Receives input data and provides simulation results for storage and streaming
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="settings" size="sm" className="text-theme-warning" />
                                Parameter Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Manages simulation parameters and configuration for different execution scenarios
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
                            <span className="text-theme-text-secondary">Phase 1: Basic local execution and job management</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 2: Cloud integration and scalable execution</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 3: HPC integration and advanced optimization</span>
                        </div>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default SimulationManagerPage; 