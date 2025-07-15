"use client";

import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import PersonaManager from "../../components/ContextManager/PersonaManager";
import PromptManager from "../../components/ContextManager/PromptManager";
import ToolManager from "../../components/ContextManager/ToolManager";

const TABS = ["Personas", "Tools", "Prompts"];

export default function ContextManagerPage() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 2 }}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Context Manager
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage Personas, Tools, and Prompts for robust, testable LLM workflows.
                </Typography>
            </Paper>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                {TABS.map((label, idx) => (
                    <Tab key={label} label={label} />
                ))}
            </Tabs>
            <Box>
                {tab === 0 && <PersonaManager />}
                {tab === 1 && <ToolManager />}
                {tab === 2 && <PromptManager />}
            </Box>
        </Box>
    );
} 