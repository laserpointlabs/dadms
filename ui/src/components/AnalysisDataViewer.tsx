import {
    Clear,
    Delete,
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
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface AnalysisMetadata {
    analysis_id: string;
    thread_id: string;
    session_id?: string;
    process_instance_id?: string;
    process_name?: string;
    process_version?: number;
    task_name: string;
    created_at: string;
    updated_at?: string;
    status: 'created' | 'running' | 'completed' | 'failed';
    tags: string[];
    source_service: string;
}

interface AnalysisData {
    metadata: AnalysisMetadata;
    input_data?: any;
    output_data?: any;
    raw_response?: string;
    processing_log?: Array<{
        timestamp: string;
        level: string;
        message: string;
    }>;
}

interface FilterState {
    status: string;
    source_service: string;
    thread_id: string;
}

interface GroupedAnalysisDisplayProps {
    analyses: AnalysisData[];
    onViewAnalysis: (analysis: AnalysisData) => void;
    onExportAnalysis: (analysis: AnalysisData) => void;
    onDeleteProcess: (processInstanceId: string) => void;
    getStatusColor: (status: string) => string;
    groupAnalysesByProcess: (analyses: AnalysisData[]) => Record<string, AnalysisData[]>;
}

const GroupedAnalysisDisplay: React.FC<GroupedAnalysisDisplayProps> = ({
    analyses,
    onViewAnalysis,
    onExportAnalysis,
    onDeleteProcess,
    getStatusColor,
    groupAnalysesByProcess
}) => {
    const groupedAnalyses = groupAnalysesByProcess(analyses);
    const processIds = Object.keys(groupedAnalyses);

    if (processIds.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    No analyses found matching your criteria
                </Typography>
            </Paper>
        );
    }

    return (
        <>
            {processIds.map((processId) => {
                const processAnalyses = groupedAnalyses[processId];
                const latestAnalysis = processAnalyses[0];
                const processStartTime = new Date(
                    Math.min(...processAnalyses.map(a => new Date(a.metadata.created_at).getTime()))
                );

                return (
                    <Accordion key={processId} defaultExpanded={processIds.length <= 3}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                                        {processId}
                                    </Typography>
                                    <Typography variant="body1" color="primary" sx={{ fontWeight: 'medium' }}>
                                        {latestAnalysis.metadata.process_name || 'Unknown Process'}
                                        {latestAnalysis.metadata.process_version && ` (v${latestAnalysis.metadata.process_version})`}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {processAnalyses.length} analyses • Started: {processStartTime.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip
                                        label={`${processAnalyses.length} analyses`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                    {latestAnalysis.metadata.source_service && (
                                        <Chip
                                            label={latestAnalysis.metadata.source_service.split('/').pop()}
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    )}
                                    <Tooltip title="Delete all analyses for this process">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteProcess(processId);
                                            }}
                                            sx={{ ml: 1 }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Analysis ID</TableCell>
                                            <TableCell>Task</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created</TableCell>
                                            <TableCell>Tags</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {processAnalyses.map((analysis) => (
                                            <TableRow key={analysis.metadata.analysis_id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        {analysis.metadata.analysis_id.substring(0, 8)}...
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {analysis.metadata.task_name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={analysis.metadata.status}
                                                        color={getStatusColor(analysis.metadata.status) as any}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {new Date(analysis.metadata.created_at).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                        {analysis.metadata.tags.slice(0, 2).map((tag) => (
                                                            <Chip
                                                                key={tag}
                                                                label={tag}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                        {analysis.metadata.tags.length > 2 && (
                                                            <Chip
                                                                label={`+${analysis.metadata.tags.length - 2}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="View Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => onViewAnalysis(analysis)}
                                                            >
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Export">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => onExportAnalysis(analysis)}
                                                            >
                                                                <Download />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </>
    );
};

const AnalysisDataViewer: React.FC = () => {
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisData[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        status: '',
        source_service: '',
        thread_id: ''
    });
    // Pagination state (for future use)
    // const [page, setPage] = useState(0);
    // const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAnalysisData = async () => {
        setLoading(true);
        try {
            console.log('Fetching real analysis data from DADM...');

            // Fetch real data from our analysis API
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/analysis/list?limit=50&detailed=true`);
            const result = await response.json();

            if (result.success && result.data) {
                // Transform DADM data to match our interface
                const transformedAnalyses: AnalysisData[] = result.data.map((item: any) => ({
                    metadata: {
                        analysis_id: item.analysis_id,
                        thread_id: item.thread_id,
                        session_id: item.session_id || '',
                        process_instance_id: item.process_id,
                        process_name: item.process_definition?.name || 'Unknown Process',
                        process_version: item.process_definition?.version || 1,
                        task_name: item.task,
                        created_at: item.created_at,
                        updated_at: item.created_at,
                        status: item.status,
                        tags: Array.isArray(item.tags) ? item.tags : [],
                        source_service: item.service
                    },
                    input_data: {
                        openai_thread: item.openai_thread || '',
                        openai_assistant: item.openai_assistant || ''
                    },
                    output_data: {
                        thread_id: item.thread_id,
                        assistant_id: item.openai_assistant
                    },
                    raw_response: `Analysis ID: ${item.analysis_id}\nTask: ${item.task}\nStatus: ${item.status}`,
                    processing_log: [
                        {
                            timestamp: item.created_at,
                            level: 'INFO',
                            message: `Analysis created: ${item.task}`
                        }
                    ]
                }));

                setAnalyses(transformedAnalyses);
                console.log(`Loaded ${transformedAnalyses.length} real analyses from DADM`);
            } else {
                console.error('Failed to fetch analysis data:', result.error);
                setAnalyses([]);
            }
        } catch (error) {
            console.error('Error fetching analysis data:', error);
            setAnalyses([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnalysisData();
    }, []);

    // Group analyses by process ID
    const groupAnalysesByProcess = (analysisData: AnalysisData[]) => {
        const grouped = analysisData.reduce((acc, analysis) => {
            const processId = analysis.metadata.process_instance_id || 'unknown';
            if (!acc[processId]) {
                acc[processId] = [];
            }
            acc[processId].push(analysis);
            return acc;
        }, {} as Record<string, AnalysisData[]>);

        // Sort each group by creation date (newest first)
        Object.keys(grouped).forEach(processId => {
            grouped[processId].sort((a, b) =>
                new Date(b.metadata.created_at).getTime() - new Date(a.metadata.created_at).getTime()
            );
        });

        return grouped;
    };

    useEffect(() => {
        // Apply filters
        let filtered = analyses;

        if (searchQuery) {
            filtered = filtered.filter(analysis =>
                analysis.metadata.analysis_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                analysis.metadata.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                analysis.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                analysis.metadata.process_instance_id?.toLowerCase().includes(searchQuery.toLowerCase())
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

        setFilteredAnalyses(filtered);
    }, [analyses, filters, searchQuery]);

    const handleViewAnalysis = (analysis: AnalysisData) => {
        setSelectedAnalysis(analysis);
        setDialogOpen(true);
    };

    const handleExportAnalysis = (analysis: AnalysisData) => {
        const dataStr = JSON.stringify(analysis, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analysis_${analysis.metadata.analysis_id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteProcess = async (processInstanceId: string) => {
        if (!window.confirm('Are you sure you want to delete all analyses for this process? This action cannot be undone.')) {
            return;
        }

        try {
            console.log(`Deleting analyses for process instance: ${processInstanceId}`);

            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/api/analysis/process/${processInstanceId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const result = await response.json();

            if (result.success) {
                // Remove deleted analyses from state
                setAnalyses(prevAnalyses =>
                    prevAnalyses.filter(analysis =>
                        analysis.metadata.process_instance_id !== processInstanceId
                    )
                );
                console.log(`Successfully deleted analyses for process ${processInstanceId}`);
            } else {
                alert(`Failed to delete analyses: ${result.error}`);
            }
        } catch (error) {
            console.error('Error deleting analyses:', error);
            alert('Failed to delete analyses. Please try again.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'running': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Analysis Data Viewer
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={fetchAnalysisData}
                    disabled={loading}
                >
                    Refresh Data
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Filters & Search
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search"
                            placeholder="Search by ID, task, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="created">Created</MenuItem>
                                <MenuItem value="running">Running</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Thread ID"
                            placeholder="Filter by thread..."
                            value={filters.thread_id}
                            onChange={(e) => setFilters({ ...filters, thread_id: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Clear />}
                            onClick={() => {
                                setFilters({ status: '', source_service: '', thread_id: '' });
                                setSearchQuery('');
                            }}
                            sx={{ height: '56px' }}
                        >
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results */}
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Analysis Results ({filteredAnalyses.length} of {analyses.length})
                    </Typography>
                    {analyses.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            Real-time data from DADM analysis storage
                        </Typography>
                    )}
                </Box>

                {analyses.length === 0 && !loading ? (
                    <Alert severity="info">
                        No analysis data found. Make sure the DADM analysis daemon is running and has processed some analyses.
                        <Box sx={{ mt: 1 }}>
                            <Button size="small" onClick={fetchAnalysisData}>
                                Retry
                            </Button>
                        </Box>
                    </Alert>
                ) : (
                    <GroupedAnalysisDisplay
                        analyses={filteredAnalyses}
                        onViewAnalysis={handleViewAnalysis}
                        onExportAnalysis={handleExportAnalysis}
                        onDeleteProcess={handleDeleteProcess}
                        getStatusColor={getStatusColor}
                        groupAnalysesByProcess={groupAnalysesByProcess}
                    />
                )}
            </Paper>

            {/* Analysis Details Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    Analysis Details: {selectedAnalysis?.metadata.task_name}
                </DialogTitle>
                <DialogContent>
                    {selectedAnalysis && (
                        <Box>
                            {/* Metadata */}
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="h6">Metadata</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Analysis ID</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                                                {selectedAnalysis.metadata.analysis_id}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Thread ID</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                                                {selectedAnalysis.metadata.thread_id}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                            <Chip
                                                label={selectedAnalysis.metadata.status}
                                                color={getStatusColor(selectedAnalysis.metadata.status) as any}
                                                size="small"
                                                sx={{ mb: 2 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="text.secondary">Service</Typography>
                                            <Typography variant="body2" sx={{ mb: 2 }}>
                                                {selectedAnalysis.metadata.source_service}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                {selectedAnalysis.metadata.tags.map((tag) => (
                                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>

                            {/* Input Data */}
                            {selectedAnalysis.input_data && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="h6">Input Data</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box
                                            sx={{
                                                bgcolor: 'background.default',
                                                p: 2,
                                                borderRadius: 1,
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                overflow: 'auto'
                                            }}
                                        >
                                            <pre>{JSON.stringify(selectedAnalysis.input_data, null, 2)}</pre>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {/* Output Data */}
                            {selectedAnalysis.output_data && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="h6">Output Data</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box
                                            sx={{
                                                bgcolor: 'background.default',
                                                p: 2,
                                                borderRadius: 1,
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                overflow: 'auto'
                                            }}
                                        >
                                            <pre>{JSON.stringify(selectedAnalysis.output_data, null, 2)}</pre>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {/* Raw Response */}
                            {selectedAnalysis.raw_response && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="h6">Raw Response</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box
                                            sx={{
                                                bgcolor: 'background.default',
                                                p: 2,
                                                borderRadius: 1,
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                overflow: 'auto',
                                                whiteSpace: 'pre-wrap'
                                            }}
                                        >
                                            {selectedAnalysis.raw_response}
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Close
                    </Button>
                    {selectedAnalysis && (
                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => handleExportAnalysis(selectedAnalysis)}
                        >
                            Export
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AnalysisDataViewer;
