"use client";

import { useState } from "react";
import { DocumentUpload } from '../../components/Knowledge/DocumentUpload';
import DomainManagement from '../../components/Knowledge/DomainManagement';
import { KnowledgeSearch } from '../../components/Knowledge/KnowledgeSearch';
import { TagManagement } from '../../components/Knowledge/TagManagement';
import { Button } from '../../components/shared/Button';
import { CodiconName, Icon } from '../../components/shared/Icon';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';

interface Tab {
    id: string;
    name: string;
    icon: CodiconName;
    description: string;
}

const TABS: Tab[] = [
    { id: "domains", name: "Domains", icon: "type-hierarchy", description: "Organize knowledge domains" },
    { id: "tags", name: "Tags", icon: "library-books", description: "Manage classification tags" },
    { id: "upload", name: "Upload", icon: "add", description: "Add documents to knowledge base" },
    { id: "search", name: "Search", icon: "search", description: "Find and retrieve documents" }
];

export default function KnowledgePage() {
    const [activeTab, setActiveTab] = useState<string>(TABS[0].id);

    const renderTabContent = () => {
        switch (activeTab) {
            case "domains": return <DomainManagement />;
            case "tags": return <TagManagement />;
            case "upload": return <DocumentUpload />;
            case "search": return <KnowledgeSearch />;
            default: return <DomainManagement />;
        }
    };

    const pageActions = (
        <Button
            variant="secondary"
            size="sm"
            leftIcon="refresh"
            onClick={() => window.location.reload()}
        >
            Refresh
        </Button>
    );

    return (
        <PageLayout
            title="Knowledge Management"
            subtitle="Organize, upload, and search your decision intelligence knowledge base"
            icon="library-books"
            actions={pageActions}
            status={{ text: 'Knowledge Base Active', type: 'active' }}
        >
            {/* Tab Navigation */}
            <div className="bg-theme-surface border-b border-theme-border">
                <PageContent padding="none" spacing="none">
                    <div className="flex">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 group
                                    ${activeTab === tab.id
                                        ? 'text-theme-accent-primary bg-theme-surface-elevated border-b-2 border-theme-accent-primary'
                                        : 'text-theme-text-secondary hover:text-theme-accent-primary hover:bg-theme-surface-hover border-transparent'
                                    }
                                `}
                            >
                                <Icon
                                    name={tab.icon}
                                    size="sm"
                                    className={activeTab === tab.id ? 'text-theme-accent-primary' : 'text-theme-text-muted group-hover:text-theme-accent-primary'}
                                />
                                <span>{tab.name}</span>
                                <div className="text-xs text-theme-text-muted group-hover:text-theme-accent-primary transition-colors">
                                    {tab.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </PageContent>
            </div>

            {/* Tab Content */}
            <PageContent className="bg-theme-bg-primary">
                <div className="bg-theme-surface rounded-lg border border-theme-border p-6 min-h-[500px]">
                    {renderTabContent()}
                </div>
            </PageContent>
        </PageLayout>
    );
} 