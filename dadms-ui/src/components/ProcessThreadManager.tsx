import { DataObject, Psychology, Search } from '@mui/icons-material';
import {
    Alert,
    Box,
    Card, CardContent, CardHeader,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    IconButton,
    InputAdornment, List, ListItemButton, ListItemText,
    Paper,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

// Mock data types
interface ServiceTaskContext {
    task_id: string;
    name: string;
    input_context: any;
    injected_context: any;
    output_context: any;
    created_at: string;
}

interface ProcessThread {
    thread_id: string;
    process_name: string;
    process_version: number;
    status: 'active' | 'completed' | 'error' | 'pending';
    created_at: string;
    metadata: any;
    tasks: ServiceTaskContext[];
}

const MOCK_PROCESS_THREADS: ProcessThread[] = [
    {
        thread_id: 'thread-1',
        process_name: 'Invoice Approval',
        process_version: 2,
        status: 'active',
        created_at: new Date().toISOString(),
        metadata: { project: 'Demo', process: 'Invoice Process' },
        tasks: [
            {
                task_id: 'task-1',
                name: 'Extract Invoice Data',
                input_context: { invoiceId: 123 },
                injected_context: { tool: 'OCR', confidence: 0.98 },
                output_context: { extracted: true, fields: ['amount', 'date'] },
                created_at: new Date().toISOString(),
            },
            {
                task_id: 'task-2',
                name: 'Approve Invoice',
                input_context: { amount: 1000 },
                injected_context: { persona: 'Manager', rules: ['limit < 5000'] },
                output_context: { approved: true, approver: 'Alice' },
                created_at: new Date().toISOString(),
            },
        ],
    },
    {
        thread_id: 'thread-2',
        process_name: 'Purchase Request',
        process_version: 1,
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        metadata: { project: 'Demo', process: 'Purchase Process' },
        tasks: [
            {
                task_id: 'task-3',
                name: 'Review Request',
                input_context: { requestId: 456 },
                injected_context: { persona: 'Reviewer' },
                output_context: { reviewed: true, comments: 'Looks good' },
                created_at: new Date(Date.now() - 86300000).toISOString(),
            },
        ],
    },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'success';
        case 'active': return 'primary';
        case 'error': return 'error';
        case 'pending': return 'warning';
        default: return 'default';
    }
};

