"use client";
import React, { useState } from 'react';
import ProcessThreadManager from './ProcessThreadManager';
import { Card, Icon } from './shared';
import ThreadImpactAnalysis from './ThreadImpactAnalysis';

// Mock types
interface ThreadData {
    thread_id: string;
    created_at: string;
    metadata: any;
    messages: OpenAIMessage[];
    message_count: number;
    status: string;
}

interface OpenAIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: Array<{
        type: string;
        text?: { value: string };
    }>;
    created_at: number;
    metadata?: any;
}

interface AnalysisThread {
    id: string;
    openai_thread: string;
    openai_assistant: string;
    name: string;
    status: 'active' | 'completed' | 'error' | 'pending';
    created_at: string;
    last_activity: string;
    analysis_count: number;
    analysis_ids: string[];
    process_definition?: {
        name: string;
        version: number;
        key: string;
    };
}

interface Tab {
    id: string;
    name: string;
    icon: 'type-hierarchy' | 'graph';
    description: string;
}

const TABS: Tab[] = [
    { id: 'threads', name: 'Thread Management', icon: 'type-hierarchy', description: 'Manage process execution threads' },
    { id: 'analysis', name: 'Impact Analysis', icon: 'graph', description: 'Analyze thread patterns and impacts' }
];

const MOCK_THREADS: AnalysisThread[] = [
    {
        id: 'thread-1',
        openai_thread: 'thread_abc123',
        openai_assistant: 'asst_def456',
        name: 'UAV Decision Analysis',
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        last_activity: '2024-01-15T11:45:00Z',
        analysis_count: 3,
        analysis_ids: ['analysis-1', 'analysis-2', 'analysis-3'],
        process_definition: {
            name: 'Decision Process',
            version: 1,
            key: 'decision-v1'
        }
    },
    {
        id: 'thread-2',
        openai_thread: 'thread_xyz789',
        openai_assistant: 'asst_def456',
        name: 'Budget Analysis Thread',
        status: 'active',
        created_at: '2024-01-16T09:00:00Z',
        last_activity: '2024-01-16T09:30:00Z',
        analysis_count: 1,
        analysis_ids: ['analysis-4']
    }
];

const ThreadManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>(TABS[0].id);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'threads':
                return <ProcessThreadManager threads={MOCK_THREADS} />;
            case 'analysis':
                return <ThreadImpactAnalysis threads={MOCK_THREADS} />;
            default:
                return <ProcessThreadManager threads={MOCK_THREADS} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-theme-text-primary mb-2">Thread Management</h1>
                <p className="text-theme-text-secondary">
                    Track process execution threads, collect feedback, and analyze patterns for continuous improvement.
                </p>
            </div>

            {/* Tab Navigation */}
            <Card variant="default" padding="none">
                <div className="border-b border-theme-border">
                    <nav className="flex">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 border-b-2
                                    ${activeTab === tab.id
                                        ? 'text-theme-accent-primary bg-theme-surface-elevated border-theme-accent-primary'
                                        : 'text-theme-text-secondary hover:text-theme-accent-primary hover:bg-theme-surface-hover border-transparent'
                                    }
                                `}
                            >
                                <Icon
                                    name={tab.icon}
                                    size="md"
                                    className={activeTab === tab.id ? 'text-theme-accent-primary' : 'text-theme-text-muted'}
                                />
                                <div className="text-left">
                                    <div>{tab.name}</div>
                                    <div className="text-xs text-theme-text-muted">
                                        {tab.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {renderTabContent()}
                </div>
            </Card>
        </div>
    );
};

export default ThreadManager; 