"use client";
import {
    Box,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import ProcessThreadManager from './ProcessThreadManager';

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

const MOCK_THREADS: AnalysisThread[] = [
    {
        id: '1',
        openai_thread: 'thread-1',
        openai_assistant: 'assistant-1',
        name: 'Invoice Approval',
        status: 'active',
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        analysis_count: 3,
        analysis_ids: ['a1', 'a2', 'a3'],
        process_definition: { name: 'Invoice Process', version: 2, key: 'invoice' }
    },
    {
        id: '2',
        openai_thread: 'thread-2',
        openai_assistant: 'assistant-2',
        name: 'Purchase Request',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        last_activity: new Date(Date.now() - 3600000).toISOString(),
        analysis_count: 2,
        analysis_ids: ['a4', 'a5'],
        process_definition: { name: 'Purchase Process', version: 1, key: 'purchase' }
    }
];

const MOCK_THREAD_DATA: ThreadData = {
    thread_id: 'thread-1',
    created_at: new Date().toISOString(),
    metadata: { project: 'Demo', process: 'Invoice Process' },
    messages: [
        {
            id: 'm1',
            role: 'user',
            content: [{ type: 'text', text: { value: 'What is the status of invoice 123?' } }],
            created_at: Math.floor(Date.now() / 1000) - 300,
        },
        {
            id: 'm2',
            role: 'assistant',
            content: [{ type: 'text', text: { value: 'Invoice 123 is approved and pending payment.' } }],
            created_at: Math.floor(Date.now() / 1000) - 200,
        }
    ],
    message_count: 2,
    status: 'active',
};

const ThreadManager: React.FC = () => {
    const [tab, setTab] = useState(0);
    return (
        <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Thread Manager
                </Typography>
            </Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Process Threads" />
                <Tab label="User Conversation Threads" disabled />
            </Tabs>
            {tab === 0 && <ProcessThreadManager />}
            {/* Future: {tab === 1 && <UserConversationThreadManager />} */}
        </Box>
    );
};

export default ThreadManager; 