const ProcessThreadManager: React.FC = () => {
    const [threads, setThreads] = useState<ProcessThread[]>(MOCK_PROCESS_THREADS);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedThreads, setExpandedThreads] = useState<{ [threadId: string]: boolean }>({});

    const filteredThreads = threads.filter(thread =>
        thread.process_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.thread_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleThreadSelect = (threadId: string) => {
        setSelectedThreadId(threadId);
        setSelectedTaskId(null);
    };
    const handleTaskSelect = (threadId: string, taskId: string) => {
        setSelectedThreadId(threadId);
        setSelectedTaskId(taskId);
    };
    const handleExpandToggle = (threadId: string) => {
        setExpandedThreads(prev => ({ ...prev, [threadId]: !prev[threadId] }));
    };

    const selectedThread = threads.find(t => t.thread_id === selectedThreadId) || null;
    const selectedTask = selectedThread && selectedTaskId
        ? selectedThread.tasks.find(t => t.task_id === selectedTaskId) || null
        : null;

    return (
        <Box sx={{ display: 'flex', gap: 3, height: '70vh', maxWidth: '100%', overflow: 'hidden' }}>
            {/* Thread List */}
            <Box sx={{ width: '400px', minWidth: '400px', maxWidth: '400px', flexShrink: 0 }}>
                <Paper sx={{ p: 2, height: '100%', overflow: 'auto', width: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search process threads..."
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
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List>
                            {filteredThreads.map((thread) => (
                                <React.Fragment key={thread.thread_id}>
                                    <ListItemButton
                                        onClick={() => handleThreadSelect(thread.thread_id)}
                                        selected={selectedThreadId === thread.thread_id && !selectedTaskId}
                                        sx={{ maxWidth: '100%', overflow: 'hidden' }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '100%', overflow: 'hidden' }}>
                                                    <Typography variant="subtitle2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                        {thread.process_name} (v{thread.process_version})
                                                    </Typography>
                                                    <Chip label={thread.status} size="small" color={getStatusColor(thread.status) as any} />
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                                    <Typography variant="caption" display="block" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        Thread: {thread.thread_id}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        Created: {new Date(thread.created_at).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <Tooltip title={expandedThreads[thread.thread_id] ? 'Collapse tasks' : 'Expand tasks'}>
                                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleExpandToggle(thread.thread_id); }}>
                                                {expandedThreads[thread.thread_id] ? '-' : '+'}
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemButton>
                                    <Collapse in={expandedThreads[thread.thread_id]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {thread.tasks.map(task => (
                                                <ListItemButton
                                                    key={task.task_id}
                                                    sx={{ pl: 4 }}
                                                    selected={selectedThreadId === thread.thread_id && selectedTaskId === task.task_id}
                                                    onClick={() => handleTaskSelect(thread.thread_id, task.task_id)}
                                                >
                                                    <ListItemText
                                                        primary={<Typography variant="body2">Task: {task.name}</Typography>}
                                                        secondary={<Typography variant="caption">{new Date(task.created_at).toLocaleString()}</Typography>}
                                                    />
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    </Collapse>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>
            {/* Thread/Task Details */}
            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', maxWidth: 'calc(100vw - 450px)', width: '100%' }}>
                {loading ? (
                    <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Paper>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                ) : selectedThread ? (
                    selectedTask ? (
                        <Paper sx={{ p: 0, height: '100%', overflow: 'auto', width: '100%', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', '& *': { maxWidth: '100% !important', wordWrap: 'break-word !important', overflowWrap: 'break-word !important', whiteSpace: 'pre-wrap' } }}>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', maxWidth: '100%', overflow: 'hidden' }}>
                                <Card sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                    <CardHeader title={`Task: ${selectedTask.name}`} titleTypographyProps={{ variant: 'h6' }} avatar={<DataObject />} />
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary"><strong>Task ID:</strong> {selectedTask.task_id}</Typography>
                                        <Typography variant="body2" color="text.secondary"><strong>Created:</strong> {new Date(selectedTask.created_at).toLocaleString()}</Typography>
                                    </CardContent>
                                </Card>
                                <Card sx={{ maxWidth: '100%', overflow: 'hidden', mt: 2 }}>
                                    <CardHeader title="Input Context" titleTypographyProps={{ variant: 'subtitle1' }} />
                                    <CardContent>
                                        <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: '120px', maxWidth: '100%' }}>{JSON.stringify(selectedTask.input_context, null, 2)}</pre>
                                    </CardContent>
                                </Card>
                                <Card sx={{ maxWidth: '100%', overflow: 'hidden', mt: 2 }}>
                                    <CardHeader title="Injected Context" titleTypographyProps={{ variant: 'subtitle1' }} />
                                    <CardContent>
                                        <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: '120px', maxWidth: '100%' }}>{JSON.stringify(selectedTask.injected_context, null, 2)}</pre>
                                    </CardContent>
                                </Card>
                                <Card sx={{ maxWidth: '100%', overflow: 'hidden', mt: 2 }}>
                                    <CardHeader title="Output Context" titleTypographyProps={{ variant: 'subtitle1' }} />
                                    <CardContent>
                                        <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: '120px', maxWidth: '100%' }}>{JSON.stringify(selectedTask.output_context, null, 2)}</pre>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 0, height: '100%', overflow: 'auto', width: '100%', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', '& *': { maxWidth: '100% !important', wordWrap: 'break-word !important', overflowWrap: 'break-word !important', whiteSpace: 'pre-wrap' } }}>
                            {/* Thread Header */}
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', maxWidth: '100%', overflow: 'hidden' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Card sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        <CardHeader title="Process Thread Information" titleTypographyProps={{ variant: 'h6' }} avatar={<DataObject />} />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary"><strong>Thread ID:</strong> {selectedThread.thread_id}</Typography>
                                            <Typography variant="body2" color="text.secondary"><strong>Process:</strong> {selectedThread.process_name} (v{selectedThread.process_version})</Typography>
                                            <Typography variant="body2" color="text.secondary"><strong>Created:</strong> {new Date(selectedThread.created_at).toLocaleString()}</Typography>
                                            <Typography variant="body2" color="text.secondary"><strong>Status:</strong> {selectedThread.status}</Typography>
                                        </CardContent>
                                    </Card>
                                    <Card sx={{ maxWidth: '100%', overflow: 'hidden' }}>
                                        <CardHeader title="Thread Metadata" titleTypographyProps={{ variant: 'h6' }} avatar={<Psychology />} />
                                        <CardContent>
                                            {selectedThread.metadata && Object.keys(selectedThread.metadata).length > 0 ? (
                                                <pre style={{ fontSize: '0.75rem', overflow: 'auto', maxHeight: '150px', maxWidth: '100%' }}>
                                                    {JSON.stringify(selectedThread.metadata, null, 2)}
                                                </pre>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">No metadata available</Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Box>
                            {/* Task List */}
                            <Box sx={{ p: 2, maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>
                                <Typography variant="h6" gutterBottom>Service Tasks ({selectedThread.tasks.length})</Typography>
                                {selectedThread.tasks.map((task, idx) => (
                                    <Card key={task.task_id} sx={{ mb: 2, maxWidth: '100%', wordWrap: 'break-word', overflow: 'hidden' }}>
                                        <CardHeader
                                            title={`Task: ${task.name}`}
                                            subheader={new Date(task.created_at).toLocaleString()}
                                            titleTypographyProps={{ variant: 'subtitle1' }}
                                            avatar={<Typography variant="h6">{idx + 1}</Typography>}
                                        />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary"><strong>Input Context:</strong></Typography>
                                            <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: '80px', maxWidth: '100%' }}>{JSON.stringify(task.input_context, null, 2)}</pre>
                                            <Typography variant="body2" color="text.secondary"><strong>Injected Context:</strong></Typography>
                                            <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: '80px', maxWidth: '100%' }}>{JSON.stringify(task.injected_context, null, 2)}</pre>
                                            <Typography variant="body2" color="text.secondary"><strong>Output Context:</strong></Typography>
                                            <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: '80px', maxWidth: '100%' }}>{JSON.stringify(task.output_context, null, 2)}</pre>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Paper>
                    )
                ) : (
                    <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Select a process thread or task to view its context</Typography>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default ProcessThreadManager; 