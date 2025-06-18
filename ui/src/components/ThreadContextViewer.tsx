import {
    DataObject,
    Psychology,
    Refresh,
    Search
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
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
        text?: {
            value: string;
        };
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

const ThreadContextViewer: React.FC = () => {
    const [threads, setThreads] = useState<AnalysisThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch real thread combinations from our API
    const fetchThreads = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/analysis/threads`);
            const result = await response.json();

            if (result.success) {
                setThreads(result.data);
                console.log(`Loaded ${result.data.length} unique thread combinations`);
            } else {
                setError(result.error || 'Failed to fetch threads');
            }
        } catch (err) {
            console.error('Error fetching threads:', err);
            setError('Failed to connect to API');
        } finally {
            setLoading(false);
        }
    };

    // Fetch thread context from OpenAI
    const fetchThreadContext = async (threadId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/analysis/threads/${threadId}/context`);
            const result = await response.json();

            if (result.success) {
                setSelectedThread(result.data);
                console.log(`Loaded thread context for ${threadId}:`, result.data);
            } else {
                setError(result.error || 'Failed to fetch thread context');
            }
        } catch (err) {
            console.error('Error fetching thread context:', err);
            setError('Failed to load thread context');
        } finally {
            setLoading(false);
        }
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
        <Box sx={{
            p: 3,
            maxWidth: '100%',
            overflow: 'hidden',
            '& .MuiGrid-container': {
                maxWidth: '100%'
            },
            '& *': {
                boxSizing: 'border-box'
            }
        }}>
            <style>
                {`
                .thread-context-viewer * {
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width: 100% !important;
                }
                .thread-context-viewer pre {
                    white-space: pre-wrap !important;
                    word-wrap: break-word !important;
                    overflow-x: auto !important;
                    max-width: 100% !important;
                }
                .thread-context-viewer code {
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    white-space: pre-wrap !important;
                }
                `}
            </style>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Thread Context Viewer
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

            <Box sx={{
                display: 'flex',
                gap: 3,
                height: '70vh',
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                {/* Thread List */}
                <Box sx={{
                    width: '400px',
                    minWidth: '400px',
                    maxWidth: '400px',
                    flexShrink: 0
                }}>
                    <Paper sx={{
                        p: 2,
                        height: '100%',
                        overflow: 'auto',
                        width: '100%'
                    }}>
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
                                            sx={{
                                                maxWidth: '100%',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        maxWidth: '100%',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                flexGrow: 1,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: '200px'
                                                            }}
                                                        >
                                                            {thread.name}
                                                        </Typography>
                                                        <Chip
                                                            label={thread.status}
                                                            size="small"
                                                            color={getStatusColor(thread.status) as any}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{
                                                        maxWidth: '100%',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            Thread: {thread.openai_thread}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            Assistant: {thread.openai_assistant}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            display="block"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
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
                <Box sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    maxWidth: 'calc(100vw - 450px)', // Force max width based on viewport
                    width: '100%'
                }}>
                    {loading && selectedThread ? (
                        <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Paper>
                    ) : selectedThread ? (
                        <Paper sx={{
                            p: 0,
                            height: '100%',
                            overflow: 'auto',
                            width: '100%',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            '& *': {
                                maxWidth: '100% !important',
                                wordWrap: 'break-word !important',
                                overflowWrap: 'break-word !important',
                                whiteSpace: 'pre-wrap'
                            }
                        }}>
                            {/* Thread Header */}
                            <Box sx={{
                                p: 2,
                                borderBottom: 1,
                                borderColor: 'divider',
                                bgcolor: 'grey.50',
                                maxWidth: '100%',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Card sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        <CardHeader
                                            title="Thread Information"
                                            titleTypographyProps={{ variant: 'h6' }}
                                            avatar={<DataObject />}
                                        />
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
                                        <CardHeader
                                            title="Thread Metadata"
                                            titleTypographyProps={{ variant: 'h6' }}
                                            avatar={<Psychology />}
                                        />
                                        <CardContent>
                                            {selectedThread.metadata && Object.keys(selectedThread.metadata).length > 0 ? (
                                                <pre style={{
                                                    fontSize: '0.75rem',
                                                    overflow: 'auto',
                                                    maxHeight: '150px',
                                                    maxWidth: '100%',
                                                    wordWrap: 'break-word',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
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
                            <Box sx={{
                                p: 2,
                                maxWidth: '100%',
                                overflow: 'hidden',
                                wordWrap: 'break-word'
                            }}>
                                <Typography variant="h6" gutterBottom>
                                    Conversation History ({selectedThread.messages.length} messages)
                                </Typography>
                                {selectedThread.messages.slice().reverse().map((message, index) => (
                                    <Card key={message.id} sx={{
                                        mb: 2,
                                        maxWidth: '100%',
                                        wordWrap: 'break-word',
                                        overflow: 'hidden'
                                    }}>
                                        <CardHeader
                                            title={message.role === 'user' ? 'User' : 'Assistant'}
                                            subheader={new Date(message.created_at * 1000).toLocaleString()}
                                            titleTypographyProps={{ variant: 'subtitle1' }}
                                            avatar={
                                                message.role === 'user' ?
                                                    <Typography variant="h6">👤</Typography> :
                                                    <Psychology />
                                            }
                                        />
                                        <CardContent sx={{
                                            maxWidth: '100%',
                                            overflow: 'auto',
                                            wordWrap: 'break-word',
                                            '& pre': {
                                                maxWidth: '100%',
                                                overflow: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word'
                                            },
                                            '& code': {
                                                maxWidth: '100%',
                                                overflow: 'auto',
                                                wordWrap: 'break-word'
                                            }
                                        }}>
                                            {message.content.map((contentItem, contentIndex) => (
                                                <Box key={contentIndex} sx={{ maxWidth: '100%' }}>
                                                    {contentItem.type === 'text' && contentItem.text ? (
                                                        <Box sx={{
                                                            maxWidth: '100%',
                                                            overflow: 'hidden',
                                                            wordWrap: 'break-word',
                                                            '& p': {
                                                                margin: '0 0 1em 0',
                                                                wordWrap: 'break-word',
                                                                overflowWrap: 'break-word',
                                                                hyphens: 'auto'
                                                            },
                                                            '& pre': {
                                                                maxWidth: '100%',
                                                                overflow: 'auto',
                                                                whiteSpace: 'pre-wrap',
                                                                wordWrap: 'break-word'
                                                            },
                                                            '& code': {
                                                                wordWrap: 'break-word',
                                                                overflowWrap: 'break-word'
                                                            }
                                                        }}>
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
                                                                                customStyle={{
                                                                                    maxWidth: '100%',
                                                                                    overflow: 'auto',
                                                                                    fontSize: '0.875rem'
                                                                                }}
                                                                                {...props}
                                                                            >
                                                                                {String(children).replace(/\n$/, '')}
                                                                            </SyntaxHighlighter>
                                                                        ) : (
                                                                            <code className={className} {...props} style={{
                                                                                maxWidth: '100%',
                                                                                overflow: 'auto',
                                                                                wordWrap: 'break-word',
                                                                                fontSize: '0.875rem'
                                                                            }}>
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

export default ThreadContextViewer;
