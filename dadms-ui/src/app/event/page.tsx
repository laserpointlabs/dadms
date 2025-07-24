"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const EventManagerPage: React.FC = () => {
    return (
        <PageLayout
            title="Event Manager"
            subtitle="Central nervous system for event-driven intelligence with real-time monitoring and webhook management"
            icon="broadcast"
            status={{ text: 'Coming Soon', type: 'warning' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="broadcast" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Event-Driven Intelligence Hub</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Event Manager serves as the central nervous system for event-driven intelligence,
                                providing continuous monitoring with real-time WebSocket streams and webhook fallback
                                for seamless system integration.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Event Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Real-time event streaming</li>
                                        <li>• WebSocket and webhook support</li>
                                        <li>• Event filtering and routing</li>
                                        <li>• Event persistence and replay</li>
                                        <li>• Event correlation and analysis</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Intelligence Capabilities</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Pattern recognition in events</li>
                                        <li>• Predictive event modeling</li>
                                        <li>• Anomaly detection</li>
                                        <li>• Event-driven automation</li>
                                        <li>• Cross-service event orchestration</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Event Types */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Event Categories</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="pulse" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">System Events</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Platform health, performance, and operational events
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="git-branch" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Process Events</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Workflow execution, task completion, and process state changes
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="database" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Data Events</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Data changes, updates, and streaming events
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="user" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">User Events</h4>
                            <p className="text-sm text-theme-text-secondary">
                                User interactions, decisions, and collaboration events
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Event Flow */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Event Processing Flow</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="eye" size="md" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Capture</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Detect and capture events from all sources
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="filter" size="md" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Filter</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Apply filters and routing rules
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="graph" size="md" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Analyze</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Process and correlate events
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="broadcast" size="md" className="text-theme-success" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Distribute</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Route events to subscribers
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-theme-warning bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="save" size="md" className="text-theme-warning" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-2">Persist</h4>
                            <p className="text-sm text-theme-text-secondary">
                                Store events for replay and analysis
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
                                <Icon name="server" size="sm" className="text-theme-accent-primary" />
                                Data Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Triggers events based on data changes and provides real-time data streaming
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="git-branch" size="sm" className="text-theme-accent-secondary" />
                                Process Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Publishes process events and receives workflow triggers
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="pulse" size="sm" className="text-theme-accent-tertiary" />
                                Simulation Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Provides simulation progress events and receives execution triggers
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3 flex items-center gap-2">
                                <Icon name="warning" size="sm" className="text-theme-warning" />
                                Error Manager
                            </h4>
                            <p className="text-sm text-theme-text-secondary">
                                Publishes error events and receives system health notifications
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
                            <span className="text-theme-text-secondary">Phase 1: Basic event capture and distribution</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-text-muted rounded-full"></div>
                            <span className="text-theme-text-secondary">Phase 2: Advanced event correlation and intelligence</span>
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

export default EventManagerPage; 