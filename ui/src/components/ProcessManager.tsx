import {
    Delete,
    Info,
    PlayArrow,
    Refresh,
    Settings,
    Stop,
    Visibility,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
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
import React, { useCallback, useEffect, useState } from 'react';

interface ProcessInstance {
    id: string;
    processDefinitionKey: string;
    processDefinitionName?: string;
    processDefinitionVersion?: number;
    startTime: string;
    endTime?: string;
    state?: string;
    status: string;
    isActive: boolean;
    businessKey?: string;
}

interface ProcessDefinition {
    id: string;
    key: string;
    name: string;
    version: number;
    resource: string;
    deploymentId: string;
}

interface GroupedProcessDefinitions {
    [key: string]: ProcessDefinition[];
}

interface ProcessDocumentation {
    processDefinitionId: string;
    processName: string;
    processDocumentation: string;
}

interface ProcessCounts {
    active: number;
    total: number;
    completed: number;
}

const ProcessManager: React.FC = () => {
    const [processInstances, setProcessInstances] = useState<ProcessInstance[]>([]);
    const [groupedProcessDefinitions, setGroupedProcessDefinitions] = useState<GroupedProcessDefinitions>({});
    const [counts, setCounts] = useState<ProcessCounts>({ active: 0, total: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<ProcessInstance | null>(null);
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [selectedDefinition, setSelectedDefinition] = useState<ProcessDefinition | null>(null);
    const [startVariables, setStartVariables] = useState('{}');
    const [documentationDialogOpen, setDocumentationDialogOpen] = useState(false);
    const [selectedDocumentation, setSelectedDocumentation] = useState<ProcessDocumentation | null>(null);
    const [loadingDocumentation, setLoadingDocumentation] = useState(false);
    const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});

    const fetchProcessInstances = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/process/instances');
            const data = await response.json();

            if (data.success) {
                setProcessInstances(data.data);
                setCounts(data.counts);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch process instances');
            }
        } catch (err) {
            setError('Failed to connect to backend');
            console.error('Error fetching process instances:', err);
        }
    }, []);

    const fetchProcessDefinitions = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/process/definitions/all-versions');
            const data = await response.json();

            if (data.success) {
                setGroupedProcessDefinitions(data.data);
            } else {
                setError(data.error || 'Failed to fetch process definitions');
            }
        } catch (err) {
            setError('Failed to connect to backend');
            console.error('Error fetching process definitions:', err);
        }
    }, []);

    const fetchDocumentation = async (processDefinition: ProcessDefinition) => {
        try {
            setLoadingDocumentation(true);
            setSelectedDocumentation(null);

            const response = await fetch(`http://localhost:8000/api/process/definitions/${processDefinition.id}/documentation`);
            const data = await response.json();

            if (data.success) {
                setSelectedDocumentation(data.data);
                setDocumentationDialogOpen(true);
            } else {
                setError(data.error || 'Failed to fetch process documentation');
            }
        } catch (err) {
            setError('Failed to connect to backend for documentation');
            console.error('Error fetching documentation:', err);
        } finally {
            setLoadingDocumentation(false);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        await Promise.all([fetchProcessInstances(), fetchProcessDefinitions()]);
        setLoading(false);
    };

    const handleDeleteProcess = async () => {
        if (!selectedInstance) return;

        try {
            const response = await fetch(`http://localhost:8000/api/process/instances/${selectedInstance.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Terminated via DADM Process Manager' })
            });

            const data = await response.json();

            if (data.success) {
                setError(null);
                await fetchProcessInstances(); // Refresh the list
            } else {
                setError(data.error || 'Failed to delete process instance');
            }
        } catch (err) {
            setError('Failed to delete process instance');
            console.error('Error deleting process:', err);
        } finally {
            setDeleteDialogOpen(false);
            setSelectedInstance(null);
        }
    };

    const handleStartProcess = async () => {
        if (!selectedDefinition) return;

        try {
            let variables = {};
            try {
                variables = JSON.parse(startVariables || '{}');
            } catch (parseErr) {
                setError('Invalid JSON in variables field');
                return;
            }

            setError('Starting process...');

            const response = await fetch('http://localhost:8000/api/process/instances/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    processDefinitionId: selectedDefinition.id,
                    variables
                })
            });

            const data = await response.json();

            if (data.success) {
                setError(null);
                // Show success message with execution details
                const message = `Process ${selectedDefinition.name || selectedDefinition.key} executed successfully!`;
                if (data.data.processInstanceId) {
                    console.log(`Process Instance ID: ${data.data.processInstanceId}`);
                }
                if (data.data.executionOutput) {
                    console.log('Execution Output:', data.data.executionOutput);
                }
                await fetchProcessInstances(); // Refresh the list
            } else {
                setError(data.error || 'Failed to start and execute process');
                if (data.details) {
                    console.error('Process execution details:', data.details);
                }
            }
        } catch (err) {
            setError('Failed to start and execute process');
            console.error('Error starting process:', err);
        } finally {
            setStartDialogOpen(false);
            setSelectedDefinition(null);
            setStartVariables('{}');
        }
    };

    const handleDeleteProcessDefinition = async (processDefinition: ProcessDefinition) => {
        if (!window.confirm(`Are you sure you want to delete the process definition "${processDefinition.name || processDefinition.key}"? This will remove the process definition from Camunda.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/process/definitions/${processDefinition.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                setError(null);
                await fetchProcessDefinitions(); // Refresh the list
            } else {
                setError(data.error || 'Failed to delete process definition');
            }
        } catch (err) {
            setError('Failed to delete process definition');
            console.error('Error deleting process definition:', err);
        }
    };

    const getStatusColor = (status: string, isActive: boolean) => {
        if (isActive) return 'success';
        if (status === 'COMPLETED') return 'info';
        if (status === 'EXTERNALLY_TERMINATED' || status === 'INTERNALLY_TERMINATED') return 'error';
        return 'default';
    };

    const formatDateTime = (dateTime: string | undefined) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString();
    };

    const getDuration = (startTime: string, endTime?: string) => {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const durationMs = end.getTime() - start.getTime();

        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Process Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Active Processes
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {counts.active}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Processes
                            </Typography>
                            <Typography variant="h4">
                                {counts.total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Available Definitions
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                {Object.keys(groupedProcessDefinitions).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Process Definitions Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Settings sx={{ mr: 1 }} />
                    Process Definitions
                </Typography>
                <Grid container spacing={2}>
                    {Object.entries(groupedProcessDefinitions).map(([key, definitions]) => {
                        const selectedVersion = selectedVersions[key] || definitions[0]?.id || '';
                        const selectedDefinition = definitions.find(def => def.id === selectedVersion) || definitions[0];

                        return (
                            <Grid item xs={12} sm={6} md={4} key={key}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" noWrap>
                                            {selectedDefinition?.name || key}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Key: {key}
                                        </Typography>
                                        <Box sx={{ mt: 1, mb: 2 }}>
                                            <FormControl size="small" fullWidth>
                                                <InputLabel>Version</InputLabel>
                                                <Select
                                                    value={selectedVersion}
                                                    label="Version"
                                                    onChange={(e) => setSelectedVersions(prev => ({
                                                        ...prev,
                                                        [key]: e.target.value
                                                    }))}
                                                >
                                                    {definitions.map((def) => (
                                                        <MenuItem key={def.id} value={def.id}>
                                                            v{def.version} {def.version === Math.max(...definitions.map(d => d.version)) && '(latest)'}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<PlayArrow />}
                                                    onClick={() => {
                                                        setSelectedDefinition(selectedDefinition);
                                                        setStartDialogOpen(true);
                                                    }}
                                                    disabled={!selectedDefinition}
                                                >
                                                    Start Process
                                                </Button>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => selectedDefinition && fetchDocumentation(selectedDefinition)}
                                                    disabled={loadingDocumentation || !selectedDefinition}
                                                    title="View process documentation"
                                                >
                                                    <Info />
                                                </IconButton>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => selectedDefinition && handleDeleteProcessDefinition(selectedDefinition)}
                                                disabled={!selectedDefinition}
                                                title="Delete process definition"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>

            {/* Process Instances Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Instance ID</TableCell>
                            <TableCell>Process Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Business Key</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {processInstances.map((instance) => (
                            <TableRow key={instance.id}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                        {instance.id.substring(0, 8)}...
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {instance.processDefinitionName || instance.processDefinitionKey}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        v{instance.processDefinitionVersion}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={instance.isActive ? 'ACTIVE' : (instance.state || 'COMPLETED')}
                                        color={getStatusColor(instance.status, instance.isActive)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {formatDateTime(instance.startTime)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {getDuration(instance.startTime, instance.endTime)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {instance.businessKey || 'N/A'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="View Details">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                // Could implement a detail view
                                                console.log('View details for:', instance.id);
                                            }}
                                        >
                                            <Visibility />
                                        </IconButton>
                                    </Tooltip>
                                    {instance.isActive && (
                                        <Tooltip title="Terminate Process">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setSelectedInstance(instance);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Stop />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>
                    <Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Terminate Process Instance
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to terminate process instance{' '}
                        <strong>{selectedInstance?.id}</strong>?
                        <br />
                        <br />
                        This action cannot be undone and will stop all active tasks in this process.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteProcess} color="error" variant="contained">
                        Terminate
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Start Process Dialog */}
            <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Start Process: {selectedDefinition?.name || selectedDefinition?.key}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Enter initial variables for the process (JSON format):
                    </DialogContentText>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        label="Process Variables (JSON)"
                        value={startVariables}
                        onChange={(e) => setStartVariables(e.target.value)}
                        placeholder='{"key": "value", "number": 42}'
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleStartProcess} variant="contained" color="primary">
                        Start Process
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Documentation Dialog */}
            <Dialog open={documentationDialogOpen} onClose={() => setDocumentationDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Process Documentation: {selectedDocumentation?.processName}
                </DialogTitle>
                <DialogContent>
                    {loadingDocumentation ? (
                        <Typography variant="body2" color="textSecondary">
                            Loading documentation...
                        </Typography>
                    ) : selectedDocumentation?.processDocumentation ? (
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedDocumentation.processDocumentation}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            No documentation available for this process.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDocumentationDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProcessManager;
