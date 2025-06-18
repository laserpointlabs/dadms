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
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
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
    analysis_id: string;
    created_at: string;
    updated_at: string;
    status: string;
    context_data: any;
    messages: any[];
    metadata: any;
}

interface AnalysisThread {
    id: string;
    name: string;
    status: 'active' | 'completed' | 'error' | 'pending';
    created_at: string;
    last_activity: string;
    message_count: number;
    context_size: number;
}

const ThreadContextViewer: React.FC = () => {
    const [threads, setThreads] = useState<AnalysisThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const mockThreads: AnalysisThread[] = [
        {
            id: 'thread_001',
            name: 'Market Analysis Q4 2024',
            status: 'completed',
            created_at: '2024-12-01T10:00:00Z',
            last_activity: '2024-12-01T15:30:00Z',
            message_count: 24,
            context_size: 12500
        },
        {
            id: 'thread_002',
            name: 'Customer Segmentation Analysis',
            status: 'active',
            created_at: '2024-12-02T09:15:00Z',
            last_activity: '2024-12-02T14:45:00Z',
            message_count: 15,
            context_size: 8900
        },
        {
            id: 'thread_003',
            name: 'Risk Assessment Pipeline',
            status: 'pending',
            created_at: '2024-12-02T11:30:00Z',
            last_activity: '2024-12-02T11:30:00Z',
            message_count: 3,
            context_size: 1200
        }
    ];

    const mockThreadData: ThreadData = {
        thread_id: 'thread_001',
        analysis_id: 'analysis_001',
        created_at: '2024-12-01T10:00:00Z',
        updated_at: '2024-12-01T15:30:00Z',
        status: 'completed',
        context_data: {
            input_parameters: {
                data_source: 'sales_database',
                time_period: 'Q4_2024',
                analysis_type: 'market_trend'
            },
            processing_steps: [
                'Data extraction completed',
                'Preprocessing applied',
                'Statistical analysis performed',
                'Visualization generated'
            ]
        },
        messages: [
            {
                id: 'msg_001',
                role: 'user',
                content: 'Analyze the Q4 2024 market trends',
                timestamp: '2024-12-01T10:00:00Z'
            },
            {
                id: 'msg_002',
                role: 'assistant',
                content: `# Market Analysis Results - Q4 2024

## Key Findings

The analysis of Q4 2024 market data reveals several important trends:

### Sales Performance
- **Total Revenue**: $2.4M (↑15% vs Q3)
- **Units Sold**: 12,500 (↑8% vs Q3)
- **Average Order Value**: $192 (↑6% vs Q3)

### Market Segments
1. **Consumer Electronics**: 45% market share
2. **Home Appliances**: 32% market share  
3. **Professional Equipment**: 23% market share

### Recommendations
- Focus marketing efforts on consumer electronics segment
- Expand inventory for home appliances
- Investigate pricing strategies for professional equipment

\`\`\`python
# Sample analysis code
import pandas as pd
import matplotlib.pyplot as plt

def analyze_sales_trends(data):
    return data.groupby('month')['revenue'].sum()
\`\`\``,
                timestamp: '2024-12-01T10:15:00Z'
            }
        ],
        metadata: {
            total_tokens: 15680,
            processing_time: 45.2,
            confidence_score: 0.89
        }
    };

    useEffect(() => {
        loadThreads();
    }, []); // Empty dependency array is intentional for initialization

    const loadThreads = async () => {
        setLoading(true);
        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setThreads(mockThreads);
        } catch (err) {
            setError('Failed to load threads');
        } finally {
            setLoading(false);
        }
    };

    const loadThreadDetails = async (threadId: string) => {
        setLoading(true);
        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setSelectedThread(mockThreadData);
        } catch (err) {
            setError('Failed to load thread details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'completed': return 'primary';
            case 'error': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const filteredThreads = threads.filter(thread =>
        thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Thread Context Viewer
                </Typography>
                <Tooltip title="Refresh threads">
                    <IconButton onClick={loadThreads} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Thread List */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
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
                                            onClick={() => loadThreadDetails(thread.id)}
                                            selected={selectedThread?.thread_id === thread.id}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
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
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            ID: {thread.id}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            Messages: {thread.message_count} | Context: {thread.context_size} chars
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            Last: {new Date(thread.last_activity).toLocaleString()}
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
                </Grid>

                {/* Thread Details */}
                <Grid item xs={12} md={8}>
                    {loading && selectedThread ? (
                        <Paper sx={{ p: 3, height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress />
                        </Paper>
                    ) : selectedThread ? (
                        <Paper sx={{ p: 0, height: '70vh', overflow: 'auto' }}>
                            {/* Thread Header */}
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardHeader
                                                title="Thread Information"
                                                titleTypographyProps={{ variant: 'h6' }}
                                                avatar={<DataObject />}
                                            />
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Thread ID:</strong> {selectedThread.thread_id}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Analysis ID:</strong> {selectedThread.analysis_id}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Status:</strong> {selectedThread.status}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Created:</strong> {new Date(selectedThread.created_at).toLocaleString()}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardHeader
                                                title="Processing Metrics"
                                                titleTypographyProps={{ variant: 'h6' }}
                                                avatar={<Psychology />}
                                            />
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Total Tokens:</strong> {selectedThread.metadata.total_tokens.toLocaleString()}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Processing Time:</strong> {selectedThread.metadata.processing_time}s
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Confidence Score:</strong> {(selectedThread.metadata.confidence_score * 100).toFixed(1)}%
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Messages:</strong> {selectedThread.messages.length}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Context Data */}
                            <Box sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Context Data
                                </Typography>
                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Input Parameters
                                        </Typography>
                                        <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                                            {JSON.stringify(selectedThread.context_data.input_parameters, null, 2)}
                                        </pre>
                                    </CardContent>
                                </Card>

                                <Card sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Processing Steps
                                        </Typography>
                                        <List dense>
                                            {selectedThread.context_data.processing_steps.map((step: string, index: number) => (
                                                <ListItem key={index}>
                                                    <ListItemText primary={`${index + 1}. ${step}`} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Messages */}
                            <Box sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Conversation History
                                </Typography>
                                {selectedThread.messages.map((message, index) => (
                                    <Card key={message.id} sx={{ mb: 2 }}>
                                        <CardHeader
                                            title={message.role === 'user' ? 'User' : 'AI Assistant'}
                                            subheader={new Date(message.timestamp).toLocaleString()}
                                            titleTypographyProps={{ variant: 'subtitle1' }}
                                            avatar={
                                                message.role === 'user' ?
                                                    <Typography variant="h6">👤</Typography> :
                                                    <Psychology />
                                            }
                                        />
                                        <CardContent>
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
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 3, height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                Select a thread to view its context and conversation history
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ThreadContextViewer;
