import { Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
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

const ContextManager = () => {
    const [tab, setTab] = useState(0);
    const [personas, setPersonas] = useState<Persona[]>(MOCK_PERSONAS);
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    return (
        <>
            <Typography variant="h4" gutterBottom>
                Context Manager
            </Typography>
            <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Personas" />
                <Tab label="Teams" />
                <Tab label="Tools" />
                <Tab label="Prompts" />
            </Tabs>
            {tab === 0 && <PersonaManager personas={personas} setPersonas={setPersonas} />}
            {tab === 1 && <TeamsTab personas={personas} />}
            {tab === 2 && <ToolManager />}
            {tab === 3 && <PromptManager />}
        </>
    );
};

export default ContextManager; 