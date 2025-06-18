import {
    Chat,
    Clear,
    Download,
    ExpandMore,
    Refresh,
    Search,
    Visibility
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AnalysisMetadata {
    analysis_id: string;
    thread_id: string;
    session_id?: string;
    process_instance_id?: string;
    task_name: string;
    created_at: string;
    updated_at: string;
    status: 'created' | 'processing' | 'completed' | 'failed' | 'archived';
    tags: string[];
    source_service: string;
}

interface AnalysisData {
    metadata: AnalysisMetadata;
    input_data: any;
    output_data?: any;
    raw_response?: string;
    processing_log: Array<{
        timestamp: string;
        level: string;
        message: string;
    }>;
}

interface FilterOptions {
    status?: string;
    source_service?: string;
    thread_id?: string;
    session_id?: string;
    process_instance_id?: string;
    tags?: string;
    date_from?: string;
    date_to?: string;
}

const AnalysisDataViewer: React.FC = () => {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [filters, setFilters] = useState<FilterOptions>({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAnalysisData = async () => {
        setLoading(true);
        try {
            // Mock data - replace with actual API calls
            const mockAnalyses: AnalysisData[] = [
                {
                    metadata: {
                        analysis_id: 'analysis_001',
                        thread_id: 'thread_abc123',
                        session_id: 'session_456',
                        process_instance_id: 'proc_12345',
                        task_name: 'OpenAI Decision Analysis',
                        created_at: '2025-06-17T10:30:00Z',
                        updated_at: '2025-06-17T10:32:15Z',
                        status: 'completed',
                        tags: ['openai', 'decision', 'investment'],
                        source_service: 'openai_assistant'
                    },
                    input_data: {
                        decision_topic: 'investment strategy',
                        context: 'Evaluating tech startup investment',
                        requirements: ['ROI analysis', 'Risk assessment', 'Market potential']
                    },
                    output_data: {
                        recommendation: 'Proceed with investment',
                        confidence: 0.85,
                        reasoning: 'Strong market potential and experienced team',
                        risks: ['Market competition', 'Technology obsolescence'],
                        thread_id: 'thread_abc123',
                        assistant_id: 'asst_xyz789'
                    },
                    raw_response: 'Based on the analysis of the tech startup investment opportunity...',
                    processing_log: [
                        { timestamp: '2025-06-17T10:30:00Z', level: 'INFO', message: 'Analysis started' },
                        { timestamp: '2025-06-17T10:30:30Z', level: 'INFO', message: 'OpenAI API call initiated' },
                        { timestamp: '2025-06-17T10:32:00Z', level: 'INFO', message: 'Response received' },
                        { timestamp: '2025-06-17T10:32:15Z', level: 'INFO', message: 'Analysis completed' }
                    ]
                },
                {
                    metadata: {
                        analysis_id: 'analysis_002',
                        thread_id: 'thread_def456',
                        session_id: 'session_789',
                        process_instance_id: 'proc_12346',
                        task_name: 'Echo Service Test',
                        created_at: '2025-06-17T10:25:00Z',
                        updated_at: '2025-06-17T10:25:30Z',
                        status: 'completed',
                        tags: ['test', 'echo'],
                        source_service: 'echo_service'
                    },
                    input_data: {
                        message: 'Hello DADM System',
                        timestamp: '2025-06-17T10:25:00Z'
                    },
                    output_data: {
                        echo_response: 'Hello DADM System',
                        service_info: {
                            name: 'Echo Service',
                            version: '1.0.0',
                            uptime: '2h 30m'
                        }
                    },
                    raw_response: 'Echo response: Hello DADM System',
                    processing_log: [
                        { timestamp: '2025-06-17T10:25:00Z', level: 'INFO', message: 'Echo request received' },
                        { timestamp: '2025-06-17T10:25:30Z', level: 'INFO', message: 'Echo response sent' }
                    ]
                },
                {
                    metadata: {
                        analysis_id: 'analysis_003',
                        thread_id: 'thread_ghi789',
                        session_id: 'session_123',
                        task_name: 'Graph Database Analysis',
                        created_at: '2025-06-17T10:20:00Z',
                        updated_at: '2025-06-17T10:22:45Z',
                        status: 'completed',
                        tags: ['neo4j', 'graph', 'analysis'],
                        source_service: 'graph_processor'
                    },
                    input_data: {
                        query: 'MATCH (n:Decision) RETURN n LIMIT 10',
                        database: 'neo4j'
                    },
                    output_data: {
                        nodes_found: 5,
                        relationships: 12,
                        execution_time: '45ms',
                        results: [
                            { id: 1, type: 'Decision', properties: { name: 'Investment Decision' } },
                            { id: 2, type: 'Decision', properties: { name: 'Technology Choice' } }
                        ]
                    },
                    processing_log: [
                        { timestamp: '2025-06-17T10:20:00Z', level: 'INFO', message: 'Graph query initiated' },
                        { timestamp: '2025-06-17T10:22:45Z', level: 'INFO', message: 'Query execution completed' }
                    ]
                }
            ];

            setAnalyses(mockAnalyses);
            setFilteredAnalyses(mockAnalyses);
        } catch (error) {
            console.error('Failed to fetch analysis data:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnalysisData();
    }, []);

    useEffect(() => {
        // Apply filters
        let filtered = analyses;

        if (searchQuery) {
            filtered = filtered.filter(analysis =>
                analysis.metadata.analysis_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                analysis.metadata.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                analysis.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (filters.status) {
            filtered = filtered.filter(analysis => analysis.metadata.status === filters.status);
        }

        if (filters.source_service) {
            filtered = filtered.filter(analysis => analysis.metadata.source_service === filters.source_service);
        }

        if (filters.thread_id) {
            filtered = filtered.filter(analysis => analysis.metadata.thread_id?.includes(filters.thread_id!));
        }

        if (filters.tags) {
            filtered = filtered.filter(analysis =>
                analysis.metadata.tags.some(tag => tag.toLowerCase().includes(filters.tags!.toLowerCase()))
            );
        }

        setFilteredAnalyses(filtered);
        setPage(0); // Reset to first page when filters change
    }, [analyses, filters, searchQuery]);

    const handleFilterChange = (key: keyof FilterOptions, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined
        }));
    };

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    const openAnalysisDetail = (analysis: AnalysisData) => {
        setSelectedAnalysis(analysis);
        setDetailDialogOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            case 'failed': return 'error';
            case 'created': return 'info';
            default: return 'default';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const exportAnalysisData = () => {
        const dataStr = JSON.stringify(filteredAnalyses, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dadm_analysis_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
                <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading analysis data...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Analysis Data Viewer
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={exportAnalysisData}
                        sx={{ mr: 1 }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchAnalysisData}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Filters & Search
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status || ''}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="created">Created</MenuItem>
                                <MenuItem value="processing">Processing</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                                <MenuItem value="archived">Archived</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Service</InputLabel>
                            <Select
                                value={filters.source_service || ''}
                                label="Service"
                                onChange={(e) => handleFilterChange('source_service', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="openai_assistant">OpenAI Assistant</MenuItem>
                                <MenuItem value="echo_service">Echo Service</MenuItem>
                                <MenuItem value="graph_processor">Graph Processor</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            label="Thread ID"
                            value={filters.thread_id || ''}
                            onChange={(e) => handleFilterChange('thread_id', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            label="Tags"
                            value={filters.tags || ''}
                            onChange={(e) => handleFilterChange('tags', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={1}>
                        <Button
                            variant="outlined"
                            startIcon={<Clear />}
                            onClick={clearFilters}
                            fullWidth
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results Summary */}
            <Alert severity="info" sx={{ mb: 2 }}>
                Showing {filteredAnalyses.length} of {analyses.length} analyses
            </Alert>

            {/* Analysis Table */}
            <Paper sx={{ width: '100%' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Analysis ID</TableCell>
                                <TableCell>Task Name</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Service</TableCell>
                                <TableCell>Thread ID</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Tags</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAnalyses
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((analysis) => (
                                    <TableRow key={analysis.metadata.analysis_id}>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {analysis.metadata.analysis_id}
                                        </TableCell>
                                        <TableCell>{analysis.metadata.task_name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={analysis.metadata.status}
                                                color={getStatusColor(analysis.metadata.status) as any}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{analysis.metadata.source_service}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {analysis.metadata.thread_id}
                                        </TableCell>
                                        <TableCell>{formatTimestamp(analysis.metadata.created_at)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {analysis.metadata.tags.map(tag => (
                                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => openAnalysisDetail(analysis)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {analysis.output_data?.thread_id && (
                                                <Tooltip title="Open AI Chat">
                                                    <IconButton size="small">
                                                        <Chat />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredAnalyses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </Paper>

            {/* Analysis Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                {selectedAnalysis && (
                    <>
                        <DialogTitle>
                            Analysis Details: {selectedAnalysis.metadata.analysis_id}
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2}>
                                {/* Metadata */}
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Metadata
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Analysis ID:</Typography>
                                                <Typography variant="body2" fontFamily="monospace">
                                                    {selectedAnalysis.metadata.analysis_id}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Task:</Typography>
                                                <Typography variant="body2">{selectedAnalysis.metadata.task_name}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Status:</Typography>
                                                <Chip
                                                    label={selectedAnalysis.metadata.status}
                                                    color={getStatusColor(selectedAnalysis.metadata.status) as any}
                                                    size="small"
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Service:</Typography>
                                                <Typography variant="body2">{selectedAnalysis.metadata.source_service}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Thread ID:</Typography>
                                                <Typography variant="body2" fontFamily="monospace">
                                                    {selectedAnalysis.metadata.thread_id}
                                                </Typography>
                                            </Box>
                                            {selectedAnalysis.metadata.process_instance_id && (
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2">Process ID:</Typography>
                                                    <Typography variant="body2" fontFamily="monospace">
                                                        {selectedAnalysis.metadata.process_instance_id}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Created:</Typography>
                                                <Typography variant="body2">
                                                    {formatTimestamp(selectedAnalysis.metadata.created_at)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Tags and Processing Log */}
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Tags & Processing
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>Tags:</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {selectedAnalysis.metadata.tags.map(tag => (
                                                    <Chip key={tag} label={tag} size="small" />
                                                ))}
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" sx={{ mb: 1 }}>Processing Log:</Typography>
                                        <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                                            {selectedAnalysis.processing_log.map((log, index) => (
                                                <Box key={index} sx={{ mb: 0.5 }}>
                                                    <Typography variant="caption" component="div">
                                                        <strong>{log.timestamp}</strong> [{log.level}] {log.message}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>
                                </Grid>

                                {/* Input Data */}
                                <Grid item xs={12}>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography variant="h6">Input Data</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <SyntaxHighlighter
                                                language="json"
                                                style={tomorrow}
                                                customStyle={{ margin: 0, borderRadius: 4 }}
                                            >
                                                {JSON.stringify(selectedAnalysis.input_data, null, 2)}
                                            </SyntaxHighlighter>
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>

                                {/* Output Data */}
                                {selectedAnalysis.output_data && (
                                    <Grid item xs={12}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMore />}>
                                                <Typography variant="h6">Output Data</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <SyntaxHighlighter
                                                    language="json"
                                                    style={tomorrow}
                                                    customStyle={{ margin: 0, borderRadius: 4 }}
                                                >
                                                    {JSON.stringify(selectedAnalysis.output_data, null, 2)}
                                                </SyntaxHighlighter>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>
                                )}

                                {/* Raw Response */}
                                {selectedAnalysis.raw_response && (
                                    <Grid item xs={12}>
                                        <Accordion>
                                            <AccordionSummary expandIcon={<ExpandMore />}>
                                                <Typography variant="h6">Raw Response</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                                    <ReactMarkdown>{selectedAnalysis.raw_response}</ReactMarkdown>
                                                </Paper>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                            {selectedAnalysis.output_data?.thread_id && (
                                <Button variant="contained" startIcon={<Chat />}>
                                    Continue in AI Chat
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default AnalysisDataViewer;
