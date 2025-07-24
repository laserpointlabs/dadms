"use client";
import React from 'react';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageLayout } from '../../components/shared/PageLayout';

const AgentAssistanceServicePage: React.FC = () => {
    return (
        <PageLayout
            title="Agent Assistance Service"
            subtitle="Configuration and support hub for AI agent assistance across the DADMS platform"
            icon="hubot"
            status={{ text: 'Active', type: 'active' }}
        >
            <div className="space-y-6">
                {/* Overview Card */}
                <Card variant="outlined" padding="lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-theme-accent-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Icon name="hubot" size="lg" className="text-theme-accent-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Agent Assistance Configuration</h3>
                            <p className="text-theme-text-secondary mb-4">
                                The Agent Assistance Service provides centralized configuration, monitoring, and support
                                for AI agent interactions across the DADMS platform. It manages agent behaviors,
                                response patterns, and integration settings.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Core Features</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• Agent behavior configuration</li>
                                        <li>• Response pattern management</li>
                                        <li>• Integration settings</li>
                                        <li>• Performance monitoring</li>
                                        <li>• Support and troubleshooting</li>
                                    </ul>
                                </div>
                                <div className="bg-theme-surface-elevated p-4 rounded-lg border border-theme-border">
                                    <h4 className="font-medium text-theme-text-primary mb-2">Integration Points</h4>
                                    <ul className="text-sm text-theme-text-secondary space-y-1">
                                        <li>• AADS collaboration workflows</li>
                                        <li>• Context Manager personas</li>
                                        <li>• LLM Playground testing</li>
                                        <li>• Process Manager automation</li>
                                        <li>• Decision Analytics insights</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Configuration Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Agent Behavior Configuration */}
                    <Card variant="outlined" padding="lg">
                        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Agent Behavior Configuration</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="hubot" size="sm" className="text-theme-accent-primary" />
                                    <span className="text-theme-text-primary">Response Style</span>
                                </div>
                                <select className="px-3 py-1 bg-theme-bg-primary border border-theme-border rounded text-theme-text-primary">
                                    <option>Professional</option>
                                    <option>Conversational</option>
                                    <option>Technical</option>
                                    <option>Educational</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="pulse" size="sm" className="text-theme-accent-secondary" />
                                    <span className="text-theme-text-primary">Response Speed</span>
                                </div>
                                <select className="px-3 py-1 bg-theme-bg-primary border border-theme-border rounded text-theme-text-primary">
                                    <option>Real-time</option>
                                    <option>Fast</option>
                                    <option>Balanced</option>
                                    <option>Thorough</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="lightbulb" size="sm" className="text-theme-accent-tertiary" />
                                    <span className="text-theme-text-primary">Creativity Level</span>
                                </div>
                                <select className="px-3 py-1 bg-theme-bg-primary border border-theme-border rounded text-theme-text-primary">
                                    <option>Conservative</option>
                                    <option>Balanced</option>
                                    <option>Creative</option>
                                    <option>Innovative</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Integration Settings */}
                    <Card variant="outlined" padding="lg">
                        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Integration Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="plug" size="sm" className="text-theme-accent-primary" />
                                    <span className="text-theme-text-primary">AADS Integration</span>
                                </div>
                                <div className="w-3 h-3 bg-theme-success rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="extensions" size="sm" className="text-theme-accent-secondary" />
                                    <span className="text-theme-text-primary">Context Manager</span>
                                </div>
                                <div className="w-3 h-3 bg-theme-success rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="beaker" size="sm" className="text-theme-accent-tertiary" />
                                    <span className="text-theme-text-primary">LLM Playground</span>
                                </div>
                                <div className="w-3 h-3 bg-theme-success rounded-full"></div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded-lg border border-theme-border">
                                <div className="flex items-center gap-3">
                                    <Icon name="git-branch" size="sm" className="text-theme-accent-primary" />
                                    <span className="text-theme-text-primary">Process Manager</span>
                                </div>
                                <div className="w-3 h-3 bg-theme-warning rounded-full"></div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Performance Monitoring */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Performance Monitoring</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-theme-accent-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="pulse" size="lg" className="text-theme-accent-primary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1">Response Time</h4>
                            <p className="text-2xl font-bold text-theme-accent-primary">1.2s</p>
                            <p className="text-sm text-theme-text-secondary">Average</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-theme-accent-secondary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="check" size="lg" className="text-theme-accent-secondary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1">Success Rate</h4>
                            <p className="text-2xl font-bold text-theme-accent-secondary">98.5%</p>
                            <p className="text-sm text-theme-text-secondary">Last 24h</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-theme-accent-tertiary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="users" size="lg" className="text-theme-accent-tertiary" />
                            </div>
                            <h4 className="font-medium text-theme-text-primary mb-1">Active Sessions</h4>
                            <p className="text-2xl font-bold text-theme-accent-tertiary">24</p>
                            <p className="text-sm text-theme-text-secondary">Current</p>
                        </div>
                    </div>
                </Card>

                {/* Support and Troubleshooting */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Support & Troubleshooting</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3">Common Issues</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-theme-surface-elevated rounded border border-theme-border">
                                    <Icon name="warning" size="sm" className="text-theme-warning" />
                                    <span className="text-sm text-theme-text-secondary">Agent not responding</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-theme-surface-elevated rounded border border-theme-border">
                                    <Icon name="warning" size="sm" className="text-theme-warning" />
                                    <span className="text-sm text-theme-text-secondary">Slow response times</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-theme-surface-elevated rounded border border-theme-border">
                                    <Icon name="warning" size="sm" className="text-theme-warning" />
                                    <span className="text-sm text-theme-text-secondary">Integration failures</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-theme-text-primary mb-3">Quick Actions</h4>
                            <div className="space-y-2">
                                <button className="w-full text-left p-2 bg-theme-surface-elevated rounded border border-theme-border hover:bg-theme-surface-hover text-sm text-theme-text-primary">
                                    <Icon name="refresh" size="sm" className="inline mr-2" />
                                    Restart Agent Service
                                </button>
                                <button className="w-full text-left p-2 bg-theme-surface-elevated rounded border border-theme-border hover:bg-theme-surface-hover text-sm text-theme-text-primary">
                                    <Icon name="sync" size="sm" className="inline mr-2" />
                                    Sync Configuration
                                </button>
                                <button className="w-full text-left p-2 bg-theme-surface-elevated rounded border border-theme-border hover:bg-theme-surface-hover text-sm text-theme-text-primary">
                                    <Icon name="bug" size="sm" className="inline mr-2" />
                                    Run Diagnostics
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Development Status */}
                <Card variant="outlined" padding="lg">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Service Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-success rounded-full"></div>
                            <span className="text-theme-text-secondary">Agent Assistance Service: Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-success rounded-full"></div>
                            <span className="text-theme-text-secondary">Configuration Management: Operational</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-success rounded-full"></div>
                            <span className="text-theme-text-secondary">Performance Monitoring: Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-theme-warning rounded-full"></div>
                            <span className="text-theme-text-secondary">Process Manager Integration: Pending</span>
                        </div>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default AgentAssistanceServicePage; 