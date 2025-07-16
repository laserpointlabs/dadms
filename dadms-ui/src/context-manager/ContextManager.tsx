import { Tab, Tabs, Typography } from '@mui/material';
import React, { useState } from 'react';
import PersonasTab from './PersonasTab';
import PromptsTab from './PromptsTab';
import TeamsTab from './TeamsTab';
import ToolsTab from './ToolsTab';

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
            {tab === 0 && <PersonasTab />}
            {tab === 1 && <TeamsTab />}
            {tab === 2 && <ToolsTab />}
            {tab === 3 && <PromptsTab />}
        </>
    );
};

export default ContextManager; 