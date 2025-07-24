"use client";

import { PageLayout } from '../../components/shared/PageLayout';

export default function SysMLWorkspacePage() {
    return (
        <PageLayout
            title="SysML Workspace"
            subtitle="Model-based systems engineering with SysML diagrams and specifications"
            icon="symbol-class"
            status={{ text: 'SysML Workspace Active', type: 'active' }}
        >
            <div className="p-6">
                <div className="bg-theme-surface border border-theme-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                        SysML Workspace Coming Soon
                    </h3>
                    <p className="text-theme-text-secondary mb-4">
                        The SysML Workspace will provide comprehensive model-based systems engineering capabilities for DADMS.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-theme-surface-elevated border border-theme-border-light rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <i className="codicon codicon-symbol-class text-theme-accent-primary mr-2"></i>
                                <h4 className="font-medium text-theme-text-primary">Block Definition Diagrams</h4>
                            </div>
                            <p className="text-sm text-theme-text-muted">
                                Create and manage system structure with block definition diagrams
                            </p>
                        </div>

                        <div className="bg-theme-surface-elevated border border-theme-border-light rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <i className="codicon codicon-git-branch text-theme-accent-primary mr-2"></i>
                                <h4 className="font-medium text-theme-text-primary">Internal Block Diagrams</h4>
                            </div>
                            <p className="text-sm text-theme-text-muted">
                                Define internal structure and connections between system components
                            </p>
                        </div>

                        <div className="bg-theme-surface-elevated border border-theme-border-light rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <i className="codicon codicon-workflow text-theme-accent-primary mr-2"></i>
                                <h4 className="font-medium text-theme-text-primary">Activity Diagrams</h4>
                            </div>
                            <p className="text-sm text-theme-text-muted">
                                Model system behavior and process flows with activity diagrams
                            </p>
                        </div>

                        <div className="bg-theme-surface-elevated border border-theme-border-light rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <i className="codicon codicon-symbol-interface text-theme-accent-primary mr-2"></i>
                                <h4 className="font-medium text-theme-text-primary">Sequence Diagrams</h4>
                            </div>
                            <p className="text-sm text-theme-text-muted">
                                Capture system interactions and message flows between components
                            </p>
                        </div>

                        <div className="bg-theme-surface-elevated border border-theme-border-light rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <i className="codicon codicon-symbol-constant text-theme-accent-primary mr-2"></i>
                                <h4 className="font-medium text-theme-text-primary">Requirements Diagrams</h4>
                            </div>
                            <p className="text-sm text-theme-text-muted">
                                Link system requirements to design elements and verify traceability
                            </p>
                        </div>

                        <div className="bg-theme-surface-elevated border border-theme-border-light rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <i className="codicon codicon-symbol-variable text-theme-accent-primary mr-2"></i>
                                <h4 className="font-medium text-theme-text-primary">Parametric Diagrams</h4>
                            </div>
                            <p className="text-sm text-theme-text-muted">
                                Model mathematical relationships and constraints between system parameters
                            </p>
                        </div>
                    </div>

                    <div className="bg-theme-bg-hover border border-theme-border-light rounded-lg p-4">
                        <h4 className="font-medium text-theme-text-primary mb-2">Integration Features</h4>
                        <ul className="text-sm text-theme-text-secondary space-y-1">
                            <li>• Seamless integration with DADMS decision analysis workflows</li>
                            <li>• Real-time collaboration on SysML models</li>
                            <li>• Version control and model history tracking</li>
                            <li>• Export to standard SysML formats (XMI, XML)</li>
                            <li>• Integration with requirements management</li>
                            <li>• Automated validation and consistency checking</li>
                        </ul>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
} 