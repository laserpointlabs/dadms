import { Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import PersonaManager from './PersonaManager';
import PromptManager from './PromptManager';
import TeamsTab from './TeamsTab';
import ToolManager from './ToolManager';

const ContextManager = () => {
    const [tab, setTab] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    return (
        <>
            <Typography variant="h4" gutterBottom>
                Context Manager (Teams Demo Enabled)
            </Typography>
            <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Personas" />
                <Tab label="Teams" />
                <Tab label="Tools" />
                <Tab label="Prompts" />
            </Tabs>
            {tab === 0 && <PersonaManager />}
            {tab === 1 && <TeamsTab />}
            {tab === 2 && <ToolManager />}
            {tab === 3 && <PromptManager />}
        </>
    );
};

export default ContextManager; 