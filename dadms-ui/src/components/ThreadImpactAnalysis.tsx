import SendIcon from '@mui/icons-material/Send';
import { Box, Divider, IconButton, List, ListItemText, Paper, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';

// Mock impacted tasks for the impact analysis report
const MOCK_IMPACTED_TASKS = [
    {
        thread_id: 'thread-2',
        process_name: 'Purchase Request',
        process_version: 1,
        task_id: 'task-3',
        task_name: 'Review Request',
        impact_score: 0.92,
        explanation: 'This task is highly similar to a changed node in the new process definition.'
    },
    {
        thread_id: 'thread-4',
        process_name: 'Vendor Onboarding',
        process_version: 2,
        task_id: 'task-9',
        task_name: 'Approve Vendor',
        impact_score: 0.78,
        explanation: 'This task shares key decision criteria with the updated process.'
    }
];

// Mock LLM summary of risks/concerns
const MOCK_LLM_SUMMARY = [
    'Potential compatibility issues with legacy systems or existing workflows.',
    'High similarity to critical decision points in previous processes; changes may introduce unintended side effects.',
    'Risk of breaking compliance with established vendor onboarding protocols.',
    'Need for additional review of downstream dependencies before implementation.'
];

const ThreadImpactAnalysis: React.FC = () => {
    // Chat state
    const [chatHistory, setChatHistory] = useState<
        { sender: 'user' | 'ai'; message: string }[]
    >([
        { sender: 'ai', message: 'How can I help you interpret the impact analysis or address your concerns?' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // Mock AI response (echo or canned)
    const getAIResponse = (userMsg: string) => {
        if (userMsg.toLowerCase().includes('compliance')) {
            return 'Based on the impact analysis, compliance risks may arise if the new process diverges from established protocols. Would you like to see specific examples?';
        }
        if (userMsg.toLowerCase().includes('recommend')) {
            return 'I recommend reviewing the high-impact tasks and consulting with domain experts before proceeding.';
        }
        return 'Thank you for your question. I will analyze the impact report and provide further insights as needed.';
    };

    const handleSend = () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatHistory(prev => [
            ...prev,
            { sender: 'user', message: userMsg },
            { sender: 'ai', message: getAIResponse(userMsg) }
        ]);
        setChatInput('');
    };

    return (
        <Box sx={{ p: 2, maxWidth: '100%', overflow: 'hidden' }}>
            <Typography variant="h5" gutterBottom>Thread Impact Analysis <span style={{ color: '#888', fontSize: '0.85em' }}>(Preview)</span></Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                This tool evaluates the potential impact of new or changed decision processes on historical decisions. It identifies and visualizes historical tasks and threads that may be affected by process changes, supporting safer process evolution, governance, and cross-domain insight.
            </Typography>
            {/* LLM Risk/Concern Summary */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f9f6e7' }}>
                <Typography variant="h6" gutterBottom>LLM Risk/Concern Summary <span style={{ color: '#888', fontSize: '0.85em' }}>(AI-generated preview)</span></Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    The following issues, concerns, and risks have been identified based on the impacted tasks:
                </Typography>
                <List>
                    {MOCK_LLM_SUMMARY.map((item, idx) => (
                        <React.Fragment key={idx}>
                            <ListItemText
                                primary={<span style={{ color: '#b26a00' }}>• {item}</span>}
                                sx={{ mb: 1 }}
                            />
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
            {/* User/AI Chat Interface */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" gutterBottom>Impact Analysis Q&A <span style={{ color: '#888', fontSize: '0.85em' }}>(Conversational Preview)</span></Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2, border: '1px solid #eee', borderRadius: 1, p: 1, bgcolor: '#fff' }}>
                    {chatHistory.map((msg, idx) => (
                        <Box key={idx} sx={{ mb: 1, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                            <Typography variant="body2" sx={{ color: msg.sender === 'user' ? '#1976d2' : '#b26a00', fontWeight: msg.sender === 'user' ? 600 : 500 }}>
                                {msg.sender === 'user' ? 'You' : 'AI'}: {msg.message}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Ask a question or comment about the impact analysis..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    />
                    <IconButton color="primary" onClick={handleSend} disabled={!chatInput.trim()}>
                        <SendIcon />
                    </IconButton>
                </Box>
            </Paper>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Mock Impact Report</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The following historical tasks are potentially impacted by the proposed process change:
                </Typography>
                <List>
                    {MOCK_IMPACTED_TASKS.map((item, idx) => (
                        <React.Fragment key={idx}>
                            <ListItemText
                                primary={<><b>{item.process_name} (v{item.process_version})</b> &mdash; Task: <b>{item.task_name}</b> <span style={{ color: '#c00', fontSize: '0.85em' }}>[Impact Score: {(item.impact_score * 100).toFixed(1)}%]</span></>}
                                secondary={<span style={{ color: '#555' }}>{item.explanation}</span>}
                                sx={{ mb: 1 }}
                            />
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
            <Typography variant="body2" color="text.secondary">
                Future versions will support interactive graph visualizations, what-if simulations, and detailed impact drill-downs.
            </Typography>
        </Box>
    );
};

export default ThreadImpactAnalysis; 