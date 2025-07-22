import { useState } from 'react';
import { CodiconName, Icon } from '../shared/Icon';
import { PageContent } from '../shared/PageLayout';
import PersonaManager from './PersonaManager';
import PromptManager from './PromptManager';
import TeamsTab from './TeamsTab';
import ToolManager from './ToolManager';

// Persona type (should match PersonaManager)
interface Persona {
    id: string;
    name: string;
    role: string;
    expertise: string[];
    guidelines: string;
    tags: string[];
    tool_ids: string[];
}

const MOCK_PERSONAS: Persona[] = [
    { id: "1", name: "Risk Analyst", role: "Analyst", expertise: ["Risk", "Finance"], guidelines: "Be thorough and cautious.", tags: ['finance', 'analysis'], tool_ids: ["2"] },
    { id: "2", name: "Mission Simulation Expert", role: "Simulation Expert", expertise: ["Simulation", "Mission Planning"], guidelines: "Use all available simulation tools.", tags: ['simulation'], tool_ids: ["1", "3"] },
];

interface Tab {
    id: string;
    name: string;
    icon: CodiconName;
    description: string;
}

const TABS: Tab[] = [
    { id: "personas", name: "Personas", icon: "robot", description: "AI agent personalities" },
    { id: "teams", name: "Teams", icon: "type-hierarchy", description: "Collections of personas" },
    { id: "tools", name: "Tools", icon: "extensions", description: "API integrations" },
    { id: "prompts", name: "Prompts", icon: "file-text", description: "Template library" }
];

const ContextManager = () => {
    const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
    const [personas, setPersonas] = useState<Persona[]>(MOCK_PERSONAS);

    const renderTabContent = () => {
        switch (activeTab) {
            case "personas": return <PersonaManager personas={personas} setPersonas={setPersonas} />;
            case "teams": return <TeamsTab personas={personas} />;
            case "tools": return <ToolManager />;
            case "prompts": return <PromptManager />;
            default: return <PersonaManager personas={personas} setPersonas={setPersonas} />;
        }
    };

    return (
        <>
            {/* Tab Navigation */}
            <div className="bg-theme-surface border-b border-theme-border">
                <PageContent padding="sm" spacing="none">
                    <nav className="flex space-x-0">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group relative px-6 py-4 text-sm font-medium transition-all duration-200
                                    ${activeTab === tab.id
                                        ? 'text-theme-accent-primary bg-theme-surface-elevated border-b-2 border-theme-accent-primary'
                                        : 'text-theme-text-secondary hover:text-theme-accent-primary hover:bg-theme-surface-hover'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon
                                        name={tab.icon}
                                        size="md"
                                        className="opacity-70 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="text-left">
                                        <div>{tab.name}</div>
                                        <div className="text-xs text-theme-text-muted group-hover:text-theme-accent-primary transition-colors">
                                            {tab.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </nav>
                </PageContent>
            </div>

            {/* Content */}
            <PageContent className="bg-theme-bg-primary">
                <div className="bg-theme-surface rounded-lg border border-theme-border p-6 min-h-[500px]">
                    {renderTabContent()}
                </div>
            </PageContent>
        </>
    );
};

export default ContextManager; 