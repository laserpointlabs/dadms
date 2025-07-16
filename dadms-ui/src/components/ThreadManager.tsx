"use client";
import { DataObject, Psychology, Refresh, Search } from '@mui/icons-material';
import {
    Alert,
    Box,
    Card, CardContent, CardHeader,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment, List, ListItemButton, ListItemText,
    Paper,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

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
    const [threads, setThreads] = useState<AnalysisThread[]>(MOCK_THREADS);
    const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Placeholder fetch functions
    const fetchThreads = async () => {
        setLoading(true);
        setError(null);
        // TODO: Replace with real API call
        setTimeout(() => {
            setThreads(MOCK_THREADS);
            setLoading(false);
        }, 500);
    };

    const fetchThreadContext = async (threadId: string) => {
        setLoading(true);
        setError(null);
        // TODO: Replace with real API call
        setTimeout(() => {
            setSelectedThread(MOCK_THREAD_DATA);
            setLoading(false);
        }, 500);
    };

    useEffect(() => {
        fetchThreads();
    }, []);

    const filteredThreads = threads.filter(thread =>
        thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.openai_thread.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.openai_assistant.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleThreadSelect = (thread: AnalysisThread) => {
        fetchThreadContext(thread.openai_thread);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'active': return 'primary';
            case 'error': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Thread Manager
                </Typography>
                <Tooltip title="Refresh threads">
                    <IconButton onClick={fetchThreads} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 3, height: '70vh', maxWidth: '100%', overflow: 'hidden' }}>
                {/* Thread List */}
                <Box sx={{ width: '400px', minWidth: '400px', maxWidth: '400px', flexShrink: 0 }}>
                    <Paper sx={{ p: 2, height: '100%', overflow: 'auto', width: '100%' }}>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search threads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Box>
                        {loading && !selectedThread ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <List>
                                {filteredThreads.map((thread) => (
                                    <React.Fragment key={thread.id}>
                                        <ListItemButton
                                            onClick={() => handleThreadSelect(thread)}
                                            selected={selectedThread?.thread_id === thread.openai_thread}
                                            sx={{ maxWidth: '100%', overflow: 'hidden' }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '100%', overflow: 'hidden' }}>
                                                        <Typography variant="subtitle2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                            {thread.name}
                                                        </Typography>
                                                        <Chip label={thread.status} size="small" color={getStatusColor(thread.status) as any} />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                                        <Typography variant="caption" display="block" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            Thread: {thread.openai_thread}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            Assistant: {thread.openai_assistant}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            Analyses: {thread.analysis_count} | Created: {new Date(thread.created_at).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>
                {/* Thread Details */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', maxWidth: 'calc(100vw - 450px)', width: '100%' }}>
                    {loading && selectedThread ? (
                        <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Paper>
                    ) : selectedThread ? (
                        <Paper sx={{ p: 0, height: '100%', overflow: 'auto', width: '100%', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', '& *': { maxWidth: '100% !important', wordWrap: 'break-word !important', overflowWrap: 'break-word !important', whiteSpace: 'pre-wrap' } }}>
                            {/* Thread Header */}
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', maxWidth: '100%', overflow: 'hidden' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Card sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        <CardHeader title="Thread Information" titleTypographyProps={{ variant: 'h6' }} avatar={<DataObject />} />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                                <strong>Thread ID:</strong> {selectedThread.thread_id}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Created:</strong> {selectedThread.created_at ? new Date(selectedThread.created_at).toLocaleString() : 'Unknown'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Status:</strong> {selectedThread.status}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Messages:</strong> {selectedThread.message_count}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    <Card sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        <CardHeader title="Thread Metadata" titleTypographyProps={{ variant: 'h6' }} avatar={<Psychology />} />
                                        <CardContent>
                                            {selectedThread.metadata && Object.keys(selectedThread.metadata).length > 0 ? (
                                                <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '150px', maxWidth: '100%', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                    {JSON.stringify(selectedThread.metadata, null, 2)}
                                                </pre>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No metadata available
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Box>
                            {/* Messages */}
                            <Box sx={{ p: 2, maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>
                                <Typography variant="h6" gutterBottom>
                                    Conversation History ({selectedThread.messages.length} messages)
                                </Typography>
                                {selectedThread.messages.slice().reverse().map((message, index) => (
                                    <Card key={message.id} sx={{ mb: 2, maxWidth: '100%', wordWrap: 'break-word', overflow: 'hidden' }}>
                                        <CardHeader
                                            title={message.role === 'user' ? 'User' : 'Assistant'}
                                            subheader={new Date(message.created_at * 1000).toLocaleString()}
                                            titleTypographyProps={{ variant: 'subtitle1' }}
                                            avatar={message.role === 'user' ? <Typography variant="h6">👤</Typography> : <Psychology />}
                                        />
                                        <CardContent sx={{ maxWidth: '100%', overflow: 'auto', wordWrap: 'break-word', '& pre': { maxWidth: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }, '& code': { maxWidth: '100%', overflow: 'auto', wordWrap: 'break-word' } }}>
                                            {message.content.map((contentItem, contentIndex) => (
                                                <Box key={contentIndex} sx={{ maxWidth: '100%' }}>
                                                    {contentItem.type === 'text' && contentItem.text ? (
                                                        <Box sx={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word', '& p': { margin: '0 0 1em 0', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }, '& pre': { maxWidth: '100%', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }, '& code': { wordWrap: 'break-word', overflowWrap: 'break-word' } }}>
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    code({ node, inline, className, children, ...props }: any) {
                                                                        const match = /language-(\w+)/.exec(className || '');
                                                                        return !inline && match ? (
                                                                            <SyntaxHighlighter
                                                                                style={tomorrow as any}
                                                                                language={match[1]}
                                                                                PreTag="div"
                                                                                wrapLongLines={true}
                                                                                customStyle={{ maxWidth: '100%', overflow: 'auto', fontSize: '0.875rem' }}
                                                                                {...props}
                                                                            >
                                                                                {String(children).replace(/\n$/, '')}
                                                                            </SyntaxHighlighter>
                                                                        ) : (
                                                                            <code className={className} {...props} style={{ maxWidth: '100%', overflow: 'auto', wordWrap: 'break-word', fontSize: '0.875rem' }}>
                                                                                {children}
                                                                            </code>
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                {contentItem.text.value}
                                                            </ReactMarkdown>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            [Unsupported content type: {contentItem.type}]
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                Select a thread to view its context and conversation history
                            </Typography>
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ThreadManager; 