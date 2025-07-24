"use client";

import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';
import { useTabs } from '../../contexts/TabContext';

export default function TestTabsPage() {
    const { tabs, activeTabId, addTab, closeTab, switchTab, navigateToTab } = useTabs();

    const handleAddTab = (path: string, title: string) => {
        addTab(path, title);
    };

    const handleNavigate = (path: string) => {
        navigateToTab(path);
    };

    return (
        <PageLayout
            title="Test Tabs Page"
            subtitle="Testing tab management functionality"
            icon="beaker"
            status={{ text: 'Testing Active', type: 'active' }}
        >
            <PageContent>
                <div className="space-y-6">
                    {/* Current Tab Info */}
                    <Card variant="default" padding="md">
                        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Current Tab Info</h3>
                        <div className="space-y-2">
                            <p><strong>Active Tab ID:</strong> {activeTabId || 'None'}</p>
                            <p><strong>Total Tabs:</strong> {tabs.length}</p>
                            <p><strong>Current Path:</strong> /test-tabs</p>
                        </div>
                    </Card>

                    {/* Tab Management */}
                    <Card variant="default" padding="md">
                        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Tab Management</h3>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAddTab('/ontology', 'Ontology Workspace')}
                                >
                                    Add Ontology Tab
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAddTab('/projects', 'Projects')}
                                >
                                    Add Projects Tab
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAddTab('/llm', 'LLM Playground')}
                                >
                                    Add LLM Tab
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Navigation Test */}
                    <Card variant="default" padding="md">
                        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Navigation Test</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="primary"
                                leftIcon="arrow-right"
                                onClick={() => handleNavigate('/ontology')}
                            >
                                Navigate to Ontology
                            </Button>
                            <Button
                                variant="primary"
                                leftIcon="arrow-right"
                                onClick={() => handleNavigate('/projects')}
                            >
                                Navigate to Projects
                            </Button>
                        </div>
                    </Card>

                    {/* Tab List */}
                    <Card variant="default" padding="md">
                        <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Current Tabs</h3>
                        <div className="space-y-2">
                            {tabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className={`p-3 rounded border ${tab.isActive
                                            ? 'border-theme-accent-primary bg-theme-accent-primary bg-opacity-10'
                                            : 'border-theme-border-secondary'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon name={tab.icon as any} size="sm" />
                                            <span className="font-medium">{tab.title}</span>
                                            {tab.isActive && (
                                                <span className="text-xs bg-theme-accent-primary text-white px-2 py-1 rounded">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                onClick={() => switchTab(tab.id)}
                                                disabled={tab.isActive}
                                            >
                                                Switch
                                            </Button>
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                onClick={() => closeTab(tab.id)}
                                            >
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tabs.length === 0 && (
                                <p className="text-theme-text-secondary text-center py-4">
                                    No tabs open
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </PageContent>
        </PageLayout>
    );
} 