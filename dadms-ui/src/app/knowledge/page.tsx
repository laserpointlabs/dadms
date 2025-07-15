"use client";

import { useState } from "react";
import { DocumentUpload } from '../../components/Knowledge/DocumentUpload';
import { DomainManagement } from '../../components/Knowledge/DomainManagement';
import { KnowledgeSearch } from '../../components/Knowledge/KnowledgeSearch';
import { TagManagement } from '../../components/Knowledge/TagManagement';

const TABS = ["Domains", "Tags", "Upload", "Search"];

export default function KnowledgePage() {
    const [tab, setTab] = useState<string>(TABS[0]);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Knowledge Management</h1>
            <div className="flex gap-2 mb-6">
                {TABS.map((t) => (
                    <button
                        key={t}
                        className={`px-4 py-2 rounded-t ${tab === t ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <div className="bg-white rounded-b shadow p-6 min-h-[300px]">
                {tab === "Domains" && <DomainManagement />}
                {tab === "Tags" && <TagManagement />}
                {tab === "Upload" && <DocumentUpload />}
                {tab === "Search" && <KnowledgeSearch />}
            </div>
        </div>
    );
} 