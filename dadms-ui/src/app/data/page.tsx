"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const DataManagerPage: React.FC = () => {
    return (
        <PageLayout
            title="Data Manager"
            subtitle="External data gateway with multi-source ingestion, schema validation, and ontology tagging"
            icon="server"
            status={{ text: 'Coming Soon', type: 'warning' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="server" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Data Gateway & Management</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Data Manager serves as the central hub for all external data operations, providing
                                seamless ingestion, validation, enrichment, and real-time streaming capabilities with
                                intelligent ontology tagging.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Data Operations</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Multi-source data ingestion</li>
                                        <li>• Schema validation and transformation</li>
                                        <li>• Metadata enrichment and tagging</li>
                                        <li>• Real-time streaming pipelines</li>
                                        <li>• Data quality monitoring</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Integration Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Ontology-based data tagging</li>
                                        <li>• API gateway management</li>
                                        <li>• Data lineage tracking</li>
                                        <li>• Security and governance</li>
                                        <li>• Performance optimization</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Data Pipeline Architecture */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Data Pipeline Architecture</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="cloud-download" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Ingestion</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Multi-format data collection from various sources
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="shield" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Validation</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Schema validation and data quality checks
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="tag" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Enrichment</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Metadata enrichment and ontology tagging
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="database" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Storage</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Optimized storage with indexing and caching
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-warning bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="broadcast" size="md" className="text-theme-warning" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Streaming</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Real-time data streaming to consumers
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Supported Data Sources */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Supported Data Sources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="database" size="sm" className="text-theme-accent-primary" />
                                Databases
                            </h4>
                            <ul className="text-sm text-theme-text-secondary space-y-1">
                                <li>• PostgreSQL</li>
                                <li>• Neo4j (Graph)</li>
                                <li>• Qdrant (Vector)</li>
                                <li>• MongoDB</li>
                                <li>• Redis</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="cloud" size="sm" className="text-theme-accent-secondary" />
                                Cloud Services
                            </h4>
                            <ul className="text-sm text-theme-text-secondary space-y-1">
                                <li>• AWS S3/Redshift</li>
                                <li>• Azure Blob/Synapse</li>
                                <li>• Google Cloud Storage</li>
                                <li>• Snowflake</li>
                                <li>• Databricks</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="plug" size="sm" className="text-theme-accent-tertiary" />
                                APIs & Streams
                            </h4>
                            <ul className="text-sm text-theme-text-secondary space-y-1">
                                <li>• REST APIs</li>
                                <li>• GraphQL</li>
                                <li>• Kafka Streams</li>
                                <li>• WebSockets</li>
                                <li>• IoT Devices</li>
                            </ul>
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
                                Provides ontology-based data tagging and semantic enrichment for incoming data streams
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="graph-line" size="sm" className="text-theme-accent-secondary" />
                                Analysis Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Supplies validated and enriched data for analytical processing and model training
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="layers" size="sm" className="text-theme-accent-tertiary" />
                                Model Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides training data and feature engineering capabilities for ML model development
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="broadcast" size="sm" className="text-theme-warning" />
                                Event Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Triggers real-time events based on data changes and streaming updates
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
                            <span className="text-theme-text-secondary">Phase 1: Core data ingestion and basic validation</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 2: Advanced schema validation and ontology tagging</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 3: Real-time streaming and full service integration</span>
                        </div>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default DataManagerPage; 