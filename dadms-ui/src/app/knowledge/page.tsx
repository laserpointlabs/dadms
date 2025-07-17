"use client";

import { useState } from "react";
import { DocumentUpload } from '../../components/Knowledge/DocumentUpload';
import { DomainManagement } from '../../components/Knowledge/DomainManagement';
import { KnowledgeSearch } from '../../components/Knowledge/KnowledgeSearch';
import { TagManagement } from '../../components/Knowledge/TagManagement';

const TABS = [
    { id: "domains", name: "Domains", icon: "🏷️", description: "Organize knowledge domains" },
    { id: "tags", name: "Tags", icon: "📋", description: "Manage classification tags" },
    { id: "upload", name: "Upload", icon: "📤", description: "Add documents to knowledge base" },
    { id: "search", name: "Search", icon: "🔍", description: "Find and retrieve documents" }
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

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Knowledge Management</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Organize, upload, and search your decision intelligence knowledge base
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="status-indicator status-active" />
                            Knowledge Base Active
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-50 border-b border-gray-200 px-6">
                <nav className="flex space-x-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group relative px-6 py-4 text-sm font-medium transition-all duration-200
                                ${activeTab === tab.id
                                    ? 'text-blue-700 bg-white border-b-2 border-blue-700'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base opacity-70 group-hover:opacity-100 transition-opacity">
                                    {tab.icon}
                                </span>
                                <div className="text-left">
                                    <div>{tab.name}</div>
                                    <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                                        {tab.description}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    <div className="card p-6 min-h-[500px]">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
} 