"use client";

import { useState } from "react";
import { Button, Card, Icon } from '../../components/shared';
import { FormField, Input, Select } from '../../components/shared/FormField';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';
import { ThemeSelector } from '../../components/shared/ThemeSelector';

interface ConfigSection {
    id: string;
    title: string;
    description: string;
    icon: string;
}

const CONFIG_SECTIONS: ConfigSection[] = [
    { id: "appearance", title: "Appearance", description: "Theme and UI preferences", icon: "symbol-color" },
    { id: "system", title: "System", description: "Backend services and connections", icon: "server" },
    { id: "security", title: "Security", description: "Authentication and permissions", icon: "key" },
    { id: "integrations", title: "Integrations", description: "External APIs and connectors", icon: "extensions" },
    { id: "notifications", title: "Notifications", description: "Alerts and communication settings", icon: "bell" },
    { id: "advanced", title: "Advanced", description: "Debug and developer options", icon: "tools" },
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<string>("appearance");
    const [mockApiUrl, setMockApiUrl] = useState("http://localhost:3001");
    const [mockTimeout, setMockTimeout] = useState("30");
    const [mockRetries, setMockRetries] = useState("3");

    const renderSectionContent = () => {
        switch (activeSection) {
            case "appearance":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Theme Settings</h3>
                            <Card variant="outlined" padding="md">
                                <div className="space-y-4">
                                    <FormField label="Theme Mode" helpText="Choose between light and dark themes">
                                        <div className="flex items-center gap-4">
                                            <ThemeSelector />
                                            <span className="text-sm text-theme-text-secondary">
                                                Test theme changes in real-time
                                            </span>
                                        </div>
                                    </FormField>

                                    <FormField label="UI Scale" helpText="Adjust interface scaling">
                                        <Select defaultValue="100">
                                            <option value="75">75% - Compact</option>
                                            <option value="100">100% - Default</option>
                                            <option value="125">125% - Large</option>
                                            <option value="150">150% - Extra Large</option>
                                        </Select>
                                    </FormField>

                                    <FormField label="Font Family" helpText="Choose your preferred code font">
                                        <Select defaultValue="default">
                                            <option value="default">Default (Consolas)</option>
                                            <option value="mono">Monaco</option>
                                            <option value="fira">Fira Code</option>
                                            <option value="source">Source Code Pro</option>
                                        </Select>
                                    </FormField>
                                </div>
                            </Card>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Layout Preferences</h3>
                            <Card variant="outlined" padding="md">
                                <div className="space-y-4">
                                    <FormField label="Activity Bar Position">
                                        <Select defaultValue="left">
                                            <option value="left">Left Side</option>
                                            <option value="right">Right Side</option>
                                            <option value="hidden">Hidden</option>
                                        </Select>
                                    </FormField>

                                    <FormField label="Sidebar Default">
                                        <Select defaultValue="explorer">
                                            <option value="explorer">Project Explorer</option>
                                            <option value="search">Search</option>
                                            <option value="hidden">Hidden</option>
                                        </Select>
                                    </FormField>
                                </div>
                            </Card>
                        </div>
                    </div>
                );

            case "system":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Backend Services</h3>
                            <Card variant="outlined" padding="md">
                                <div className="space-y-4">
                                    <FormField label="API Base URL" helpText="Base URL for DADMS backend services">
                                        <Input
                                            value={mockApiUrl}
                                            onChange={(e) => setMockApiUrl(e.target.value)}
                                            placeholder="http://localhost:3001"
                                        />
                                    </FormField>

                                    <FormField label="Request Timeout (seconds)">
                                        <Input
                                            type="number"
                                            value={mockTimeout}
                                            onChange={(e) => setMockTimeout(e.target.value)}
                                        />
                                    </FormField>

                                    <FormField label="Retry Attempts">
                                        <Input
                                            type="number"
                                            value={mockRetries}
                                            onChange={(e) => setMockRetries(e.target.value)}
                                        />
                                    </FormField>
                                </div>
                            </Card>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Service Health</h3>
                            <Card variant="outlined" padding="md">
                                <div className="space-y-3">
                                    {[
                                        { name: "Project Service", port: 3001, status: "online" },
                                        { name: "Knowledge Service", port: 3003, status: "online" },
                                        { name: "LLM Service", port: 3002, status: "offline" },
                                        { name: "Event Manager", port: 3004, status: "online" },
                                    ].map((service) => (
                                        <div key={service.name} className="flex items-center justify-between p-3 bg-theme-surface-elevated rounded border border-theme-border">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${service.status === 'online' ? 'bg-theme-accent-success' : 'bg-theme-accent-error'}`} />
                                                <span className="text-theme-text-primary font-medium">{service.name}</span>
                                                <span className="text-theme-text-secondary text-sm">:{service.port}</span>
                                            </div>
                                            <span className={`text-sm font-medium ${service.status === 'online' ? 'text-theme-accent-success' : 'text-theme-accent-error'}`}>
                                                {service.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                );

            case "security":
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8">
                                <Icon name="key" size="xl" className="text-theme-text-muted mb-4" />
                                <h3 className="text-lg font-medium text-theme-text-primary mb-2">Security Configuration</h3>
                                <p className="text-theme-text-secondary mb-4">
                                    Authentication and security settings will be implemented in future versions.
                                </p>
                                <div className="text-sm text-theme-text-secondary">
                                    <p>Features coming soon:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• User authentication & authorization</li>
                                        <li>• Role-based access control (RBAC)</li>
                                        <li>• API key management</li>
                                        <li>• Session management</li>
                                        <li>• Audit logging</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case "integrations":
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8">
                                <Icon name="extensions" size="xl" className="text-theme-text-muted mb-4" />
                                <h3 className="text-lg font-medium text-theme-text-primary mb-2">External Integrations</h3>
                                <p className="text-theme-text-secondary mb-4">
                                    Integration management will be implemented in future versions.
                                </p>
                                <div className="text-sm text-theme-text-secondary">
                                    <p>Planned integrations:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Webhook endpoints</li>
                                        <li>• External API connectors</li>
                                        <li>• Database connections</li>
                                        <li>• Cloud service integrations</li>
                                        <li>• Third-party tools</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case "notifications":
                return (
                    <div className="space-y-6">
                        <Card variant="outlined" padding="md">
                            <div className="text-center py-8">
                                <Icon name="bell-dot" size="xl" className="text-theme-text-muted mb-4" />
                                <h3 className="text-lg font-medium text-theme-text-primary mb-2">Notification Settings</h3>
                                <p className="text-theme-text-secondary mb-4">
                                    Notification configuration will be implemented in future versions.
                                </p>
                                <div className="text-sm text-theme-text-secondary">
                                    <p>Features coming soon:</p>
                                    <ul className="mt-2 space-y-1">
                                        <li>• Email notifications</li>
                                        <li>• In-app alerts</li>
                                        <li>• Push notifications</li>
                                        <li>• Slack/Teams integration</li>
                                        <li>• Custom notification rules</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                );

            case "advanced":
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Developer Options</h3>
                            <Card variant="outlined" padding="md">
                                <div className="space-y-4">
                                    <FormField label="Debug Mode">
                                        <Select defaultValue="off">
                                            <option value="off">Disabled</option>
                                            <option value="basic">Basic Logging</option>
                                            <option value="verbose">Verbose Logging</option>
                                            <option value="trace">Full Trace</option>
                                        </Select>
                                    </FormField>

                                    <FormField label="Performance Monitoring">
                                        <Select defaultValue="enabled">
                                            <option value="enabled">Enabled</option>
                                            <option value="disabled">Disabled</option>
                                        </Select>
                                    </FormField>

                                    <FormField label="Error Reporting">
                                        <Select defaultValue="auto">
                                            <option value="auto">Automatic</option>
                                            <option value="manual">Manual Only</option>
                                            <option value="disabled">Disabled</option>
                                        </Select>
                                    </FormField>
                                </div>
                            </Card>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">System Information</h3>
                            <Card variant="outlined" padding="md">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">DADMS Version:</span>
                                        <span className="text-theme-text-primary font-mono">2.0.0-dev</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Build:</span>
                                        <span className="text-theme-text-primary font-mono">20250113-main</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Node.js:</span>
                                        <span className="text-theme-text-primary font-mono">v18.17.0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">React:</span>
                                        <span className="text-theme-text-primary font-mono">v18.2.0</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                );

            default:
                return <div>Section not found</div>;
        }
    };

    const pageActions = (
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon="export">
                Export Config
            </Button>
            <Button variant="secondary" size="sm" leftIcon="refresh">
                Reset to Defaults
            </Button>
            <Button variant="primary" size="sm" leftIcon="save">
                Save Changes
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="Configuration & Settings"
            subtitle="System configuration, preferences, and administrative controls"
            icon="settings-gear"
            actions={pageActions}
            status={{ text: 'Configuration Mode', type: 'active' }}
        >
            <PageContent spacing="lg">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Settings Navigation */}
                    <div className="lg:col-span-1">
                        <Card variant="outlined" padding="sm">
                            <div className="space-y-1">
                                {CONFIG_SECTIONS.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-left p-3 rounded-md transition-colors ${activeSection === section.id
                                            ? 'bg-theme-accent-primary bg-opacity-20 text-theme-accent-primary border border-theme-accent-primary border-opacity-30'
                                            : 'hover:bg-theme-surface-hover text-theme-text-primary'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon name={section.icon as any} size="md" />
                                            <div>
                                                <div className="font-medium text-sm">{section.title}</div>
                                                <div className="text-xs text-theme-text-secondary">{section.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Settings Content */}
                    <div className="lg:col-span-3">
                        {renderSectionContent()}
                    </div>
                </div>
            </PageContent>
        </PageLayout>
    );
} 